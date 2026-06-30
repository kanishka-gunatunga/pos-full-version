import type { ReactNode } from "react";

type VoucherStatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  iconWrapClassName: string;
};

export default function VoucherStatCard({
  label,
  value,
  icon,
  iconWrapClassName,
}: VoucherStatCardProps) {
  return (
    <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-['Inter'] text-[13px] font-medium leading-5 text-[#62748E]">{label}</p>
          <p className="mt-1 truncate font-['Inter'] text-[22px] font-bold leading-7 text-[#1D293D]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${iconWrapClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
