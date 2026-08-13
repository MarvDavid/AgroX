const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || '';


const initialProducts = [
  {
    id: 'ag-1',
    name: 'Organic Fresh Yellow Maize',
    category: 'Grains & Cereals',
    price: 35000,
    original_price: 42000,
    unit: 'bag (50kg)',
    rating: 4.8,
    reviews_count: 124,
    image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=80&w=800',
    description: 'Premium grade sun-dried yellow maize harvested directly from sustainable farms. Dried to 12% moisture content suitable for storage or processing.',
    seller: JSON.stringify({
      id: 's-101',
      name: 'SunValley Grain Farms',
      location: 'Oyo State, Nigeria',
      verified: true,
      rating: 4.9
    }),
    in_stock: true,
    stock_count: 450,
    is_organic: true,
    featured: true,
    tags: ['Corn', 'Maize', 'Grain', 'Bulk']
  },
  {
    id: 'ag-2',
    name: 'Fresh Harvest Roma Tomatoes',
    category: 'Fresh Produce',
    price: 25000,
    original_price: 30000,
    unit: 'basket (25kg)',
    rating: 4.7,
    reviews_count: 89,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=800',
    description: 'Farm-fresh firm red Roma tomatoes. Plucked at peak ripeness, rich in flavor, ideal for retail distribution and food processing.',
    seller: JSON.stringify({
      id: 's-102',
      name: 'GreenField Produce Co.',
      location: 'Plateau State, Nigeria',
      verified: true,
      rating: 4.8
    }),
    in_stock: true,
    stock_count: 120,
    is_organic: true,
    featured: true,
    tags: ['Tomato', 'Fresh', 'Vegetable']
  },
  {
    id: 'ag-3',
    name: 'Hybrid Tomato Seeds (F1 Resistance)',
    category: 'Seeds & Seedlings',
    price: 5000,
    original_price: null,
    unit: 'pack (500 seeds)',
    rating: 4.9,
    reviews_count: 67,
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&q=80&w=800',
    description: 'High-yield hybrid tomato seeds with high resistance to wilt and leaf curl viruses. Fast germination rate guaranteed above 95%.',
    seller: JSON.stringify({
      id: 's-103',
      name: 'AgroSeed Innovations',
      location: 'Kaduna, Nigeria',
      verified: true,
      rating: 4.95
    }),
    in_stock: true,
    stock_count: 850,
    is_organic: false,
    featured: true,
    tags: ['Seeds', 'Tomato', 'Hybrid', 'Farming']
  },
  {
    id: 'ag-4',
    name: 'Bio-Organic NPK 15-15-15 Fertilizer',
    category: 'Fertilizers & Soil',
    price: 45000,
    original_price: 50000,
    unit: 'bag (50kg)',
    rating: 4.6,
    reviews_count: 210,
    image: 'https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&q=80&w=800',
    description: 'Balanced compound fertilizer providing nitrogen, phosphorus, and potassium for accelerated crop growth and soil nutrient enrichment.',
    seller: JSON.stringify({
      id: 's-104',
      name: 'TerraNutri Agri Supplies',
      location: 'Kano, Nigeria',
      verified: true,
      rating: 4.7
    }),
    in_stock: true,
    stock_count: 300,
    is_organic: true,
    featured: false,
    tags: ['Fertilizer', 'NPK', 'Soil', 'Nutrients']
  }
];

async function main() {
  console.log('Connecting to Supabase PostgreSQL database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected successfully!');

  // Create products table
  console.log('Creating "products" table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS products (
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
  `);

  // Create orders table
  console.log('Creating "orders" table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS orders (
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
  `);

  // Create chats table
  console.log('Creating "chats" table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS chats (
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
  `);

  // Create messages table
  console.log('Creating "messages" table...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id VARCHAR(255) PRIMARY KEY,
      chat_id VARCHAR(255) NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      sender_id VARCHAR(255) NOT NULL,
      sender_name TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Seed initial products
  console.log('Seeding initial agricultural products into Supabase...');
  for (const prod of initialProducts) {
    await client.query(`
      INSERT INTO products (id, name, category, price, original_price, unit, rating, reviews_count, image, description, seller, in_stock, stock_count, is_organic, featured, tags)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO NOTHING;
    `, [
      prod.id, prod.name, prod.category, prod.price, prod.original_price, prod.unit,
      prod.rating, prod.reviews_count, prod.image, prod.description, prod.seller,
      prod.in_stock, prod.stock_count, prod.is_organic, prod.featured, prod.tags
    ]);
  }

  console.log('✅ Supabase Database Schema & Initial Data setup successfully!');
  await client.end();
}

main().catch((err) => {
  console.error('❌ Error setting up Supabase database:', err);
  process.exit(1);
});
