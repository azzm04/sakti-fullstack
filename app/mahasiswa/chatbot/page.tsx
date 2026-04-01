'use client';

import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '@/lib/api';
import { ChatMessageSchema, ChatMessage } from '@/schemas';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSend, IconPaperclip, IconThumbUp, IconThumbDown, IconCopy, IconSparkles } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'lucide-react';

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    ChatMessageSchema.parse({
      id: '1',
      role: 'assistant',
      content: 'Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP-Kuliah hari ini?',
      timestamp: new Date().toISOString(),
    }),
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = ChatMessageSchema.parse({
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    });

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call FastAPI backend
      const response = await chatAPI.sendMessage(inputMessage, conversationId);
      
      const assistantMessage: ChatMessage = ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      });

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: ChatMessage = ChatMessageSchema.parse({
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: new Date().toISOString(),
      });
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickSuggestions = [
    "Syarat Ekonomi KIPK",
    "Cek Status DTKS",
    "Dokumen Pendukung",
    "Batas Waktu Pendaftaran",
  ];

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <header className="h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-8 border-b border-outline-variant/20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">
              Interaksi Aktif
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
          <h2 className="font-headline font-extrabold text-xl text-primary tracking-tight leading-none mt-0.5">
            SAKABOT AI
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/mahasiswa/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-highest text-on-surface text-sm font-semibold transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">dashboard</span>
            Kembali ke Dashboard
            </Link>
        </div>
      </header>

      {/* Chat Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0 py-8 chat-scrollbar">
        <div className="max-w-4xl mx-auto space-y-10 pb-32">
          {/* Date Separator */}
          <div className="flex justify-center">
            <span className="px-4 py-1 rounded-full bg-surface-container text-[11px] font-bold text-on-surface-variant tracking-wider uppercase">
              Hari Ini
            </span>
          </div>

          {/* Messages */}
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex flex-col ${
                  message.role === 'user' ? 'items-end' : 'items-start'
                } gap-2`}
              >
                {message.role === 'user' ? (
                  // User Message
                  <div className="flex gap-4 max-w-[85%] md:max-w-[70%]">
                    <div className="flex flex-col gap-1 items-end">
                      <div className="p-4 bg-primary rounded-2xl rounded-tr-none text-on-primary shadow-sm leading-relaxed">
                        {message.content}
                      </div>
                      <span className="text-[10px] font-medium text-on-surface-variant">
                        {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ) : (
                  // AI Response
                  <div className="flex flex-col items-start gap-2 max-w-[95%] md:max-w-[85%]">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-primary mt-1 shadow-md">
                        <IconSparkles className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="p-6 bg-surface-container-lowest rounded-2xl rounded-tl-none text-on-surface shadow-sm border border-outline-variant/10 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-4">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                            <IconThumbUp className="w-4 h-4" />
                            Membantu
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                            <IconThumbDown className="w-4 h-4" />
                            Tidak Relevan
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant text-[11px] font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
                            <IconCopy className="w-4 h-4" />
                            Salin
                          </button>
                        </div>
                        
                        <span className="text-[10px] font-medium text-on-surface-variant">
                          {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })} • SAKABOT AI Engine
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <span className="text-sm text-on-surface-variant">SAKABOT sedang mengetik...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface via-surface to-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Quick Suggestions */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="flex-shrink-0 px-4 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/30 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Input Container */}
          <form onSubmit={handleSendMessage} className="relative group">
            <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-3xl"></div>
            <div className="relative flex items-end gap-3 p-2 bg-surface-container-lowest rounded-[2rem] shadow-xl border border-outline-variant/20 transition-all group-focus-within:border-primary/30">
              <button
                type="button"
                className="p-3 text-on-surface-variant hover:text-primary transition-colors"
                title='button'
              >
                <IconPaperclip className="w-5 h-5" />
              </button>
              
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-sm resize-none max-h-32 font-body"
                placeholder="Tanyakan sesuatu ke SAKABOT..."
                rows={1}
              />
              
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-white shadow-lg active:scale-90 transition-transform disabled:opacity-50"
                title='button'
              >
                <IconSend className="w-5 h-5" />
              </button>
            </div>
          </form>
          
          <p className="text-center mt-3 text-[10px] text-on-surface-variant/60 font-medium">
            SAKABOT dapat memberikan informasi yang tidak akurat. Mohon verifikasi kembali melalui panduan resmi Puslapdik.
          </p>
        </div>
      </div>
    </div>
  );
}