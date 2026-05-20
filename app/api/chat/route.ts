import axios from 'axios';

const FASTAPI_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, data } = body;

    const userMessage = messages[messages.length - 1];
    const messageContent = userMessage?.content || '';
    const imageBase64 = data?.imageBase64 || null;

    console.log('📤 Chat API called:', {
      message: messageContent.substring(0, 50) + '...',
      hasImage: !!imageBase64,
      timestamp: new Date().toISOString(),
    });

    const response = await axios.post(`${FASTAPI_URL}/api/chat`, {
      pesan: messageContent,
      gambar_base64: imageBase64,
    });

    const botReply =
      response.data.jawaban ??
      response.data.reply ??
      response.data.message ??
      'Maaf, tidak ada respons.';

    console.log('✅ Backend response:', botReply.substring(0, 50) + '...');

    const encoder = new TextEncoder();
    const words = botReply.split(' ');

    const customStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for (let i = 0; i < words.length; i++) {
            const word = (i === 0 ? '' : ' ') + words[i];
            // Format: 0:"chunk"\n
            const chunk = `0:${JSON.stringify(word)}\n`;
            controller.enqueue(encoder.encode(chunk));
            await new Promise((resolve) => setTimeout(resolve, 30));
          }
          // Finish signal
          controller.enqueue(
            encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
          );
          controller.close();
          console.log('✅ Streaming completed');
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