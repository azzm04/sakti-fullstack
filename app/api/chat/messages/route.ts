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

    // 💡 TERJEMAHKAN FORMAT ROLE DARI DATABASE KE FORMAT FRONTEND
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      // Jika di DB "USER" jadi "user", jika "MODEL" jadi "assistant"
      role: msg.role === 'USER' ? 'user' : 'assistant',
      createdAt: msg.createdAt,
      imageUrl: msg.imageUrl,
    }));

   return NextResponse.json({ messages: formattedMessages }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}