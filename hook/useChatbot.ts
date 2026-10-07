"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { ChatMessage } from "@/schemas";
import { useChat } from "ai/react";
import type { Message } from "ai";

export function useChatbot(
  imageBase64?: string | null, // dipertahankan agar pemanggil lama tidak error
  initialSessionId?: string | null,
) {
  // ID sesi hanya terisi untuk pengguna yang login
  const [sessionId, setSessionId] = useState<string | null>(
    initialSessionId || null,
  );

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit: submitBawaan,
    isLoading,
    setMessages,
    stop,
    setInput,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "1",
        role: "assistant",
        content:
          "Halo! Saya SAKABOT, asisten virtual SAKTI. Ada yang bisa saya bantu terkait KIP Kuliah hari ini?",
      },
    ],
    // Menangkap ID Sesi dari header respons backend
    onResponse: (response: Response) => {
      const newSessionId = response.headers.get("X-Session-Id");
      if (newSessionId && !sessionId) {
        setSessionId(newSessionId);
      }
    },
    onFinish: (message: Message) => {
      console.log("💬 Chat finished:", message.content);
    },
    onError: (error: Error) => {
      console.error("❌ Chat error:", error);
    },
  });

  // Gambar dan sessionId dikirim PER PERMINTAAN, sehingga tidak ada nilai usang.
  // userId tidak dikirim: server mengambilnya dari token login.
  const handleSubmit = (
    e: FormEvent<HTMLFormElement>,
    gambar?: string | null,
  ) => {
    submitBawaan(e, {
      body: {
        data: {
          imageBase64: gambar ?? imageBase64 ?? null,
          sessionId,
        },
      },
    });
  };

  return {
    messages: messages as ChatMessage[],
    input,
    isLoading,
    stop,
    handleInputChange,
    handleSubmit,
    setMessages,
    setInput,
    sessionId,
  };
}