"use client";

import { useState, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CreateSupplierBody } from "@/types/supply";

export interface SupplierFormData {
  name: string;
  branch: string;
  branchId?: number;
  contactPerson: string;
  email?: string;
  country?: string;
  phone: string;
  address?: string;
  taxId?: string;
  paymentTerms?: string;
  status?: "active" | "inactive";
}

interface BranchOption {
  id: number;
  name: string;
}

interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSupplier?: SupplierFormData | null;
  branches: BranchOption[];
  onSave: (body: CreateSupplierBody) => void | Promise<void>;
  isSaving?: boolean;
}

const SRI_LANKA_MOBILE_REGEX = /^[0]{1}[7]{1}[01245678]{1}[0-9]{7}$/;

export default function AddSupplierModal({
  isOpen,
  onClose,
  initialSupplier,
  branches,
  onSave,
  isSaving = false,
}: AddSupplierModalProps) {
  const [status, setStatus] = useState<"active" | "inactive">(
    () => initialSupplier?.status ?? "active"
  );
  const [contactPersonValue, setContactPersonValue] = useState(
    () => initialSupplier?.contactPerson ?? ""
  );
  const [contactPersonError, setContactPersonError] = useState<string | null>(null);
  const [phoneValue, setPhoneValue] = useState(() => initialSupplier?.phone ?? "");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = !!initialSupplier;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[640px] overflow-hidden rounded-[32px] bg-white px-8 pb-8 pt-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] transition-colors hover:bg-[#F8FAFC]"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
            {isEditing ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#90A1B9]">
            Enter supplier details to add to the system
          </p>
        </div>

        <form
          ref={formRef}
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = formRef.current;
            if (!form) return;
            const name = (form.elements.namedItem("supplierName") as HTMLInputElement)?.value?.trim();
            const branchIdRaw = (form.elements.namedItem("branchId") as HTMLSelectElement)?.value;
            const contactPerson = contactPersonValue.trim();
            const email = (form.elements.namedItem("email") as HTMLInputElement)?.value?.trim();
            const country = (form.elements.namedItem("country") as HTMLSelectElement)?.value?.trim();
            const phone = phoneValue.trim();
            const address = (form.elements.namedItem("address") as HTMLInputElement)?.value?.trim();
            const taxId = (form.elements.namedItem("taxId") as HTMLInputElement)?.value?.trim();
            const paymentTerms = (form.elements.namedItem("paymentTerms") as HTMLInputElement)?.value?.trim();

            if (!name || !branchIdRaw || !contactPerson || !phone) {
              toast.error("Please fill in all required fields.");
              return;
            }

            if (!SRI_LANKA_MOBILE_REGEX.test(contactPerson)) {
              toast.error("Please enter a valid Sri Lankan mobile number for Contact Person (e.g. 0771234567).");
              setContactPersonError(
                "Enter a valid Sri Lankan mobile number for Contact Person (e.g. 0771234567)."
              );
              return;
            }

            if (!SRI_LANKA_MOBILE_REGEX.test(phone)) {
              toast.error("Please enter a valid Sri Lankan mobile number (e.g. 0771234567).");
              setPhoneError("Enter a valid Sri Lankan mobile number (e.g. 0771234567).");
              return;
            }
            const branchId = Number(branchIdRaw);
            if (!Number.isInteger(branchId)) return;
            const body: CreateSupplierBody = {
              name,
              branchId,
              contactPerson,
              email: email || undefined,
              phone,
              status,
              country: country || undefined,
              address: address || undefined,
              taxId: taxId || undefined,
              paymentTerms: paymentTerms || undefined,
            };
            await onSave(body);
            onClose();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Supplier name */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                SUPPLIER NAME<span className="text-[#EC003F]"> *</span>
              </label>
              <input
                name="supplierName"
                type="text"
                placeholder="Enter supplier name"
                defaultValue={initialSupplier?.name}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                required
              />
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                BRANCH<span className="text-[#EC003F]"> *</span>
              </label>
              <select
                name="branchId"
                className="mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
                defaultValue={initialSupplier?.branchId ?? branches[0]?.id ?? ""}
                required
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact person */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                CONTACT PERSON<span className="text-[#EC003F]"> *</span>
              </label>
              <input
                name="contactPerson"
                type="tel"
                placeholder="Enter contact person's mobile"
                value={contactPersonValue}
                onChange={(e) => {
                  const next = e.target.value;
                  setContactPersonValue(next);
                  const trimmed = next.trim();
                  if (!trimmed) {
                    setContactPersonError("Contact person mobile is required.");
                    return;
                  }
                  if (!SRI_LANKA_MOBILE_REGEX.test(trimmed)) {
                    setContactPersonError(
                      "Enter a valid Sri Lankan mobile number for Contact Person (e.g. 0771234567)."
                    );
                  } else {
                    setContactPersonError(null);
                  }
                }}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                required
              />
              {contactPersonError && (
                <p className="mt-1 text-xs text-[#EC003F]">
                  {contactPersonError}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                EMAIL
              </label>
              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                defaultValue={initialSupplier?.email}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                COUNTRY
              </label>
              <select
                name="country"
                className="mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
                defaultValue={initialSupplier?.country ?? "Sri Lanka"}
              >
                <option value="Sri Lanka">Sri Lanka</option>
              </select>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                PHONE<span className="text-[#EC003F]"> *</span>
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="0771234567"
                value={phoneValue}
                onChange={(e) => {
                  const next = e.target.value;
                  setPhoneValue(next);
                  const trimmed = next.trim();
                  if (!trimmed) {
                    setPhoneError("Phone is required.");
                    return;
                  }
                  if (!SRI_LANKA_MOBILE_REGEX.test(trimmed)) {
                    setPhoneError("Enter a valid Sri Lankan mobile number (e.g. 0771234567).");
                  } else {
                    setPhoneError(null);
                  }
                }}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                required
              />
              {phoneError && (
                <p className="mt-1 text-xs text-[#EC003F]">
                  {phoneError}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                ADDRESS
              </label>
              <input
                name="address"
                type="text"
                placeholder="Enter full address"
                defaultValue={initialSupplier?.address}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            {/* Tax ID */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                TAX ID
              </label>
              <input
                name="taxId"
                type="text"
                placeholder="Enter tax ID"
                defaultValue={initialSupplier?.taxId}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            {/* Payment terms */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                PAYMENT TERMS
              </label>
              <input
                name="paymentTerms"
                type="text"
                placeholder="e.g., Net 30"
                defaultValue={initialSupplier?.paymentTerms}
                className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
                className="mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex w-full gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] border border-[#E2E8F0] bg-white p-2.5 font-['Inter'] text-base font-bold leading-6 text-[#45556C] hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[16px] bg-[#EA580C] p-2.5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C33,0px_20px_25px_-5px_#EA580C33] hover:bg-[#DC4C04] disabled:opacity-70"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? "Save changes" : "Add supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

