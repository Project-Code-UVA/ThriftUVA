# Stripe Connect Sample Integration

This folder contains a standalone sample integration that demonstrates:

1. Creating connected accounts with Stripe **V2 Accounts API**.
2. Onboarding connected accounts with **V2 Account Links API**.
3. Reading live onboarding/account status from Stripe.
4. Creating platform-level Stripe products/prices for real `listings` rows.
5. Displaying a storefront from real listings and processing destination-charge checkout.
6. Handling thin webhook events for account requirements/capability updates.
7. Handling successful checkout webhooks by creating `transactions` rows and marking listings sold.

## 1) Install dependencies

From project root:

```bash
npm install
```

## 2) Configure environment

Create a `.env` file in this folder:

```bash
cp stripe-connect-sample/.env.example stripe-connect-sample/.env
```

Then fill in real values:

- `STRIPE_SECRET_KEY`
- `APP_BASE_URL` (usually `http://localhost:4242`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (after running Stripe CLI listen command)

## 3) Run sample server

From project root:

```bash
npm run stripe:sample
```

Open:

```text
http://localhost:4242
```

## 4) Start Stripe CLI webhook forwarding (thin events)

Use Stripe CLI:

```bash
stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[.recipient].capability_status_updated' --forward-thin-to http://localhost:4242/api/webhooks/stripe
```

Copy the webhook signing secret from CLI output into:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Restart the sample server.

## 5) Run SQL migration

Run `stripe-connect-sample/sql/001_add_stripe_columns.sql` in Supabase SQL editor.
This adds required Stripe columns used by the integration.

## Required database columns

The server expects these columns to exist:

- `users.stripe_account_id`
- `users.stripe_onboarding_complete`
- `users.stripe_ready_to_receive_payments`
- `listings.stripe_product_id`
- `listings.stripe_price_id`

For webhook purchase recording, it first tries to insert a rich row in `transactions` with:

- `buyer_id`
- `listing_id`
- `seller_id`
- `stripe_checkout_session_id`
- `amount_total`
- `currency`

If your `transactions` schema is minimal, it falls back to inserting only:

- `buyer_id`
- `listing_id`

## How this maps to ThriftUVA

- Seller Stripe account mapping is stored directly on `users`.
- Listing Stripe product/price mapping is stored directly on `listings`.
- Checkout uses listing `stripe_price_id` + seller `stripe_account_id`.

## Optional Expo app wiring (already added)

The existing sell screen (`app/(tabs)/sell.tsx`) now does a best-effort call to:

`POST /api/listings/:listingId/sync-stripe-product`

Set this env var in the Expo app `.env` to enable it:

- `EXPO_PUBLIC_STRIPE_SAMPLE_BASE_URL` (for example `http://localhost:4242`)
