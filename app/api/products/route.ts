import { NextRequest, NextResponse } from 'next/server';
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
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, category, price, unit, image, description, seller, stockCount, isOrganic } = body;

    if (!name || !category || !price) {
      return NextResponse.json({ success: false, error: 'Missing required product fields' }, { status: 400 });
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
      image: image || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800',
      description: description || 'Fresh farm produce verified by AgroX logistics.',
      seller: seller || {
        id: 's-farmer-demo',
        name: 'SunValley Grain Farms',
        location: 'Oyo State, Nigeria',
        verified: true,
        rating: 4.9,
      },
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
    return NextResponse.json({ success: false, error: error.message || 'Failed to create product listing' }, { status: 500 });
  }
}
