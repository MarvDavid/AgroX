'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Store, User, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar({
  onSearchChange,
  onOpenChat,
}: {
  onSearchChange?: (query: string) => void;
  onOpenChat?: () => void;
}) {
  const { setIsCartOpen, totalItems } = useCart();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(searchValue);
    }
  };

  return (
    <header className="agrox-header">
      <div className="agrox-container">
        <div className="agrox-nav-wrapper">
          {/* Logo */}
          <Link href="/" className="agrox-brand">
            <img src="/header-logo-agroX.webp" alt="AgroX Logo" style={{ height: '36px', width: 'auto' }} />
          </Link>

          {/* Search bar */}
          <form className="agrox-search-form" onSubmit={handleSearchSubmit}>
            <Search className="agrox-search-icon" size={18} />
            <input
              type="text"
              placeholder="Search maize, tomatoes, seeds, machinery..."
              className="agrox-search-input"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
            />
          </form>

          {/* Nav buttons */}
          <div className="agrox-nav-actions">
            <Link href="/buyer" className="agrox-btn agrox-btn-outline" title="Buyer Dashboard">
              <LayoutDashboard size={18} />
              <span className="hidden-mobile">Buyer Dashboard</span>
            </Link>

            <Link href="/seller" className="agrox-btn agrox-btn-outline" title="Farmer Portal">
              <Store size={18} />
              <span className="hidden-mobile">Farmer Portal</span>
            </Link>

            {onOpenChat ? (
              <button
                className="agrox-cart-trigger"
                onClick={onOpenChat}
                aria-label="Open Direct Messages"
                title="Direct Chat"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}
              >
                <MessageSquare size={20} />
              </button>
            ) : (
              <Link
                href="/chat"
                className="agrox-cart-trigger"
                aria-label="Chat Inbox"
                title="Chat Inbox"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}
              >
                <MessageSquare size={20} />
              </Link>
            )}

            <button
              className="agrox-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Cart"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.625rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)', position: 'relative' }}
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="agrox-cart-badge">{totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
