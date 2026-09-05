import { NextRequest, NextResponse } from 'next/server';
import { getChats, getChatMessages, sendChatMessage, createOrGetChatThread } from '@/lib/db';
import { isAuthedRequest } from '@/lib/admin-auth';
import { ADMIN_SELLER_ID, ADMIN_SUPPORT_NAME } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const chatId = searchParams.get('chatId');
    const userId = searchParams.get('userId') || undefined;

    if (action === 'threads' || (!chatId && !action)) {
      // getChats() with no argument returns every thread on the platform. That
      // was being served to any visitor, which would expose buyers' support
      // conversations to each other the moment admin joins chat. Admins get the
      // unfiltered view; everyone else must scope to their own id.
      if (isAuthedRequest(request)) {
        const threads = await getChats(userId);
        return NextResponse.json({ success: true, threads });
      }

      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'A userId is required to list conversations.' },
          { status: 400 }
        );
      }

      const threads = await getChats(userId);
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
        farmerName === undefined && farmerId === ADMIN_SELLER_ID
          ? ADMIN_SUPPORT_NAME
          : farmerName || 'Verified Farmer'
      );
      return NextResponse.json({ success: true, thread });
    }

    if (!chatId || !senderId || !text) {
      return NextResponse.json({ success: false, error: 'Missing required message parameters' }, { status: 400 });
    }

    // senderRole and senderId are client-supplied, so without this check anyone
    // could post as AgroX Support inside a buyer's own conversation.
    const claimsAdminIdentity = senderRole === 'admin' || senderId === ADMIN_SELLER_ID;
    if (claimsAdminIdentity && !isAuthedRequest(request)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to post as AgroX Support.' },
        { status: 403 }
      );
    }

    const role: 'farmer' | 'buyer' | 'admin' =
      senderRole === 'admin' || senderRole === 'farmer' ? senderRole : 'buyer';

    const message = await sendChatMessage(
      chatId,
      senderId,
      senderName || 'User',
      role,
      text
    );

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Failed to process chat message' }, { status: 500 });
  }
}
