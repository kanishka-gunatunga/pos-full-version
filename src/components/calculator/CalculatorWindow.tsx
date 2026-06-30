"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X } from "lucide-react";
import Calculator from "./Calculator";

const DEFAULT_POSITION = { x: 100, y: 100 };

function getInitialPosition() {
  if (typeof window === "undefined") return DEFAULT_POSITION;
  const padding = 16;
  const calcWidth = Math.min(280, window.innerWidth - padding * 2);
  const calcHeight = 380;
  const isMobile = window.innerWidth < 768;
  const x = isMobile
    ? (window.innerWidth - calcWidth) / 2
    : Math.max(padding, Math.min(window.innerWidth - calcWidth - padding, DEFAULT_POSITION.x));
  const y = Math.max(
    padding,
    Math.min(window.innerHeight - calcHeight - padding, DEFAULT_POSITION.y)
  );
  return { x, y };
}

export default function CalculatorWindow({ onClose }: { onClose: () => void }) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setPosition(getInitialPosition());
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const getClientCoords = (e: MouseEvent | TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  };

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      const { x, y } =
        "touches" in e
          ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
          : { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
      setIsDragging(true);
      dragOffset.current = { x: x - position.x, y: y - position.y };
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      if ("touches" in e && e.cancelable) e.preventDefault();
      const { x, y } = getClientCoords(e);
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 280, x - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, y - dragOffset.current.y)),
      });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  return (
    <div
      className="fixed z-50 flex max-h-[calc(100dvh-2rem)] w-[280px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border-2 border-zinc-200 bg-white shadow-xl md:max-h-none md:max-w-none"
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Draggable header */}
      <div
        className="flex cursor-grab touch-none items-center justify-between border-b border-zinc-200 bg-zinc-100 px-3 py-2 active:cursor-grabbing"
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <span className="text-sm font-medium text-zinc-700">Calculator</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-800"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Calculator body - scrollable on small screens */}
      <div className="overflow-y-auto p-3">
        <Calculator />
      </div>
    </div>
  );
}
