import axios from 'axios';
import { prisma } from '@/lib/prisma';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Frontend harus mengirimkan sessionId dan userId di dalam objek 'data'
    const { messages, data } = body;

    const userMessage = messages[messages.length - 1];
    const messageContent = userMessage?.content || '';
    const imageBase64 = data?.imageBase64 || null;
    
    const userId = data?.userId || null;
    let sessionId = data?.sessionId || null;
    let isNewSession = false;

    // ==========================================
    // 1. MANAJEMEN SESI (PRISMA) & HARD LIMIT
    // ==========================================
    if (!sessionId) {
      isNewSession = true;

      // --- LOGIKA HARD LIMIT ---
      // Hanya berlaku jika user login (userId tidak null)
      if (userId) {
        // Ambil semua sesi milik user, urutkan dari yang paling baru
        const existingSessions = await prisma.chatSession.findMany({
          where: { userId: userId },
          orderBy: { createdAt: 'desc' },
        });

        // Jika user sudah memiliki 3 sesi atau lebih, kita sisakan 2 yang terbaru.
        // Sisa sesi terlama akan dihapus, agar ketika sesi baru ini masuk, totalnya pas 3.
        if (existingSessions.length >= 3) {
          const sessionsToDelete = existingSessions.slice(2).map(s => s.id);
          
          await prisma.chatSession.deleteMany({
            where: {
              id: { in: sessionsToDelete },
            },
          });
        }
      }
      // --------------------------

      // Buat sesi baru di database
      const newSession = await prisma.chatSession.create({
        data: {
          userId: userId,
          judul: "Menganalisis percakapan...", // Judul sementara
        }
      });
      sessionId = newSession.id;
    }

    // ==========================================
    // 2. SIMPAN PESAN USER KE DATABASE
    // ==========================================
    await prisma.chatMessage.create({
      data: {
        sessionId: sessionId,
        role: "USER",   // Ubah menjadi huruf kapital (sesuai ENUM)
        content: messages[messages.length - 1].content
      }
    });

    // ==========================================
    // 3. SIAPKAN RIWAYAT & KIRIM KE FASTAPI
    // ==========================================
    // Ambil semua pesan SEBELUMNYA sebagai history (buang pesan terakhir)
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));

    console.log('📤 Chat API called:', {
      sessionId,
      message: messageContent.substring(0, 50) + '...',
      hasImage: !!imageBase64,
      historyLength: history.length,
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(`${FASTAPI_URL}/api/chat`, {
      pesan: messageContent,
      gambar_base64: imageBase64,
      history: history // Kirim ingatan ke FastAPI
    });

    const botReply =
      response.data.jawaban ??
      response.data.reply ??
      response.data.message ??
      'Maaf, tidak ada respons.';

    console.log('✅ Backend response:', botReply.substring(0, 50) + '...');

    // ==========================================
    // 4. SIMPAN JAWABAN AI KE DATABASE
    // ==========================================
    await prisma.chatMessage.create({
      data: {
        sessionId: sessionId,
        role: "MODEL",
        content: botReply,
      }
    });

    // ==========================================
    // 5. PEMBUATAN JUDUL ASINKRON (JIKA SESI BARU)
    // ==========================================
    if (isNewSession) {
      // Fire-and-forget: Biarkan berjalan di latar belakang tanpa di-await
      axios.post(`${FASTAPI_URL}/api/generate-title`, { pesan: messageContent })
        .then(async (titleRes) => {
          if (titleRes.data?.judul) {
            await prisma.chatSession.update({
              where: { id: sessionId },
              data: { judul: titleRes.data.judul }
            });
          }
        })
        .catch(err => console.error("❌ Error generate title:", err));
    }

    // ==========================================
    // 6. STREAMING RESPONS KE FRONTEND
    // ==========================================
    const encoder = new TextEncoder();
    const words = botReply.split(' ');

    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? '' : ' ') + words[i];
            const chunk = `0:${JSON.stringify(word)}\n`;
            controller.enqueue(encoder.encode(chunk));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          controller.enqueue(
            encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
          );
          controller.close();
        } catch (error) {
          console.error('❌ Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(customStream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Vercel-AI-Data-Stream': 'v1', 
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        // Kembalikan ID Sesi agar frontend tahu sesi apa yang sedang aktif
        'X-Session-Id': sessionId, 
      },
    });

  } catch (error) {
    console.error('❌ Chat API Error:', error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Maaf, terjadi kesalahan dalam memproses pesan Anda.';

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(`0:${JSON.stringify(errorMessage)}\n`)
          );
          controller.enqueue(
            encoder.encode(`d:{"finishReason":"error"}\n`)
          );
          controller.close();
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}