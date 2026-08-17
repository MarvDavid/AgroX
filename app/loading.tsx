import React from 'react';

export default function Loading() {
  return (
    <div
      className="agrox-shell"
      style={{ alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}
    >
      <div
        className="spin"
        style={{
          width: '2.25rem',
          height: '2.25rem',
          borderRadius: 'var(--radius-full)',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-action-primary)',
        }}
      />
      <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
        Loading AgroX…
      </p>
    </div>
  );
}
