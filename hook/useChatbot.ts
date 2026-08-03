'use client';

import { useState } from 'react';
import { ChatMessage } from '@/schemas';
import { useChat } from 'ai/react';
import type { Message } from 'ai';
// Pastikan path import ini disesuaikan dengan lokasi hook autentikasi tim Anda
import { useCurrentUser } from '@/hook/useCurrentUser'; 

export function useChatbot(imageBase64?: string | null, initialSessionId?: string | null) {
  // Mengambil data mahasiswa yang sedang login (jika ada)
  const user = useCurrentUser();
  // Menyimpan state sesi agar obrolan tidak terputus
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
    stop,
    setInput,
  } = useChat({
    api: '/api/chat',
    body: {
      data: {
        imageBase64: imageBase64 || null,
        sessionId: sessionId,
        userId: user?.user?.id || null,
      },
    },
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content: 'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
      },
    ],
    // FUNGSI BARU: Menangkap ID Sesi yang dilempar oleh API backend
    onResponse: (response: Response) => {
      const newSessionId = response.headers.get('X-Session-Id');
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }
    },
    onFinish: (message: Message) => {
      console.log('💬 Chat finished:', message.content);
    },
    onError: (error: Error) => {
      console.error('❌ Chat error:', error);
    },
  });

  return {
    messages: messages as ChatMessage[],
    input,
    isLoading,
    stop,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    sessionId, // Diekspor agar bisa digunakan oleh komponen Sidebar (jika diperlukan)
  };
}