-- 004_catalog_extensions.sql
-- Additive only. Never modifies objects created by 001–003.
--
-- 1. stripe_events — webhook idempotency ledger: each Stripe event id is
--    claimed exactly once, so replayed/duplicate webhooks become no-ops.
-- 2. products.performance_tier — tier label used by prebuilt gaming PCs.
-- 3. product_benchmarks — per-game FPS figures shown on gaming-PC pages.
--    NOTE: imported benchmark figures are marketing data supplied with the
--    catalog and require client confirmation (see PRODUCTION_ECOMMERCE_AUDIT.md).

CREATE TABLE IF NOT EXISTS stripe_events (
  event_id     TEXT PRIMARY KEY,
  type         TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS performance_tier TEXT;

CREATE TABLE IF NOT EXISTS product_benchmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  game       TEXT NOT NULL,
  fps_1440p  INT CHECK (fps_1440p >= 0),
  fps_4k     INT CHECK (fps_4k >= 0),
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_benchmarks_product ON product_benchmarks(product_id);
