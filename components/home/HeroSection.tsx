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

            <div className="agrox-hero-cta" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--color-glass-border)',
              }}
            >
              <div>
                <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)', fontWeight: 800 }}>5,000+</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, lineHeight: 1.2 }}>Verified Farmers</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)', fontWeight: 800 }}>100%</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, lineHeight: 1.2 }}>Quality Guarantee</div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(1.15rem, 2.5vw, 1.5rem)', fontWeight: 800 }}>24-48 hrs</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85, lineHeight: 1.2 }}>Fast Logistics</div>
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
                maxHeight: '320px',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
