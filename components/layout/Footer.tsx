'use client';

import React from 'react';
import Link from 'next/link';
import { Sprout, Mail, Phone, MapPin, Shield, Truck, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--primitive-charcoal-900)', color: 'var(--primitive-white)', marginTop: '3.5rem', paddingTop: '2.5rem' }}>
      <div className="agrox-container">
        {/* Trust Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
            gap: '1.25rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(67, 160, 71, 0.15)', color: 'var(--color-success)', padding: '0.75rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              <Shield size={22} />
            </div>
            <div>
              <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700 }}>100% Quality Inspected</h4>
              <p style={{ color: 'var(--primitive-charcoal-200)', fontSize: '0.8rem' }}>Verified produce & farm inputs</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '0.75rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              <Truck size={22} />
            </div>
            <div>
              <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700 }}>Fast Freight Delivery</h4>
              <p style={{ color: 'var(--primitive-charcoal-200)', fontSize: '0.8rem' }}>Cold-chain & bulk logistics</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(249, 168, 37, 0.15)', color: 'var(--color-accent)', padding: '0.75rem', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
              <Award size={22} />
            </div>
            <div>
              <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700 }}>Farmer Escrow Protection</h4>
              <p style={{ color: 'var(--primitive-charcoal-200)', fontSize: '0.8rem' }}>Secure payment release</p>
            </div>
          </div>
        </div>

        {/* Footer Links Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
            gap: '2rem',
            paddingBottom: '2.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primitive-green-400)', marginBottom: '0.85rem' }}>
              <Sprout size={22} />
              <span>AgroX</span>
            </div>
            <p style={{ color: 'var(--primitive-charcoal-200)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              The premier digital agricultural trade engine connecting farmers, grain suppliers, seed producers, and global bulk buyers.
            </p>
          </div>

          <div>
            <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>Product Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primitive-charcoal-200)' }}>
              <li><Link href="/?category=Fresh Produce">Fresh Produce</Link></li>
              <li><Link href="/?category=Grains & Cereals">Grains & Cereals</Link></li>
              <li><Link href="/?category=Seeds & Seedlings">Seeds & Seedlings</Link></li>
              <li><Link href="/?category=Fertilizers & Soil">Fertilizers & Soil</Link></li>
              <li><Link href="/?category=Farm Equipment">Farm Machinery</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>Platform Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--primitive-charcoal-200)' }}>
              <li><Link href="/seller">Register as Farmer / Supplier</Link></li>
              <li><Link href="/buyer">Buyer Command Center</Link></li>
              <li><Link href="/checkout">Bulk Order Checkout</Link></li>
              <li><Link href="/chat">Direct Negotiations Chat</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--primitive-white)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.85rem' }}>Newsletter</h4>
            <p style={{ color: 'var(--primitive-charcoal-200)', fontSize: '0.825rem', marginBottom: '0.85rem' }}>
              Get weekly crop pricing reports & agricultural marketplace insights.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--primitive-white)',
                  fontSize: '0.825rem',
                }}
              />
              <button className="agrox-btn agrox-btn-primary" style={{ padding: '0.55rem 0.85rem', fontSize: '0.825rem' }}>
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            padding: '1.25rem 0',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--primitive-charcoal-200)',
          }}
        >
          © {new Date().getFullYear()} AgroX Platform Inc. All rights reserved. Empowering modern agriculture.
        </div>
      </div>
    </footer>
  );
}
