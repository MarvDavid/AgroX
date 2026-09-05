'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import { ShieldAlert, LogIn, RefreshCw, AlertCircle } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'unconfigured'
      ? 'Admin console is not configured. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET in .env.local, then restart the dev server.'
      : ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Login failed.');
        setSubmitting(false);
        return;
      }

      const next = searchParams.get('next');
      // Only follow same-origin admin paths, so ?next= can't be used to bounce
      // a freshly-authenticated admin off to another site.
      const target = next && next.startsWith('/admin') ? next : '/admin';
      router.replace(target);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || 'Could not reach the server.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="agrox-panel"
      style={{ maxWidth: '420px', width: '100%', margin: '0 auto', boxShadow: 'var(--shadow-xl)' }}
    >
      <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <ShieldAlert size={44} style={{ color: 'var(--color-error)', margin: '0 auto 0.75rem' }} />
        <h1 style={{ fontSize: 'clamp(1.25rem, 3.5vw, 1.6rem)', fontWeight: 800, lineHeight: 1.25 }}>
          Admin Console
        </h1>
        <p
          style={{
            color: 'var(--color-text-secondary)',
            marginTop: '0.35rem',
            fontSize: '0.875rem',
          }}
        >
          Restricted area. Sign in to manage listings, orders, refunds and support.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div>
          <label className="agrox-label" htmlFor="admin-password">
            Admin Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Enter admin password"
            className="agrox-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              background: 'rgba(211, 47, 47, 0.1)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              padding: '0.7rem 0.85rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !password}
          className="agrox-btn agrox-btn-primary"
          style={{ width: '100%' }}
        >
          {submitting ? <RefreshCw size={16} className="spin" /> : <LogIn size={16} />}
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <PageShell footer={false} mainClassName="agrox-page-center">
      {/* useSearchParams needs a Suspense boundary or the route opts the whole
          page out of static rendering at build time. */}
      <Suspense fallback={<div className="agrox-panel" style={{ maxWidth: '420px', margin: '0 auto' }}>Loading...</div>}>
        <AdminLoginForm />
      </Suspense>
    </PageShell>
  );
}
