'use client';

import React, { useState, useMemo } from 'react';
import Navbar from '@/components/layout/Navbar';
import CategoryBar from '@/components/layout/CategoryBar';
import HeroSection from '@/components/home/HeroSection';
import ProductCard from '@/components/products/ProductCard';
import ProductDetailModal from '@/components/products/ProductDetailModal';
import Footer from '@/components/layout/Footer';
import { MOCK_PRODUCTS } from '@/lib/data';
import { Product, ProductCategory } from '@/types';
import { Filter, SlidersHorizontal } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      // Category filter
      if (selectedCategory !== 'All' && product.category !== selectedCategory) {
        return false;
      }
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
  }, [selectedCategory, searchQuery, organicOnly]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar onSearchChange={setSearchQuery} />
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
                {selectedCategory === 'All' ? 'Featured Agricultural Catalog' : selectedCategory}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing {filteredProducts.length} verified produce & farming supplies
              </p>
            </div>

            {/* Filter toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
                  style={{ accentColor: 'var(--primary-600)', width: '16px', height: '16px' }}
                />
                <span style={{ fontWeight: 600 }}>🌿 100% Organic Only</span>
              </label>
            </div>
          </div>

          {/* Grid of Products */}
          {filteredProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '4rem 1rem',
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-light)',
              }}
            >
              <Filter size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No products found</h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
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
        />
      </main>

      <Footer />
    </div>
  );
}
