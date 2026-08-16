'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Store, MessageSquare, LayoutDashboard, X } from 'lucide-react';
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
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

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
          <Link href="/" className="agrox-brand" aria-label="AgroX Homepage">
            <img src="/header-logo-agroX.webp" alt="AgroX Logo" style={{ height: '36px', width: 'auto' }} />
          </Link>

          {/* Desktop Search bar */}
          <form className="agrox-search-form hidden-mobile" onSubmit={handleSearchSubmit}>
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
            {/* Mobile search trigger button */}
            {onSearchChange && (
              <button
                className="agrox-cart-trigger visible-mobile"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                aria-label="Toggle mobile search"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}
              >
                {isMobileSearchOpen ? <X size={18} /> : <Search size={18} />}
              </button>
            )}

            <Link href="/buyer" className="agrox-btn agrox-btn-outline" title="Buyer Dashboard" aria-label="Buyer Dashboard" style={{ padding: '0.55rem 0.75rem' }}>
              <LayoutDashboard size={18} />
              <span className="hidden-mobile">Buyer Dashboard</span>
            </Link>

            <Link href="/seller" className="agrox-btn agrox-btn-outline" title="Farmer Portal" aria-label="Farmer Portal" style={{ padding: '0.55rem 0.75rem' }}>
              <Store size={18} />
              <span className="hidden-mobile">Farmer Portal</span>
            </Link>

            {onOpenChat ? (
              <button
                className="agrox-cart-trigger"
                onClick={onOpenChat}
                aria-label="Open Direct Messages"
                title="Direct Chat"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}
              >
                <MessageSquare size={18} />
              </button>
            ) : (
              <Link
                href="/chat"
                className="agrox-cart-trigger"
                aria-label="Chat Inbox"
                title="Chat Inbox"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)' }}
              >
                <MessageSquare size={18} />
              </Link>
            )}

            <button
              className="agrox-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Cart"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.55rem', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-muted)', position: 'relative' }}
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <span className="agrox-cart-badge">{totalItems}</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        {isMobileSearchOpen && onSearchChange && (
          <div style={{ padding: '0 0 0.85rem 0' }} className="visible-mobile">
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search className="agrox-search-icon" size={18} />
              <input
                type="text"
                autoFocus
                placeholder="Search maize, tomatoes, machinery..."
                className="agrox-search-input"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={searchValue}
                onChange={(e) => {
                  setSearchValue(e.target.value);
                  onSearchChange(e.target.value);
                }}
              />
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
