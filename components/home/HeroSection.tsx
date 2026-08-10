'use client';

import React from 'react';
import { ArrowRight, ShieldCheck, Truck, Users } from 'lucide-react';
import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="agrox-container">
      <div className="agrox-hero">
        <div className="agrox-hero-grid">
          <div>
            <div className="agrox-marquee">
              <div className="agrox-marquee-track">
                🌾 Direct Farm-to-Buyer Marketplace &nbsp;&bull;&nbsp; Fresh Agro Produce & Machinery
              </div>
            </div>
            <h1 className="agrox-hero-title">
              Fresh Agro Produce & Machinery directly from Source.
            </h1>
            <p className="agrox-hero-subtitle">
              AgroX connects certified commercial farmers, equipment manufacturers, and bulk produce buyers with transparent pricing and fast logistics.
            </p>

            <div className="agrox-hero-cta">
              <a href="#products" className="agrox-btn" style={{ background: 'var(--color-accent)', color: 'var(--primitive-charcoal-900)' }}>
                Browse Catalog <ArrowRight size={18} />
              </a>
              <Link href="/seller" className="agrox-btn agrox-btn-outline" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--primitive-white)', borderColor: 'rgba(255,255,255,0.3)' }}>
                Sell Produce
              </Link>
            </div>

            {/* Quick stats */}
            <div
              style={{
                display: 'flex',
                gap: '2rem',
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--color-glass-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>5,000+</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Verified Farmers</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>100%</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Quality Guarantee</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>24-48 hrs</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Logistics Delivery</div>
              </div>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <img
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000"
              alt="Golden Wheat & Farm Field"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                objectFit: 'cover',
                maxHeight: '380px',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
