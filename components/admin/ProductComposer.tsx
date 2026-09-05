'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, RefreshCw, AlertCircle, ImageIcon, Link2 } from 'lucide-react';
import { Product } from '@/types';
import { ADMIN_SELLER, ASSIGNABLE_CATEGORIES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

interface ProductComposerProps {
  open: boolean;
  /** Present when editing; absent when creating. */
  initial?: Product | null;
  /** Farmers already on the marketplace, offered as attribution overrides. */
  sellers: Product['seller'][];
  onClose: () => void;
  onSaved: (product: Product, mode: 'created' | 'updated', warning?: string) => void;
}

const emptyForm = {
  name: '',
  category: ASSIGNABLE_CATEGORIES[0] as string,
  price: '',
  originalPrice: '',
  unit: 'bag (50kg)',
  description: '',
  stockCount: '100',
  image: '',
  isOrganic: false,
  featured: false,
  sellerId: ADMIN_SELLER.id,
};

export default function ProductComposer({
  open,
  initial,
  sellers,
  onClose,
  onSaved,
}: ProductComposerProps) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = Boolean(initial);

  // Seller options always include the house identity, then any distinct farmer
  // already selling on the marketplace.
  const sellerOptions = useMemo(() => {
    const byId = new Map<string, Product['seller']>();
    byId.set(ADMIN_SELLER.id, ADMIN_SELLER);
    for (const s of sellers) {
      if (s?.id && !byId.has(s.id)) byId.set(s.id, s);
    }
    return Array.from(byId.values());
  }, [sellers]);

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initial) {
      setForm({
        name: initial.name,
        category: initial.category,
        price: String(initial.price),
        originalPrice: initial.originalPrice ? String(initial.originalPrice) : '',
        unit: initial.unit,
        description: initial.description || '',
        stockCount: String(initial.stockCount ?? 0),
        image: initial.image || '',
        isOrganic: Boolean(initial.isOrganic),
        featured: Boolean(initial.featured),
        sellerId: initial.seller?.id || ADMIN_SELLER.id,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError('');
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: data });
      const json = await res.json();

      if (!res.ok || !json.success) {
        // Upload needs a service-role key; pasting a URL always works, so say so
        // rather than leaving the field looking broken.
        setError(json.error || 'Upload failed. You can paste an image URL instead.');
        return;
      }
      setForm((prev) => ({ ...prev, image: json.url }));
    } catch (e: any) {
      setError(e?.message || 'Upload failed. You can paste an image URL instead.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const seller = sellerOptions.find((s) => s.id === form.sellerId) || ADMIN_SELLER;

    const payload = {
      name: form.name.trim(),
      category: form.category,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      unit: form.unit.trim(),
      description: form.description.trim(),
      stockCount: Number(form.stockCount),
      image: form.image.trim(),
      isOrganic: form.isOrganic,
      featured: form.featured,
      seller,
    };

    try {
      const res = await fetch(
        isEditing ? `/api/admin/products/${encodeURIComponent(initial!.id)}` : '/api/admin/products',
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const json = await res.json();

      if (!res.ok || !json.success) {
        // The seller portal used to swallow this and leave the modal sitting
        // there with no explanation.
        setError(json.error || 'Could not save this product.');
        return;
      }

      onSaved(json.product, isEditing ? 'updated' : 'created', json.warning);
    } catch (e: any) {
      setError(e?.message || 'Could not save this product.');
    } finally {
      setSubmitting(false);
    }
  };

  const priceNumber = Number(form.price);
  const originalNumber = Number(form.originalPrice);
  const discount =
    form.originalPrice && originalNumber > priceNumber
      ? Math.round(((originalNumber - priceNumber) / originalNumber) * 100)
      : 0;

  return (
    <>
      <div className="agrox-modal-backdrop" onClick={() => !submitting && onClose()} />
      <div className="agrox-modal agrox-modal--lg" role="dialog" aria-modal="true" aria-label={isEditing ? 'Edit listing' : 'Add listing'}>
        <div className="agrox-modal-header">
          <h3 className="agrox-modal-title">{isEditing ? 'Edit Listing' : 'Add Product Listing'}</h3>
          <button type="button" onClick={onClose} className="agrox-modal-close" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="agrox-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                background: 'rgba(211, 47, 47, 0.1)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                padding: '0.7rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                lineHeight: 1.45,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{error}</span>
            </div>
          )}

          <div>
            <label className="agrox-label">Product Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Organic Sweet Yellow Maize"
              className="agrox-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.85rem' }}>
            <div style={{ minWidth: 0 }}>
              <label className="agrox-label">Category</label>
              <select
                className="agrox-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {ASSIGNABLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ minWidth: 0 }}>
              <label className="agrox-label">Unit / Packaging</label>
              <input
                type="text"
                required
                placeholder="bag (50kg)"
                className="agrox-input"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
            <div style={{ minWidth: 0 }}>
              <label className="agrox-label">Price (NGN)</label>
              <input
                type="number"
                required
                min={1}
                step="0.01"
                placeholder="35000"
                className="agrox-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <label className="agrox-label">Was (optional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="42000"
                className="agrox-input"
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
              />
              {discount > 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.3rem', fontWeight: 600 }}>
                  Shows a SAVE {discount}% badge
                </div>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <label className="agrox-label">Stock Quantity</label>
              <input
                type="number"
                required
                min={0}
                className="agrox-input"
                value={form.stockCount}
                onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem' }}>
                {Number(form.stockCount) > 0 ? 'Listed as in stock' : 'Zero stock hides it from buyers'}
              </div>
            </div>
          </div>

          <div>
            <label className="agrox-label">Seller Attribution</label>
            <select
              className="agrox-input"
              value={form.sellerId}
              onChange={(e) => setForm({ ...form, sellerId: e.target.value })}
            >
              {sellerOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id === ADMIN_SELLER.id ? `${s.name} (platform default)` : `${s.name} - ${s.location}`}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.3rem', lineHeight: 1.45 }}>
              Listings created here stay tagged as admin-listed for your Orders view, even when attributed to a farmer.
            </div>
          </div>

          {/* Image. The seller portal has no image field at all, so every listing
              it created shared one hardcoded stock photo. */}
          <div>
            <label className="agrox-label">Product Image</label>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
                <Link2
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '0.7rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-text-secondary)',
                  }}
                />
                <input
                  type="url"
                  placeholder="Paste an image URL"
                  className="agrox-input"
                  style={{ paddingLeft: '2.1rem' }}
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <button
                type="button"
                className="agrox-btn agrox-btn-outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                style={{ flexShrink: 0 }}
              >
                {uploading ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : 'Upload'}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                }}
              />
            </div>

            <div
              style={{
                marginTop: '0.6rem',
                height: '140px',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--color-border)',
                background: 'var(--color-surface-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {form.image ? (
                <img
                  src={form.image}
                  alt="Listing preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                  <ImageIcon size={26} style={{ opacity: 0.4, margin: '0 auto 0.35rem' }} />
                  No image yet
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="agrox-label">Description</label>
            <textarea
              rows={3}
              required
              placeholder="Sun-dried yellow maize, 12% moisture level, graded and bagged."
              className="agrox-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.isOrganic}
                onChange={(e) => setForm({ ...form, isOrganic: e.target.checked })}
                style={{ accentColor: 'var(--color-success)', width: '16px', height: '16px' }}
              />
              Certified organic
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                style={{ accentColor: 'var(--color-action-primary)', width: '16px', height: '16px' }}
              />
              Feature on the storefront
            </label>
          </div>

          {priceNumber > 0 && (
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Buyers will see{' '}
              <strong style={{ color: 'var(--color-action-primary)' }}>{formatCurrency(priceNumber)}</strong>{' '}
              per {form.unit || 'unit'}.
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem' }}>
            <button type="button" onClick={onClose} className="agrox-btn agrox-btn-outline" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="agrox-btn agrox-btn-primary" style={{ flex: 2 }}>
              {submitting ? <RefreshCw size={16} className="spin" /> : <Upload size={16} />}
              {isEditing ? 'Save Changes' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
