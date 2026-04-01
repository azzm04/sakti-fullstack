import { Send, Loader2 } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="p-3 bg-white border-t border-slate-100">
      <div className="bg-slate-50 rounded-full flex items-center px-4 py-1.5 border border-slate-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <input
          type="text"
          placeholder="Tanya SAKABOT..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          className="bg-transparent border-none outline-none flex-1 text-sm text-slate-700 placeholder:text-slate-400 py-1.5 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-sm shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
          )}
        </button>
      </div>
    </div>
  );
}