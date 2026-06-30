"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Calendar, Clock, Layers, X } from "lucide-react";
import NewOrderIcon from "@/components/icons/NewOrderIcon";
import { toast } from "sonner";
import { useOrder } from "@/contexts/OrderContext";

function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFormattedTime() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function useRealTimeClock() {
  const [time, setTime] = useState(getFormattedTime);
  useEffect(() => {
    const interval = setInterval(() => setTime(getFormattedTime()), 1000);
    return () => clearInterval(interval);
  }, []);
  return time;
}

export default function MenuPageHeader() {
  const {
    orders,
    activeOrderId,
    setActiveOrderId,
    addOrder,
    closeOrder,
    canAddOrder,
    canCloseOrder,
    checkoutLockedOrderSlotId,
  } = useOrder();

  const checkoutLockActive = checkoutLockedOrderSlotId != null;

  const currentTime = useRealTimeClock();

  return (
    <header className="relative z-50 flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"
            style={{
              boxShadow: "0px 4px 6px -4px #EA580C33, 0px 10px 15px -3px #EA580C33",
            }}
          >
            <Image src="/house_icon.svg" alt="" width={24} height={24} className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-[22.5px] tracking-normal text-[#1D293D]">
              Ahas Gawwa POS
            </h1>
            <p className="text-[10px] mt-1 font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
              MAHARAGAMA BRANCH
            </p>
          </div>
        </div>

        {/* Order tabs - pill container */}
        <div className="flex items-center gap-1 rounded-[16px] border border-[#E2E8F0] bg-[#F1F5F9] px-1.5 py-1.5">
          {orders.map((order, index) => (
            <div
              key={order.id}
              className={`flex items-center gap-1.5 rounded-[14px] px-2.5 py-1 transition-colors ${
                activeOrderId === order.id ? "bg-white" : "bg-transparent hover:bg-white/50"
              }`}
              style={
                activeOrderId === order.id
                  ? {
                      boxShadow: "0px 1px 2px -1px #0000001A, 0px 1px 3px 0px #0000001A",
                    }
                  : undefined
              }
            >
              <button
                type="button"
                onClick={() => {
                  if (checkoutLockActive && order.id !== checkoutLockedOrderSlotId) {
                    toast.message("Finish or cancel checkout on the other order before switching tabs.");
                    return;
                  }
                  setActiveOrderId(order.id);
                }}
                className="flex h-7 min-w-0 items-center gap-1.5"
              >
                <Layers
                  className={`h-4 w-4 shrink-0 ${
                    activeOrderId === order.id ? "text-primary" : "text-[#62748E]"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    activeOrderId === order.id ? "text-primary" : "text-[#62748E]"
                  }`}
                >
                  Order {index + 1}
                </span>
              </button>
              {canCloseOrder && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (checkoutLockActive) {
                      toast.message("Finish or cancel checkout before closing an order tab.");
                      return;
                    }
                    closeOrder(order.id);
                  }}
                  className="shrink-0 rounded-full p-0.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700"
                  aria-label={`Close Order ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {canAddOrder && (
            <button
              type="button"
              onClick={() => {
                if (checkoutLockActive) {
                  toast.message("Finish or cancel checkout before starting another order tab.");
                  return;
                }
                addOrder();
              }}
              className="flex items-center gap-1.5 rounded-[14px] px-2.5 py-1 text-sm font-medium text-[#62748E] transition-colors hover:bg-white/50"
            >
              <NewOrderIcon className="h-[18px] w-[18px] shrink-0" />
              New Order
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2">
          <Calendar className="h-4 w-4 text-[#EA580C]" />
          <span className="text-sm font-bold leading-5 tracking-normal text-[#45556C]">
            {getFormattedDate()}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2">
          <Clock className="h-4 w-4 text-[#EA580C]" />
          <span className="text-sm font-bold leading-5 tracking-[-0.35px] text-[#1D293D]">
            {currentTime}
          </span>
        </div>
      </div>
    </header>
  );
}
