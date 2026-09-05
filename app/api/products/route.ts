import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/api-error';
import { getProducts, addProduct } from '@/lib/db';
import { ADMIN_SELLER_ID } from '@/lib/constants';
import { isAuthedRequest } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('search') || undefined;

    const products = await getProducts(category, query);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return errorResponse(error, 'Failed to fetch products');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, unit, image, description, seller, stockCount, isOrganic } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ success: false, error: 'Missing required product fields' }, { status: 400 });
    }
    if (!seller?.id || !seller?.name) {
      return NextResponse.json(
        { success: false, error: 'A seller with an id and name is required.' },
        { status: 400 }
      );
    }

    // This route is public (the farmer portal posts to it), and it accepts a
    // caller-supplied `seller` object. Without this check anyone could POST
    // seller.id = 's-admin' / verified: true and mint a listing that the
    // storefront presents as an official, platform-owned product.
    // Admin-attributed listings must come through /api/admin/products.
    const claimsAdminIdentity =
      seller?.id === ADMIN_SELLER_ID || Boolean(body.listedByAdmin);

    if (claimsAdminIdentity && !isAuthedRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to publish listings as AgroX Admin.' },
        { status: 403 }
      );
    }

    const createdProduct = await addProduct({
      name,
      category,
      price: Number(price),
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      unit: unit || 'bag (50kg)',
      rating: 5.0,
      reviewsCount: 1,
      // No invented fallbacks. These used to default to a single stock photo, a
      // generic blurb and a fictional "SunValley Grain Farms" seller, which wrote
      // fabricated data into real product rows.
      image: String(image || '').trim(),
      description: String(description || '').trim(),
      seller,
      inStock: stockCount === undefined ? true : Number(stockCount) > 0,
      stockCount: stockCount !== undefined ? Number(stockCount) : 100,
      isOrganic: Boolean(isOrganic),
      // Was hardcoded true, which made "featured" meaningless - every listing
      // ever created through the app claimed the front page.
      featured: Boolean(body.featured),
      listedByAdmin: Boolean(body.listedByAdmin),
    });

    return NextResponse.json({ success: true, product: createdProduct }, { status: 201 });
  } catch (error: any) {
    return errorResponse(error, 'Failed to create product listing');
  }
}
