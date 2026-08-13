-- AgroX Supabase Database Schema & Realtime Setup
-- Copy and paste this SQL script into your Supabase Dashboard > SQL Editor > Run

-- 1. Create Products Table
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

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(255) PRIMARY KEY,
  reference VARCHAR(255) UNIQUE NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT,
  shipping_address TEXT,
  items JSONB NOT NULL,
  total_amount NUMERIC NOT NULL,
  escrow_status TEXT NOT NULL DEFAULT 'paid_escrow_secured',
  paystack_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Chats Table
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

-- 4. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id VARCHAR(255) PRIMARY KEY,
  chat_id VARCHAR(255) NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id VARCHAR(255) NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON public.orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_paystack_ref ON public.orders(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON public.chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_farmer_id ON public.chats(farmer_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created ON public.messages(chat_id, created_at ASC);

-- 6. Enable Row Level Security & Access Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Products: Public can browse & search produce; authenticated/authorized can list
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update products" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

-- Orders: Public can create order & query by reference / buyer email
CREATE POLICY "Orders read policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders insert policy" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Orders update status policy" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);

-- Chats & Messages: Enable conversation access & creation
CREATE POLICY "Chats select policy" ON public.chats FOR SELECT USING (true);
CREATE POLICY "Chats insert policy" ON public.chats FOR INSERT WITH CHECK (true);
CREATE POLICY "Chats update policy" ON public.chats FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Messages select policy" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Messages insert policy" ON public.messages FOR INSERT WITH CHECK (true);

-- Seed Initial Marketplace Produce
INSERT INTO public.products (id, name, category, price, original_price, unit, rating, reviews_count, image, description, seller, in_stock, stock_count, is_organic, featured, tags)
VALUES 
(
  'ag-1', 
  'Organic Fresh Yellow Maize', 
  'Grains & Cereals', 
  35000, 
  42000, 
  'bag (50kg)', 
  4.8, 
  124, 
  'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800', 
  'Premium grade sun-dried yellow maize harvested directly from sustainable farms. Dried to 12% moisture content suitable for storage or processing.', 
  '{"id": "s-101", "name": "SunValley Grain Farms", "location": "Oyo State, Nigeria", "rating": 4.9, "verified": true}', 
  true, 
  450, 
  true, 
  true, 
  ARRAY['Corn', 'Maize', 'Grain', 'Bulk']
),
(
  'ag-2', 
  'Fresh Harvest Roma Tomatoes', 
  'Fresh Produce', 
  25000, 
  30000, 
  'basket (25kg)', 
  4.7, 
  89, 
  'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800', 
  'Farm-fresh firm red Roma tomatoes. Plucked at peak ripeness, rich in flavor, ideal for retail distribution and food processing.', 
  '{"id": "s-102", "name": "GreenField Produce Co.", "location": "Plateau State, Nigeria", "rating": 4.8, "verified": true}', 
  true, 
  120, 
  true, 
  true, 
  ARRAY['Tomato', 'Fresh', 'Vegetable']
)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime Broadcast for Messaging
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
