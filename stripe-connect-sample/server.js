/**
 * Stripe Connect + Supabase sample server for ThriftUVA.
 *
 * This version intentionally wires into your REAL app data model:
 * - users.stripe_account_id
 * - users.stripe_onboarding_complete
 * - users.stripe_ready_to_receive_payments
 * - listings.stripe_product_id
 * - listings.stripe_price_id
 *
 * It keeps Expo UI/auth unchanged and adds server-side Stripe flows.
 */

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

function requireEnv(name, helpText) {
  const value = process.env[name];
  const looksLikePlaceholder =
    !value ||
    value.includes('YOUR_') ||
    value.includes('<') ||
    value.includes('PLACEHOLDER');
  if (looksLikePlaceholder) {
    throw new Error(`[Stripe Connect Sample] Missing ${name}. ${helpText}`);
  }
  return value;
}

const STRIPE_SECRET_KEY = requireEnv(
  'STRIPE_SECRET_KEY',
  'Set STRIPE_SECRET_KEY in stripe-connect-sample/.env'
);
const APP_BASE_URL = requireEnv(
  'APP_BASE_URL',
  'Set APP_BASE_URL in stripe-connect-sample/.env (ex: http://localhost:4242)'
);
const SUPABASE_URL = requireEnv(
  'SUPABASE_URL',
  'Set SUPABASE_URL in stripe-connect-sample/.env'
);
const SUPABASE_SERVICE_ROLE_KEY = requireEnv(
  'SUPABASE_SERVICE_ROLE_KEY',
  'Set SUPABASE_SERVICE_ROLE_KEY in stripe-connect-sample/.env (service role key required for server writes).'
);
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Use Stripe Client for all Stripe requests.
const stripeClient = new Stripe(STRIPE_SECRET_KEY);

// Service role client for trusted backend writes.
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const app = express();
const port = Number(process.env.PORT || 4242);

const DEFAULT_FEE_BPS = Number(process.env.APPLICATION_FEE_BPS || 1000); // 10%

app.use(express.static(path.join(__dirname, 'public')));

/**
 * Convert basis points to an integer fee amount in minor currency units.
 */
function computeApplicationFee(unitAmount, quantity) {
  const gross = unitAmount * quantity;
  return Math.round((gross * DEFAULT_FEE_BPS) / 10000);
}

/**
 * Helper to throw human-friendly errors when expected schema columns are absent.
 */
function helpfulSchemaError(error, contextMessage) {
  if (!error) return null;
  return `${contextMessage} Supabase error: ${error.message}.` +
    ` Ensure required columns exist (users.stripe_account_id, users.stripe_onboarding_complete, users.stripe_ready_to_receive_payments, listings.stripe_product_id, listings.stripe_price_id).`;
}

/**
 * Creates Stripe product/price for an existing listing when missing,
 * then persists stripe_product_id + stripe_price_id on the listing row.
 */
async function ensureStripePriceForListing(listing) {
  if (listing.stripe_product_id && listing.stripe_price_id) {
    return {
      stripeProductId: listing.stripe_product_id,
      stripePriceId: listing.stripe_price_id,
    };
  }

  const currency = 'usd';
  const unitAmount = Math.round(Number(listing.price) * 100);
  if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
    throw new Error(`Listing ${listing.id} has invalid price (${listing.price}).`);
  }

  const product = await stripeClient.products.create({
    name: listing.title || `Listing ${listing.id}`,
    description: listing.description || undefined,
    default_price_data: {
      unit_amount: unitAmount,
      currency,
    },
    metadata: {
      listing_id: listing.id,
      seller_id: listing.seller_id,
    },
  });

  const stripePriceId =
    typeof product.default_price === 'string' ? product.default_price : product.default_price?.id;
  if (!stripePriceId) {
    throw new Error('Stripe did not return a default price id for created product.');
  }

  const { error: listingUpdateError } = await supabaseAdmin
    .from('listings')
    .update({
      stripe_product_id: product.id,
      stripe_price_id: stripePriceId,
    })
    .eq('id', listing.id);

  if (listingUpdateError) {
    throw new Error(helpfulSchemaError(listingUpdateError, 'Failed to save Stripe IDs to listing.'));
  }

  return {
    stripeProductId: product.id,
    stripePriceId,
  };
}

/**
 * Refreshes account readiness from Stripe and syncs onto users row.
 */
async function syncUserStripeStatus(userId, stripeAccountId) {
  const account = await stripeClient.v2.core.accounts.retrieve(stripeAccountId, {
    include: ['configuration.recipient', 'requirements'],
  });

  const readyToReceivePayments =
    account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status ===
    'active';

  const requirementsStatus = account?.requirements?.summary?.minimum_deadline?.status;
  const onboardingComplete =
    requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due';

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({
      stripe_onboarding_complete: onboardingComplete,
      stripe_ready_to_receive_payments: readyToReceivePayments,
    })
    .eq('id', userId);

  if (updateError) {
    throw new Error(helpfulSchemaError(updateError, 'Failed to sync onboarding status onto user row.'));
  }

  return {
    account,
    readyToReceivePayments,
    onboardingComplete,
    requirementsStatus: requirementsStatus || null,
  };
}

// Keep raw parser first for webhook signature verification.
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    if (!STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({
        error:
          'Missing STRIPE_WEBHOOK_SECRET. Set it in stripe-connect-sample/.env after running stripe listen.',
      });
    }

    const signature = req.headers['stripe-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Missing Stripe-Signature header.' });
    }

    /**
     * First, try standard webhook parsing for events like checkout.session.completed.
     * If this fails (for thin-only payloads), we fall back to thin parser below.
     */
    try {
      const event = stripeClient.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const listingId = session?.metadata?.listing_id;
        const buyerId = session?.metadata?.buyer_user_id;
        const sellerId = session?.metadata?.seller_user_id;
        const amount = session?.amount_total;
        const currency = session?.currency;

        if (!listingId || !buyerId) {
          console.warn('[webhook] checkout.session.completed missing metadata:', session?.id);
          return res.json({ received: true, ignored: 'missing metadata' });
        }

        // 1) Mark listing sold.
        const { error: listingUpdateError } = await supabaseAdmin
          .from('listings')
          .update({ status: 'sold' })
          .eq('id', listingId);

        if (listingUpdateError) {
          throw new Error(helpfulSchemaError(listingUpdateError, 'Failed to mark listing sold.'));
        }

        // 2) Create transaction/purchase row.
        // Insert only fields likely to exist; add optional Stripe/session fields if your table supports them.
        const txRow = {
          buyer_id: buyerId,
          listing_id: listingId,
          seller_id: sellerId || null,
          stripe_checkout_session_id: session.id,
          amount_total: amount ?? null,
          currency: currency ?? null,
        };

        const { error: txError } = await supabaseAdmin.from('transactions').insert(txRow);
        if (txError) {
          // Retry with minimal row for stricter schemas.
          const { error: fallbackTxError } = await supabaseAdmin.from('transactions').insert({
            buyer_id: buyerId,
            listing_id: listingId,
          });
          if (fallbackTxError) {
            throw new Error(
              helpfulSchemaError(
                fallbackTxError,
                'Failed to create transaction row (and fallback insert also failed).'
              )
            );
          }
        }

        console.log('[webhook] checkout.session.completed handled:', session.id);
        return res.json({ received: true, handled: 'checkout.session.completed' });
      }
    } catch (standardEventError) {
      // Do not return yet; try thin-event handling next.
    }

    /**
     * Thin event handling for Stripe V2 account events.
     */
    if (typeof stripeClient.parseThinEvent !== 'function') {
      return res.status(500).json({
        error: 'Installed Stripe SDK does not expose parseThinEvent().',
      });
    }

    const thinEvent = stripeClient.parseThinEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    const event = await stripeClient.v2.core.events.retrieve(thinEvent.id);

    if (
      event.type === 'v2.core.account[requirements].updated' ||
      event.type.includes('capability_status_updated')
    ) {
      const accountId = event.related_object?.id;
      if (accountId) {
        const { data: users, error: userLookupError } = await supabaseAdmin
          .from('users')
          .select('id, stripe_account_id')
          .eq('stripe_account_id', accountId)
          .limit(1);

        if (userLookupError) {
          throw new Error(helpfulSchemaError(userLookupError, 'Failed to lookup user for account update.'));
        }

        const user = users?.[0];
        if (user) {
          await syncUserStripeStatus(user.id, accountId);
        }
      }
    }

    return res.json({ received: true, handled: 'thin-event' });
  } catch (err) {
    console.error('[webhook] Error:', err);
    return res.status(400).json({ error: err.message || 'Webhook processing failed.' });
  }
});

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    appBaseUrl: APP_BASE_URL,
    webhookSecretConfigured: Boolean(STRIPE_WEBHOOK_SECRET),
  });
});

/**
 * Create connected account and persist account id onto users.stripe_account_id.
 */
app.post('/api/connect/accounts', async (req, res) => {
  try {
    const { appUserId, displayName, contactEmail } = req.body || {};
    if (!appUserId || !displayName || !contactEmail) {
      return res.status(400).json({
        error: 'appUserId, displayName, and contactEmail are required.',
      });
    }

    const { data: existingUsers, error: existingUserError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', appUserId)
      .limit(1);
    if (existingUserError) {
      throw new Error(helpfulSchemaError(existingUserError, 'Failed to validate user before account creation.'));
    }
    if (!existingUsers?.length) {
      return res.status(404).json({
        error: `User ${appUserId} does not exist in users table.`,
      });
    }

    const account = await stripeClient.v2.core.accounts.create({
      display_name: displayName,
      contact_email: contactEmail,
      identity: {
        country: 'us',
      },
      dashboard: 'express',
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: {
                requested: true,
              },
            },
          },
        },
      },
    });

    const { error: userUpdateError } = await supabaseAdmin
      .from('users')
      .update({
        stripe_account_id: account.id,
        stripe_onboarding_complete: false,
        stripe_ready_to_receive_payments: false,
      })
      .eq('id', appUserId);

    if (userUpdateError) {
      throw new Error(helpfulSchemaError(userUpdateError, 'Failed to save connected account on users row.'));
    }

    return res.json({
      appUserId,
      accountId: account.id,
      account,
    });
  } catch (err) {
    console.error('[connect/accounts] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to create connected account.',
    });
  }
});

/**
 * Read seller account status by app user id, directly from Stripe and sync users table flags.
 */
app.get('/api/connect/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: users, error: userLookupError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_account_id')
      .eq('id', userId)
      .limit(1);

    if (userLookupError) {
      throw new Error(helpfulSchemaError(userLookupError, 'Failed to lookup user.'));
    }

    const user = users?.[0];
    if (!user || !user.stripe_account_id) {
      return res.status(404).json({
        error: 'User does not have stripe_account_id set.',
      });
    }

    const status = await syncUserStripeStatus(user.id, user.stripe_account_id);
    return res.json({
      userId: user.id,
      stripeAccountId: user.stripe_account_id,
      ...status,
    });
  } catch (err) {
    console.error('[connect/users/:id/status] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to fetch user Stripe status.',
    });
  }
});

/**
 * Create onboarding link for a given seller user id.
 */
app.post('/api/connect/users/:userId/onboarding-link', async (req, res) => {
  try {
    const { userId } = req.params;
    const { data: users, error: userLookupError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_account_id')
      .eq('id', userId)
      .limit(1);

    if (userLookupError) {
      throw new Error(helpfulSchemaError(userLookupError, 'Failed to lookup user for onboarding.'));
    }

    const user = users?.[0];
    if (!user?.stripe_account_id) {
      return res.status(404).json({
        error: 'User does not have stripe_account_id set.',
      });
    }

    const refreshUrl = `${APP_BASE_URL}/?userId=${encodeURIComponent(userId)}&onboarding=refresh`;
    const returnUrl = `${APP_BASE_URL}/?userId=${encodeURIComponent(userId)}&onboarding=return`;

    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: user.stripe_account_id,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['recipient'],
          refresh_url: refreshUrl,
          return_url: returnUrl,
        },
      },
    });

    return res.json({
      userId,
      stripeAccountId: user.stripe_account_id,
      url: accountLink.url,
      expiresAt: accountLink.expires_at || null,
    });
  } catch (err) {
    console.error('[connect/users/:id/onboarding-link] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to create onboarding link.',
    });
  }
});

/**
 * Sync Stripe product/price for a listing.
 * This is the server-side operation expected after listing creation.
 */
app.post('/api/listings/:listingId/sync-stripe-product', async (req, res) => {
  try {
    const { listingId } = req.params;

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, seller_id, title, description, price, stripe_product_id, stripe_price_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({
        error: listingError?.message || `Listing ${listingId} not found.`,
      });
    }

    const stripeRefs = await ensureStripePriceForListing(listing);
    return res.json({
      listingId,
      ...stripeRefs,
    });
  } catch (err) {
    console.error('[listings/:id/sync-stripe-product] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to sync Stripe product for listing.',
    });
  }
});

/**
 * Legacy-compatible product creation endpoint.
 * For real ThriftUVA integration, a "product" maps directly to a listing.
 */
app.post('/api/products', async (req, res) => {
  try {
    const { listingId } = req.body || {};
    if (!listingId) {
      return res.status(400).json({
        error: 'listingId is required. In this app, products are created from listings.',
      });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, seller_id, title, description, price, stripe_product_id, stripe_price_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({
        error: listingError?.message || `Listing ${listingId} not found.`,
      });
    }

    const refs = await ensureStripePriceForListing(listing);
    return res.json({
      listingId: listing.id,
      stripeProductId: refs.stripeProductId,
      stripePriceId: refs.stripePriceId,
    });
  } catch (err) {
    console.error('[products/create-from-listing] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to create Stripe product from listing.',
    });
  }
});

/**
 * Storefront endpoint: return active listings and seller account readiness.
 */
app.get('/api/storefront/listings', async (_req, res) => {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('id, seller_id, title, description, price, images, status, stripe_product_id, stripe_price_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(helpfulSchemaError(error, 'Failed to fetch storefront listings.'));
    }

    const sellerIds = [...new Set((listings || []).map((l) => l.seller_id).filter(Boolean))];
    let sellerRows = [];
    if (sellerIds.length > 0) {
      const { data, error: sellerError } = await supabaseAdmin
        .from('users')
        .select('id, display_name, stripe_account_id, stripe_onboarding_complete, stripe_ready_to_receive_payments')
        .in('id', sellerIds);
      if (sellerError) {
        throw new Error(helpfulSchemaError(sellerError, 'Failed to fetch seller profile data.'));
      }
      sellerRows = data || [];
    }

    const sellerMap = Object.fromEntries((sellerRows || []).map((u) => [u.id, u]));
    const payload = (listings || []).map((listing) => ({
      ...listing,
      seller: sellerMap[listing.seller_id] || null,
    }));

    return res.json({ listings: payload });
  } catch (err) {
    console.error('[storefront/listings] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to load storefront listings.',
    });
  }
});

/**
 * Legacy-compatible products listing endpoint.
 * Returns active listings normalized as "products" for simple storefront UIs.
 */
app.get('/api/products', async (_req, res) => {
  try {
    const { data: listings, error } = await supabaseAdmin
      .from('listings')
      .select('id, title, description, price, stripe_product_id, stripe_price_id, seller_id, status')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(helpfulSchemaError(error, 'Failed to list products from listings.'));
    }

    const products = (listings || []).map((listing) => ({
      id: listing.id,
      listingId: listing.id,
      name: listing.title,
      description: listing.description,
      unitAmount: Math.round(Number(listing.price) * 100),
      currency: 'usd',
      connectedAccountId: null,
      stripeProductId: listing.stripe_product_id,
      stripePriceId: listing.stripe_price_id,
    }));

    return res.json({ products });
  } catch (err) {
    console.error('[products/list] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to list products.',
    });
  }
});

/**
 * Checkout endpoint uses listing id + buyer user id.
 * Uses listing.stripe_price_id and users.stripe_account_id exactly as requested.
 */
app.post('/api/checkout/session', async (req, res) => {
  try {
    const { listingId: rawListingId, productId, buyerUserId, quantity = 1 } = req.body || {};
    const listingId = rawListingId || productId;
    if (!listingId || !buyerUserId) {
      return res.status(400).json({
        error: 'listingId (or productId) and buyerUserId are required.',
      });
    }

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer.' });
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, seller_id, title, description, price, status, stripe_product_id, stripe_price_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({
        error: listingError?.message || `Listing ${listingId} not found.`,
      });
    }
    if (listing.status !== 'active') {
      return res.status(400).json({
        error: `Listing ${listingId} is not active.`,
      });
    }

    const { data: sellerRows, error: sellerError } = await supabaseAdmin
      .from('users')
      .select('id, stripe_account_id, stripe_ready_to_receive_payments')
      .eq('id', listing.seller_id)
      .limit(1);

    if (sellerError) {
      throw new Error(helpfulSchemaError(sellerError, 'Failed to load seller account mapping.'));
    }

    const seller = sellerRows?.[0];
    if (!seller?.stripe_account_id) {
      return res.status(400).json({
        error: 'Seller is missing stripe_account_id. Onboard seller first.',
      });
    }

    // Ensure listing has Stripe product/price ids.
    const refs = await ensureStripePriceForListing(listing);

    const price = await stripeClient.prices.retrieve(refs.stripePriceId);
    if (!price.unit_amount || !price.currency) {
      return res.status(400).json({
        error: 'Stripe price is missing amount/currency.',
      });
    }

    const applicationFeeAmount = computeApplicationFee(price.unit_amount, qty);

    const session = await stripeClient.checkout.sessions.create({
      line_items: [
        {
          price: refs.stripePriceId,
          quantity: qty,
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeAmount,
        transfer_data: {
          destination: seller.stripe_account_id,
        },
      },
      metadata: {
        listing_id: listing.id,
        buyer_user_id: buyerUserId,
        seller_user_id: listing.seller_id,
      },
      mode: 'payment',
      success_url: `${APP_BASE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE_URL}/?checkout=cancelled`,
    });

    return res.json({
      sessionId: session.id,
      url: session.url,
      listingId: listing.id,
      stripePriceId: refs.stripePriceId,
      destinationAccountId: seller.stripe_account_id,
      applicationFeeAmount,
    });
  } catch (err) {
    console.error('[checkout/session] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to create checkout session.',
    });
  }
});

app.get('/api/checkout/session/:sessionId', async (req, res) => {
  try {
    const session = await stripeClient.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['line_items', 'payment_intent'],
    });
    return res.json({ session });
  } catch (err) {
    console.error('[checkout/session/:id] Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to retrieve checkout session.',
    });
  }
});

app.listen(port, () => {
  console.log(`Stripe Connect sample running at ${APP_BASE_URL}`);
  console.log(`Open ${APP_BASE_URL} to use the onboarding + storefront demo.`);
});
