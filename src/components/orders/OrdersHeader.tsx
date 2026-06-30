import { Search } from "lucide-react";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  onlyMyOrders: boolean;
  onOnlyMyOrdersChange: (value: boolean) => void;
};

export default function OrdersHeader({
  search,
  onSearchChange,
  onlyMyOrders,
  onOnlyMyOrdersChange,
}: Props) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="shrink-0 lg:min-w-[20rem] lg:max-w-xl lg:pr-2">
        <h1 className="font-['Inter'] text-[24px] font-bold leading-[32px] tracking-normal text-[#1D293D]">
          Orders
        </h1>
        <p className="mt-2 max-w-none font-['Inter'] text-sm font-normal leading-5 text-[#62748E] text-pretty">
          Manage and track all current restaurant orders.
        </p>
      </div>
      <div className="flex w-full min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:justify-end lg:gap-6">
        <div className="relative w-full min-w-0 sm:min-w-[360px] sm:max-w-[520px] lg:flex-1 lg:max-w-[520px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by Order ID, Customer, or Phone..."
            className="w-full rounded-[16px] border border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 font-['Inter'] text-sm leading-[100%] text-[#0A0A0A] placeholder:font-medium placeholder:text-[#45556C80] focus:border-[#EA580C] focus:outline-none focus:ring-1 "
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-[12px] border border-transparent px-1 py-1 font-['Inter'] text-xs font-medium text-[#62748E] hover:bg-[#F8FAFC] sm:px-2">
          <input
            type="checkbox"
            checked={onlyMyOrders}
            onChange={(e) => onOnlyMyOrdersChange(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer rounded border-[#CAD5E2] accent-primary focus:ring-2 focus:ring-primary/30 focus:ring-offset-0"
            aria-label="Show only orders I placed"
          />
          <span className="select-none whitespace-nowrap">Only my orders</span>
        </label>
      </div>
    </div>
  );
}
