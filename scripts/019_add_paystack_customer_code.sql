-- Migration 019: add paystack_customer_code to organizations
-- Stores the Paystack customer code (e.g. "CUS_xxxxxxxxxxxx") returned when a
-- customer record is created via the Paystack API. Written only via the service-
-- role admin client; never exposed through the RLS-scoped client.

BEGIN;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;

COMMIT;
