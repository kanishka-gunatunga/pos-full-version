"use client";

export default function MinWidthGuard({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="hidden min-[1000px]:block">{children}</div>
      <div className="min-[1000px]:hidden flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-6">
        <div className="w-full max-w-md rounded-[24px] border border-[#E2E8F0] bg-white p-8 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.07),0px_10px_15px_-3px_rgba(0,0,0,0.05)] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7ED]">
            <svg
              className="h-8 w-8 text-[#EA580C]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-['Inter'] text-xl font-bold leading-7 text-[#1D293D]">
            Access denied
          </h1>
          <p className="mt-3 font-['Inter'] text-sm leading-5 text-[#62748E]">
            This system is for desktop use only. Please access from a desktop device.
          </p>
        </div>
      </div>
    </>
  );
}
