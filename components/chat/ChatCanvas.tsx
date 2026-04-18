"use client";

import React, {
  useRef, useEffect, useState, useCallback,
  type Dispatch, type SetStateAction, type ChangeEvent, memo,
} from "react";
import equal from "fast-deep-equal";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X, ImagePlus, AlertCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { chatAPI } from "@/lib/api";
import { ChatMessageSchema, type ChatMessage } from "@/schemas";
import ChatMessages from "./ChatMessages";

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

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const StopIcon = () => (
  <svg height={14} viewBox="0 0 16 16" width={14}>
    <path fillRule="evenodd" clipRule="evenodd" d="M3 3H13V13H3V3Z" fill="currentColor" />
  </svg>
);

const PaperclipIcon = () => (
  <svg height={15} strokeLinejoin="round" viewBox="0 0 16 16" width={15} className="-rotate-45">
    <path fillRule="evenodd" clipRule="evenodd"
      d="M10.8591 1.70735C10.3257 1.70735 9.81417 1.91925 9.437 2.29643L3.19455 8.53886C2.56246 9.17095 2.20735 10.0282 2.20735 10.9222C2.20735 11.8161 2.56246 12.6734 3.19455 13.3055C3.82665 13.9376 4.68395 14.2927 5.57786 14.2927C6.47178 14.2927 7.32908 13.9376 7.96117 13.3055L14.2036 7.06304L14.7038 6.56287L15.7041 7.56321L15.204 8.06337L8.96151 14.3058C8.06411 15.2032 6.84698 15.7074 5.57786 15.7074C4.30875 15.7074 3.09162 15.2032 2.19422 14.3058C1.29682 13.4084 0.792664 12.1913 0.792664 10.9222C0.792664 9.65305 1.29682 8.43592 2.19422 7.53852L8.43666 1.29609C9.07914 0.653606 9.95054 0.292664 10.8591 0.292664C11.7678 0.292664 12.6392 0.653606 13.2816 1.29609C13.9241 1.93857 14.2851 2.80997 14.2851 3.71857C14.2851 4.62718 13.9241 5.49858 13.2816 6.14106L7.0324 12.3835C6.64459 12.7712 6.11905 12.9888 5.57107 12.9888C5.02297 12.9888 4.49731 12.7711 4.10974 12.3835C3.72217 11.9959 3.50444 11.4703 3.50444 10.9222C3.50444 10.3741 3.72217 9.8484 4.10974 9.46084L9.877 3.70039L10.3775 3.20051L11.3772 4.20144L10.8767 4.70131L5.11008 10.4612C4.98779 10.5835 4.91913 10.7493 4.91913 10.9222C4.91913 11.0951 4.98782 11.2609 5.11008 11.3832C5.23234 11.5054 5.39817 11.5741 5.57107 11.5741C5.74398 11.5741 5.9098 11.5054 6.03206 11.3832L12.2813 5.14072C12.6586 4.7633 12.8704 4.25185 12.8704 3.71857C12.8704 3.18516 12.6585 2.6736 12.2813 2.29643C11.9041 1.91925 11.3926 1.70735 10.8591 1.70735Z"
      fill="currentColor" />
  </svg>
);

const ArrowUpIcon = () => (
  <svg height={14} strokeLinejoin="round" viewBox="0 0 16 16" width={14}>
    <path fillRule="evenodd" clipRule="evenodd"
      d="M8.70711 1.39644C8.31659 1.00592 7.68342 1.00592 7.2929 1.39644L2.21968 6.46966L1.68935 6.99999L2.75001 8.06065L3.28034 7.53032L7.25001 3.56065V14.25V15H8.75001V14.25V3.56065L12.7197 7.53032L13.25 8.06065L14.3107 6.99999L13.7803 6.46966L8.70711 1.39644Z"
      fill="currentColor" />
  </svg>
);

// ── Suggested Actions ─────────────────────────────────────────────────────────
const SUGGESTED = [
  { title: "Syarat Ekonomi",    label: "untuk penerima KIPK",          action: "Apa saja syarat ekonomi untuk mendaftar KIPK?" },
  { title: "Cek Status DTKS",   label: "apakah saya terdaftar?",        action: "Bagaimana cara cek status DTKS saya?" },
  { title: "Dokumen Pendukung", label: "yang perlu disiapkan",          action: "Dokumen apa saja yang perlu disiapkan untuk KIPK?" },
  { title: "Batas Waktu",       label: "pendaftaran KIPK 2026",         action: "Kapan batas waktu pendaftaran KIPK 2026?" },
];

const SuggestedActions = memo(({ onSelect }: { onSelect: (a: string) => void }) => (
  <div className="grid sm:grid-cols-2 gap-2 w-full pb-2">
    <AnimatePresence>
      {SUGGESTED.map((s, i) => (
        <motion.div
          key={s.action}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ delay: 0.05 * i }}
          className={i > 1 ? "hidden sm:block" : "block"}
        >
          <button
            onClick={() => onSelect(s.action)}
            className="w-full text-left border border-border rounded-xl px-4 py-3.5 text-sm bg-white hover:bg-muted transition-colors flex flex-col gap-0.5"
          >
            <span className="font-semibold text-foreground">{s.title}</span>
            <span className="text-muted-foreground text-xs">{s.label}</span>
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
));
SuggestedActions.displayName = "SuggestedActions";

// ── Attachment Preview ────────────────────────────────────────────────────────
const PreviewAttachment = memo(({ att, uploading, onRemove }: {
  att: Attachment; uploading?: boolean; onRemove?: () => void;
}) => (
  <div className="relative group flex flex-col gap-1">
    <div className="w-20 h-16 bg-muted rounded-xl overflow-hidden border border-border flex items-center justify-center">
      {att.contentType.startsWith("image/") && att.url ? (
        <img src={att.url} alt={att.name} className="size-full object-cover" />
      ) : (
        <span className="text-[10px] text-muted-foreground text-center px-1">
          {att.name.split(".").pop()?.toUpperCase()}
        </span>
      )}
      {uploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Loader2 className="size-5 animate-spin text-primary" />
        </div>
      )}
    </div>
    <span className="text-[10px] text-muted-foreground max-w-20 truncate">{att.name}</span>
    {onRemove && (
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <X size={10} />
      </button>
    )}
  </div>
));
PreviewAttachment.displayName = "PreviewAttachment";

// ── Send / Stop Buttons ───────────────────────────────────────────────────────
const SendButton = memo(({ onSend, disabled }: { onSend: () => void; disabled: boolean }) => (
  <button
    onClick={(e) => { e.preventDefault(); if (!disabled) onSend(); }}
    disabled={disabled}
    aria-label="Kirim pesan"
    className="rounded-full p-1.5 h-fit bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
  >
    <ArrowUpIcon />
  </button>
));
SendButton.displayName = "SendButton";

const StopButton = memo(({ onStop }: { onStop: () => void }) => (
  <button
    onClick={(e) => { e.preventDefault(); onStop(); }}
    aria-label="Hentikan"
    className="rounded-full p-1.5 h-fit border border-foreground text-foreground"
  >
    <StopIcon />
  </button>
));
StopButton.displayName = "StopButton";

// ── Main Input Component ──────────────────────────────────────────────────────
interface InputProps {
  messages: ChatMessage[];
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  onSend: (params: { input: string; attachments: Attachment[] }) => void;
  onStop: () => void;
  isLoading: boolean;
}

function MultimodalInput({ messages, attachments, setAttachments, onSend, onStop, isLoading }: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState("");
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);

  const adjustHeight = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight + 2}px`;
  };

  const resetHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.rows = 1; adjustHeight(); }
  }, []);

  useEffect(() => { adjustHeight(); }, [input]);

  const uploadFile = async (file: File): Promise<Attachment | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          resolve({ url: URL.createObjectURL(file), name: file.name, contentType: file.type, size: file.size });
        } catch { resolve(undefined); }
        finally { setUploadQueue((q) => q.filter((n) => n !== file.name)); }
      }, 500);
    });
  };

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadQueue((q) => [...q, ...files.map((f) => f.name)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const valid = files.filter((f) => f.size <= 5 * 1024 * 1024);
    const results = await Promise.all(valid.map(uploadFile));
    setAttachments((prev) => [...prev, ...results.filter((r): r is Attachment => !!r)]);
  }, [setAttachments]);

  const removeAttachment = useCallback((att: Attachment) => {
    if (att.url.startsWith("blob:")) URL.revokeObjectURL(att.url);
    setAttachments((prev) => prev.filter((a) => a.url !== att.url));
    textareaRef.current?.focus();
  }, [setAttachments]);

  const submitForm = useCallback(() => {
    if (!input.trim() && !attachments.length) return;
    onSend({ input, attachments });
    setInput("");
    setAttachments([]);
    attachments.forEach((a) => { if (a.url.startsWith("blob:")) URL.revokeObjectURL(a.url); });
    resetHeight();
    textareaRef.current?.focus();
  }, [input, attachments, onSend, setAttachments, resetHeight]);

  const showSuggested = messages.length === 0 && !attachments.length && !uploadQueue.length;
  const canSend = !isLoading && !uploadQueue.length;
  const sendDisabled = !canSend || (!input.trim() && !attachments.length);

  return (
    <div className="relative w-full flex flex-col gap-4">
      <AnimatePresence>
        {showSuggested && (
          <motion.div
            key="suggested"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
          >
            <SuggestedActions onSelect={(a) => {
              setInput(a);
              requestAnimationFrame(() => { adjustHeight(); textareaRef.current?.focus(); });
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        onChange={handleFileChange}
        disabled={isLoading}
        tabIndex={-1}
      />

      {/* Attachment previews */}
      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex gap-3 overflow-x-auto pb-2 pl-1 items-end">
          {attachments.map((att) => (
            <PreviewAttachment key={att.url} att={att} onRemove={() => removeAttachment(att)} />
          ))}
          {uploadQueue.map((name, i) => (
            <PreviewAttachment key={`${name}-${i}`} att={{ url: "", name, contentType: "", size: 0 }} uploading />
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (!sendDisabled) submitForm();
            }
          }}
          placeholder="Tanyakan sesuatu ke SAKABOT..."
          rows={1}
          autoFocus
          disabled={isLoading}
          className={cn(
            "w-full min-h-[44px] max-h-[calc(75dvh)] overflow-y-auto resize-none",
            "rounded-2xl border border-border bg-background text-foreground",
            "px-4 pb-10 pt-3 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:opacity-50"
          )}
        />

        {/* Attach button — bottom left */}
        <div className="absolute bottom-0 left-0 p-2">
          <button
            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
            disabled={isLoading}
            aria-label="Lampirkan file"
            className="rounded-md rounded-bl-lg p-[7px] h-fit border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
          >
            <PaperclipIcon />
          </button>
        </div>

        {/* Send/Stop button — bottom right */}
        <div className="absolute bottom-0 right-0 p-2">
          {isLoading
            ? <StopButton onStop={onStop} />
            : <SendButton onSend={submitForm} disabled={sendDisabled} />
          }
        </div>
      </div>
    </div>
  );
}

// ── Initial Message ───────────────────────────────────────────────────────────
const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: "1",
  role: "assistant",
  content: "Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?",
  timestamp: new Date().toISOString(),
});

// ── ChatCanvas ────────────────────────────────────────────────────────────────
export default function ChatCanvas() {
  const [messages, setMessages]     = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError]   = useState("");
  const dragCounter = useRef(0);

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
    setAttachments((prev) => [...prev, { url, name: file.name, contentType: file.type, size: file.size }]);
  }, []);

  const handleSend = useCallback(async ({ input, attachments: atts }: { input: string; attachments: Attachment[] }) => {
    if (!input.trim() && !atts.length) return;
    if (isLoading) return;

    const userMsg = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: "user",
      content: input || "📎 [Gambar dikirim]",
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [
      ...prev,
      atts.length > 0 ? { ...userMsg, imageUrl: atts[0].url } as ChatMessage : userMsg,
    ]);
    setIsLoading(true);

    try {
      const base64 = atts[0]?.url.startsWith("blob:")
        ? await fetch(atts[0].url).then((r) => r.blob()).then((b) => new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onload = () => res((reader.result as string).split(",")[1]);
            reader.onerror = rej;
            reader.readAsDataURL(b);
          }))
        : null;

      const res = await chatAPI.sendMessage(input || "Tolong analisis gambar ini.", base64);
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
  }, [isLoading]);

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
      <ChatMessages messages={messages} isLoading={isLoading} onCopy={handleCopy} />

      {/* Input area */}
      <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent">
        <div className="max-w-3xl mx-auto">
          <MultimodalInput
            messages={messages}
            attachments={attachments}
            setAttachments={setAttachments}
            onSend={handleSend}
            onStop={() => setIsLoading(false)}
            isLoading={isLoading}
          />
          <p className="text-center mt-3 text-[10px] text-muted-foreground/60 font-medium">
            SAKABOT dapat memberikan informasi yang tidak akurat. Mohon verifikasi melalui panduan resmi Puslapdik.
          </p>
        </div>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="drop-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative z-10 flex flex-col items-center gap-4 px-10 py-8 bg-background rounded-3xl shadow-2xl border border-border max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center border-2 border-dashed border-primary/40">
                <ImagePlus className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-foreground mb-1">Lepaskan gambar di sini</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP — maks. 5MB</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      <AnimatePresence>
        {dropError && (
          <motion.div
            key="drop-error"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 bg-foreground text-background rounded-2xl shadow-xl pointer-events-none max-w-sm w-[90%]"
          >
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span className="text-sm font-medium">{dropError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
