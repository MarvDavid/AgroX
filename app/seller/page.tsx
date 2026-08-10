'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Sprout, Upload, CheckCircle2, ShieldCheck, MapPin, Package } from 'lucide-react';
import Link from 'next/link';

export default function SellerPortalPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    sellerName: '',
    location: '',
    category: 'Fresh Produce',
    productTitle: '',
    price: '',
    unit: 'bag (50kg)',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }} className="agrox-container">
        <div style={{ margin: '2rem 0' }}>
          <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
            <span
              style={{
                display: 'inline-block',
                background: 'var(--primitive-green-100)',
                color: 'var(--primitive-green-900)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: '0.75rem',
              }}
            >
              FARMER & SUPPLIER PORTAL
            </span>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 800 }}>
              List Your Produce Direct to Verified Buyers
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0.5rem auto 0' }}>
              Eliminate middlemen, secure guaranteed prices, and enjoy escrow protected transactions.
            </p>
          </div>

          {submitted ? (
            <div
              style={{
                maxWidth: '600px',
                margin: '3rem auto',
                padding: '3rem 2rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Listing Submitted for Verification!</h2>
              <p style={{ color: 'var(--color-text-secondary)', margin: '0.75rem 0 1.5rem' }}>
                Our agricultural field agents will verify your produce batch within 4 hours.
              </p>
              <Link href="/" className="agrox-btn agrox-btn-primary">
                Return to Marketplace
              </Link>
            </div>
          ) : (
            <div
              style={{
                maxWidth: '700px',
                margin: '0 auto',
                background: 'var(--color-surface)',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                  Product Listing Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Farm / Cooperative Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SunValley Grain Farms"
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.farmName}
                      onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Location (State, Region)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Oyo State, Nigeria"
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Category
                    </label>
                    <select
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option>Fresh Produce</option>
                      <option>Grains & Cereals</option>
                      <option>Seeds & Seedlings</option>
                      <option>Fertilizers & Soil</option>
                      <option>Farm Equipment</option>
                      <option>Livestock & Poultry</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Product Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium White Maize (Grade A)"
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.productTitle}
                      onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Price (USD $)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 45.00"
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                      Unit Packaging
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. bag (50kg), crate"
                      className="agrox-search-input"
                      style={{ paddingLeft: '1rem' }}
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                    Harvest & Product Description
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe crop grade, moisture level, harvest date..."
                    className="agrox-search-input"
                    style={{ paddingLeft: '1rem', borderRadius: 'var(--radius-md)', height: 'auto' }}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="agrox-btn agrox-btn-primary" style={{ padding: '0.85rem', marginTop: '1rem' }}>
                  <Upload size={18} />
                  <span>Submit Listing for Escrow Verification</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
