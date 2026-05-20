'use client';

import { ChatMessage } from '@/schemas';
import { useChat } from 'ai/react';
import type { Message } from 'ai';

export function useChatbot(imageBase64?: string | null) {
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
      },
    },
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content:
          'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
      },
    ],
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
  };
}