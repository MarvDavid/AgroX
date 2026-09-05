import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct, getDbHealth, getProductById, updateProduct } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ASSIGNABLE_CATEGORIES } from '@/lib/constants';
import { Product, ProductCategory } from '@/types';

// `params` is a Promise in Next 16, matching app/api/products/[id]/route.ts.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();
    const patch: Partial<Product> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ success: false, error: 'Product name cannot be empty.' }, { status: 400 });
      }
      patch.name = name;
    }

    if (body.category !== undefined) {
      if (!ASSIGNABLE_CATEGORIES.includes(body.category as ProductCategory)) {
        return NextResponse.json(
          { success: false, error: `Category must be one of: ${ASSIGNABLE_CATEGORIES.join(', ')}` },
          { status: 400 }
        );
      }
      patch.category = body.category as ProductCategory;
    }

    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { success: false, error: 'Price must be a number greater than zero.' },
          { status: 400 }
        );
      }
      patch.price = price;
    }

    if (body.originalPrice !== undefined) {
      patch.originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
    }
    if (body.unit !== undefined) patch.unit = String(body.unit).trim();
    if (body.description !== undefined) patch.description = String(body.description).trim();
    if (body.image !== undefined) patch.image = String(body.image).trim();
    if (body.isOrganic !== undefined) patch.isOrganic = Boolean(body.isOrganic);
    if (body.featured !== undefined) patch.featured = Boolean(body.featured);
    if (body.tags !== undefined) patch.tags = Array.isArray(body.tags) ? body.tags : undefined;
    if (body.seller !== undefined) patch.seller = body.seller;

    if (body.stockCount !== undefined) {
      const stockCount = Number(body.stockCount);
      if (!Number.isFinite(stockCount) || stockCount < 0) {
        return NextResponse.json({ success: false, error: 'Stock count cannot be negative.' }, { status: 400 });
      }
      patch.stockCount = stockCount;
      // Keep the derived flag consistent rather than letting the two disagree.
      patch.inStock = stockCount > 0;
    }
    if (body.inStock !== undefined && body.stockCount === undefined) {
      patch.inStock = Boolean(body.inStock);
    }

    const updated = await updateProduct(id, patch);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    const health = getDbHealth();
    return NextResponse.json({
      success: true,
      product: updated,
      ...(health.degraded
        ? { warning: `Saved locally only - the database is unreachable${health.reason ? ` (${health.reason})` : ''}.` }
        : {}),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;

    const existing = await getProductById(id);
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    await deleteProduct(id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete product' },
      { status: 500 }
    );
  }
}
