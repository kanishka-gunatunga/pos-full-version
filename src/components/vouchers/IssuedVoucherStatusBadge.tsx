import type { IssuedVoucherStatus } from "@/domains/vouchers/types";

const STYLES: Record<IssuedVoucherStatus, string> = {
  active: "bg-[#D0FAE5] text-[#007A55] border border-[#A4F4CF]",
  inactive: "bg-[#FFE2E2] text-[#C10007] border border-[#FFC9C9]",
  redeemed: "bg-[#F1F5F9] text-[#45556C] border border-[#E2E8F0]",
};

const LABELS: Record<IssuedVoucherStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  redeemed: "Redeemed",
};

export default function IssuedVoucherStatusBadge({ status }: { status: IssuedVoucherStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 font-['Inter'] text-[12px] font-bold capitalize leading-4 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
