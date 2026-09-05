import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin session tokens.
 *
 * Next 16's proxy.ts runs on the Node.js runtime (and the `runtime` segment
 * config is rejected there), so the same node:crypto implementation serves both
 * the proxy and the route handlers - no Web Crypto split.
 *
 * Deliberately dependency-free: proxy.ts is advised not to lean on shared
 * modules, so this pulls in nothing from lib/db or lib/supabase.
 */

export const ADMIN_COOKIE = 'agrox_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

function getPassword(): string {
  return process.env.ADMIN_PASSWORD || '';
}

function getSecret(): string {
  // Falls back to the password so a minimal setup still works, but keeping them
  // separate means rotating the password can invalidate sessions independently.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

/**
 * The admin console refuses to authenticate at all unless it is configured.
 * Fail closed: an unset password must never mean "no password required".
 */
export function isAdminConfigured(): boolean {
  return getPassword().length > 0 && getSecret().length > 0;
}

/** Length-independent constant-time compare (timingSafeEqual throws on length mismatch). */
function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function verifyAdminPassword(input: string): boolean {
  if (!isAdminConfigured()) return false;
  if (typeof input !== 'string' || input.length === 0) return false;
  return safeEqual(input, getPassword());
}

export function createSessionToken(): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ sub: 'admin', iat: now, exp: now + SESSION_TTL_SECONDS })
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!isAdminConfigured()) return false;
  if (!token) return false;

  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  if (!safeEqual(signature, sign(payload))) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded?.sub !== 'admin') return false;
    return typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isAuthedRequest(request: NextRequest): boolean {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
};

/**
 * Per-handler guard. proxy.ts already gates /api/admin/*, but the Next docs are
 * explicit that authorization must be re-checked inside the handler rather than
 * trusted from the proxy alone - this is what covers a route added later under a
 * prefix the matcher does not happen to catch.
 *
 * Returns a 401 response to return early, or null when the caller is authorized.
 */
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Admin console is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local.',
      },
      { status: 503 }
    );
  }
  if (!isAuthedRequest(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}
