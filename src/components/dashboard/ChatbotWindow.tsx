"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchWithAuth } from "@/lib/api";
import { Loader2 } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

interface ChatbotWindowProps {
  onClose: () => void;
}

export default function ChatbotWindow({ onClose }: ChatbotWindowProps) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Hi! I'm your POS assistant. Ask me anything about your data!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetchWithAuth("/api/chatbot", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", content: data.reply || "I couldn't process that request." }]);
    } catch (error) {
      console.error("Chatbot error:", error);
      setMessages(prev => [...prev, { role: "bot", content: "Sorry, I am having trouble connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g);
    
    return (
      <span className="whitespace-pre-wrap leading-relaxed block">
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#E2E8F0]">
      {/* Header */}
      <div className="flex items-center justify-between bg-primary px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-bold">POS Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-1 transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex max-w-[85%] items-start gap-2 rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-none"
                  : "bg-white text-[#1D293D] border border-[#E2E8F0] rounded-bl-none"
              }`}
            >
              {msg.role === "bot" && (
                <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              )}
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[85%] items-center gap-2 rounded-2xl rounded-bl-none border border-[#E2E8F0] bg-white px-4 py-3 text-sm shadow-sm text-[#64748B]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E2E8F0] bg-white p-3">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-4 pr-12 text-sm text-[#1D293D] placeholder:text-[#94A3B8] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:bg-[#94A3B8] disabled:hover:opacity-100"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
