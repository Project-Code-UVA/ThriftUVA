/**
 * Shared Stripe sample API helper for Expo screens.
 *
 * This file centralizes all calls to the local Stripe Connect sample server.
 * We only use the public base URL env var here (never secret keys).
 */

type JsonRecord = Record<string, any>;

function getStripeApiBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_STRIPE_SAMPLE_BASE_URL;
  if (!raw) {
    throw new Error(
      "Missing EXPO_PUBLIC_STRIPE_SAMPLE_BASE_URL. Add it to your root .env (example: http://localhost:4242)."
    );
  }
  return raw.replace(/\/$/, "");
}

async function parseJsonResponse(response: Response): Promise<JsonRecord> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function requestJson(path: string, options: RequestInit = {}): Promise<JsonRecord> {
  const baseUrl = getStripeApiBaseUrl();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    const payload = await parseJsonResponse(response);
    if (!response.ok) {
      throw new Error(payload?.error || `Stripe API request failed (${response.status}).`);
    }
    return payload;
  } catch (error: any) {
    // Provide a clean offline hint for local development.
    if (error?.message?.includes("Network request failed")) {
      throw new Error(
        "Stripe payment server appears offline. Start it with `npm run stripe:sample` and try again."
      );
    }
    throw error;
  }
}

/**
 * Creates a hosted Checkout Session for a listing + buyer.
 * Returns the checkout URL to open in the browser.
 */
export async function createCheckoutSession(
  listingId: string,
  buyerUserId: string
): Promise<string> {
  const payload = await requestJson("/api/checkout/session", {
    method: "POST",
    body: JSON.stringify({
      listingId,
      buyerUserId,
      quantity: 1,
    }),
  });

  const checkoutUrl = payload?.url || payload?.checkoutUrl;
  if (!checkoutUrl) {
    throw new Error("Stripe checkout URL was not returned by the payment server.");
  }
  return checkoutUrl;
}

/**
 * Creates/ensures Stripe product+price for a listing on the backend.
 */
export async function syncListingStripeProduct(listingId: string): Promise<JsonRecord> {
  return requestJson(`/api/listings/${encodeURIComponent(listingId)}/sync-stripe-product`, {
    method: "POST",
  });
}

/**
 * Creates a connected account for current app user.
 */
export async function createConnectedAccountForUser(input: {
  appUserId: string;
  displayName: string;
  contactEmail: string;
}): Promise<JsonRecord> {
  return requestJson("/api/connect/accounts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Fetches current Stripe payout/onboarding status for a user.
 */
export async function getUserPaymentStatus(userId: string): Promise<JsonRecord> {
  return requestJson(`/api/connect/users/${encodeURIComponent(userId)}/status`);
}

/**
 * Creates an onboarding link for a connected account by user id.
 */
export async function createUserOnboardingLink(userId: string): Promise<string> {
  const payload = await requestJson(
    `/api/connect/users/${encodeURIComponent(userId)}/onboarding-link`,
    {
      method: "POST",
    }
  );
  if (!payload?.url) {
    throw new Error("Onboarding link was not returned by the payment server.");
  }
  return payload.url;
}

