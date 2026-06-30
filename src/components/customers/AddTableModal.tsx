"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Table, TableStatus } from "@/types/table";

interface AddTableModalProps {
  onClose: () => void;
  onSave: (data: { table_name: string; status: TableStatus }) => void | Promise<void>;
  initialData?: Table | null;
}

export default function AddTableModal({ onClose, onSave, initialData }: AddTableModalProps) {
  const [formData, setFormData] = useState({
    table_name: initialData?.table_name || "",
    status: initialData?.status || "available" as TableStatus,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.table_name.trim()) {
      setError("Please enter table name.");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.resolve(onSave(formData));
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save table.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[450px] overflow-hidden rounded-[32px] bg-white p-8 shadow-2xl transition-all"
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
          {initialData ? "Edit Table" : "Add New Table"}
        </h2>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">TABLE NAME / NUMBER</label>
            <input
              type="text"
              placeholder="e.g. Table 01, Window Table"
              value={formData.table_name}
              onChange={(e) => setFormData({ ...formData, table_name: e.target.value })}
              required
              className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-bold uppercase text-[#90A1B9]">INITIAL STATUS</label>
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TableStatus })}
                className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 appearance-none cursor-pointer"
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="reserved">Reserved</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[#90A1B9]">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4 pt-4">
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
              {isSubmitting ? "Saving..." : initialData ? "Update Table" : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
