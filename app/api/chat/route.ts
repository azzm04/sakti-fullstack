import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-server";

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL;
const MAKS_PANJANG_PESAN = 4000;
const MAKS_GAMBAR_BASE64 = 7_000_000; // kira-kira 5 MB gambar

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, data } = body;

    // ==========================================
    // 0. VALIDASI INPUT
    // ==========================================
    const userMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
    const messageContent: string =
      typeof userMessage?.content === "string" ? userMessage.content.trim() : "";

    if (!messageContent || messageContent.length > MAKS_PANJANG_PESAN) {
      return Response.json({ error: "Pesan tidak valid" }, { status: 400 });
    }

    const rawImage = data?.imageBase64;
    if (typeof rawImage === "string" && rawImage.length > MAKS_GAMBAR_BASE64) {
      return Response.json({ error: "Ukuran gambar terlalu besar" }, { status: 400 });
    }
    const imageBase64: string | null =
      typeof rawImage === "string" && rawImage.length > 0 ? rawImage : null;

    // ==========================================
    // 1. IDENTITAS DARI TOKEN, BUKAN DARI KLIEN
    // ==========================================
    const user = await getCurrentUser();
    const userId =  user?.role === "MAHASISWA_KIPK" && data?.simpan !== false ? user.id : null;
    const sessionDariKlien: string | null =
      typeof data?.sessionId === "string" ? data.sessionId : null;

    let sessionId: string | null = null;
    let isNewSession = false;

    // ==========================================
    // 2. SESI & PENYIMPANAN: HANYA UNTUK PENGGUNA LOGIN
    //    Pengguna umum: sesi sementara, tidak ada yang ditulis ke database
    // ==========================================
    if (userId) {
      if (sessionDariKlien) {
        // Sesi harus milik pengguna ini
        const milik = await prisma.chatSession.findFirst({
          where: { id: sessionDariKlien, userId },
          select: { id: true },
        });
        if (!milik) {
          return Response.json({ error: "Sesi tidak ditemukan" }, { status: 403 });
        }
        sessionId = milik.id;
      } else {
        isNewSession = true;

        // HARD LIMIT: sisakan 2 sesi terbaru agar total menjadi 3 setelah sesi baru dibuat
        const existingSessions = await prisma.chatSession.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (existingSessions.length >= 3) {
          await prisma.chatSession.deleteMany({
            where: { userId, id: { in: existingSessions.slice(2).map((s) => s.id) } },
          });
        }

        const newSession = await prisma.chatSession.create({
          data: { userId, judul: "Menganalisis percakapan..." },
        });
        sessionId = newSession.id;
      }

      await prisma.chatMessage.create({
        data: { sessionId, role: "USER", content: messageContent },
      });
    }

    // ==========================================
    // 3. SIAPKAN RIWAYAT & KIRIM KE FASTAPI
    // ==========================================
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    console.log("📤 Chat API called:", {
      login: !!userId,
      sessionId,
      message: messageContent.substring(0, 50) + "...",
      hasImage: !!imageBase64,
      historyLength: history.length,
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(`${FASTAPI_URL}/api/chat`, {
      pesan: messageContent,
      gambar_base64: imageBase64,
      history,
    });

    const botReply: string =
      response.data.jawaban ??
      response.data.reply ??
      response.data.message ??
      "Maaf, tidak ada respons.";

    // ==========================================
    // 4. SIMPAN JAWABAN AI (HANYA PENGGUNA LOGIN)
    // ==========================================
    if (sessionId) {
      await prisma.chatMessage.create({
        data: { sessionId, role: "MODEL", content: botReply },
      });
    }

    // ==========================================
    // 5. JUDUL OTOMATIS UNTUK SESI BARU
    // ==========================================
    if (isNewSession && sessionId) {
      const idSesi = sessionId;
      axios
        .post(`${FASTAPI_URL}/api/generate-title`, { pesan: messageContent })
        .then(async (titleRes) => {
          if (titleRes.data?.judul) {
            await prisma.chatSession.update({
              where: { id: idSesi },
              data: { judul: titleRes.data.judul },
            });
          }
        })
        .catch((err) => console.error("❌ Error generate title:", err));
    }

    // ==========================================
    // 6. STREAMING RESPONS KE FRONTEND
    // ==========================================
    const encoder = new TextEncoder();
    const words = botReply.split(" ");

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? "" : " ") + words[i];
            controller.enqueue(encoder.encode(`0:${JSON.stringify(word)}\n`));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.enqueue(
            encoder.encode(
              `d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("❌ Streaming error:", error);
          controller.error(error);
        }
      },
    });

    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    };
    // ID sesi hanya dikirim untuk pengguna login
    if (sessionId) headers["X-Session-Id"] = sessionId;

    return new Response(customStream, { status: 200, headers });
  } catch (error) {
    // Detail galat hanya ke log server, tidak dikirim ke pengguna
    console.error("❌ Chat API Error:", error);

    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              `0:${JSON.stringify("Maaf, terjadi kesalahan dalam memproses pesan Anda.")}\n`
            )
          );
          controller.enqueue(encoder.encode(`d:{"finishReason":"error"}\n`));
          controller.close();
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Vercel-AI-Data-Stream": "v1",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}