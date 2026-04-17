"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, AlertCircle } from "lucide-react"; // Menggunakan Lucide Icons
import { chatAPI } from "@/lib/api";
import { ChatMessageSchema, type ChatMessage } from "@/schemas";
import ChatMessages from "./ChatMessages";
import ChatInputBar, { type ImageAttachment, ACCEPTED_TYPES, toBase64 } from "./ChatInputBar";

const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: "1",
  role: "assistant",
  content: "Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?",
  timestamp: new Date().toISOString(),
});

export default function ChatCanvas() {
  const [messages, setMessages]         = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachment, setAttachment]     = useState<ImageAttachment | null>(null);
  const [isLoading, setIsLoading]       = useState(false);
  const [isDragging, setIsDragging]     = useState(false);
  const [dropError, setDropError]       = useState("");
  const dragCounter                     = useRef(0);

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    setDropError("");

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setDropError("Format tidak didukung. Gunakan PNG, JPG, SVG, atau WebP.");
      setTimeout(() => setDropError(""), 3000);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDropError("Ukuran gambar maksimal 5MB.");
      setTimeout(() => setDropError(""), 3000);
      return;
    }

    const base64 = await toBase64(file);
    setAttachment({ file, previewUrl: URL.createObjectURL(file), base64 });
  }, []);

  // ── Send Handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(async (text?: string) => {
    const msgText = text ?? inputMessage;
    if (!msgText.trim() && !attachment) return;
    if (isLoading) return;

    const userMsg = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: "user",
      content: msgText || "📎 [Gambar dikirim]",
      timestamp: new Date().toISOString(),
    });
    setMessages((prev) => [
      ...prev,
      attachment ? { ...userMsg, imageUrl: attachment.previewUrl } as ChatMessage : userMsg,
    ]);

    const sentText  = msgText;
    const sentImage = attachment?.base64 ?? null;
    setInputMessage("");
    setAttachment(null);
    setIsLoading(true);

    try {
      const res = await chatAPI.sendMessage(sentText || "Tolong analisis gambar ini.", sentImage);
      setMessages((prev) => [...prev, ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res.jawaban ?? res.reply ?? res.message ?? "Maaf, tidak ada respons.",
        timestamp: new Date().toISOString(),
      })]);
    } catch {
      setMessages((prev) => [...prev, ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
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
      className="flex-1 flex flex-col bg-transparent relative overflow-hidden w-full h-full"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Komponen Pesan dan Input */}
      <ChatMessages messages={messages} isLoading={isLoading} onCopy={handleCopy} />

      <ChatInputBar
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        attachment={attachment}
        setAttachment={setAttachment}
        isLoading={isLoading}
        onSend={handleSend}
      />

      {/* ── Drop Overlay (Modern & Responsive) ── */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 sm:p-6 pointer-events-none"
          >
            {/* Dark/Blur Backdrop yang lebih elegan */}
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

            {/* Drop Card */}
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 flex flex-col items-center text-center gap-4 px-6 py-8 sm:px-12 sm:py-10 bg-white rounded-[2rem] shadow-2xl border border-white/20 w-full max-w-sm mx-auto"
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-50 flex items-center justify-center border-2 border-dashed border-primary/30">
                <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Lepaskan gambar di sini</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">PNG, JPG, SVG, WebP — maks. 5MB</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Toast (Modern Glassmorphism) ── */}
      <AnimatePresence>
        {dropError && (
          <motion.div
            key="drop-error"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-24 sm:bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3.5 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-xl pointer-events-none w-[90%] max-w-md sm:w-auto"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-sm font-medium leading-tight">{dropError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}