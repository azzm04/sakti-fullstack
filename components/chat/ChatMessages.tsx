'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '@/schemas';

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  onCopy: (text: string) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function formatDate() {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function ChatMessages({ messages, isLoading, onCopy }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-0 py-8" style={{ scrollbarWidth: 'thin' }}>
      <div className="max-w-4xl mx-auto space-y-10 pb-48">

        <div className="flex justify-center">
          <span className="px-4 py-1 rounded-full bg-slate-200/70 text-[11px] font-bold text-slate-500 tracking-wider uppercase">
            {mounted ? formatDate() : ''}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const msgWithImg = msg as ChatMessage & { imageUrl?: string };
            const time = mounted ? formatTime(msg.timestamp) : '--:--';

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
              >
                {isUser ? (
                  <div className="flex gap-4 max-w-[85%] md:max-w-[70%]">
                    <div className="flex flex-col gap-1 items-end">
                      {msgWithImg.imageUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-1">
                          <img src={msgWithImg.imageUrl} alt="attachment" className="max-w-[240px] max-h-[200px] object-cover" />
                        </div>
                      )}
                      {msg.content && msg.content !== '📎 [Gambar dikirim]' && (
                        <div className="p-4 bg-primary rounded-2xl rounded-tr-none text-white shadow-sm leading-relaxed text-sm">
                          {msg.content}
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-slate-400">{time} • Terkirim</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 max-w-[95%] md:max-w-[85%]">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary mt-1 shadow-md">
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="p-6 bg-white rounded-2xl rounded-tl-none text-slate-700 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-slate-200/50 leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => onCopy(msg.content)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">content_copy</span>Salin
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          <span className="material-symbols-outlined text-sm">thumb_up</span>Membantu
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                          <span className="material-symbols-outlined text-sm">thumb_down</span>Tidak Relevan
                        </button>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">{time} • SAKABOT AI Engine</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex gap-4 items-start"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-primary shadow-md">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-slate-200/50 flex gap-1.5 items-center">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={endRef} />
      </div>
    </div>
  );
}
