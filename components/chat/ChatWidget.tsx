"use client";

import { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { useChatbot } from "@/hook/useChatbot";
import ChatMessages from "./ChatMessage";
import type { ChatMessage } from "@/schemas";
import ChatInput from "./ChatInput";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const { messages, isLoading, input, handleInputChange, handleSubmit, stop } =
    useChatbot(imageBase64);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSendMessage = (image?: string | null) => {
    if (image) setImageBase64(image);
    handleSubmit({
      preventDefault: () => {},
    } as React.FormEvent<HTMLFormElement>);
  };

  return (
    <div className="fixed bottom-5 right-5 md:bottom-8 md:right-8 z-[60] group font-body">
      {/* TOOLTIP */}
      <div
        className={`absolute bottom-full right-0 mb-4 w-72 bg-white rounded-2xl shadow-xl p-5 border border-slate-200 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-0 scale-95 invisible"
            : "opacity-0 scale-95 invisible group-hover:opacity-100 group-hover:scale-100 group-hover:visible"
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            <Avatar className="size-8 shrink-0 mt-1 shadow-sm">
              <AvatarImage
                alt="SAKABOT"
                src="https://api.dicebear.com/9.x/glass/svg?seed=alice"
              />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                SA
              </AvatarFallback>
            </Avatar>
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
        className={`absolute bottom-20 right-0 w-[350px] sm:w-[380px] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right ${
          isOpen
            ? "opacity-100 scale-100 visible h-[550px]"
            : "opacity-0 scale-50 invisible h-0"
        }`}
      >
        {/* Header Chat */}
        <div className="bg-primary p-4 text-white flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-sm tracking-wide">SAKABOT</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-blue-100">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                Siap Membantu Terkait KIP-Kuliah
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5 text-white/90" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-4 relative bg-slate-50/50">
          <ChatMessages
            messages={messages as ChatMessage[]}
            isLoading={isLoading}
            onCopy={handleCopy}
          />
        </div>

        {/* Footer Chat */}
        <div className="shrink-0 bg-white">
          <ChatInput
            input={input}
            onInputChange={handleInputChange}
            onSend={handleSendMessage}
            isLoading={isLoading}
            onStop={stop}
          />
        </div>
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
