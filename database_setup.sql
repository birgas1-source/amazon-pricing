-- ==========================================================
-- Amazon Pricing Tool - Complete Database Setup
-- ==========================================================
-- شغل الـ SQL ده مرة واحدة في Supabase SQL Editor
-- بعد إنشاء مشروع Supabase جديد
-- ==========================================================

-- ============ 1. PRODUCTS (الجدول الأساسي) ============
CREATE TABLE IF NOT EXISTS products (
  asin TEXT PRIMARY KEY,
  title TEXT,
  image TEXT,
  brand TEXT,
  color TEXT,
  price_aed NUMERIC,
  stars NUMERIC,
  reviews_count INT,
  seller_name_ae TEXT,
  delivery_days_ae INT,
  last_scraped_ae TIMESTAMPTZ DEFAULT NOW(),
  not_in_catalog BOOLEAN DEFAULT FALSE,
  awaiting_listing BOOLEAN DEFAULT FALSE,
  rejected BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  needs_price_fix BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- ============ 2. PRODUCT_PRICING (التكلفة والشحن في EGP) ============
CREATE TABLE IF NOT EXISTS product_pricing (
  asin TEXT PRIMARY KEY REFERENCES products(asin) ON DELETE CASCADE,
  shipping_egp NUMERIC,
  shipping_source TEXT,   -- 'manual' | 'ai' | 'reference'
  ai_weight NUMERIC,
  ai_dimensions TEXT,
  ai_status TEXT,
  shipping_suspicious BOOLEAN DEFAULT FALSE,
  min_price_egp NUMERIC,
  max_price_egp NUMERIC,
  pricing_complete BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_pricing DISABLE ROW LEVEL SECURITY;

-- ============ 3. PRODUCT_EG_DATA (بيانات Amazon مصر) ============
CREATE TABLE IF NOT EXISTS product_eg_data (
  asin TEXT PRIMARY KEY REFERENCES products(asin) ON DELETE CASCADE,
  price_egp NUMERIC,
  buy_box_seller TEXT,
  buy_box_seller_id TEXT,
  buy_box_position INT,
  is_our_listing BOOLEAN DEFAULT FALSE,
  competitors INT,
  total_sellers INT,
  our_position INT,
  our_price_egp NUMERIC,
  last_scraped_eg TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_eg_data DISABLE ROW LEVEL SECURITY;

-- ============ 4. PRODUCT_SELLERS (كل البائعين لكل منتج) ============
CREATE TABLE IF NOT EXISTS product_sellers (
  id BIGSERIAL PRIMARY KEY,
  asin TEXT NOT NULL,
  seller_id TEXT,
  seller_name TEXT,
  price_egp NUMERIC,
  position INT,
  is_buy_box BOOLEAN DEFAULT FALSE,
  is_us BOOLEAN DEFAULT FALSE,
  rating_text TEXT,
  rating_count INT,
  positive_pct TEXT,
  delivery_date TEXT,
  asin_total_sellers INT,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_sellers_asin ON product_sellers(asin);
CREATE INDEX IF NOT EXISTS idx_product_sellers_seller_id ON product_sellers(seller_id);
ALTER TABLE product_sellers DISABLE ROW LEVEL SECURITY;

-- ============ 5. PRICE_ALERTS (التنبيهات) ============
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asin TEXT REFERENCES products(asin) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'price_up' | 'price_down' | 'unavailable_ae' | 'delisted' | 'delivery_change'
  old_value NUMERIC,
  new_value NUMERIC,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_alerts_asin ON price_alerts(asin);
CREATE INDEX IF NOT EXISTS idx_price_alerts_seen ON price_alerts(seen);
ALTER TABLE price_alerts DISABLE ROW LEVEL SECURITY;

-- ============ 6. PRICE_HISTORY (تاريخ الأسعار) ============
CREATE TABLE IF NOT EXISTS price_history (
  id BIGSERIAL PRIMARY KEY,
  asin TEXT NOT NULL,
  price_aed NUMERIC,
  price_egp NUMERIC,
  our_price_egp NUMERIC,
  buy_box_seller TEXT,
  source TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_price_history_asin ON price_history(asin);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at);
ALTER TABLE price_history DISABLE ROW LEVEL SECURITY;

-- ============ 7. SCRAPE_JOBS (سجل عمليات السكراب) ============
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT,
  status TEXT DEFAULT 'pending',  -- 'pending' | 'running' | 'done' | 'failed'
  total_products INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE scrape_jobs DISABLE ROW LEVEL SECURITY;

-- ============ 8. SETTINGS (إعدادات عامة - سعر الصرف، إلخ) ============
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- القيم الافتراضية
INSERT INTO settings (key, value) VALUES ('exchange_rate_aed_to_egp', '14.5')
ON CONFLICT (key) DO NOTHING;

-- ============ 9. SHIPPING_REFERENCE (مرجع الشحن - cache دائم) ============
CREATE TABLE IF NOT EXISTS shipping_reference (
  asin TEXT PRIMARY KEY,
  shipping_egp NUMERIC,
  ai_weight NUMERIC,
  ai_dimensions TEXT,
  ai_status TEXT,
  shipping_suspicious BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shipping_reference DISABLE ROW LEVEL SECURITY;

-- ============ 10. FRIEND_SELLERS (البائعين الأصدقاء - رفض تلقائي) ============
CREATE TABLE IF NOT EXISTS friend_sellers (
  seller_id TEXT PRIMARY KEY,
  seller_name TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);
ALTER TABLE friend_sellers DISABLE ROW LEVEL SECURITY;

-- ============ 11. SCRAPE_STATE (تتبع الـ batches للـ cron) ============
CREATE TABLE IF NOT EXISTS scrape_state (
  market TEXT PRIMARY KEY,  -- 'ae' | 'eg'
  prev_data JSONB NOT NULL,
  total_batches INTEGER NOT NULL DEFAULT 1,
  completed_batches INTEGER DEFAULT 0,
  all_alerts JSONB DEFAULT '[]'::jsonb,
  products_updated INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE scrape_state DISABLE ROW LEVEL SECURITY;

-- ============ 12. V_PRODUCTS (المنظور الرئيسي) ============
CREATE OR REPLACE VIEW v_products AS
SELECT
  p.asin, p.title, p.image, p.brand, p.color, p.price_aed, p.stars, p.reviews_count,
  p.seller_name_ae, p.delivery_days_ae, p.last_scraped_ae,
  p.not_in_catalog, p.awaiting_listing,
  p.rejected, p.rejection_reason, p.needs_price_fix,
  pp.shipping_egp, pp.min_price_egp, pp.max_price_egp, pp.pricing_complete,
  pp.shipping_source, pp.ai_weight, pp.ai_dimensions, pp.ai_status, pp.shipping_suspicious,
  pp.updated_at AS pricing_updated_at,
  eg.price_egp, eg.buy_box_seller, eg.buy_box_seller_id, eg.is_our_listing,
  eg.competitors, eg.last_scraped_eg,
  eg.buy_box_position, eg.total_sellers, eg.our_position, eg.our_price_egp,
  CASE
    WHEN p.rejected = TRUE AND p.needs_price_fix = TRUE THEN 'price_fix'
    WHEN p.rejected = TRUE THEN 'rejected'
    WHEN p.not_in_catalog = TRUE THEN 'rejected'
    WHEN pp.shipping_suspicious = TRUE THEN 'suspicious'
    WHEN pp.shipping_egp IS NULL THEN 'missing'
    WHEN eg.is_our_listing = TRUE THEN 'active'
    WHEN p.awaiting_listing = TRUE THEN 'awaiting'
    WHEN eg.price_egp IS NOT NULL AND pp.min_price_egp IS NOT NULL
      AND eg.price_egp < pp.min_price_egp THEN 'burnt'
    WHEN eg.our_position IS NOT NULL AND eg.is_our_listing = FALSE THEN 'lost_buybox'
    WHEN pp.pricing_complete = TRUE THEN 'ready'
    ELSE 'missing'
  END AS status,
  CASE
    WHEN eg.price_egp IS NOT NULL AND pp.min_price_egp IS NOT NULL
    THEN ROUND(((eg.price_egp - pp.min_price_egp) / pp.min_price_egp * 100)::NUMERIC, 1)
    ELSE NULL
  END AS price_diff_pct,
  CASE
    WHEN eg.our_price_egp IS NOT NULL AND eg.price_egp IS NOT NULL
      AND eg.is_our_listing = FALSE AND eg.our_position IS NOT NULL
    THEN ROUND((eg.our_price_egp - eg.price_egp)::NUMERIC, 1)
    ELSE NULL
  END AS buy_box_gap
FROM products p
LEFT JOIN product_pricing pp ON p.asin = pp.asin
LEFT JOIN product_eg_data eg ON p.asin = eg.asin;

-- ============ DONE ============
-- لو شفت الرسالة "Success. No rows returned" يبقى كله تمام ✅
