import { NextResponse } from 'next/server';

/**
 * Maps a thrown data-layer error onto an HTTP response.
 *
 * A database that is down is a 503 (transient, retry), not a 500 (bug). Keeping
 * that distinction lets the UI say something truthful and specific instead of
 * "something went wrong" — and it replaces the old behaviour of quietly serving
 * mock data whenever a query failed.
 */
export function errorResponse(error: any, fallbackMessage: string) {
  const code = error?.code;

  if (code === 'DATABASE_UNAVAILABLE' || code === 'ADMIN_DATABASE_UNAVAILABLE') {
    return NextResponse.json(
      { success: false, code, error: error.message },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { success: false, error: error?.message || fallbackMessage },
    { status: 500 }
  );
}
