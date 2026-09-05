import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  isAdminConfigured,
  verifyAdminPassword,
} from '@/lib/admin-auth';

/**
 * Admin login / logout.
 *
 * Exempted from the proxy gate in proxy.ts - gating this route would 401 the
 * login request before the password is read, leaving no way in.
 */

// One shared password with no account lockout is brute-forceable, so throttle by
// client address. In-process and therefore per-instance: enough for this app's
// single-admin console, not a substitute for a real limiter at scale.
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdminConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Admin console is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local, then restart the dev server.',
        },
        { status: 503 }
      );
    }

    const key = clientKey(request);
    if (rateLimited(key)) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!verifyAdminPassword(password)) {
      return NextResponse.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      );
    }

    // Successful login clears the throttle for this client.
    attempts.delete(key);

    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_COOKIE, createSessionToken(), SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Login failed' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE, '', { ...SESSION_COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
