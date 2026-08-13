const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nxiheuoibsrsdoltbyug.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: ws },
});

async function testConnection() {
  console.log('Testing Supabase REST API connection with user API keys...');
  
  try {
    const { data, error } = await supabase.from('products').select('*').limit(5);
    
    if (error) {
      console.log('Supabase returned response:', error.message, '| Code:', error.code);
    } else {
      console.log('✅ Supabase connected successfully! Product count in DB:', data.length);
    }
  } catch (err) {
    console.error('Unexpected error connecting to Supabase:', err.message);
  }
}

testConnection();
