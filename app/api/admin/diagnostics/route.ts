import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { isAdminDbConfigured } from '@/lib/supabase-admin';
import { getPaystackMode } from '@/lib/paystack';

/**
 * Reports what THIS running instance can actually see and reach.
 *
 * Exists because a failure that only happens on a hosted deploy is otherwise
 * undiagnosable from a developer machine: the same code works locally, so the
 * difference is always environment, and this is the only way to inspect it.
 *
 * Admin-gated, and it never returns a secret value - only whether a variable is
 * present, its length, and a short non-reversible prefix so a wrong-key mix-up
 * (publishable pasted into the service-role slot, say) is visible.
 */

/** Describes a secret without disclosing it. */
function describe(value: string | undefined) {
  if (!value) return { present: false };
  return {
    present: true,
    length: value.length,
    // Enough to identify the key TYPE, never enough to use it.
    prefix: value.slice(0, 11),
    hasWhitespace: /\s/.test(value),
  };
}

async function probe(url: string, key: string | undefined, label: string) {
  if (!url || !key) return { target: label, skipped: 'url or key missing' };

  const started = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/refunds?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    });
    const body = await res.text();
    return {
      target: label,
      httpStatus: res.status,
      ms: Date.now() - started,
      body: body.slice(0, 200),
    };
  } catch (e: any) {
    return {
      target: label,
      networkError: e?.message,
      cause: e?.cause?.code || e?.cause?.message,
      ms: Date.now() - started,
    };
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  let host = '(unset)';
  try {
    if (url) host = new URL(url).host;
  } catch {
    host = `(unparseable: ${url.slice(0, 40)})`;
  }

  return NextResponse.json({
    success: true,
    runtime: {
      nodeVersion: process.version,
      // 'nodejs' unless something forced the edge runtime, where node:crypto
      // in lib/admin-auth.ts would not be available.
      isEdge: typeof (globalThis as any).EdgeRuntime !== 'undefined',
      vercelEnv: process.env.VERCEL_ENV || null,
      vercelRegion: process.env.VERCEL_REGION || null,
    },
    supabase: {
      host,
      urlSource: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? 'NEXT_PUBLIC_SUPABASE_URL'
        : process.env.SUPABASE_URL
          ? 'SUPABASE_URL'
          : 'none',
      anonClientConfigured: isSupabaseConfigured,
      adminClientConfigured: isAdminDbConfigured,
      anonKey: describe(anonKey),
      serviceRoleKey: describe(serviceKey),
    },
    paystack: { mode: getPaystackMode() },
    admin: {
      passwordSet: Boolean(process.env.ADMIN_PASSWORD),
      sessionSecretSet: Boolean(process.env.ADMIN_SESSION_SECRET),
    },
    // Live reachability from this instance, which is the thing a local machine
    // cannot tell you.
    probes: await Promise.all([
      probe(url, anonKey, 'refunds via publishable key'),
      probe(url, serviceKey, 'refunds via service-role key'),
    ]),
  });
}
