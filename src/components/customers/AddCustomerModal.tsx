"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Customer, CreateCustomerData } from "@/types/customer";

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: CreateCustomerData) => void | Promise<void>;
  initialData?: Customer | null;
}

function getErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const res = (err as { response?: { data?: { message?: string }; status?: number } }).response;
    if (res?.data?.message) return res.data.message;
    if (res?.status === 500) return "Server error. Please try again.";
    if (res?.status === 401) return "Unauthorized. Please log in again.";
    if (res?.status === 404) return "Endpoint not found. Check backend route.";
  }
  return err instanceof Error ? err.message : "Failed to save customer.";
}

export default function AddCustomerModal({ onClose, onSave, initialData }: AddCustomerModalProps) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: initialData?.name || "",
    mobile: initialData?.mobile || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    category: initialData?.category || "normal",
    promotions_enabled: initialData?.promotions_enabled ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phone = formData.mobile;
    if (!phone.trim()) {
      setError("Please enter mobile number.");
      return;
    }

    if (!/^0{1}7{1}[01245678]{1}[0-9]{7}$/.test(phone.replace(/[-\s]/g, ""))) {
      setError("Invalid mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[500px] overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] hover:bg-[#F8FAFC] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="mb-8 text-[20px] font-bold text-[#1D293D]">
          {initialData ? "Edit Customer" : "Create New Customer"}
        </h2>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">FULL NAME</label>
            <input
              type="text"
              name="name"
              placeholder="Enter user name"
              value={formData.name}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">MOBILE NUMBER</label>
            <input
              type="text"
              name="mobile"
              placeholder="07XXXXXXXX"
              value={formData.mobile}
              onChange={handleChange}
              required
              className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">EMAIL ADDRESS</label>
            <input
              type="email"
              name="email"
              placeholder="name@bistro.com"
              value={formData.email}
              onChange={handleChange}
              className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">ADDRESS</label>
            <input
              type="text"
              name="address"
              placeholder="Enter customer address"
              value={formData.address}
              onChange={handleChange}
              className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">CATEGORY</label>
            <div className="relative">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="staff">Staff</option>
                <option value="management">Management</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#90A1B9]">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl cursor-pointer border border-[#E2E8F0] text-[14px] font-bold text-[#62748E] transition-all hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-xl cursor-pointer bg-[#EA580C] text-[14px] font-bold text-white shadow-lg shadow-[#EA580C]/20 transition-all hover:bg-[#DC4C04] hover:shadow-xl active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
