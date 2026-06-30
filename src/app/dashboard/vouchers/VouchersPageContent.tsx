"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  Gift,
  Package,
  Pencil,
  Printer,
  Search,
} from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import VoucherStatCard from "@/components/vouchers/VoucherStatCard";
import IssuedVoucherStatusBadge from "@/components/vouchers/IssuedVoucherStatusBadge";
import EditIssuedVoucherValidityModal from "@/components/vouchers/EditIssuedVoucherValidityModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/constants";
import type { IssuedVoucherRow, VoucherPageSummary } from "@/domains/vouchers/types";

type StatusFilter = "all" | IssuedVoucherRow["status"];

function formatCreatedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function formatExpiryDisplay(ymd: string) {
  return new Date(`${ymd}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getValidityMonths(label: string): 6 | 12 {
  return label.toLowerCase().includes("12") ? 12 : 6;
}

function addMonthsToYmd(ymd: string, months: number): string {
  const [y, m, d] = ymd.split("-").map((n) => Number.parseInt(n, 10));
  const dt = new Date(y, m - 1, d);
  dt.setMonth(dt.getMonth() + months);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function VouchersPageContent({
  initialSummary,
  initialIssuedVouchers,
}: {
  initialSummary: VoucherPageSummary;
  initialIssuedVouchers: IssuedVoucherRow[];
}) {
  const router = useRouter();
  const { isCashier } = useAuth();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [issuedVouchers, setIssuedVouchers] = useState<IssuedVoucherRow[]>(initialIssuedVouchers);
  const [editingVoucher, setEditingVoucher] = useState<IssuedVoucherRow | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSession, setEditSession] = useState(0);
  const [statusTarget, setStatusTarget] = useState<IssuedVoucherRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  useEffect(() => {
    setIssuedVouchers(initialIssuedVouchers);
  }, [initialIssuedVouchers]);

  const openEditModal = (row: IssuedVoucherRow) => {
    setEditingVoucher(row);
    setEditSession((s) => s + 1);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingVoucher(null);
  };

  const handleSaveValidity = (voucherId: string, nextMonths: 6 | 12) => {
    setIssuedVouchers((prev) =>
      prev.map((row) => {
        if (row.id !== voucherId) return row;
        const currentMonths = getValidityMonths(row.validityLabel);
        if (currentMonths === 12 && nextMonths === 6) return row;
        if (currentMonths === nextMonths) return row;
        const expiryDate =
          currentMonths === 6 && nextMonths === 12 ? addMonthsToYmd(row.expiryDate, 6) : row.expiryDate;
        return {
          ...row,
          validityLabel: nextMonths === 6 ? "6 months" : "12 months",
          expiryDate,
        };
      })
    );
  };

  const nextStatusLabel =
    statusTarget?.status === "active"
      ? "inactive"
      : statusTarget?.status === "inactive"
        ? "active"
        : null;

  const handleConfirmStatusToggle = () => {
    if (!statusTarget || !nextStatusLabel) return;
    setIssuedVouchers((prev) =>
      prev.map((row) =>
        row.id === statusTarget.id
          ? {
              ...row,
              status: nextStatusLabel,
            }
          : row
      )
    );
    setStatusTarget(null);
  };

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return issuedVouchers.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      const hay = [
        row.code,
        row.barcode,
        row.issuedToName ?? "",
        row.issuedToPhone ?? "",
        row.branchName,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [issuedVouchers, debouncedSearch, statusFilter]);

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="font-['Inter'] text-[30px] font-bold leading-9 text-[#1D293D]">
                Gift Vouchers
              </h1>
              <p className="mt-1 font-['Inter'] text-[16px] font-normal leading-6 text-[#62748E]">
                Manage gift vouchers and promotional codes
              </p>
            </div>
            <Link
              href={ROUTES.DASHBOARD_VOUCHERS_CREATED}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[14px] bg-primary px-5 font-['Inter'] text-[14px] font-bold text-white shadow-primary transition-opacity hover:opacity-95"
            >
              Created Vouchers
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <VoucherStatCard
              label="Total Active"
              value={String(initialSummary.totalActiveCount)}
              icon={<Gift className="h-5 w-5 text-[#007A55]" aria-hidden />}
              iconWrapClassName="bg-[#D0FAE5]"
            />
            <VoucherStatCard
              label="Active Value"
              value={initialSummary.activeValueFormatted}
              icon={<DollarSign className="h-5 w-5 text-[#155DFC]" aria-hidden />}
              iconWrapClassName="bg-[#DBEAFE]"
            />
            <VoucherStatCard
              label="Redeemed"
              value={String(initialSummary.redeemedCount)}
              icon={<Package className="h-5 w-5 text-[#7C3AED]" aria-hidden />}
              iconWrapClassName="bg-[#EDE9FE]"
            />
            <VoucherStatCard
              label="Redeemed Value"
              value={initialSummary.redeemedValueFormatted}
              icon={<DollarSign className="h-5 w-5 text-[#F54900]" aria-hidden />}
              iconWrapClassName="bg-[#FFEDD4]"
            />
          </div>

          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                <input
                  type="search"
                  placeholder="Search by code, barcode, customer name or mobile..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-10 pr-4 text-[14px] text-[#1D293D] placeholder:text-[#90A1B9] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div className="flex shrink-0 items-center gap-2 lg:justify-end">
                <span className="font-['Inter'] text-[13px] font-medium text-[#62748E]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="h-11 min-w-[140px] appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white py-2.5 pl-4 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="redeemed">Redeemed</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-sm">
            <ConfirmModal
              isOpen={statusTarget !== null}
              onClose={() => setStatusTarget(null)}
              onConfirm={handleConfirmStatusToggle}
              title={
                nextStatusLabel === "inactive"
                  ? "Deactivate Voucher?"
                  : nextStatusLabel === "active"
                    ? "Activate Voucher?"
                    : "Update Voucher Status?"
              }
              message={
                nextStatusLabel === "inactive"
                  ? "This issued voucher will become inactive and cannot be redeemed until reactivated."
                  : nextStatusLabel === "active"
                    ? "This issued voucher will become active and redeemable again."
                    : "Do you want to update this voucher status?"
              }
              confirmLabel={
                nextStatusLabel === "inactive"
                  ? "Yes, Deactivate"
                  : nextStatusLabel === "active"
                    ? "Yes, Activate"
                    : "Confirm"
              }
              cancelLabel="Cancel"
            />
            <EditIssuedVoucherValidityModal
              key={editSession}
              isOpen={editModalOpen}
              voucher={editingVoucher}
              onClose={closeEditModal}
              onSave={handleSaveValidity}
            />
            <div className="scrollbar-subtle max-h-[560px] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[1100px] table-fixed text-left">
                <thead className="sticky top-0 z-10 border-b-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <tr className="h-11">
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Voucher code
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Barcode
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Value
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Validity
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Expiry date
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Issued to
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Branch
                    </th>
                    <th className="px-3 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-3 py-3 align-top">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-['Inter'] text-[13px] font-bold leading-5 text-[#1D293D]">
                            {row.code}
                          </span>
                          <span className="font-['Inter'] text-[12px] font-normal leading-4 text-[#62748E]">
                            Created {formatCreatedDate(row.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="font-['Inter'] text-[13px] font-medium leading-5 text-[#314158]">
                          {row.barcode}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="font-['Inter'] text-[13px] font-bold leading-5 text-[#1D293D]">
                          {row.valueFormatted}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="font-['Inter'] text-[13px] leading-5 text-[#314158]">
                          {row.validityLabel}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-[#90A1B9]" />
                          <span className="font-['Inter'] text-[13px] leading-5 text-[#314158]">
                            {formatExpiryDisplay(row.expiryDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {row.issuedToName ? (
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-['Inter'] text-[13px] font-medium leading-5 text-[#314158]">
                              {row.issuedToName}
                            </span>
                            {row.issuedToPhone ? (
                              <span className="font-['Inter'] text-[12px] leading-4 text-[#62748E]">
                                {row.issuedToPhone}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-[#90A1B9]">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span className="font-['Inter'] text-[13px] leading-5 text-[#314158]">
                          {row.branchName}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <IssuedVoucherStatusBadge status={row.status} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-full p-2 text-[#155DFC] transition-colors hover:bg-[#EFF6FF]"
                            aria-label="Print voucher"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full p-2 text-primary transition-colors hover:bg-primary-muted"
                            aria-label="Edit voucher"
                            onClick={() => openEditModal(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                              row.status === "redeemed"
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-[#F8FAFC]"
                            }`}
                            aria-label={
                              row.status === "active"
                                ? "Set voucher inactive"
                                : row.status === "inactive"
                                  ? "Set voucher active"
                                  : "Voucher redeemed status locked"
                            }
                            disabled={row.status === "redeemed"}
                            onClick={() => {
                              if (row.status === "redeemed") return;
                              setStatusTarget(row);
                            }}
                          >
                            <span
                              className={`relative inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                                row.status === "active"
                                  ? "border-[#00BC7D]"
                                  : row.status === "inactive"
                                    ? "border-[#E7000B]"
                                    : "border-[#CBD5E1]"
                              }`}
                            >
                              {row.status === "active" ? (
                                <span className="h-2 w-2 rounded-full bg-[#00BC7D]" />
                              ) : row.status === "inactive" ? (
                                <span className="h-2 w-2 rounded-full bg-[#E7000B]" />
                              ) : null}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-16 text-center font-['Inter'] text-[14px] text-[#90A1B9]"
                      >
                        No vouchers match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#E2E8F0] bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="font-['Inter'] text-[13px] text-[#62748E]">
                Showing <span className="font-bold text-[#1D293D]">{filteredRows.length}</span> items
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
