"use client";

import type { ExtraFeeTabId } from "@/domains/extra-fee/types";

type Props = {
  activeTab: ExtraFeeTabId;
  onTabChange: (tab: ExtraFeeTabId) => void;
};

export default function ExtraFeeTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onTabChange("delivery")}
        className={`flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-center font-['Inter'] text-base font-medium leading-6 transition-opacity duration-300 ease-out ${
          activeTab === "delivery"
            ? "bg-[#EA580C] text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
            : "bg-[#F1F5F9] text-[#45556C] hover:opacity-90"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M10.5 13.5V4.5C10.5 4.10218 10.342 3.72064 10.0607 3.43934C9.77936 3.15804 9.39782 3 9 3H3C2.60218 3 2.22064 3.15804 1.93934 3.43934C1.65804 3.72064 1.5 4.10218 1.5 4.5V12.75C1.5 12.9489 1.57902 13.1397 1.71967 13.2803C1.86032 13.421 2.05109 13.5 2.25 13.5H3.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.25 13.5H6.75"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.25 13.5H15.75C15.9489 13.5 16.1397 13.421 16.2803 13.2803C16.421 13.1397 16.5 12.9489 16.5 12.75V10.0125C16.4997 9.8423 16.4415 9.67726 16.335 9.5445L13.725 6.282C13.6549 6.19416 13.5659 6.12321 13.4646 6.0744C13.3633 6.02559 13.2524 6.00016 13.14 6H10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12.75 15C13.5784 15 14.25 14.3284 14.25 13.5C14.25 12.6716 13.5784 12 12.75 12C11.9216 12 11.25 12.6716 11.25 13.5C11.25 14.3284 11.9216 15 12.75 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.25 15C6.07843 15 6.75 14.3284 6.75 13.5C6.75 12.6716 6.07843 12 5.25 12C4.42157 12 3.75 12.6716 3.75 13.5C3.75 14.3284 4.42157 15 5.25 15Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Delivery Fees
      </button>
      <button
        type="button"
        onClick={() => onTabChange("service")}
        className={`flex h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-center font-['Inter'] text-base font-medium leading-6 transition-opacity duration-300 ease-out ${
          activeTab === "service"
            ? "bg-[#EA580C] text-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
            : "bg-[#F1F5F9] text-[#45556C] hover:opacity-90"
        }`}
      >
        % Service Charge
      </button>
    </div>
  );
}
