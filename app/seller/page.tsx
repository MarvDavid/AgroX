'use client';

import React, { useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Truck, 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  Upload,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function SellerPortalPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    farmName: '',
    location: '',
    category: 'Fresh Produce',
    productTitle: '',
    price: '',
    unit: 'bag (50kg)',
    description: '',
  });

  const handleListingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsListingModalOpen(false);
    }, 3000);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'products', label: 'Products', icon: TrendingUp },
    { id: 'deliveries', label: 'Deliveries', icon: Truck },
    { id: 'disputes', label: 'Disputes', icon: ShieldAlert },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-surface-muted)' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '2rem 0' }} className="agrox-container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="agrox-seller-grid">
          
          {/* Sidebar Nav */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', height: 'fit-content' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>Farmer Portal</h2>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'var(--primitive-green-100)' : 'transparent',
                    color: isActive ? 'var(--primitive-green-900)' : 'var(--color-text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Main Dashboard Area */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Good morning, SunValley Farms</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>Here's what's happening with your farm today.</p>
              </div>
              <button 
                onClick={() => setIsListingModalOpen(true)}
                className="agrox-btn agrox-btn-primary"
              >
                <Plus size={18} /> List New Product
              </button>
            </div>

            {/* Dashboard Cards (Kept sparing as requested) */}
            {activeTab === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Today's Sales (Escrow)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{formatCurrency(1450000)}</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Pending Orders</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>12</div>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Active Deliveries</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>4</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(249, 168, 37, 0.1)', border: '1px solid rgba(249, 168, 37, 0.3)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={24} style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Action Required</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>3 new orders need to be dispatched to logistics today.</p>
                    <button style={{ marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-action-primary)', background: 'transparent' }}>View Orders →</button>
                  </div>
                </div>
              </>
            )}

            {/* Empty State for other tabs */}
            {activeTab !== 'dashboard' && (
              <div style={{ background: 'var(--color-surface)', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'center' }}>
                <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>No data available</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>This section is currently empty.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Product Listing Modal */}
      {isListingModalOpen && (
        <>
          <div className="agrox-drawer-backdrop" onClick={() => !submitted && setIsListingModalOpen(false)} style={{ zIndex: 110 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '2.5rem', zIndex: 111, boxShadow: 'var(--shadow-xl)'
          }}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <CheckCircle2 size={56} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Listing Submitted!</h2>
                <p style={{ color: 'var(--color-text-secondary)', margin: '0.75rem 0' }}>Our agents will verify your produce within 4 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleListingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>List New Product</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Category</label>
                    <select className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option>Fresh Produce</option>
                      <option>Grains & Cereals</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Product Title</label>
                    <input type="text" required className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.productTitle} onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Price (NGN ₦)</label>
                    <input type="number" required className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Unit Packaging</label>
                    <input type="text" required className="agrox-search-input" style={{ paddingLeft: '1rem' }} value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>Harvest Description</label>
                  <textarea rows={4} required className="agrox-search-input" style={{ paddingLeft: '1rem', borderRadius: 'var(--radius-md)', height: 'auto' }} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button type="button" onClick={() => setIsListingModalOpen(false)} className="agrox-btn" style={{ flex: 1, background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)' }}>Cancel</button>
                  <button type="submit" className="agrox-btn agrox-btn-primary" style={{ flex: 2 }}><Upload size={18} /> Submit Listing</button>
                </div>
              </form>
            )}
          </div>
        </>
      )}

      <Footer />
      
      <style dangerouslySetInnerHTML={{__html: `
        .agrox-seller-grid { grid-template-columns: 1fr; }
        @media(min-width: 992px) { .agrox-seller-grid { grid-template-columns: 250px 1fr; } }
      `}} />
    </div>
  );
}
