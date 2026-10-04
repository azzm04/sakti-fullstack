export const dynamic = "force-dynamic"; // Wajib agar tidak di-cache Next.js

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET() {
  try {
    // userId diambil dari sesi login, bukan dari parameter URL
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ sessions: [] }, { status: 200 }); // pengguna umum
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, judul: true, createdAt: true },
    });

    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      title: s.judul || "Percakapan Baru",
      judul: s.judul || "Percakapan Baru",
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ sessions: formattedSessions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}