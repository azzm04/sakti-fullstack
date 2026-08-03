"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
  memo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  X,
  ImagePlus,
  AlertCircle,
  Paperclip,
  ArrowUp,
  Square,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { ChatMessageSchema, type ChatMessage } from "@/schemas";
import ChatMessages from "./ChatMessage";

// ── Utils ─────────────────────────────────────────────────────────────────────
const cn = (...args: (string | undefined | null | false)[]) =>
  twMerge(args.filter(Boolean).join(" "));

// ── Types ─────────────────────────────────────────────────────────────────────
interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Suggested Actions ─────────────────────────────────────────────────────────
const SUGGESTED = [
  {
    title: "Syarat Ekonomi",
    label: "Penerima KIPK",
    action: "Apa saja syarat ekonomi untuk mendaftar KIPK?",
  },
  {
    title: "Cek Status DTKS",
    label: "Apakah saya terdaftar?",
    action: "Bagaimana cara cek status DTKS saya?",
  },
  {
    title: "Dokumen Pendukung",
    label: "Yang perlu disiapkan",
    action: "Dokumen apa saja yang perlu disiapkan untuk KIPK?",
  },
  {
    title: "Batas Waktu",
    label: "Pendaftaran KIPK 2026",
    action: "Kapan batas waktu pendaftaran KIPK 2026?",
  },
];

const SuggestedActions = memo(
  ({ onSelect }: { onSelect: (a: string) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pb-4">
      <AnimatePresence>
        {SUGGESTED.map((s, i) => (
          <motion.div
            key={s.action}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.05 * i }}
            className={i > 1 ? "hidden sm:block" : "block"}
          >
            <button
              onClick={() => onSelect(s.action)}
              className="w-full text-left border border-slate-200 rounded-2xl px-4 py-3 text-sm bg-white/50 backdrop-blur-sm hover:bg-white hover:shadow-sm hover:border-primary transition-all flex flex-col gap-1 group"
            >
              <span className="font-semibold text-slate-700 group-hover:text-primary transition-colors">
                {s.title}
              </span>
              <span className="text-slate-500 text-xs">{s.label}</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  ),
);
SuggestedActions.displayName = "SuggestedActions";

// ── Attachment Preview ────────────────────────────────────────────────────────
const PreviewAttachment = memo(
  ({
    att,
    uploading,
    onRemove,
  }: {
    att: Attachment;
    uploading?: boolean;
    onRemove?: () => void;
  }) => (
    <div className="relative group flex flex-col gap-1.5 shrink-0">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
        {att.contentType.startsWith("image/") && att.url ? (
          <img
            src={att.url}
            alt={att.name}
            className="size-full object-cover"
          />
        ) : (
          <span className="text-[10px] font-bold text-slate-400 text-center px-1">
            {att.name.split(".").pop()?.toUpperCase()}
          </span>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
          </div>
        )}
      </div>

      <span className="text-[10px] font-medium text-slate-500 max-w-[4rem] sm:max-w-[5rem] truncate text-center">
        {att.name}
      </span>

      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:scale-110 transition-all z-10 shadow-md"
          title="Tutup Modal"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  ),
);
PreviewAttachment.displayName = "PreviewAttachment";

// ── Main Input Component ──────────────────────────────────────────────────────
interface InputProps {
  messages: ChatMessage[];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  onSend: (params: { input: string; attachments: Attachment[] }) => void;
  onStop: () => void;
  isLoading: boolean;
}

function MultimodalInput({
  messages,
  attachments,
  setAttachments,
  onSend,
  onStop,
  isLoading,
}: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  };

  const resetHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.rows = 1;
      adjustHeight();
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          resolve({
            url: URL.createObjectURL(file),
            name: file.name,
            contentType: file.type,
            size: file.size,
          });
        } catch {
          resolve(undefined);
        } finally {
          setUploadQueue((q) => q.filter((n) => n !== file.name));
        }
      }, 500);
    });
  };

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (!files.length) return;
      setUploadQueue((q) => [...q, ...files.map((f) => f.name)]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
      const results = await Promise.all(valid.map(uploadFile));
      setAttachments((prev) => [
        ...prev,
        ...results.filter((r): r is Attachment => !!r),
      ]);
    },
    [setAttachments],
  );

  const removeAttachment = useCallback(
    (att: Attachment) => {
      if (att.url.startsWith("blob:")) URL.revokeObjectURL(att.url);
      setAttachments((prev) => prev.filter((a) => a.url !== att.url));
      textareaRef.current?.focus();
    },
    [setAttachments],
  );

  const submitForm = useCallback(() => {
    if (!input.trim() && !attachments.length) return;
    onSend({ input, attachments });
    setInput("");
    setAttachments([]);
    resetHeight();
    textareaRef.current?.focus();
  }, [input, attachments, onSend, setAttachments, resetHeight]);

  const showSuggested =
    messages.length === 1 && !attachments.length && !uploadQueue.length;
  const canSend = !isLoading && !uploadQueue.length;
  const sendDisabled = !canSend || (!input.trim() && !attachments.length);

  return (
    <div className="w-full flex flex-col gap-2">
      {showSuggested && (
        <SuggestedActions
          onSelect={(a) => {
            setInput(a);
            requestAnimationFrame(() => {
              adjustHeight();
              textareaRef.current?.focus();
            });
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
        title="Input File"
      />

      <div
        className={cn(
          "relative flex flex-col w-full bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden transition-all duration-200",
          "focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary focus-within:shadow-md",
        )}
      >
        {(attachments.length > 0 || uploadQueue.length > 0) && (
          <div className="flex gap-4 px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">
            {attachments.map((att) => (
              <PreviewAttachment
                key={att.url}
                att={att}
                onRemove={() => removeAttachment(att)}
              />
            ))}
            {uploadQueue.map((name, i) => (
              <PreviewAttachment
                key={`${name}-${i}`}
                att={{ url: "", name, contentType: "", size: 0 }}
                uploading
              />
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !e.nativeEvent.isComposing
            ) {
              e.preventDefault();
              if (!sendDisabled) submitForm();
            }
          }}
          placeholder="Tanyakan sesuatu ke SAKABOT..."
          rows={1}
          autoFocus
          disabled={isLoading}
          className="w-full bg-transparent resize-none px-5 py-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none disabled:opacity-50"
        />

        <div className="flex items-center justify-between px-3 pb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              fileInputRef.current?.click();
            }}
            disabled={isLoading}
            title="Lampirkan Gambar"
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors disabled:opacity-40"
          >
            <Paperclip size={18} strokeWidth={2.5} className="-rotate-45" />
          </button>

          {isLoading ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onStop();
              }}
              className="p-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
              title="Hentikan Pengiriman"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (!sendDisabled) submitForm();
              }}
              disabled={sendDisabled}
              title="Kirim Pesan"
              className="p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-sm flex items-center justify-center disabled:shadow-none"
            >
              <ArrowUp size={18} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Initial Message ───────────────────────────────────────────────────────────
const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: "1",
  role: "assistant",
  content:
    "Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?",
  timestamp: new Date().toISOString(),
});

// ── Types for Props ───────────────────────────────────────────────────────────
interface ChatCanvasProps {
  userId?: string; // Menangkap userId dari Props
  currentSessionId?: string | null;
  onMessageSent?: (sessionId: string) => void;
}

// ── ChatCanvas ────────────────────────────────────────────────────────────────
export default function ChatCanvas({ userId, currentSessionId, onMessageSent }: ChatCanvasProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState("");
  const dragCounter = useRef(0);

  useEffect(() => {
    async function fetchSessionMessages() {
      if (!currentSessionId) {
        setMessages([INITIAL_MESSAGE]);
        return;
      }

      try {
        const res = await fetch(`/api/chat/messages?sessionId=${currentSessionId}`);
        const data = await res.json();
        
        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.createdAt,
          }));
          setMessages(loadedMessages);
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      } catch (err) {
        console.error("Gagal memuat pesan sesi:", err);
      }
    }

    fetchSessionMessages();
  }, [currentSessionId]);

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
    const url = URL.createObjectURL(file);
    setAttachments((prev) => [
      ...prev,
      { url, name: file.name, contentType: file.type, size: file.size },
    ]);
  }, []);

  const handleSend = useCallback(
    async ({
      input,
      attachments: atts,
    }: {
      input: string;
      attachments: Attachment[];
    }) => {
      if (!input.trim() && !atts.length) return;
      if (isLoading) return;

      const userMsg = ChatMessageSchema.parse({
        id: Date.now().toString(),
        role: "user",
        content: input || "📎 [Gambar dilampirkan]",
        timestamp: new Date().toISOString(),
      });

      const updatedMessages = [
        ...messages,
        atts.length > 0
          ? ({ ...userMsg, imageUrl: atts[0].url } as ChatMessage)
          : userMsg,
      ];
      
      setMessages(updatedMessages);
      setIsLoading(true);

      try {
        const base64 = atts[0]?.url.startsWith("blob:")
          ? await fetch(atts[0].url)
              .then((r) => r.blob())
              .then(
                (b) =>
                  new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () =>
                      res((reader.result as string).split(",")[1]);
                    reader.onerror = rej;
                    reader.readAsDataURL(b);
                  }),
              )
          : null;

        // Menggunakan userId dari props
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedMessages,
            data: {
              userId: userId, // Pastikan userId terkirim!
              sessionId: currentSessionId,
              imageBase64: base64,
            }
          })
        });

       

        const rawText = await response.text();
        let botReply = rawText;
        
        if (rawText.includes('0:')) {
          botReply = rawText
            .split('\n')
            .filter(line => line.startsWith('0:'))
            .map(line => {
              try { 
                return JSON.parse(line.substring(2)); 
              } catch { 
                return ""; 
              }
            })
            .join('');
        }

        setMessages((prev) => [
          ...prev,
          ChatMessageSchema.parse({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: botReply || "Maaf, tidak ada respons.",
            timestamp: new Date().toISOString(),
          }),
        ]);

         const newSessionId = response.headers.get('x-session-id');
        if (newSessionId && onMessageSent) {
          onMessageSent(newSessionId);
        }


      } catch (err) {
        console.error("Gagal mengirim pesan:", err);
        setMessages((prev) => [
          ...prev,
          ChatMessageSchema.parse({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "Maaf, terjadi kesalahan koneksi. Silakan coba lagi.",
            timestamp: new Date().toISOString(),
          }),
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, currentSessionId, userId, onMessageSent],
  );

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

 return (
    <main
      // 1. Ubah menjadi flex-1 agar mengisi sisa ruang secara dinamis
      className="flex-1 flex flex-col w-full bg-[#f9fafb] overflow-hidden"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* 2. AREA PESAN (Otomatis Scroll) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto">
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            onCopy={handleCopy}
          />
        </div>
      </div>

      {/* 3. AREA INPUT (Sejajar, Bukan Absolute, dengan shrink-0) */}
      <div className="w-full bg-[#f9fafb] border-t border-slate-200/60 pt-4 pb-4 px-4 shrink-0 z-10">
        <div className="max-w-3xl mx-auto">
          <MultimodalInput
            messages={messages}
            attachments={attachments}
            setAttachments={setAttachments}
            onSend={handleSend}
            onStop={() => setIsLoading(false)}
            isLoading={isLoading}
          />
          <p className="text-center mt-3 text-[10px] text-slate-400 font-medium">
            SAKABOT dapat memberikan informasi yang tidak akurat. Mohon
            verifikasi melalui panduan resmi Puslapdik.
          </p>
        </div>
      </div>

      {/* OVERLAY DRAG & DROP TETAP SAMA */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="drop-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 flex flex-col items-center gap-4 px-10 py-8 bg-white rounded-3xl shadow-2xl border border-indigo-100 max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/50 flex items-center justify-center border-2 border-dashed border-indigo-300">
                <ImagePlus className="w-8 h-8 text-primary/60" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-slate-800 mb-1">
                  Lepaskan gambar di sini
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG, SVG, WebP — maks. 5MB
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {dropError && (
          <motion.div
            key="drop-error"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-36 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-rose-600 text-white rounded-full shadow-xl shadow-rose-600/20 pointer-events-none max-w-sm w-[90%]"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-semibold">{dropError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}