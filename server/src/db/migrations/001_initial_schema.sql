-- ============================================================================
-- Migration: 001 Initial Schema
-- Premium PC E-Commerce Platform
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Updated-at trigger function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'admin', 'staff', 'manager')),
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'suspended', 'deleted')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Categories (hierarchical) ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url   TEXT,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  meta_title  TEXT,
  meta_desc   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug      ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_visible   ON categories(is_visible, sort_order);

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Brands ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  logo_url    TEXT,
  description TEXT,
  website_url TEXT,
  is_visible  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug    ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_visible ON brands(is_visible, sort_order);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Products ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  sku              TEXT UNIQUE NOT NULL,
  description      TEXT,
  category_id      UUID NOT NULL REFERENCES categories(id),
  brand_id         UUID NOT NULL REFERENCES brands(id),
  price            NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  previous_price   NUMERIC(12, 2) CHECK (previous_price >= 0),
  cost_price       NUMERIC(12, 2) CHECK (cost_price >= 0),
  discount_percent SMALLINT NOT NULL DEFAULT 0
                     CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured      BOOLEAN NOT NULL DEFAULT FALSE,
  is_new           BOOLEAN NOT NULL DEFAULT FALSE,
  rating           NUMERIC(3, 2) NOT NULL DEFAULT 0.00
                     CHECK (rating >= 0 AND rating <= 5),
  review_count     INT NOT NULL DEFAULT 0,
  wattage          INT,
  weight_grams     INT,
  -- Full-text search vector (auto-updated via trigger)
  search_vector    TSVECTOR,
  meta_title       TEXT,
  meta_desc        TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_sku         ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand       ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_price       ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_active      ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_search      ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_rating      ON products(rating DESC);
CREATE INDEX IF NOT EXISTS idx_products_created     ON products(created_at DESC);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.sku, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Product Images ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  alt_text   TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);

-- ─── Product Specifications ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_specs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  value      TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_specs_product ON product_specs(product_id, sort_order);

-- ─── Product Tags ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_tags (
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag        TEXT NOT NULL,
  PRIMARY KEY (product_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

-- ─── Inventory (separate from products to allow independent management) ───────

CREATE TABLE IF NOT EXISTS inventory (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand    INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  quantity_reserved   INT NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  low_stock_threshold INT NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
  supplier            TEXT,
  restock_eta         DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_reserved_lte_on_hand
    CHECK (quantity_reserved <= quantity_on_hand)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
  ON inventory(quantity_on_hand)
  WHERE quantity_on_hand <= low_stock_threshold;

-- Computed available quantity view
CREATE OR REPLACE VIEW inventory_status AS
SELECT
  i.product_id,
  i.quantity_on_hand,
  i.quantity_reserved,
  (i.quantity_on_hand - i.quantity_reserved) AS quantity_available,
  i.low_stock_threshold,
  CASE
    WHEN (i.quantity_on_hand - i.quantity_reserved) <= 0 THEN 'out-of-stock'
    WHEN (i.quantity_on_hand - i.quantity_reserved) <= i.low_stock_threshold THEN 'low-stock'
    ELSE 'in-stock'
  END AS stock_status
FROM inventory i;

-- ─── Carts ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT carts_user_or_session
    CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_carts_user_id    ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

CREATE TRIGGER carts_updated_at
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Cart Items ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 99),
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);

-- ─── Orders ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     TEXT UNIQUE NOT NULL,
  user_id          UUID REFERENCES users(id),
  status           TEXT NOT NULL DEFAULT 'processing'
                     CHECK (status IN ('processing','assembling','quality_check','shipped','delivered','cancelled','refunded')),
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                     CHECK (payment_status IN ('pending','paid','failed','refunded')),
  payment_method   TEXT,
  payment_ref      TEXT,
  subtotal         NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost    NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  tax_amount       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount  NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total            NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  currency         TEXT NOT NULL DEFAULT 'USD',
  -- Shipping address snapshot (preserved even if user changes their address)
  shipping_name    TEXT NOT NULL,
  shipping_street  TEXT NOT NULL,
  shipping_city    TEXT NOT NULL,
  shipping_state   TEXT NOT NULL,
  shipping_zip     TEXT NOT NULL,
  shipping_country TEXT NOT NULL,
  tracking_number  TEXT,
  estimated_delivery TEXT,
  customer_email   TEXT,
  customer_phone   TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id      ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created      ON orders(created_at DESC);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Order Items (immutable product snapshots) ────────────────────────────────

CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES orders(id),
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  -- Snapshots — preserved even if product changes later
  product_name      TEXT NOT NULL,
  product_sku       TEXT NOT NULL,
  product_image_url TEXT,
  unit_price        NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity          INT NOT NULL CHECK (quantity > 0),
  discount_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total        NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

-- ─── Order Timeline ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS order_timeline (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id),
  status      TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_timeline_order ON order_timeline(order_id, created_at);

-- ─── Wishlist ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);

-- ─── Reviews ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id),
  rating            SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title             TEXT NOT NULL,
  content           TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── Schema Migrations Tracking ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
  version    TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version) VALUES ('001') ON CONFLICT DO NOTHING;
