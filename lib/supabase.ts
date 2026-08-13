import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://nxiheuoibsrsdoltbyug.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseUrl !== 'https://placeholder.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'placeholder-anon-key'
);

let customWebSocket: any = undefined;
if (typeof window === 'undefined') {
  try {
    customWebSocket = require('ws');
  } catch (e) {
    // ws package optional in browser
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  ...(customWebSocket ? { realtime: { transport: customWebSocket } } : {}),
});
