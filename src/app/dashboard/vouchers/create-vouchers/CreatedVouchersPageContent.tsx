"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Printer } from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import CreatedTemplateStatusBadge from "@/components/vouchers/CreatedTemplateStatusBadge";
import CreateGiftVoucherModal from "@/components/vouchers/CreateGiftVoucherModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import type { GiftVoucherSavePayload } from "@/components/vouchers/CreateGiftVoucherModal";
import { useAuth } from "@/contexts/AuthContext";
import { ROUTES } from "@/lib/constants";
import type { CreatedVoucherTemplate } from "@/domains/vouchers/types";

export default function CreatedVouchersPageContent({
  initialTemplates,
}: {
  initialTemplates: CreatedVoucherTemplate[];
}) {
  const router = useRouter();
  const { isCashier } = useAuth();
  const [templates, setTemplates] = useState<CreatedVoucherTemplate[]>(initialTemplates);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherModalSession, setVoucherModalSession] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<CreatedVoucherTemplate | null>(null);
  const [statusTarget, setStatusTarget] = useState<CreatedVoucherTemplate | null>(null);

  useEffect(() => {
    setTemplates(initialTemplates);
  }, [initialTemplates]);

  const handleSaveVoucher = useCallback((data: GiftVoucherSavePayload) => {
    const validityLabel = data.validityMonths === 6 ? "6 months" : "12 months";
    if (data.templateId) {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== data.templateId) return t;
          const imageUrl =
            data.imageFile !== null ? URL.createObjectURL(data.imageFile) : t.imageUrl;
          return {
            ...t,
            valueFormatted: data.valueFormatted,
            validityLabel,
            imageUrl,
          };
        })
      );
    } else {
      const imageUrl =
        data.imageFile !== null
          ? URL.createObjectURL(data.imageFile)
          : "/product-placeholder.svg";
      setTemplates((prev) => [
        {
          id: crypto.randomUUID(),
          valueFormatted: data.valueFormatted,
          imageUrl,
          validityLabel,
          status: "active",
        },
        ...prev,
      ]);
    }
  }, []);

  const closeVoucherModal = useCallback(() => {
    setVoucherModalOpen(false);
    setEditingTemplate(null);
  }, []);

  const openVoucherModal = useCallback((template: CreatedVoucherTemplate | null) => {
    setEditingTemplate(template);
    setVoucherModalSession((s) => s + 1);
    setVoucherModalOpen(true);
  }, []);

  const nextStatusLabel =
    statusTarget?.status === "active"
      ? "inactive"
      : statusTarget?.status === "inactive"
        ? "active"
        : null;

  const handleConfirmStatusToggle = useCallback(() => {
    if (!statusTarget || !nextStatusLabel) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === statusTarget.id
          ? {
              ...t,
              status: nextStatusLabel,
            }
          : t
      )
    );
    setStatusTarget(null);
  }, [statusTarget, nextStatusLabel]);

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Link
                href={ROUTES.DASHBOARD_VOUCHERS}
                className="inline-flex h-10 w-[95.5px] shrink-0 items-center justify-center gap-1.5 self-start rounded-[14px] bg-[#F1F5F9] font-['Inter'] text-[16px] font-bold leading-6 tracking-normal text-[#314158] transition-colors duration-300 ease-out hover:bg-[#E2E8F0] active:bg-[#E2E8F0] sm:self-center"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-[#314158]" strokeWidth={1.5} aria-hidden />
                Back
              </Link>
              <div>
                <h1 className="font-['Inter'] text-[30px] font-bold leading-9 text-[#1D293D]">
                  Created Vouchers
                </h1>
                <p className="mt-1 font-['Inter'] text-[16px] font-normal leading-6 text-[#62748E]">
                  Manage gift vouchers
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[14px] bg-primary px-5 font-['Inter'] text-[14px] font-bold text-white shadow-primary transition-opacity hover:opacity-95"
              onClick={() => openVoucherModal(null)}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New Voucher
            </button>
          </div>

          <CreateGiftVoucherModal
            key={voucherModalSession}
            open={voucherModalOpen}
            editingTemplate={editingTemplate}
            onClose={closeVoucherModal}
            onSave={handleSaveVoucher}
          />
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
                ? "This voucher template will become inactive and cannot be used for new voucher issuance."
                : nextStatusLabel === "active"
                  ? "This voucher template will become active and can be used for new voucher issuance."
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

          <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-sm">
            <div className="scrollbar-subtle max-h-[560px] overflow-x-auto overflow-y-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="sticky top-0 z-10 border-b-2 border-[#E2E8F0] bg-[#F8FAFC]">
                  <tr className="h-11">
                    <th className="px-4 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Voucher value
                    </th>
                    <th className="px-4 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Image
                    </th>
                    <th className="px-4 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Validity
                    </th>
                    <th className="px-4 py-3 font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-['Inter'] text-[11px] font-bold uppercase leading-4 tracking-[0.5px] text-[#45556C] sm:text-[12px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {templates.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-[#F8FAFC]">
                      <td className="px-4 py-4 align-middle">
                        <span className="font-['Inter'] text-[14px] font-bold text-[#1D293D]">
                          {row.valueFormatted}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="relative h-12 w-20 overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                          {row.imageUrl.startsWith("blob:") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.imageUrl}
                              alt=""
                              className="h-full w-full object-contain p-1"
                            />
                          ) : (
                            <Image
                              src={row.imageUrl}
                              alt=""
                              fill
                              className="object-contain p-1"
                              sizes="80px"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <span className="font-['Inter'] text-[13px] leading-5 text-[#314158]">
                          {row.validityLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <CreatedTemplateStatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            className="rounded-full p-2 text-[#155DFC] transition-colors hover:bg-[#EFF6FF]"
                            aria-label="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full p-2 text-primary transition-colors hover:bg-primary-muted"
                            aria-label="Edit"
                            onClick={() => openVoucherModal(row)}
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
