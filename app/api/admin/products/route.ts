import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-error';
import { addProduct, getAllProductsForAdmin } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ADMIN_SELLER, ASSIGNABLE_CATEGORIES } from '@/lib/constants';
import { Product, ProductCategory } from '@/types';

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const products = await getAllProductsForAdmin();
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return errorResponse(error, 'Failed to load products');
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const category = String(body?.category || '').trim();
    const price = Number(body?.price);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required.' }, { status: 400 });
    }
    if (!ASSIGNABLE_CATEGORIES.includes(category as ProductCategory)) {
      return NextResponse.json(
        { success: false, error: `Category must be one of: ${ASSIGNABLE_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: 'Price must be a number greater than zero.' },
        { status: 400 }
      );
    }

    const originalPrice = body?.originalPrice ? Number(body.originalPrice) : undefined;
    if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice <= price)) {
      return NextResponse.json(
        { success: false, error: 'Original price must be higher than the current price.' },
        { status: 400 }
      );
    }

    const stockCount = body?.stockCount !== undefined ? Number(body.stockCount) : 0;
    if (!Number.isFinite(stockCount) || stockCount < 0) {
      return NextResponse.json(
        { success: false, error: 'Stock count cannot be negative.' },
        { status: 400 }
      );
    }

    // Default to the platform's own identity; the composer may override it to
    // attribute the listing to a real farmer instead.
    const seller: Product['seller'] =
      body?.seller && body.seller.id && body.seller.name
        ? {
            id: String(body.seller.id),
            name: String(body.seller.name),
            location: String(body.seller.location || 'Nigeria'),
            verified: Boolean(body.seller.verified),
            rating: Number(body.seller.rating) || 5.0,
          }
        : ADMIN_SELLER;

    const product = await addProduct({
      name,
      category: category as ProductCategory,
      price,
      originalPrice,
      unit: String(body?.unit || '').trim() || 'bag (50kg)',
      rating: Number(body?.rating) || 5.0,
      reviewsCount: Number(body?.reviewsCount) || 0,
      image: String(body?.image || '').trim(),
      description: String(body?.description || '').trim(),
      seller,
      inStock: stockCount > 0,
      stockCount,
      isOrganic: Boolean(body?.isOrganic),
      featured: Boolean(body?.featured),
      // Always true here regardless of the seller override - this is the field
      // the admin order view filters on.
      listedByAdmin: true,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error, 'Failed to create product');
  }
}
