"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { useSendBulkPromotions } from "@/hooks/useCustomer";
import { toast } from "sonner";

interface SendPromotionModalProps {
  onClose: () => void;
}

export default function SendPromotionModal({ onClose }: SendPromotionModalProps) {
  const [message, setMessage] = useState("");
  const { mutateAsync: sendPromotions, isPending } = useSendBulkPromotions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Please enter a promotion message.");
      return;
    }

    try {
      await sendPromotions({ message });
      toast.success("Promotions sent successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to send promotions:", error);
      toast.error("Failed to send promotions. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-8 text-[20px] font-bold text-[#1D293D]">
          Send Promotion
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">Promotion Message</label>
            <textarea
              placeholder="Enter your promotion message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full rounded-xl bg-[#F8FAFC] p-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 resize-none border border-transparent"
            />
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl cursor-pointer border border-[#E2E8F0] text-[14px] font-bold text-[#62748E] transition-all hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-12 flex-1 flex items-center justify-center gap-2 rounded-xl cursor-pointer bg-[#EA580C] text-[14px] font-bold text-white shadow-lg shadow-[#EA580C]/20 transition-all hover:bg-[#DC4C04] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isPending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
