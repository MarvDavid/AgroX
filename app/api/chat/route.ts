import { NextRequest, NextResponse } from 'next/server';
import { getChats, getChatMessages, sendChatMessage, createOrGetChatThread } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chatId = searchParams.get('chatId');

    if (action === 'threads' || (!chatId && !action)) {
      const threads = await getChats();
      return NextResponse.json({ success: true, threads });
    }

    if (chatId) {
      const messages = await getChatMessages(chatId);
      return NextResponse.json({ success: true, messages });
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch chat data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, chatId, senderId, senderName, senderRole, text, productId, productName, buyerId, buyerName, farmerId, farmerName } = body;

    if (action === 'create_thread') {
      if (!buyerId || !farmerId) {
        return NextResponse.json({ success: false, error: 'Missing buyer or farmer ID' }, { status: 400 });
      }
      const thread = await createOrGetChatThread(
        productId || 'ag-general',
        productName || 'Agricultural Produce',
        buyerId,
        buyerName || 'Interested Buyer',
        farmerId,
        farmerName || 'Verified Farmer'
      );
      return NextResponse.json({ success: true, thread });
    }

    if (!chatId || !senderId || !text) {
      return NextResponse.json({ success: false, error: 'Missing required message parameters' }, { status: 400 });
    }

    const message = await sendChatMessage(
      chatId,
      senderId,
      senderName || 'User',
      senderRole || 'buyer',
      text
    );

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to process chat message' }, { status: 500 });
  }
}
