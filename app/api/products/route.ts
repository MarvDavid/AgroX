import { NextRequest, NextResponse } from 'next/server';
import { getProducts, addProduct } from '@/lib/db';

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
      inStock: true,
      stockCount: stockCount ? Number(stockCount) : 100,
      isOrganic: Boolean(isOrganic),
      featured: true,
    });

    return NextResponse.json({ success: true, product: createdProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to create product listing' }, { status: 500 });
  }
}
