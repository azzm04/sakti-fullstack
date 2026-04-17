'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { chatAPI } from '@/lib/api';
import { ChatMessageSchema, type ChatMessage } from '@/schemas';
import ChatMessages from './ChatMessages';
import ChatInputBar, { type ImageAttachment, ACCEPTED_TYPES, toBase64 } from './ChatInputBar';

const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: '1',
  role: 'assistant',
  content: 'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
  timestamp: new Date().toISOString(),
});

export default function ChatCanvas() {
  const [messages, setMessages]         = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [attachment, setAttachment]     = useState<ImageAttachment | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [dropError, setDropError]       = useState('');
  const dragCounter                     = useRef(0); // track nested dragenter/dragleave

  // ── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    setDropError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setDropError('Format tidak didukung. Gunakan PNG, JPG, SVG, atau WebP.');
      setTimeout(() => setDropError(''), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDropError('Ukuran gambar maksimal 5MB.');
      setTimeout(() => setDropError(''), 3000);
      return;
    }

    const base64 = await toBase64(file);
    setAttachment({ file, previewUrl: URL.createObjectURL(file), base64 });
  }, []);

  // ── Send handler ──────────────────────────────────────────────────────────
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
    setMessages((prev) => [
      ...prev,
      attachment ? { ...userMsg, imageUrl: attachment.previewUrl } as ChatMessage : userMsg,
    ]);

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
    <main
      className="flex-1 flex flex-col bg-[#f7f9fb] relative overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ChatMessages messages={messages} isLoading={isLoading} onCopy={handleCopy} />

      <ChatInputBar
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        attachment={attachment}
        setAttachment={setAttachment}
        isLoading={isLoading}
        onSend={handleSend}
      />

      {/* ── Drop overlay ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none"
          >
            {/* Blurred backdrop */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />

            {/* Drop card */}
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex flex-col items-center gap-3 px-12 py-10 bg-white rounded-3xl shadow-2xl border-2 border-dashed border-primary/40"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  image
                </span>
              </div>
              <p className="text-lg font-bold text-primary">Lepaskan gambar di sini</p>
              <p className="text-sm text-slate-400">PNG, JPG, SVG, WebP — maks. 5MB</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drop error toast ── */}
      <AnimatePresence>
        {dropError && (
          <motion.div
            key="drop-error"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-red-500 text-white text-sm font-semibold rounded-full shadow-lg pointer-events-none"
          >
            {dropError}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
