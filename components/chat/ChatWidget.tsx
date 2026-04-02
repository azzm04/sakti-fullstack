"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Bot } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
// Sesuaikan import ini dengan letak file api.ts milikmu
import { chatAPI } from "@/lib/api"; 

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Halo! Saya SAKABOT. Ada yang bisa saya bantu terkait KIP-Kuliah?",
      isUser: false,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah setiap kali array messages bertambah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // 1. Tambahkan pesan user ke UI
    const userMessage: Message = { id: Date.now().toString(), text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Tembak API Backend FastAPI
      const response = await chatAPI.sendMessage(text);
      
      // Backend returns one of: jawaban, reply, message, response
      const botReply = response.jawaban ?? response.reply ?? response.message ?? response.response ?? response.data;

      // 3. Tambahkan balasan bot ke UI
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), text: botReply, isUser: false },
      ]);
    } catch (error) {
      console.error("Gagal mengirim pesan:", error);
      // Fallback jika API mati/error
      setMessages((prev) => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          text: "Maaf, SAKABOT sedang mengalami gangguan koneksi. Silakan coba lagi nanti.", 
          isUser: false 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[60] group font-body">
      
      {/* TOOLTIP (Hanya Muncul Jika Chat Tertutup) */}
      <div
        className={`absolute bottom-full right-0 mb-4 w-72 bg-white rounded-2xl shadow-xl p-5 border border-slate-200 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-0 scale-95 invisible"
            : "opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">SAKABOT</div>
            <div className="text-[10px] text-green-600 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mb-4">
          Halo! Ada yang bisa saya bantu terkait pendaftaran KIP-Kuliah?
        </p>
      </div>

      {/* MINI CHAT WINDOW */}
      <div 
        className={`absolute bottom-20 right-0 w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen ? "opacity-100 scale-100 visible h-[500px]" : "opacity-0 scale-50 invisible h-0"
        }`}
      >
        {/* Header Chat */}
        <div className="bg-primary p-4 text-white flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide">SAKABOT</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-100">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                Siap Membantu
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="btn"
          >
            <X className="w-5 h-5 text-white/90" />
          </button>
        </div>

        {/* Body Chat (Area Pesan) */}
        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} text={msg.text} isUser={msg.isUser} />
          ))}
          
          {/* Indikator Mengetik dari Bot */}
          {isLoading && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-slate-200 flex gap-1.5">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          )}
          {/* Dummy div agar bisa auto-scroll ke dasar chat */}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Chat (Input Area Terpisah) */}
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* FLOATING TRIGGER BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform rotate-90 duration-300" />
        ) : (
          <MessageSquare className="w-6 h-6 transition-transform duration-300" />
        )}
      </button>

    </div>
  );
}