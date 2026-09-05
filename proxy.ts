import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isAdminConfigured, isAuthedRequest } from '@/lib/admin-auth';

/**
 * Gate for the admin console.
 *
 * `proxy.ts` is Next 16's rename of `middleware.ts` and runs on the Node.js
 * runtime (the `runtime` segment config is rejected here), so node:crypto in
 * lib/admin-auth.ts works unchanged.
 *
 * These two paths sit *inside* the matcher below and must be exempted here, or
 * the console cannot be used at all:
 *   /admin/login        - gating it redirects to itself, forever.
 *   /api/admin/session  - gating it 401s the login POST before the password is
 *                         ever read, so no session can be minted.
 */
const PUBLIC_PATHS = new Set(['/admin/login', '/api/admin/session']);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const isApiRoute = pathname.startsWith('/api/');

  // Fail closed. An unset ADMIN_PASSWORD must never mean "no password required".
  if (!isAdminConfigured()) {
    if (isApiRoute) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Admin console is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local.',
        },
        { status: 503 }
      );
    }
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('error', 'unconfigured');
    return NextResponse.redirect(url);
  }

  if (isAuthedRequest(request)) {
    return NextResponse.next();
  }

  if (isApiRoute) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

// Matcher values must be static constants. '/admin' is listed separately because
// it reads clearer than relying on ':path*' matching zero segments.
export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
