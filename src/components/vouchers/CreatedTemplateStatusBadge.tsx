import type { CreatedVoucherTemplateStatus } from "@/domains/vouchers/types";

const STYLES: Record<CreatedVoucherTemplateStatus, string> = {
  active: "bg-[#D0FAE5] text-[#007A55] border border-[#A4F4CF]",
  inactive: "bg-[#F1F5F9] text-[#45556C] border border-[#E2E8F0]",
  redeemed: "bg-[#FFEBD2] text-[#9A3412] border border-[#FED7AA]",
};

const LABELS: Record<CreatedVoucherTemplateStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  redeemed: "Redeemed",
};

export default function CreatedTemplateStatusBadge({
  status,
}: {
  status: CreatedVoucherTemplateStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 font-['Inter'] text-[12px] font-bold capitalize leading-4 ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
