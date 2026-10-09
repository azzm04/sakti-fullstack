"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Copy, CheckCircle2, Bot } from "lucide-react";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/schemas";

const cn = (...args: (string | undefined | null | false)[]) =>
  twMerge(args.filter(Boolean).join(" "));

const EMPTY_MESSAGES: ChatMessage[] = [];

function MessageAvatar() {
  return (
    <span
      role="img"
      aria-label="SAKABOT"
      className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FB] text-[#000352]"
    >
      <Bot size={18} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}

const MessageItem = memo(
  ({ msg, onCopy }: { msg: ChatMessage; onCopy: (t: string) => void }) => {
    const isUser = msg.role === "user";
    const [copied, setCopied] = useState(false);
    const reduceMotion = useReducedMotion();

    const handleCopy = () => {
      onCopy(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
        className={cn(
          "flex w-full gap-3",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {/* ── Avatar Assistant ── */}
        {!isUser && (
          <MessageAvatar />
        )}

        <div
          className={cn(
            "flex flex-col min-w-0 max-w-[calc(100%-44px)] md:max-w-[85%]",
            isUser ? "items-end" : "items-start",
          )}
        >
          {/* Gambar Lampiran */}
          {msg.imageUrl && (
            <div className="mb-2 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[200px] bg-slate-100 flex items-center justify-center min-h-[100px]">
              {/* eslint-disable-next-line @next/next/no-img-element -- base64/runtime image, next/image cannot optimize data URIs */}
              <img
                src={
                  msg.imageUrl.startsWith("data:") ||
                  msg.imageUrl.startsWith("http")
                    ? msg.imageUrl
                    : `data:image/jpeg;base64,${msg.imageUrl}`
                }
                alt="Lampiran"
                className="w-full h-auto max-h-[250px] object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          {/* Bubble Chat */}
          <div
            className={cn(
              "relative group px-4 py-3", // Sedikit diperkecil paddingnya agar mirip demo
              isUser
                ? "bg-[#000352] text-white rounded-xl rounded-tr-sm"
                : "bg-white border border-[#E2E8F0] text-[#334155] rounded-xl rounded-tl-sm pb-10",
            )}
          >
            {/* Action Bar (Copy) */}
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute right-2 bottom-1.5 p-1.5 text-slate-500 hover:text-[#000352] hover:bg-slate-50 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000352]/25 transition-colors"
                title="Salin pesan"
              >
                {copied ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Copy size={16} />
                )}
              </button>
            )}

            {/* Isi Pesan (Markdown Support) */}
            <div
              className={cn(
                "prose prose-sm max-w-none break-words",
                isUser ? "prose-invert" : "prose-slate",
                "prose-p:leading-relaxed prose-pre:my-2 prose-pre:p-3 prose-pre:bg-slate-800 prose-pre:rounded-xl",
              )}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>

        </div>

      </motion.div>
    );
  },
);
MessageItem.displayName = "MessageItem";

export default function ChatMessages({
  messages = EMPTY_MESSAGES,
  isLoading = false,
  onCopy,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeMessages = Array.isArray(messages) ? messages : EMPTY_MESSAGES;
  const reduceMotion = useReducedMotion();

  // Auto-scroll ke bawah
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: reduceMotion ? "instant" : "smooth",
      });
    }
  }, [safeMessages, isLoading, reduceMotion]);

  // Prevent scroll from leaking to parent/body on mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (containerRef.current) {
        containerRef.current.dataset.lastY = String(e.touches[0].clientY);
      }
    },
    [],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const touchY = e.touches[0].clientY;
    const lastY = Number(el.dataset.lastY || touchY);
    const movingDown = touchY > lastY; // finger moving down = scroll up
    el.dataset.lastY = String(touchY);

    if ((isAtTop && movingDown) || (isAtBottom && !movingDown)) {
      e.preventDefault();
    }
  }, []);

  return (
    <div
      ref={containerRef}
      data-lenis-prevent
      className="flex-1 min-h-0 flex flex-col gap-5 py-6 overflow-y-auto overscroll-contain scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onWheel={(e) => e.stopPropagation()}
    >
      <AnimatePresence initial={false}>
        {safeMessages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} onCopy={onCopy} />
        ))}

        {/* ── Loading Indicator Asisten dengan Avatar ── */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            className="flex w-full gap-3 justify-start"
          >
            <MessageAvatar />

            <div
              role="status"
              className="mt-1 flex min-h-11 items-center gap-3 rounded-xl rounded-tl-sm border border-[#E2E8F0] bg-white px-4 py-3"
            >
              <span className="text-sm text-[#64748B]">Sedang menyiapkan jawaban</span>
              <span className="flex items-center gap-1" aria-hidden="true">
                {[0, 1, 2].map((index) => (
                  <motion.span
                    key={index}
                    className="size-1.5 rounded-full bg-[#000352]/60"
                    animate={reduceMotion ? { opacity: 0.6 } : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
                    transition={reduceMotion ? { duration: 0 } : {
                      duration: 1.2,
                      repeat: Infinity,
                      delay: index * 0.16,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
