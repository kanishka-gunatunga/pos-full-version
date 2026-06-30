"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { Material, CreateMaterialBody } from "@/types/supply";
import type { Branch } from "@/types/branch";
import type { Category } from "@/types/product";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMaterial?: Material | null;
  branches: Branch[];
  categories: Category[];
  onSave: (body: CreateMaterialBody) => void | Promise<void>;
  isSaving?: boolean;
}

const ALL_BRANCHES_LABEL = "All Branches";

function parseMinStockLevel(value: string): number {
  const match = value.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
}

function unitToSelectValue(unit: string): string {
  return unit === "pieces" ? "pcs" : unit;
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  initialMaterial,
  branches,
  categories,
  onSave,
  isSaving = false,
}: AddMaterialModalProps) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>(() => {
    if (!initialMaterial) {
      return branches.length ? [branches[0].name] : [];
    }
    if (initialMaterial.allBranches) return [ALL_BRANCHES_LABEL];
    const namesFromIds =
      initialMaterial.branchIds?.map((id) => branches.find((b) => b.id === id)?.name) || [];
    return namesFromIds.filter((name): name is string => Boolean(name));
  });

  const [branchMinStock, setBranchMinStock] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};

    // If material applies to all branches, seed the global min stock field
    if (initialMaterial?.allBranches && initialMaterial.minStockValue) {
      const unitShort = unitToSelectValue(initialMaterial.minStockUnit);
      map[ALL_BRANCHES_LABEL] = `${initialMaterial.minStockValue}${unitShort}`;
      return map;
    }

    // Otherwise seed per-branch values (if any)
    if (!initialMaterial || !initialMaterial.perBranchMinStocks) return map;

    for (const mb of initialMaterial.perBranchMinStocks) {
      const branch = branches.find((b) => b.id === mb.branchId);
      if (!branch) continue;
      const unitShort = unitToSelectValue(mb.minStockUnit);
      map[branch.name] = `${mb.minStockValue}${unitShort}`;
    }

    return map;
  });

  const isEditing = !!initialMaterial;

  if (!isOpen) return null;

  const toggleBranch = (branch: string) => {
    setSelectedBranches((prev) => {
      if (branch === "All Branches") {
        // Toggle all-branches: if turning on, clear others; if turning off, clear selection.
        return prev.includes("All Branches") ? [] : ["All Branches"];
      }

      // For specific branches, ensure "All Branches" is not selected.
      const withoutAll = prev.filter((b) => b !== "All Branches");
      if (withoutAll.includes(branch)) {
        return withoutAll.filter((b) => b !== branch);
      }
      return [...withoutAll, branch];
    });
  };

  const handleMinStockChange = (branch: string, value: string) => {
    setBranchMinStock((prev) => ({ ...prev, [branch]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-8 pt-7 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full text-[#90A1B9] transition-colors hover:bg-[#F8FAFC]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-2">
            <h2 className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
              {isEditing ? "Edit Material" : "Add New Material"}
            </h2>
            <p className="mt-1 font-['Inter'] text-sm leading-5 text-[#90A1B9]">
              {isEditing
                ? "Update material details"
                : "Define a new material to use across branches"}
            </p>
          </div>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);

            const name = (formData.get("materialName") as string | null)?.trim() || "";
            const category = (formData.get("category") as string | null) || "";
            const unitSelect = (formData.get("unit") as string | null) || "kg";

            if (!name || !category || !unitSelect) {
              toast.error("Please fill in all required material fields.");
              return;
            }

            const nonAllBranches = selectedBranches.filter((b) => b !== ALL_BRANCHES_LABEL);
            const allBranches = selectedBranches.includes(ALL_BRANCHES_LABEL);

            if (!allBranches && nonAllBranches.length === 0) {
              toast.error("Please select at least one branch or choose All Branches.");
              return;
            }

            // Map branch names to IDs (and keep name/id pairs for per-branch mins)
            const selectedBranchEntries = nonAllBranches
              .map((name) => {
                const branch = branches.find((b) => b.name === name);
                return branch ? { id: branch.id, name: branch.name } : null;
              })
              .filter((entry): entry is { id: number; name: string } => entry !== null);

            const branchIds = allBranches ? [] : selectedBranchEntries.map((b) => b.id);

            if (!allBranches && branchIds.length === 0) {
              toast.error("Selected branches are invalid. Please try again.");
              return;
            }

            const normalizedUnitForMaterial = unitSelect === "pcs" ? "pieces" : unitSelect;

            const payload: CreateMaterialBody = {
              name,
              category,
              unit: normalizedUnitForMaterial,
              allBranches,
              branchIds,
            };

            // For "All Branches", use a single global min stock input
            if (allBranches) {
              const rawGlobal = branchMinStock[ALL_BRANCHES_LABEL];
              if (rawGlobal) {
                const value = parseMinStockLevel(rawGlobal);
                if (value > 0) {
                  const unitMatch = rawGlobal.match(/[a-zA-Z]+/g);
                  const unitFromInput = unitMatch?.[0]?.toLowerCase();
                  const normalizedUnit =
                    unitFromInput === "kg" || unitFromInput === "g" || unitFromInput === "pcs"
                      ? unitFromInput
                      : unitSelect;
                  payload.minStockValue = value;
                  payload.minStockUnit =
                    normalizedUnit === "pcs" ? "pieces" : normalizedUnitForMaterial;
                }
              }
            }

            // Build per-branch min stock thresholds when not using All Branches
            if (!allBranches && selectedBranchEntries.length > 0) {
              const perBranchMinStocks = selectedBranchEntries
                .map(({ id, name }) => {
                  const raw = branchMinStock[name];
                  if (!raw) {
                    return {
                      branchId: id,
                      minStockValue: 0,
                      minStockUnit: normalizedUnitForMaterial,
                    };
                  }
                  const value = parseMinStockLevel(raw);
                  const unitMatch = raw.match(/[a-zA-Z]+/g);
                  const unitFromInput = unitMatch?.[0]?.toLowerCase();
                  const normalizedUnit =
                    unitFromInput === "kg" || unitFromInput === "g" || unitFromInput === "pcs"
                      ? unitFromInput
                      : unitSelect;
                  return {
                    branchId: id,
                    minStockValue: value,
                    minStockUnit: normalizedUnit === "pcs" ? "pieces" : normalizedUnit,
                  };
                })
                .filter((entry) => entry.minStockValue > 0);

              if (perBranchMinStocks.length > 0) {
                payload.perBranchMinStocks = perBranchMinStocks;
                // Optional: set global default from first non-zero entry
                payload.minStockValue = perBranchMinStocks[0].minStockValue;
                payload.minStockUnit = perBranchMinStocks[0].minStockUnit;
              }
            }

            await onSave(payload);
            onClose();
          }}
        >
          <div className="scrollbar-subtle min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-8 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Material name */}
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  MATERIAL NAME<span className="text-[#EC003F]"> *</span>
                </label>
                <input
                  name="materialName"
                  type="text"
                  placeholder="Enter material name"
                  defaultValue={initialMaterial?.name}
                  className="mt-1 h-10 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  CATEGORY<span className="text-[#EC003F]"> *</span>
                </label>
                <select
                  name="category"
                  className="mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
                  defaultValue={initialMaterial?.category ?? ""}
                  required
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-1.5">
                <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#90A1B9]">
                  UNIT<span className="text-[#EC003F]"> *</span>
                </label>
                <select
                  name="unit"
                  className="mt-1 h-10 w-full cursor-pointer appearance-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] pl-3.5 pr-10 font-['Inter'] text-sm text-[#0F172A] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] [background-image:url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M3%204.5L6%207.5L9%204.5%22%20stroke%3D%22%2390A1B9%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] [background-position:right_1rem_center] [background-repeat:no-repeat] [background-size:12px]"
                  defaultValue={
                    initialMaterial ? unitToSelectValue(initialMaterial.unit) : "kg"
                  }
                  required
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="pcs">Pieces</option>
                </select>
              </div>
            </div>

            {/* Branch selection */}
            <div className="space-y-2 w-full">
              <label className="font-['Inter'] text-xs font-semibold uppercase tracking-[0.04em] text-[#314158]">
                Select Branches & Set Min Stock<span className="text-[#EC003F]"> *</span>
              </label>
              <div className="mt-1 w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-4 w-full">
                  {[ALL_BRANCHES_LABEL, ...branches.map((b) => b.name)].map((branch) => {
                    const checked = selectedBranches.includes(branch);
                    return (
                      <div
                        key={branch}
                        className={`block w-full border px-4 py-3 ${
                          branch === "All Branches"
                            ? "rounded-[10px] border-x-transparent border-t-transparent border-b-[#E2E8F0] gap-3"
                            : "rounded-[12px] border-transparent"
                        } ${
                          checked && branch !== "All Branches"
                            ? "border-[#EA580C33] bg-[#FFFFFF]"
                            : branch !== "All Branches"
                              ? "bg-transparent"
                              : ""
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3 font-['Inter'] text-sm font-medium leading-[14px] text-[#0A0A0A]">
                          <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleBranch(branch)}
                              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                            <span
                              className={`absolute inset-0 rounded-[4px] border p-[1px] shadow-[0px_1px_2px_0px_#0000000D] transition-colors ${
                                checked
                                  ? "border-[#EA580C] bg-[#EA580C]"
                                  : "border-[#E2E8F0] bg-white"
                              }`}
                            />
                            <svg
                              className={`pointer-events-none relative h-2.5 w-2.5 text-white transition-opacity ${
                                checked ? "opacity-100" : "opacity-0"
                              }`}
                              viewBox="0 0 12 12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M2 6l3 3 5-6" />
                            </svg>
                          </span>
                          <span>{branch}</span>
                        </label>

                        {checked && (
                          <div className="mt-1 bg-[#ffffff] px-3 py-3">
                            <label className="font-['Inter'] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#90A1B9]">
                              {branch === ALL_BRANCHES_LABEL ? "Global Min Stock Level" : "Min Stock Level"}
                            </label>
                            <input
                              type="text"
                              placeholder={branch === ALL_BRANCHES_LABEL ? "e.g. 5kg" : "5kg"}
                              value={branchMinStock[branch] ?? ""}
                              onChange={(e) => handleMinStockChange(branch, e.target.value)}
                              className="mt-1 h-9 w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 font-['Inter'] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex w-full gap-3 border-t border-[#E2E8F0] bg-white px-8 py-4">
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
              className="flex h-11 flex-1 items-center justify-center rounded-[16px] bg-[#EA580C] p-2.5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C33,0px_20px_25px_-5px_#EA580C33] hover:bg-[#DC4C04] disabled:opacity-70"
            >
              {isEditing ? (isSaving ? "Saving..." : "Save changes") : isSaving ? "Adding..." : "Add material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
