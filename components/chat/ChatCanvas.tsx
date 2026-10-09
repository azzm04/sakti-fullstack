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

import Image from "next/image";

import { AnimatePresence, motion } from "framer-motion";

import {
  Loader2,
  X,
  ImagePlus,
  AlertCircle,
  Paperclip,
  ArrowUp,
  Square,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

import { twMerge } from "tailwind-merge";

import { ChatMessageSchema, type ChatMessage } from "@/schemas";

import ChatMessages from "./ChatMessage";

// ============================================================
// UTILITY
// ============================================================

const cn = (...args: (string | undefined | null | false)[]) =>
  twMerge(args.filter(Boolean).join(" "));

// ============================================================
// TYPES
// ============================================================

interface Attachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

type ScrollDir = "none" | "up" | "down";

// ============================================================
// MIDDLE MOUSE AUTOSCROLL CONFIG
// ============================================================

/** Jarak (px) dari titik anchor sebelum mulai scroll */
const AUTOSCROLL_DEADZONE = 12;
/** Kecepatan maksimum (px per frame) */
const AUTOSCROLL_MAX_SPEED = 70;
/** Kalau tombol tengah ditahan lebih lama dari ini, lepas = berhenti */
const AUTOSCROLL_HOLD_MS = 250;

// ============================================================
// ACCEPTED FILE TYPES
// ============================================================

export const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/svg+xml",
  "image/webp",
];

// ============================================================
// BASE64 UTILITY
// ============================================================

export function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// SUGGESTED ACTIONS
// ============================================================

const SUGGESTED = [
  {
    title: "Syarat Ekonomi",
    label: "Penerima KIPK",
    action: "Apa saja syarat ekonomi untuk mendaftar KIPK?",
  },
  {
    title: "Cek Aktif DTSEN",
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

// ============================================================
// SUGGESTED ACTION COMPONENT
// ============================================================

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
              className="w-full text-left border border-[#E2E8F0] rounded-lg px-4 py-3 text-sm bg-white hover:bg-[#F8FAFC] hover:border-[#94A3B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]/25 transition-colors flex flex-col gap-1 group"
            >
              <span className="font-medium text-[#0B1536] group-hover:text-[#000352] transition-colors">
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

// ============================================================
// ATTACHMENT PREVIEW
// ============================================================

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
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center relative shadow-sm">
        {att.contentType.startsWith("image/") && att.url ? (
          <img src={att.url} alt={att.name} className="size-full object-cover" />
        ) : (
          <span className="text-[10px] font-bold text-slate-400 text-center px-1">
            {att.name.split(".").pop()?.toUpperCase()}
          </span>
        )}

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Loader2 className="w-5 h-5 animate-spin text-[#000352]" />
          </div>
        )}
      </div>

      <span className="text-[10px] font-medium text-slate-500 max-w-[4rem] sm:max-w-[5rem] truncate text-center">
        {att.name}
      </span>

      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center opacity-100 hover:bg-rose-500 transition-all z-10 shadow-md"
          title="Hapus Lampiran"
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  ),
);

PreviewAttachment.displayName = "PreviewAttachment";

// ============================================================
// INPUT PROPS
// ============================================================

interface InputProps {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  attachments: Attachment[];
  setAttachments: Dispatch<SetStateAction<Attachment[]>>;
  onSend: (params: { input: string; attachments: Attachment[] }) => void;
  onStop: () => void;
  isLoading: boolean;
}

// ============================================================
// MULTIMODAL INPUT
// ============================================================

function MultimodalInput({
  input,
  setInput,
  attachments,
  setAttachments,
  onSend,
  onStop,
  isLoading,
}: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");

  // TEXTAREA HEIGHT
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

  // UPLOAD
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
      const file = e.target.files?.[0];
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) {
        setUploadError("Hanya gambar PNG, JPG, atau WebP dengan ukuran maksimal 5 MB.");
        setTimeout(() => setUploadError(""), 3000);
        return;
      }

      setUploadError("");
      setUploadQueue((q) => [...q, file.name]);

      const hasil = await uploadFile(file);
      if (hasil) {
        // Satu gambar per pesan: gambar baru menggantikan yang lama
        setAttachments((prev) => {
          prev.forEach((a) => a.url.startsWith("blob:") && URL.revokeObjectURL(a.url));
          return [hasil];
        });
      }
    },
    [setAttachments],
  );

  // REMOVE ATTACHMENT
  const removeAttachment = useCallback(
    (att: Attachment) => {
      if (att.url.startsWith("blob:")) {
        URL.revokeObjectURL(att.url);
      }
      setAttachments((prev) => prev.filter((a) => a.url !== att.url));
      textareaRef.current?.focus();
    },
    [setAttachments],
  );

  // SUBMIT
  const submitForm = useCallback(() => {
    if (!input.trim() && !attachments.length) return;

    onSend({ input, attachments });

    setInput("");
    setAttachments([]);
    resetHeight();
    textareaRef.current?.focus();
  }, [input, attachments, onSend, setAttachments, setInput, resetHeight]);

  // STATES
  const canSend = !isLoading && !uploadQueue.length;

  const sendDisabled = !canSend || (!input.trim() && !attachments.length);

  return (
    <div className="w-full flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={isLoading}
        title="Input File"
      />

      {uploadError && (
        <div className="text-red-500 text-sm px-5 py-2">{uploadError}</div>
      )}

      <div
        className={cn(
          "relative flex flex-col w-full bg-white border border-[#CBD5E1] rounded-xl overflow-hidden transition-colors duration-200",
          "focus-within:ring-2 focus-within:ring-[#000352]/10 focus-within:border-[#000352]",
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
          id="sakabot-message-input"
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
          aria-label="Pesan untuk SAKABOT"
          placeholder="Tulis pertanyaan tentang KIP Kuliah..."
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
            className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#000352] transition-colors disabled:opacity-40"
          >
            <Paperclip size={18} strokeWidth={2.5} className="-rotate-45" />
          </button>

          {isLoading ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                onStop();
              }}
              className="p-3 bg-[#000352] text-white rounded-lg hover:bg-[#151965] transition-colors flex items-center justify-center"
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
              className="p-3 bg-[#000352] text-white rounded-lg hover:bg-[#151965] disabled:bg-slate-100 disabled:text-slate-400 transition-colors flex items-center justify-center disabled:shadow-none"
            >
              <ArrowUp size={18} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// INITIAL MESSAGE
// ============================================================

const INITIAL_MESSAGE: ChatMessage = ChatMessageSchema.parse({
  id: "1",
  role: "assistant",
  content:
    "Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?",
  timestamp: new Date().toISOString(),
});

// ============================================================
// CHAT CANVAS
// ============================================================

interface ChatCanvasProps {
  userId?: string;
  currentSessionId?: string | null;
  onMessageSent?: (sessionId: string) => void;
}

export default function ChatCanvas({
  userId,
  currentSessionId,
  onMessageSent,
}: ChatCanvasProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const isNewConversation = !currentSessionId && messages.length === 1 && messages[0].id === INITIAL_MESSAGE.id;
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropError, setDropError] = useState("");

  const dragCounter = useRef(0);

  // ==========================================================
  // SCROLL CONTAINER + AUTOSCROLL STATE
  // ==========================================================

  const chatScrollRef = useRef<HTMLDivElement>(null);

  const autoScrollRef = useRef({
    active: false,
    anchorX: 0,
    anchorY: 0,
    mouseY: 0,
    downAt: 0,
    moved: false,
    acc: 0, // akumulasi sub-pixel agar scroll pelan tetap jalan
    dir: "none" as ScrollDir,
    rafId: 0,
  });

  const [autoScrollAnchor, setAutoScrollAnchor] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [scrollDir, setScrollDir] = useState<ScrollDir>("none");

  // ==========================================================
  // LOAD SESSION
  // ==========================================================

  useEffect(() => {
    async function fetchSessionMessages() {
      if (!currentSessionId) {
        setMessages([INITIAL_MESSAGE]);
        return;
      }

      try {
        const res = await fetch(
          `/api/chat/messages?sessionId=${currentSessionId}`,
        );
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

  // ==========================================================
  // DRAG & DROP FILE
  // ==========================================================

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
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
      setDropError("Format tidak didukung. Gunakan PNG, JPG, atau WebP.");
      setTimeout(() => setDropError(""), 3000);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDropError("Ukuran gambar maksimal 5MB.");
      setTimeout(() => setDropError(""), 3000);
      return;
    }

    const url = URL.createObjectURL(file);

    setAttachments((prev) => {
      prev.forEach((a) => a.url.startsWith("blob:") && URL.revokeObjectURL(a.url));
      return [{ url, name: file.name, contentType: file.type, size: file.size }];
    });
  }, []);



  // ==========================================================
  // SEND MESSAGE
  // ==========================================================

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
        // CONVERT IMAGE TO BASE64
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

        // API REQUEST
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: updatedMessages,
            data: {
              userId: userId,
              sessionId: currentSessionId,
              imageBase64: base64,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Permintaan ditolak (${response.status})`);
        }

        // PARSE RESPONSE
        const rawText = await response.text();
        let botReply = rawText;

        if (rawText.includes("0:")) {
          botReply = rawText
            .split("\n")
            .filter((line) => line.startsWith("0:"))
            .map((line) => {
              try {
                return JSON.parse(line.substring(2));
              } catch {
                return "";
              }
            })
            .join("");
        }

        // ADD BOT MESSAGE
        setMessages((prev) => [
          ...prev,
          ChatMessageSchema.parse({
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: botReply || "Maaf, tidak ada respons.",
            timestamp: new Date().toISOString(),
          }),
        ]);

        // SESSION ID
        const newSessionId = response.headers.get("x-session-id");
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

  // ==========================================================
  // COPY
  // ==========================================================

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // ==========================================================
  // WHEEL SCROLL (RODA MOUSE)
  //
  // Ditangani manual agar tidak "dimakan" handler global
  // (Lenis / Locomotive / listener wheel lain yang preventDefault).
  // ==========================================================

  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Biarkan Ctrl + wheel untuk zoom browser
      if (e.ctrlKey) return;

      // Abaikan scroll horizontal (touchpad geser samping)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      const max = el.scrollHeight - el.clientHeight;
      if (max <= 0) return;

      // Normalisasi satuan delta (pixel / baris / halaman)
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= el.clientHeight;

      e.preventDefault();
      e.stopPropagation();

      el.scrollTop = Math.max(0, Math.min(max, el.scrollTop + dy));
    };

    // passive: false WAJIB agar preventDefault berfungsi
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ==========================================================
  // MIDDLE MOUSE AUTOSCROLL (KLIK TOMBOL TENGAH)
  //
  // - Klik tengah sekali  → autoscroll aktif; gerakkan mouse ke
  //   atas/bawah untuk scroll, klik apa saja / Esc untuk berhenti.
  // - Tahan tengah + geser → scroll selama ditahan, lepas = berhenti.
  // ==========================================================

  const stopAutoScroll = useCallback(() => {
    const s = autoScrollRef.current;
    if (!s.active) return;

    s.active = false;
    cancelAnimationFrame(s.rafId);

    setAutoScrollAnchor(null);
    setScrollDir("none");
  }, []);

  const handleChatMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Hanya tombol tengah mouse
      if (e.button !== 1) return;

      // Matikan autoscroll bawaan browser & paste tombol tengah (Linux)
      e.preventDefault();

      const s = autoScrollRef.current;

      if (s.active) {
        stopAutoScroll();
        return;
      }

      const container = chatScrollRef.current;
      if (!container) return;

      // Tidak ada yang bisa di-scroll
      if (container.scrollHeight <= container.clientHeight) return;

      s.active = true;
      s.anchorX = e.clientX;
      s.anchorY = e.clientY;
      s.mouseY = e.clientY;
      s.downAt = performance.now();
      s.moved = false;
      s.acc = 0;
      s.dir = "none";

      setAutoScrollAnchor({ x: e.clientX, y: e.clientY });

      const loop = () => {
        const el = chatScrollRef.current;
        if (!s.active || !el) return;

        const dy = s.mouseY - s.anchorY;
        const dist = Math.abs(dy);

        if (dist > AUTOSCROLL_DEADZONE) {
          const speed = Math.min(
            Math.pow((dist - AUTOSCROLL_DEADZONE) / 10, 1.3),
            AUTOSCROLL_MAX_SPEED,
          );

          s.acc += Math.sign(dy) * speed;

          const step = Math.trunc(s.acc);
          if (step !== 0) {
            el.scrollTop += step;
            s.acc -= step;
          }
        }

        s.rafId = requestAnimationFrame(loop);
      };

      s.rafId = requestAnimationFrame(loop);
    },
    [stopAutoScroll],
  );

  // Cegah klik tengah membuka link di tab baru / paste
  const handleChatAuxClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button === 1) e.preventDefault();
    },
    [],
  );

  // Listener global selama autoscroll aktif
  useEffect(() => {
    if (!autoScrollAnchor) return;

    const s = autoScrollRef.current;

    const onMove = (e: MouseEvent) => {
      s.mouseY = e.clientY;

      const dx = e.clientX - s.anchorX;
      const dy = e.clientY - s.anchorY;

      if (
        Math.abs(dx) > AUTOSCROLL_DEADZONE ||
        Math.abs(dy) > AUTOSCROLL_DEADZONE
      ) {
        s.moved = true;
      }

      const dir: ScrollDir =
        Math.abs(dy) <= AUTOSCROLL_DEADZONE ? "none" : dy < 0 ? "up" : "down";

      if (dir !== s.dir) {
        s.dir = dir;
        setScrollDir(dir);
      }
    };

    const onUp = (e: MouseEvent) => {
      if (e.button !== 1) return;

      const held = performance.now() - s.downAt;

      // Tahan-geser: lepas = berhenti. Klik sekali: tetap aktif.
      if (s.moved || held > AUTOSCROLL_HOLD_MS) {
        stopAutoScroll();
      }
    };

    const onDown = (e: MouseEvent) => {
      // Klik apa pun saat aktif hanya menghentikan autoscroll
      e.preventDefault();
      e.stopPropagation();
      stopAutoScroll();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stopAutoScroll();
    };

    const onWheel = () => stopAutoScroll();
    const onBlur = () => stopAutoScroll();

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousedown", onDown, true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("blur", onBlur);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onBlur);
    };
  }, [autoScrollAnchor, stopAutoScroll]);

  // Bersihkan animation frame saat unmount
  useEffect(() => {
    const s = autoScrollRef.current;
    return () => {
      s.active = false;
      cancelAnimationFrame(s.rafId);
    };
  }, []);

  const autoScrollCursor =
    scrollDir === "up"
      ? "n-resize"
      : scrollDir === "down"
        ? "s-resize"
        : "all-scroll";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main
      /*
       * flex-1          = mengisi sisa tinggi setelah header
       * min-h-0         = mengizinkan child flex mengecil
       * overflow-hidden = mencegah BODY ikut scrolling
       */
      className="flex-1 min-h-0 flex flex-col w-full bg-[#F8FAFC] overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* AREA PESAN — HANYA BAGIAN INI YANG BOLEH SCROLL */}
      <div
        ref={chatScrollRef}
        data-lenis-prevent
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 lg:px-8 py-4"
        onMouseDown={handleChatMouseDown}
        onAuxClick={handleChatAuxClick}
      >
        <div className={cn("max-w-3xl mx-auto", isNewConversation && "flex min-h-full flex-col justify-center py-4 sm:py-8")}>
          {isNewConversation ? (
            <section aria-labelledby="sakabot-welcome-title" className="mx-auto w-full max-w-xl">
              <div className="mb-6 flex flex-col items-center text-center">
                <Image
                  src="/illustrations/sakabot-header-animated.svg"
                  alt=""
                  width={96}
                  height={116}
                  className="mb-4 h-24 w-20 object-contain sm:h-[116px] sm:w-24"
                />
                <h2 id="sakabot-welcome-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B1536]">Ada yang bisa saya bantu?</h2>
                <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-[#64748B]">Tanyakan informasi KIP Kuliah atau pilih topik berikut untuk memulai.</p>
              </div>
              <SuggestedActions onSelect={(question) => {
                setInput(question);
                document.getElementById("sakabot-message-input")?.focus();
              }} />
            </section>
          ) : (
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onCopy={handleCopy}
            />
          )}
        </div>
      </div>

      {/* AREA INPUT — TETAP DI BAWAH */}
      <div className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] pt-4 pb-4 px-4 sm:px-6 lg:px-8 shrink-0 z-10">
        <div className="max-w-3xl mx-auto">
          <MultimodalInput
            input={input}
            setInput={setInput}
            attachments={attachments}
            setAttachments={setAttachments}
            onSend={handleSend}
            onStop={() => setIsLoading(false)}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* MIDDLE MOUSE AUTOSCROLL OVERLAY + INDIKATOR */}
      {autoScrollAnchor && (
        <div
          className="fixed inset-0 z-[60] select-none"
          style={{ cursor: autoScrollCursor }}
        >
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 border border-slate-300 shadow-md flex flex-col items-center justify-center"
            style={{ left: autoScrollAnchor.x, top: autoScrollAnchor.y }}
          >
            <ChevronUp
              size={12}
              strokeWidth={3}
              className={scrollDir === "up" ? "text-[#000352]" : "text-slate-400"}
            />
            <span className="w-1 h-1 rounded-full bg-slate-400" />
            <ChevronDown
              size={12}
              strokeWidth={3}
              className={
                scrollDir === "down" ? "text-[#000352]" : "text-slate-400"
              }
            />
          </div>
        </div>
      )}

      {/* DRAG & DROP OVERLAY */}
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
              className="relative z-10 flex flex-col items-center gap-4 px-10 py-8 bg-white rounded-xl shadow-lg border border-[#E2E8F0] max-w-sm w-full"
            >
              <div className="w-16 h-16 rounded-lg bg-[#EEF3FB] flex items-center justify-center border-2 border-dashed border-[#94A3B8]">
                <ImagePlus className="w-8 h-8 text-[#000352]" />
              </div>

              <div className="text-center">
                <p className="text-base font-bold text-slate-800 mb-1">
                  Lepaskan gambar di sini
                </p>
                <p className="text-xs text-slate-500">
                  PNG, JPG, WebP — maks. 5MB
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DROP ERROR */}
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