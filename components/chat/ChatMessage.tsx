import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

export default function ChatMessage({ text, isUser }: ChatMessageProps) {
  return (
    <div className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1 border",
          isUser
            ? "bg-blue-50 border-blue-200"
            : "bg-blue-100 border-blue-300"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Bubble Chat */}
      <div
        className={cn(
          "p-3 rounded-2xl shadow-sm border text-sm max-w-[85%] leading-relaxed",
          isUser
            ? "bg-primary text-white border-primary rounded-br-sm"
            : "bg-white text-slate-600 border-slate-200 rounded-bl-sm"
        )}
      >
        {text}
      </div>
    </div>
  );
}