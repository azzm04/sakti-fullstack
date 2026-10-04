export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    // Sesi harus milik pengguna yang sedang login
    const milik = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId: user.id },
      select: { id: true },
    });
    if (!milik) {
      return NextResponse.json({ messages: [] }, { status: 200 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" }, // dari pesan tertua ke terbaru
    });

    // Terjemahkan role database ke format frontend
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role === "USER" ? "user" : "assistant",
      createdAt: msg.createdAt,
      imageUrl: msg.imageUrl,
    }));

    return NextResponse.json({ messages: formattedMessages }, { status: 200 });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}