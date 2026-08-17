'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';

export default function NotFound() {
  return (
    <PageShell mainClassName="agrox-page-center">
      <div
        className="agrox-panel"
        style={{ textAlign: 'center', maxWidth: '520px', width: '100%', margin: '0 auto' }}
      >
        <Sprout size={48} style={{ color: 'var(--color-action-primary)', margin: '0 auto 1rem' }} />
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 800, lineHeight: 1.2 }}>
          Page not found
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', margin: '0.75rem 0 1.5rem', fontSize: '0.9rem' }}>
          We couldn&apos;t find that page. It may have been moved, or the listing is no longer active.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="agrox-btn agrox-btn-primary" style={{ flex: '1 1 180px' }}>
            Browse Catalog
          </Link>
          <Link href="/buyer" className="agrox-btn agrox-btn-outline" style={{ flex: '1 1 180px' }}>
            Buyer Dashboard
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
