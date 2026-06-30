"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { UserRole, User } from "@/types/user";
import type { UserFormPayload } from "./types";
import { useGetAllBranches } from "@/hooks/useBranch";
import { useGetUserPasscode } from "@/hooks/useUser";

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: UserFormPayload) => void;
  initialData?: User | null;
}

export default function AddUserModal({ onClose, onAdd, initialData }: AddUserModalProps) {
  const { data: branches = [], isLoading: isBranchesLoading } = useGetAllBranches();
  const [formData, setFormData] = useState<UserFormPayload>({
    id: initialData?.id,
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    password: "",
    role: initialData?.role ?? "cashier",
    employeeId: initialData?.employeeId ?? "",
    branchId: initialData?.branchId ?? 0,
    passcode: "", // Will be fetched via hook if editing
  });
  const [error, setError] = useState<string | null>(null);

  const isPrivileged = formData.role === "admin" || formData.role === "manager";

  // Fetch passcode only when editing a privileged user
  const { data: passcodeData } = useGetUserPasscode(
    initialData?.id && isPrivileged ? initialData.id : undefined
  );

  useEffect(() => {
    if (branches.length > 0 && !formData.branchId && !initialData?.branchId) {
      const firstBranchId = branches[0]?.id;
      if (firstBranchId !== undefined) {
        setFormData((prev) => ({ ...prev, branchId: Number(firstBranchId) }));
      }
    }
  }, [branches, initialData, formData.branchId]);

  // Sync fetched passcode to formData when it arrives
  useEffect(() => {
    if (passcodeData?.passcode) {
      setFormData((prev) => ({ ...prev, passcode: passcodeData.passcode }));
    }
  }, [passcodeData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic required fields
    if (!formData.name.trim()) return setError("Full name is required.");
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email || "")) return setError("Invalid email address.");

    // Password is required for new users
    if (!initialData && (!formData.password || formData.password.length < 6)) {
      return setError("Password must be at least 6 characters.");
    }

    if (!formData.employeeId.trim()) return setError("Employee ID is required.");

    // Passcode validation for privileged roles
    if (isPrivileged) {
      if (!formData.passcode) return setError("Passcode is required for Admin/Manager.");
      if (!/^\d{4}$/.test(formData.passcode)) return setError("Passcode must be exactly 4 digits.");
    }

    onAdd(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "branchId" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const showPasscode = isPrivileged;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl transition-all"
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
          {initialData ? "Edit User" : "Create New User"}
        </h2>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="text-[12px] font-bold uppercase text-[#90A1B9]">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                placeholder="name@bistro.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase text-[#90A1B9]">PASSWORD</label>
              <input
                type="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required={!initialData}
                className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase text-[#90A1B9]">EMPLOYEE ID</label>
              <input
                type="text"
                name="employeeId"
                placeholder="EMP001"
                value={formData.employeeId}
                onChange={handleChange}
                required
                className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase text-[#90A1B9]">BRANCH</label>
              <div className="relative">
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  disabled={isBranchesLoading}
                  className="h-12 w-full appearance-none rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                  required
                >
                  {isBranchesLoading ? (
                    <option value="">Loading branches...</option>
                  ) : branches.length === 0 ? (
                    <option value="">No branches found</option>
                  ) : (
                    branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))
                  )}
                </select>
                {isBranchesLoading ? (
                  <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9] animate-spin" />
                ) : (
                  <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9] pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase text-[#90A1B9]">SYSTEM ROLE</label>
              <div className="relative">
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="h-12 w-full appearance-none rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9] pointer-events-none" />
              </div>
            </div>

            {showPasscode && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[12px] font-bold uppercase text-[#90A1B9]">
                  PASSCODE (ADMIN/MANAGER ONLY)
                </label>
                <input
                  type="text"
                  name="passcode"
                  placeholder="4-digit code"
                  value={formData.passcode}
                  onChange={handleChange}
                  maxLength={4}
                  className="h-12 w-full rounded-xl bg-[#F8FAFC] px-4 text-[14px] text-[#1D293D] outline-none transition-all focus:ring-2 focus:ring-primary/10 font-mono"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 flex-1 rounded-xl cursor-pointer border border-[#E2E8F0] text-[14px] font-bold text-[#62748E] transition-all hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-12 flex-1 rounded-xl cursor-pointer bg-[#EA580C] text-[14px] font-bold text-white shadow-lg shadow-[#EA580C]/20 transition-all hover:bg-[#DC4C04] hover:shadow-xl active:scale-95"
            >
              {initialData ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
