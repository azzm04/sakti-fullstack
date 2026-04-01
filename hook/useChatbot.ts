'use client';

import { useState } from 'react';
import { chatAPI } from '@/lib/api';
import { ChatMessageSchema, ChatMessage } from '@/schemas';

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    ChatMessageSchema.parse({
      id: '1',
      role: 'assistant',
      content:
        'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
      timestamp: new Date().toISOString(),
    }),
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    // 🔹 User message (divalidasi Zod)
    const userMessage = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(message, conversationId);

      const assistantRaw = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      const assistantMessage = ChatMessageSchema.parse(assistantRaw);

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date().toISOString(),
      });

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    sendMessage,
  };
}