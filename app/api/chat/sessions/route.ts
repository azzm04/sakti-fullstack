export const dynamic = 'force-dynamic'; // Wajib agar tidak di-cache Next.js

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ sessions: [] }, { status: 200 });
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    // Kita petakan (map) datanya agar memiliki properti 'title' dan 'judul'
    // Sehingga apapun yang diminta oleh frontend ChatSidebar.tsx pasti cocok.
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      title: s.judul || "Percakapan Baru", // Menyesuaikan jika frontend butuh 'title'
      judul: s.judul || "Percakapan Baru", // Menyesuaikan jika frontend butuh 'judul'
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ sessions: formattedSessions }, { status: 200 });
  } catch (error) {
    console.error('❌ Error fetching sessions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}