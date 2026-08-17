'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell mainClassName="agrox-page-center">
      <div
        className="agrox-panel"
        style={{ textAlign: 'center', maxWidth: '520px', width: '100%', margin: '0 auto' }}
      >
        <AlertCircle size={48} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2 }}>
          Something went wrong
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.75rem 0 1.5rem', fontSize: '0.9rem' }}>
          We hit an unexpected error loading this page. Your cart and any escrow orders are unaffected.
        </p>
        {error.digest && (
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
            Reference: {error.digest}
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} className="agrox-btn agrox-btn-primary" style={{ flex: '1 1 180px' }}>
            <RefreshCw size={16} /> Try again
          </button>
          <Link href="/" className="agrox-btn agrox-btn-outline" style={{ flex: '1 1 180px' }}>
            Back to Catalog
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
