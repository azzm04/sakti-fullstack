'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { chatAPI } from '@/lib/api';
import { ChatMessageSchema, type ChatMessage } from '@/schemas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconSend, IconThumbUp, IconThumbDown, IconCopy,
  IconSparkles, IconPhoto, IconX,
} from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import Link from 'next/link';

// Accepted image MIME types
const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
const ACCEPTED_EXT = '.png,.jpg,.jpeg,.svg,.webp,.gif';

type ImageAttachment = { file: File; previewUrl: string; base64: string };

const QUICK = ['Syarat Ekonomi KIPK', 'Cek Status DTKS', 'Dokumen Pendukung', 'Batas Waktu Pendaftaran'];

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    ChatMessageSchema.parse({
      id: '1',
      role: 'assistant',
      content: 'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
      timestamp: new Date().toISOString(),
    }),
  ]);
  const [inputMessage, setInputMessage]   = useState('');
  const [attachment, setAttachment]       = useState<ImageAttachment | null>(null);
  const [isLoading, setIsLoading]         = useState(false);
  const [imageError, setImageError]       = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [inputMessage]);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setImageError('Format tidak didukung. Gunakan PNG, JPG, SVG, atau WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Ukuran gambar maksimal 5MB.');
      return;
    }
    setImageError('');
    const base64 = await toBase64(file);
    const previewUrl = URL.createObjectURL(file);
    setAttachment({ file, previewUrl, base64 });
    // reset input so same file can be re-selected
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback(() => {
    if (attachment) URL.revokeObjectURL(attachment.previewUrl);
    setAttachment(null);
    setImageError('');
  }, [attachment]);

  const canSend = (inputMessage.trim() || attachment) && !isLoading;

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;

    const userMsg = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage || '📎 [Gambar dikirim]',
      timestamp: new Date().toISOString(),
    });

    // Attach preview URL to message for rendering
    const userMsgWithImage = attachment
      ? { ...userMsg, imageUrl: attachment.previewUrl }
      : userMsg;

    setMessages((prev) => [...prev, userMsgWithImage as ChatMessage]);
    const sentText  = inputMessage;
    const sentImage = attachment?.base64 ?? null;
    setInputMessage('');
    setAttachment(null);
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage(sentText || 'Tolong analisis gambar ini.', sentImage);
      setMessages((prev) => [...prev, ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.jawaban ?? response.reply ?? response.message ?? 'Maaf, tidak ada respons.',
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
  };

  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-background">

      {/* ── Header ── */}
      <header className="shrink-0 h-16 bg-white/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <IconSparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-extrabold text-base text-primary leading-none">SAKABOT AI</h2>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Asisten Virtual KIP-Kuliah</p>
          </div>
        </div>
        <Link
          href="/mahasiswa/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-border transition-colors"
        >
          <span className="material-symbols-outlined text-base">dashboard</span>
          Dashboard
        </Link>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-4">

          {/* Date pill */}
          <div className="flex justify-center">
            <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const msgWithImg = msg as ChatMessage & { imageUrl?: string };
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <IconSparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Image attachment preview */}
                    {msgWithImg.imageUrl && (
                      <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
                        <img
                          src={msgWithImg.imageUrl}
                          alt="attachment"
                          className="max-w-[240px] max-h-[200px] object-cover"
                        />
                      </div>
                    )}

                    {/* Bubble */}
                    {(msg.content && msg.content !== '📎 [Gambar dikirim]') && (
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-white border border-border text-foreground rounded-tl-sm prose prose-sm max-w-none'
                      }`}>
                        {isUser
                          ? msg.content
                          : <ReactMarkdown>{msg.content}</ReactMarkdown>
                        }
                      </div>
                    )}

                    {/* Action row for assistant */}
                    {!isUser && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <button onClick={() => handleCopy(msg.content)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                          <IconCopy className="w-3 h-3" /> Salin
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                          <IconThumbUp className="w-3 h-3" /> Membantu
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                          <IconThumbDown className="w-3 h-3" /> Tidak
                        </button>
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}

                    {/* Timestamp for user */}
                    {isUser && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex gap-3 items-end"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <IconSparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-white border border-border px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input Area ── */}
      <div className="shrink-0 border-t border-border bg-white/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Quick suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK.map((s) => (
              <button key={s} onClick={() => setInputMessage(s)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                {s}
              </button>
            ))}
          </div>

          {/* Image preview strip */}
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-1"
              >
                <div className="relative group">
                  <img src={attachment.previewUrl} alt="preview" className="h-14 w-14 rounded-xl object-cover border border-border shadow-sm" />
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <IconX className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium text-foreground truncate max-w-[160px]">{attachment.file.name}</p>
                  <p>{(attachment.file.size / 1024).toFixed(0)} KB</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {imageError && (
            <p className="text-xs text-destructive px-1">{imageError}</p>
          )}

          {/* Input row */}
          <form onSubmit={handleSend} className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={handleImageSelect}
            />

            {/* Image upload button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => fileInputRef.current?.click()}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                attachment
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-muted border-border text-muted-foreground hover:text-primary hover:border-primary'
              }`}
              title="Upload gambar (PNG, JPG, SVG, WebP)"
            >
              <IconPhoto className="w-5 h-5" />
            </motion.button>

            {/* Textarea */}
            <div className="flex-1 relative bg-muted rounded-2xl border border-border focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                rows={1}
                placeholder="Tanyakan sesuatu ke SAKABOT..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none px-4 py-2.5 text-sm resize-none max-h-32 font-body text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Send button */}
            <motion.button
              type="submit"
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.05 } : {}}
              whileTap={canSend ? { scale: 0.92 } : {}}
              className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
            >
              <IconSend className="w-4 h-4" />
            </motion.button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground/60">
            SAKABOT dapat memberikan informasi yang tidak akurat. Verifikasi melalui panduan resmi Puslapdik.
          </p>
        </div>
      </div>
    </div>
  );
}
