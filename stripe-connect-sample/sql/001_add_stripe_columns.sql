-- Run this migration in Supabase SQL editor before using the Stripe sample.
-- It adds the columns required by stripe-connect-sample/server.js.

alter table if exists public.users
  add column if not exists stripe_account_id text,
  add column if not exists stripe_onboarding_complete boolean not null default false,
  add column if not exists stripe_ready_to_receive_payments boolean not null default false;

alter table if exists public.listings
  add column if not exists stripe_product_id text,
  add column if not exists stripe_price_id text;

alter table if exists public.transactions
  add column if not exists seller_id text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists amount_total integer,
  add column if not exists currency text;

create unique index if not exists users_stripe_account_id_idx
  on public.users (stripe_account_id)
  where stripe_account_id is not null;

create index if not exists listings_stripe_product_id_idx
  on public.listings (stripe_product_id);

create index if not exists listings_stripe_price_id_idx
  on public.listings (stripe_price_id);

create unique index if not exists transactions_stripe_checkout_session_id_idx
  on public.transactions (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
