"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="mx-auto max-w-md rounded-[24px] border border-[#FFE6EB] bg-[#FFF1F2] p-8 text-center">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
            Something went wrong
          </h2>
          <p className="mt-2 font-['Inter'] text-sm text-[#62748E]">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-xl bg-[#EA580C] px-6 py-2.5 font-['Inter'] text-sm font-bold text-white transition-colors hover:bg-[#DC4C04]"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
