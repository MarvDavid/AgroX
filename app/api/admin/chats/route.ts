import { NextRequest, NextResponse } from 'next/server';
import { getChats, getChatMessages, sendChatMessage } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { ADMIN_SELLER_ID, ADMIN_SUPPORT_NAME } from '@/lib/constants';

/**
 * Admin support inbox.
 *
 * The unfiltered thread listing lives here rather than on /api/chat, where it
 * was being served to every visitor. The admin identity is set server-side, so
 * a client cannot choose to post as AgroX Support.
 */
export async function GET(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      const messages = await getChatMessages(chatId);
      return NextResponse.json({ success: true, messages });
    }

    const threads = await getChats();
    return NextResponse.json({ success: true, threads });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const chatId = String(body?.chatId || '').trim();
    const text = String(body?.text || '').trim();

    if (!chatId || !text) {
      return NextResponse.json(
        { success: false, error: 'A chatId and message text are required.' },
        { status: 400 }
      );
    }

    const message = await sendChatMessage(
      chatId,
      ADMIN_SELLER_ID,
      ADMIN_SUPPORT_NAME,
      'admin',
      text
    );

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send reply' },
      { status: 500 }
    );
  }
}
