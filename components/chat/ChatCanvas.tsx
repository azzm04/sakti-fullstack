'use client';

import { useState, useCallback } from 'react';
import { chatAPI } from '@/lib/api';
import { ChatMessageSchema, type ChatMessage } from '@/schemas';
import ChatMessages from './ChatMessages';
import ChatInputBar, { type ImageAttachment } from './ChatInputBar';

const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: '1',
  role: 'assistant',
  content: 'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
  timestamp: new Date().toISOString(),
});

export default function ChatCanvas() {
  const [messages, setMessages]       = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachment, setAttachment]   = useState<ImageAttachment | null>(null);
  const [isLoading, setIsLoading]     = useState(false);

  const handleSend = useCallback(async (text?: string) => {
    const msgText = text ?? inputMessage;
    if (!msgText.trim() && !attachment) return;
    if (isLoading) return;

    const userMsg = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: 'user',
      content: msgText || '📎 [Gambar dikirim]',
      timestamp: new Date().toISOString(),
    });
    setMessages((prev) => [...prev, attachment ? { ...userMsg, imageUrl: attachment.previewUrl } as ChatMessage : userMsg]);

    const sentText  = msgText;
    const sentImage = attachment?.base64 ?? null;
    setInputMessage('');
    setAttachment(null);
    setIsLoading(true);

    try {
      const res = await chatAPI.sendMessage(sentText || 'Tolong analisis gambar ini.', sentImage);
      setMessages((prev) => [...prev, ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.jawaban ?? res.reply ?? res.message ?? 'Maaf, tidak ada respons.',
        timestamp: new Date().toISOString(),
      })]);
    } catch {
      setMessages((prev) => [...prev, ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi.',
        timestamp: new Date().toISOString(),
      })]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, attachment, isLoading]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  return (
    <main className="flex-1 flex flex-col bg-[#f7f9fb] relative overflow-hidden">
      <ChatMessages messages={messages} isLoading={isLoading} onCopy={handleCopy} />
      <ChatInputBar
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        attachment={attachment}
        setAttachment={setAttachment}
        isLoading={isLoading}
        onSend={handleSend}
      />
    </main>
  );
}
