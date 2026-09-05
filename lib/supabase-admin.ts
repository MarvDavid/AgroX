import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Privileged, server-only Supabase client.
 *
 * This uses the service-role key, which BYPASSES ROW LEVEL SECURITY. It exists so
 * that admin-only tables (refunds, processed_webhook_events) and Storage uploads
 * do not have to be made world-writable just to function.
 *
 * Rules:
 *  - Never import this from a client component.
 *  - Never expose the key via a NEXT_PUBLIC_ variable.
 *  - Route handlers under /api/admin/* must still verify the admin session
 *    themselves (see lib/admin-auth.ts) - this client grants no authorization of
 *    its own, it only removes the RLS ceiling.
 */

// Runtime fuse. The key is not NEXT_PUBLIC_, so Next will never inline it into a
// client bundle - importing this in the browser yields an unconfigured client
// rather than a leak - but failing loudly beats failing mysteriously.
if (typeof window !== 'undefined') {
  throw new Error(
    'lib/supabase-admin.ts was imported from client code. It is server-only.'
  );
}

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();

const serviceRoleKey =
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '').trim();

export const isAdminDbConfigured = Boolean(supabaseUrl && serviceRoleKey);

export const supabaseAdmin: SupabaseClient | null = isAdminDbConfigured
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

/**
 * The client privileged writes should use, with an explicit reason when it is
 * unavailable so callers can surface something honest instead of a silent 403.
 */
export function requireAdminDb(): { client: SupabaseClient } | { error: string } {
  if (!supabaseAdmin) {
    return {
      error:
        'SUPABASE_SERVICE_ROLE_KEY is not configured. Set it in .env.local to enable admin database writes and image uploads.',
    };
  }
  return { client: supabaseAdmin };
}
