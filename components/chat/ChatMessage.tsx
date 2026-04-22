"use client";

import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, CheckCircle2 } from "lucide-react";
import { twMerge } from "tailwind-merge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/schemas";
// Pastikan path ini sesuai dengan letak komponen shadcn-mu
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const cn = (...args: (string | undefined | null | false)[]) =>
  twMerge(args.filter(Boolean).join(" "));

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}

const MessageItem = memo(
  ({ msg, onCopy }: { msg: ChatMessage; onCopy: (t: string) => void }) => {
    const isUser = msg.role === "user";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      onCopy(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex w-full gap-3",
          isUser ? "justify-end" : "justify-start",
        )}
      >
        {/* ── Avatar Assistant ── */}
        {!isUser && (
          <Avatar className="size-8 shrink-0 mt-1 shadow-sm">
            <AvatarImage alt="SAKABOT" src="https://api.dicebear.com/9.x/glass/svg?seed=alice" />
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
              SA
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "flex flex-col max-w-[85%] md:max-w-[75%]",
            isUser ? "items-end" : "items-start",
          )}
        >
          {/* Gambar Lampiran */}
          {msg.imageUrl && (
            <div className="mb-2 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm max-w-sm">
              <img
                src={msg.imageUrl}
                alt="Lampiran"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Bubble Chat */}
          <div
            className={cn(
              "relative group px-4 py-2.5 shadow-sm", // Sedikit diperkecil paddingnya agar mirip demo
              isUser
                ? "bg-slate-900 text-white rounded-2xl rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm",
            )}
          >
            {/* Action Bar (Copy) */}
            {!isUser && (
              <button
                onClick={handleCopy}
                className="absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-slate-200"
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

          {/* Timestamp */}
          <span className="text-[10px] font-medium text-slate-400 mt-1 px-1">
            {new Date(msg.timestamp).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* ── Avatar User ── */}
        {isUser && (
          <Avatar className="size-8 shrink-0 mt-1 border border-slate-200 shadow-sm">
            <AvatarImage alt="User" src="https://api.dicebear.com/9.x/glass/svg?seed=you" />
            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-bold">
              U
            </AvatarFallback>
          </Avatar>
        )}
      </motion.div>
    );
  },
);
MessageItem.displayName = "MessageItem";

export default function ChatMessages({
  messages = [],
  isLoading = false,
  onCopy,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const safeMessages = Array.isArray(messages) ? messages : [];

  // Auto-scroll ke bawah
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [safeMessages, isLoading]);

  return (
    <div ref={containerRef} className="flex flex-col gap-5 py-6 scroll-smooth">
      <AnimatePresence initial={false}>
        {safeMessages.map((msg) => (
          <MessageItem key={msg.id} msg={msg} onCopy={onCopy} />
        ))}

        {/* ── Loading Indicator Asisten dengan Avatar ── */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex w-full gap-3 justify-start"
          >
            <Avatar className="size-8 shrink-0 mt-1 border border-slate-200 shadow-sm">
              <AvatarImage alt="SAKABOT" src="https://api.dicebear.com/9.x/glass/svg?seed=alice" />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                SA
              </AvatarFallback>
            </Avatar>

            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[38px] mt-1">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                className="w-1.5 h-1.5 rounded-full bg-slate-400"
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-slate-400"
              />
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                className="w-1.5 h-1.5 rounded-full bg-slate-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
