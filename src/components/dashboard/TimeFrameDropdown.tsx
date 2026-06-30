"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

const timeframes = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "Last 30 Days",
  "This Month",
  "Last Month",
];

export default function TimeFrameDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Last 7 Days");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#45556C] transition-all hover:bg-zinc-50 active:scale-95 cursor-pointer"
      >
        <Calendar className="h-4 w-4" />
        <span>{selected}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#90A1B9] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 transition-all duration-200 z-[100] ${
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-1">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              onClick={() => {
                setSelected(timeframe);
                setIsOpen(false);
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors cursor-pointer ${
                selected === timeframe
                  ? "bg-primary/10 text-primary"
                  : "text-[#62748E] hover:bg-[#F8FAFC] hover:text-[#1D293D]"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
