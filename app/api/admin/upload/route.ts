import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { requireAdminDb } from '@/lib/supabase-admin';

const BUCKET = 'product-images';
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

/**
 * Uploads a product image to Supabase Storage.
 *
 * Goes through the service-role client: with the publishable key, Storage would
 * need an anon INSERT policy on storage.objects, which is far more permission
 * than this needs. When the service key is absent the route says so plainly, and
 * the composer's "paste an image URL" field keeps working.
 */
export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  const db = requireAdminDb();
  if ('error' in db) {
    return NextResponse.json(
      { success: false, code: 'NO_SERVICE_ROLE', error: `${db.error} You can paste an image URL instead.` },
      { status: 503 }
    );
  }

  try {
    // App Router route handlers have no built-in body size limit, so the guards
    // below are the only thing standing between this and a memory exhaustion.
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'No file was uploaded.' }, { status: 400 });
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type "${file.type}". Use JPEG, PNG, WebP, AVIF or GIF.` },
        { status: 415 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { success: false, error: `Image is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB.` },
        { status: 413 }
      );
    }

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const objectName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await db.client.storage.from(BUCKET).upload(objectName, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      const hint = /bucket/i.test(error.message)
        ? ' Run `npm run setup-db` to create the product-images bucket.'
        : '';
      return NextResponse.json({ success: false, error: `${error.message}${hint}` }, { status: 502 });
    }

    const { data } = db.client.storage.from(BUCKET).getPublicUrl(objectName);

    return NextResponse.json({ success: true, url: data.publicUrl, path: objectName });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
