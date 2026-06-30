"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Check,
  DollarSign,
  CreditCard,
  User,
  Building2,
  ChevronDown,
  Calendar,
} from "lucide-react";

function OrderPlacedIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M4.5 1.5L2.25 4.5V15C2.25 15.3978 2.40804 15.7794 2.68934 16.0607C2.97064 16.342 3.35218 16.5 3.75 16.5H14.25C14.6478 16.5 15.0294 16.342 15.3107 16.0607C15.592 15.7794 15.75 15.3978 15.75 15V4.5L13.5 1.5H4.5Z" stroke="#009966" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.25 4.5H15.75" stroke="#009966" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7.5C12 8.29565 11.6839 9.05871 11.1213 9.62132C10.5587 10.1839 9.79565 10.5 9 10.5C8.20435 10.5 7.44129 10.1839 6.87868 9.62132C6.31607 9.05871 6 8.29565 6 7.5" stroke="#009966" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OrderRefundedIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M15.3125 9C15.3125 7.25952 14.6211 5.59032 13.3904 4.35961C12.1597 3.1289 10.4905 2.4375 8.75 2.4375C6.91538 2.4444 5.15446 3.16027 3.83542 4.43542L2.1875 6.08333" stroke="#F54900" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.1875 2.4375V6.08333H5.83333" stroke="#F54900" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.1875 9C2.1875 10.7405 2.8789 12.4097 4.10961 13.6404C5.34032 14.8711 7.00952 15.5625 8.75 15.5625C10.5846 15.5556 12.3455 14.8397 13.6646 13.5646L15.3125 11.9167" stroke="#F54900" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.6665 11.917H15.3123V15.5628" stroke="#F54900" strokeWidth="1.45833" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CashOutIcon({ className }: { className?: string }) {
  return (
    <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M7.13281 3.05566V14.9437" stroke="#F54900" strokeWidth="1.1888" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.1048 4.83887H5.64681C5.09505 4.83887 4.56589 5.05805 4.17574 5.4482C3.78559 5.83835 3.56641 6.36751 3.56641 6.91927C3.56641 7.47103 3.78559 8.00019 4.17574 8.39034C4.56589 8.78049 5.09505 8.99967 5.64681 8.99967H8.61882C9.17057 8.99967 9.69973 9.21886 10.0899 9.60901C10.48 9.99916 10.6992 10.5283 10.6992 11.0801C10.6992 11.6318 10.48 12.161 10.0899 12.5511C9.69973 12.9413 9.17057 13.1605 8.61882 13.1605H3.56641" stroke="#F54900" strokeWidth="1.1888" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PaymentReceivedIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M13.0859 4.41992H2.61719C1.89447 4.41992 1.30859 5.0058 1.30859 5.72852V12.2715C1.30859 12.9942 1.89447 13.5801 2.61719 13.5801H13.0859C13.8087 13.5801 14.3945 12.9942 14.3945 12.2715V5.72852C14.3945 5.0058 13.8087 4.41992 13.0859 4.41992Z" stroke="#155DFC" strokeWidth="1.30859" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M1.30859 7.69141H14.3945" stroke="#155DFC" strokeWidth="1.30859" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useGetAllBranches } from "@/hooks/useBranch";
import { getActivityLogs } from "@/services/activityLogService";

export type ActivityType =
  | "order_placed"
  | "order_refunded"
  | "cash_out"
  | "payment_received"
  | "cash_in"
  | "discount_applied";

export type UserRole = "Cashier" | "Manager" | "Admin";

export interface ActivityLogEntry {
  id: string;
  dateTime: string;
  activityType: ActivityType;
  description: string;
  userName: string;
  role: UserRole;
  branchName: string;
  orderId: string | null;
  amount: number;
  currency: string;
  hasManagerApproval: boolean;
}

const ACTIVITY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "order_placed", label: "Order Placed" },
  { value: "order_refunded", label: "Order Refunded" },
  { value: "cash_out", label: "Cash Out" },
  { value: "cash_in", label: "Cash In" },
  { value: "payment_received", label: "Payment Received" },
  { value: "discount_applied", label: "Discount Applied" },
];

const USER_ROLES = [
  { value: "all", label: "All Roles" },
  { value: "Cashier", label: "Cashier" },
  { value: "Manager", label: "Manager" },
  { value: "Admin", label: "Admin" },
];

function getActivityTypeDisplay(type: ActivityType) {
  switch (type) {
    case "order_placed":
      return { label: "Order Placed", icon: OrderPlacedIcon };
    case "order_refunded":
      return { label: "Order Refunded", icon: OrderRefundedIcon };
    case "cash_out":
      return { label: "Cash Out", icon: CashOutIcon };
    case "cash_in":
      return { label: "Cash In", icon: DollarSign, color: "text-[#00BC7D]" };
    case "payment_received":
      return { label: "Payment Received", icon: PaymentReceivedIcon };
    case "discount_applied":
      return { label: "Discount Applied", icon: CreditCard, color: "text-[#2B7FFF]" };
    default:
      return { label: type, icon: Check, color: "text-[#90A1B9]" };
  }
}

function getRoleBadgeClass(role: UserRole) {
  switch (role) {
    case "Cashier":
      return "bg-[#D0FAE5] border border-[#A4F4CF] text-[#007A55]";
    case "Manager":
      return "bg-[#DBEAFE] border border-[#BEDBFF] text-[#1447E6]";
    case "Admin":
      return "bg-[#45556C]/20 border border-[#45556C]/30 text-[#45556C]";
    default:
      return "bg-[#F1F5F9] border border-[#E2E8F0] text-[#45556C]";
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/** Calendar date in the user's local timezone — matches `<input type="date">` (avoid `toISOString()` UTC drift). */
function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive: today and the previous 6 days (7 calendar days). */
function getDefaultActivityDateRange(): { from: string; to: string } {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { from: toLocalYmd(start), to: toLocalYmd(end) };
}

export default function ActivityContent() {
  const { data: branches = [], isLoading: branchesLoading } = useGetAllBranches("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [userRole, setUserRole] = useState("all");
  const [branch, setBranch] = useState("all");
  const [fromDate, setFromDate] = useState(() => getDefaultActivityDateRange().from);
  const [toDate, setToDate] = useState(() => getDefaultActivityDateRange().to);
  const [managerApprovalOnly, setManagerApprovalOnly] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const branchSelectValue =
    branch === "all" || branches.some((b) => String(b.id) === branch)
      ? branch
      : "all";

  const fetchActivities = useCallback(async () => {
    const requestSeq = ++requestSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const activityTypeLabel =
        activityType === "all"
          ? undefined
          : ACTIVITY_TYPES.find((t) => t.value === activityType)?.label;
      const branchId =
        branchSelectValue === "all"
          ? undefined
          : Number.parseInt(branchSelectValue, 10);
      const branchIdParam =
        branchId !== undefined && !Number.isNaN(branchId) ? branchId : undefined;

      const queryFrom = fromDate <= toDate ? fromDate : toDate;
      const queryTo = fromDate <= toDate ? toDate : fromDate;

      const res = await getActivityLogs({
        search: debouncedSearch.trim() || undefined,
        activityType: activityTypeLabel,
        userRole: userRole === "all" ? undefined : userRole,
        branchId: branchIdParam,
        fromDate: queryFrom,
        toDate: queryTo,
        withManagerApproval: managerApprovalOnly ? true : undefined,
        limit: 200,
      });

      // Ignore stale responses (fast filter changes / slow network)
      if (requestSeq !== requestSeqRef.current) return;

      setActivities(res.items);
    } catch (err) {
      if (requestSeq !== requestSeqRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load activity log");
      setActivities([]);
    } finally {
      if (requestSeq !== requestSeqRef.current) return;
      setLoading(false);
    }
  }, [
    debouncedSearch,
    activityType,
    userRole,
    branchSelectValue,
    fromDate,
    toDate,
    managerApprovalOnly,
  ]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-['Inter'] text-[30px] font-bold leading-9 text-[#1D293D]">
              Activity Log
            </h1>
            <p className="mt-1 font-['Inter'] text-[16px] font-normal leading-6 text-[#62748E]">
              Monitor all system activities
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                <Filter className="h-4 w-4 text-[#155DFC]" />
              </div>
              <span className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
                Filters
              </span>
            </div>
            <div className="rounded-[16px] py-4">
              {/* Row 1: Search, Activity Type, User Role, Branch */}
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-11 w-full rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    Activity Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                    className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {ACTIVITY_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    User Role
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  >
                    {USER_ROLES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    Branch
                  </label>
                  <select
                    value={branchSelectValue}
                    onChange={(e) => setBranch(e.target.value)}
                    disabled={branchesLoading}
                    className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="all">
                      {branchesLoading ? "Loading branches…" : "All Branches"}
                    </option>
                    {branches.map((b) => (
                      <option key={b.id} value={String(b.id)}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* Row 2: From Date, To Date, Manager Approval */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      onClick={(e) => {
                        // Ensure clicking anywhere on the input opens the date picker
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      }}
                      className="h-11 w-full rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      onClick={(e) => {
                        (e.currentTarget as HTMLInputElement).showPicker?.();
                      }}
                      className="h-11 w-full rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    Manager Approval
                  </label>
                  <label className="flex h-11 cursor-pointer items-center gap-3 rounded-[14px] border-2 border-[#E2E8F0] bg-white pl-4">
                    <input
                      type="checkbox"
                      checked={managerApprovalOnly}
                      onChange={(e) => setManagerApprovalOnly(e.target.checked)}
                      className="h-4 w-4 rounded border-[#E2E8F0] text-primary focus:ring-primary/20"
                    />
                    <span className="font-['Inter'] text-[14px] font-medium text-[#45556C]">
                      With Manager Approval Only
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-sm">
            <div className="scrollbar-subtle max-h-[500px] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[1000px] table-fixed text-left 2xl:min-w-[1140px]">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[12%]" />
                  <col className="w-[17%]" />
                  <col className="w-[12%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[6%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <thead className="sticky top-0 z-20 border-b-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <tr className="h-10 sm:h-11 xl:h-12">
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2.5 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-3 sm:py-3 sm:text-[12px] xl:px-4 xl:py-3.5 xl:text-[13px]">
                      Date & Time
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Activity Type
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Description
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      User
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Role
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Branch
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Order ID
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Amount
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-2.5 sm:py-3 sm:text-[12px] xl:px-3 xl:py-3.5 xl:text-[13px]">
                      Manager
                    </th>
                    <th className="sticky top-0 z-20 bg-[#F8FAFC] px-2.5 py-2.5 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:px-3 sm:py-3 sm:text-[12px] xl:px-4 xl:py-3.5 xl:text-[13px]">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {loading && (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center font-['Inter'] text-[14px] text-[#62748E]">
                        Loading activity log...
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    activities.map((activity) => {
                    const typeDisplay = getActivityTypeDisplay(activity.activityType);
                    const TypeIcon = typeDisplay.icon;
                    return (
                      <tr key={activity.id} className="group transition-colors hover:bg-[#F8FAFC]">
                        <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 xl:px-4 xl:py-3.5">
                          <div className="flex min-w-0 flex-col">
                            <span className="font-['Inter'] text-[13px] font-bold leading-5 text-[#1D293D]">
                              {formatDate(activity.dateTime)}
                            </span>
                            <span className="font-['Inter'] text-[12px] font-normal leading-4 text-[#62748E]">
                              {formatTime(activity.dateTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <div className={`flex min-w-0 items-center gap-1.5 ${typeDisplay.color ?? ""}`}>
                            <TypeIcon className="h-4 w-4 shrink-0" />
                            <span className="truncate font-['Inter'] text-[13px] font-medium leading-5 text-[#314158]">
                              {typeDisplay.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <p className="line-clamp-2 font-['Inter'] text-[13px] font-normal leading-5 text-[#314158]">
                            {activity.description}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <User className="h-4 w-4 shrink-0 text-[#90A1B9]" />
                            <span className="truncate font-['Inter'] text-[13px] font-medium leading-5 text-[#314158]">
                              {activity.userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <span
                            className={`inline-flex rounded-[10px] border px-2 py-0.5 font-['Inter'] text-[12px] font-bold leading-4 ${getRoleBadgeClass(activity.role)}`}
                          >
                            {activity.role}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Building2 className="h-4 w-4 shrink-0 text-[#90A1B9]" />
                            <span className="truncate font-['Inter'] text-[13px] font-normal leading-5 text-[#314158]">
                              {activity.branchName}
                            </span>
                          </div>
                        </td>
                        <td className="min-w-0 px-2 py-2.5 sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          {activity.orderId ? (
                            <div className="scrollbar-subtle max-w-full overflow-x-auto">
                              <Link
                                href={`${ROUTES.DASHBOARD_ORDERS}?order=${activity.orderId}`}
                                className="block whitespace-nowrap font-['Inter'] text-[13px] font-medium leading-5 text-[#155DFC] hover:underline"
                              >
                                {activity.orderId}
                              </Link>
                            </div>
                          ) : (
                            <span className="text-[#90A1B9]">—</span>
                          )}
                        </td>
                        <td className="min-w-0 px-2 py-2.5 text-right sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          <div className="scrollbar-subtle ml-auto max-w-full overflow-x-auto">
                            <span className="whitespace-nowrap font-['Inter'] text-[13px] font-bold leading-5 text-[#1D293D]">
                              {activity.currency}
                              {activity.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-center sm:px-2.5 sm:py-3 xl:px-3 xl:py-3.5">
                          {activity.hasManagerApproval ? (
                            <span className="inline-flex items-center gap-1 rounded-[10px] border border-[#FEE685] bg-[#FEF3C6] px-2 py-0.5">
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                                <path d="M11.6668 7.58294C11.6668 10.4996 9.62516 11.9579 7.1985 12.8038C7.07142 12.8468 6.93339 12.8448 6.80766 12.7979C4.37516 11.9579 2.3335 10.4996 2.3335 7.58294V3.49961C2.3335 3.3449 2.39495 3.19653 2.50435 3.08713C2.61375 2.97774 2.76212 2.91628 2.91683 2.91628C4.0835 2.91628 5.54183 2.21628 6.55683 1.32961C6.68041 1.22403 6.83762 1.16602 7.00016 1.16602C7.16271 1.16602 7.31991 1.22403 7.4435 1.32961C8.46433 2.22211 9.91683 2.91628 11.0835 2.91628C11.2382 2.91628 11.3866 2.97774 11.496 3.08713C11.6054 3.19653 11.6668 3.3449 11.6668 3.49961V7.58294Z" stroke="#BB4D00" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5.25 6.99967L6.41667 8.16634L8.75 5.83301" stroke="#BB4D00" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="font-['Inter'] text-[12px] font-bold leading-4 text-[#BB4D00]">
                                Yes
                              </span>
                            </span>
                          ) : (
                            <span className="text-[#90A1B9]">—</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2.5 sm:px-3 sm:py-3 xl:px-4 xl:py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRow(expandedRow === activity.id ? null : activity.id)
                            }
                            className="rounded-lg p-1.5 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
                            aria-label="Toggle details"
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                expandedRow === activity.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && !error && activities.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center font-['Inter'] text-[14px] text-[#90A1B9]">
                        No activities match your filters.
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={10} className="px-4 py-16 text-center font-['Inter'] text-[14px] text-red-600">
                        {error}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#E2E8F0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-['Inter'] text-[13px] text-[#62748E]">
                Showing <span className="font-bold text-[#1D293D]">{activities.length}</span> items
              </div>
              <div className="font-['Inter'] text-[13px] text-[#62748E]">
                Date range:{" "}
                <span className="font-bold text-[#1D293D]">{fromDate}</span> –{" "}
                <span className="font-bold text-[#1D293D]">{toDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
