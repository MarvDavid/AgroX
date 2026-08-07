'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Search, Sprout, Store, User, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar({
  onSearchChange,
}: {
  onSearchChange?: (query: string) => void;
}) {
  const { setIsCartOpen, totalItems } = useCart();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <div className="agrox-brand-icon">
              <Sprout size={22} />
            </div>
            <span>AgroX</span>
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
            <Link href="/seller" className="agrox-btn agrox-btn-outline">
              <Store size={18} />
              <span className="hidden-mobile">Farmer Portal</span>
            </Link>

            <button
              className="agrox-cart-trigger"
              onClick={() => setIsCartOpen(true)}
              aria-label="Open Cart"
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className="agrox-cart-badge">{totalItems}</span>
              )}
            </button>

            <button className="agrox-btn agrox-btn-primary">
              <User size={18} />
              <span>Sign In</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
