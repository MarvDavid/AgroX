-- AgroX Supabase Database Schema & Realtime Setup
--
-- This file is the SINGLE source of truth for the schema. `npm run setup-db`
-- (scripts/setup-db.js) reads and executes this exact file, so there is no second
-- copy of the DDL to drift out of sync. You can also paste it into the Supabase
-- Dashboard > SQL Editor and run it.
--
-- It is safe to run repeatedly. Every statement is idempotent:
--   - CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS for structure
--   - DROP POLICY IF EXISTS before each CREATE POLICY, because Postgres has no
--     CREATE POLICY IF NOT EXISTS. (Bare CREATE POLICY made a second run abort
--     partway, silently skipping everything after the first duplicate.)

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(255) PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  unit TEXT NOT NULL,
  rating NUMERIC DEFAULT 5.0,
  reviews_count INT DEFAULT 0,
  image TEXT,
  description TEXT,
  seller JSONB NOT NULL,
  in_stock BOOLEAN DEFAULT TRUE,
  stock_count INT DEFAULT 0,
  is_organic BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(255) PRIMARY KEY,
  reference VARCHAR(255) UNIQUE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  shipping_address TEXT,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  escrow_status TEXT NOT NULL DEFAULT 'pending',
  paystack_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.chats (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255),
  product_name TEXT,
  buyer_id VARCHAR(255) NOT NULL,
  buyer_name TEXT NOT NULL,
  farmer_id VARCHAR(255) NOT NULL,
  farmer_name TEXT NOT NULL,
  last_message TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- sender_role is plain TEXT with no CHECK constraint, so the 'admin' support
-- role needs no migration.
CREATE TABLE IF NOT EXISTS public.messages (
  id VARCHAR(255) PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refund ledger. Written only by the admin console and Paystack webhooks, both
-- of which use the service-role key, so this table keeps RLS on with NO policies
-- rather than being made world-writable like the storefront tables.
CREATE TABLE IF NOT EXISTS public.refunds (
  id VARCHAR(255) PRIMARY KEY,
  order_id VARCHAR(255) NOT NULL,
  order_reference VARCHAR(255) NOT NULL,
  paystack_reference TEXT,
  amount NUMERIC NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  paystack_refund_id TEXT UNIQUE,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paystack retries webhook deliveries. Claiming the event id here makes
-- reprocessing a no-op instead of a double transition.
CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. Migrations for existing installs
--    CREATE TABLE IF NOT EXISTS is a no-op on a table that already exists, so
--    anything added after the first release needs explicit DDL here.
-- ---------------------------------------------------------------------------

-- Provenance for listings created in the admin console. Kept separate from
-- seller so that attributing a platform listing to a real farmer still leaves a
-- trace.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS listed_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Orders are born unpaid. The old default of 'paid_escrow_secured' failed in
-- exactly the wrong direction.
ALTER TABLE public.orders
  ALTER COLUMN escrow_status SET DEFAULT 'pending';

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_products_listed_by_admin ON public.products(listed_by_admin);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON public.chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_farmer_id ON public.chats(farmer_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created ON public.messages(chat_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_refunds_order_reference ON public.refunds(order_reference);

-- Partial unique index: one order per Paystack reference, while any number of
-- unpaid orders may have a NULL reference.
DROP INDEX IF EXISTS public.idx_orders_paystack_ref;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_paystack_ref_uniq
  ON public.orders(paystack_reference) WHERE paystack_reference IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- Storefront tables. These policies are permissive because the app has no
-- end-user auth yet; the API routes are what enforce access. Tighten them here
-- when real accounts land.
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert products" ON public.products;
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update products" ON public.products;
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete products" ON public.products;
CREATE POLICY "Public delete products" ON public.products FOR DELETE USING (true);

DROP POLICY IF EXISTS "Orders read policy" ON public.orders;
CREATE POLICY "Orders read policy" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Orders update status policy" ON public.orders;
CREATE POLICY "Orders update status policy" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Chats select policy" ON public.chats;
CREATE POLICY "Chats select policy" ON public.chats FOR SELECT USING (true);
DROP POLICY IF EXISTS "Chats insert policy" ON public.chats;
CREATE POLICY "Chats insert policy" ON public.chats FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Chats update policy" ON public.chats;
CREATE POLICY "Chats update policy" ON public.chats FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
CREATE POLICY "Messages select policy" ON public.messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
CREATE POLICY "Messages insert policy" ON public.messages FOR INSERT WITH CHECK (true);

-- refunds and processed_webhook_events intentionally have NO policies: with RLS
-- enabled that denies every anon/authenticated request, and only the
-- service-role key (lib/supabase-admin.ts) can reach them.

-- ---------------------------------------------------------------------------
-- 5. Storage bucket for admin-uploaded product images
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read so <img src> works. No insert policy: uploads go through the
-- service-role key in /api/admin/upload, which bypasses RLS.
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- 6. Seed marketplace produce
-- ---------------------------------------------------------------------------

INSERT INTO public.products (id, name, category, price, original_price, unit, rating, reviews_count, image, description, seller, in_stock, stock_count, is_organic, featured, tags)
VALUES
(
  'ag-1',
  'Organic Fresh Yellow Maize',
  'Grains & Cereals',
  35000, 42000, 'bag (50kg)', 4.8, 124,
  'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
  'Premium grade sun-dried yellow maize harvested directly from sustainable farms. Dried to 12% moisture content suitable for storage or processing.',
  '{"id": "s-101", "name": "SunValley Grain Farms", "location": "Oyo State, Nigeria", "rating": 4.9, "verified": true}',
  true, 450, true, true, ARRAY['Corn', 'Maize', 'Grain', 'Bulk']
),
(
  'ag-2',
  'Fresh Harvest Roma Tomatoes',
  'Fresh Produce',
  25000, 30000, 'basket (25kg)', 4.7, 89,
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
  'Farm-fresh firm red Roma tomatoes. Plucked at peak ripeness, rich in flavor, ideal for retail distribution and food processing.',
  '{"id": "s-102", "name": "GreenField Produce Co.", "location": "Plateau State, Nigeria", "rating": 4.8, "verified": true}',
  true, 120, true, true, ARRAY['Tomato', 'Fresh', 'Vegetable']
),
(
  'ag-3',
  'Hybrid Tomato Seeds (F1 Resistance)',
  'Seeds & Seedlings',
  5000, NULL, 'pack (500 seeds)', 4.9, 67,
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=800',
  'High-yield hybrid tomato seeds with high resistance to wilt and leaf curl viruses. Fast germination rate guaranteed above 95%.',
  '{"id": "s-103", "name": "AgroSeed Innovations", "location": "Kaduna, Nigeria", "rating": 4.95, "verified": true}',
  true, 850, false, true, ARRAY['Seeds', 'Tomato', 'Hybrid', 'Farming']
),
(
  'ag-4',
  'Bio-Organic NPK 15-15-15 Fertilizer',
  'Fertilizers & Soil',
  45000, 50000, 'bag (50kg)', 4.6, 210,
  'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=800',
  'Balanced compound fertilizer providing nitrogen, phosphorus, and potassium for accelerated crop growth and soil nutrient enrichment.',
  '{"id": "s-104", "name": "TerraNutri Agri Supplies", "location": "Kano, Nigeria", "rating": 4.7, "verified": true}',
  true, 300, true, false, ARRAY['Fertilizer', 'NPK', 'Soil', 'Nutrients']
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Realtime broadcast for messaging
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;
END $$;
