export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: sessionId },
      orderBy: { createdAt: 'asc' }, // Urutkan dari pesan tertua (atas) ke terbaru (bawah)
    });

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}