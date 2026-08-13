'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import CategoryBar from '@/components/layout/CategoryBar';
import HeroSection from '@/components/home/HeroSection';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import ChatDrawer from '@/components/chat/ChatDrawer';
import Footer from '@/components/layout/Footer';
import { Product, ProductCategory } from '@/types';
import { Filter, RefreshCw } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatProduct, setChatProduct] = useState<{ id: string; name: string; sellerId: string; sellerName: string } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = selectedCategory !== 'All'
        ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to fetch products from API:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChatWithFarmer = (prod: Product) => {
    setChatProduct({
      id: prod.id,
      name: prod.name,
      sellerId: prod.seller.id,
      sellerName: prod.seller.name,
    });
    setIsChatOpen(true);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCat = product.category.toLowerCase().includes(q);
        const matchesDesc = product.description.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesDesc) return false;
      }
      // Organic filter
      if (organicOnly && !product.isOrganic) {
        return false;
      }
      return true;
    });
  }, [products, searchQuery, organicOnly]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onSearchChange={setSearchQuery} onOpenChat={() => setIsChatOpen(true)} />
      <CategoryBar
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main style={{ flex: 1 }}>
        <HeroSection />

        {/* Catalog Section */}
        <section id="products" className="agrox-container" style={{ marginTop: '3rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                {selectedCategory === 'All' ? 'Verified Agricultural Produce & Equipment' : selectedCategory}
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                Showing {filteredProducts.length} verified listings from accredited farmers & suppliers
              </p>
            </div>

            {/* Filter toggles & Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={fetchProducts}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-surface-muted)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                Refresh Feed
              </button>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={organicOnly}
                  onChange={(e) => setOrganicOnly(e.target.checked)}
                  style={{ accentColor: 'var(--color-success)', width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 600 }}>🌿 100% Organic Only</span>
              </label>
            </div>
          </div>

          {/* Grid of Products */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-secondary)' }}>
              <RefreshCw size={32} className="spin" style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>Fetching live agricultural listings...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Filter size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No products found</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                Try adjusting your search query or category filters.
              </p>
            </div>
          ) : (
            <div className="agrox-product-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick View Modal */}
        <ProductDetailModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onChatFarmer={handleOpenChatWithFarmer}
        />
      </main>

      <Footer />

      {/* Direct Buyer-Farmer Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        targetProduct={chatProduct}
        currentUser={{ id: 'buyer-001', name: 'John Doe Enterprise', role: 'buyer' }}
      />
    </div>
  );
}
