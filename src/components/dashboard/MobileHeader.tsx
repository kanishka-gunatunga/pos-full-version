"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export default function MobileHeader() {
  const { toggle } = useSidebar();

  return (
    <header className="flex h-14 shrink-0 items-center border-b border-zinc-200 bg-white px-4 md:hidden">
      <button
        type="button"
        onClick={toggle}
        className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-800"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
    </header>
  );
}
