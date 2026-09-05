import { createClient } from '@supabase/supabase-js';

// Browser-safe client. Everything here is either NEXT_PUBLIC_ or inert, because
// this module is reachable from client components.
//
// The fallback chain below deliberately does NOT include SUPABASE_SERVICE_ROLE_KEY
// or SUPABASE_SECRET_KEY. It used to, which meant a service-role key dropped into
// any of those slots would silently become "the anon client" and mask the fact
// that RLS was being bypassed. Privileged access lives in lib/supabase-admin.ts.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

// A secret key here would be a misconfiguration, not a convenience: warn loudly
// rather than quietly running the whole app with RLS bypassed.
if (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.startsWith('service_role')) {
  console.warn(
    '[supabase] A SECRET key is set on a public Supabase env var. Move it to ' +
      'SUPABASE_SERVICE_ROLE_KEY and use the sb_publishable_ key here.'
  );
}

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let customWebSocket: any = undefined;
if (typeof window === 'undefined') {
  try {
    customWebSocket = require('ws');
  } catch (e) {
    // ws package optional in browser
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    ...(customWebSocket ? { realtime: { transport: customWebSocket } } : {}),
  }
);
