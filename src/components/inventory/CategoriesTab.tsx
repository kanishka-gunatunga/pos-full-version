"use client";

import { Plus, Pencil, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useGetAllCategories, useActivateCategory, useDeactivateCategory, useExportCategories, useImportCategories } from "@/hooks/useCategory";
import { CategoryIcon, SubCategoryIcon } from "./CategoryIcons";
import { Category } from "@/types/product";

type CategoriesTabProps = {
  onAddCategory: () => void;
  onEditCategory: (category: Category) => void;
};

export default function CategoriesTab({ onAddCategory, onEditCategory }: CategoriesTabProps) {
  const { data: categories, isLoading, error } = useGetAllCategories("all");
  const activateMutation = useActivateCategory();
  const deactivateMutation = useDeactivateCategory();
  const exportCategoriesMutation = useExportCategories();
  const importCategoriesMutation = useImportCategories();

  const handleToggleStatus = async (category: Category) => {
    try {
      if (category.status === "active") {
        await deactivateMutation.mutateAsync(category.id);
        toast.success("Category deactivated successfully");
      } else {
        await activateMutation.mutateAsync(category.id);
        toast.success("Category activated successfully");
      }
    } catch (err: any) {
      console.error("Failed to toggle category status:", err);
      toast.error(err?.response?.data?.message || "Failed to change category status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-[#90A1B9]">
        <p>Failed to load categories</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm font-bold text-[#EA580C] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-['Inter'] text-[16px] font-bold leading-6 text-[#314158]">
          Categories & Sub-Categories
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = ".csv";
              fileInput.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  try {
                    await importCategoriesMutation.mutateAsync(file);
                    toast.success("Categories imported successfully");
                  } catch (err: any) {
                    toast.error(err?.response?.data?.message || "Failed to import categories");
                  }
                }
              };
              fileInput.click();
            }}
            disabled={importCategoriesMutation.isPending}
            className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] shadow-sm transition-opacity hover:bg-gray-50 disabled:opacity-50"
          >
            Import
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await exportCategoriesMutation.mutateAsync();
              } catch (err: any) {
                toast.error(err?.response?.data?.message || "Failed to export categories");
              }
            }}
            disabled={exportCategoriesMutation.isPending}
            className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] shadow-sm transition-opacity hover:bg-gray-50 disabled:opacity-50"
          >
            Export
          </button>
          <button
            type="button"
            onClick={onAddCategory}
          className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-opacity hover:bg-[#c2410c]"
          style={{ transitionDuration: "300ms", transitionTimingFunction: "ease-out" }}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>
      </div>
      <div className="flex flex-col gap-3">
        {categories?.map((cat) => (
          <div
            key={cat.id}
            className={`flex items-center gap-4 rounded-2xl border border-[#E2E8F0] px-5 py-4 transition-opacity ${cat.status === "inactive" ? "bg-[#F1F5F9] opacity-60" : "bg-[#F8FAFC]"
              }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex gap-3">
                <div className="flex shrink-0 self-start justify-center rounded-[14px] border border-[#E2E8F0] bg-white p-2.5 opacity-100">
                  <CategoryIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                      {cat.name}
                    </h3>
                    {cat.status === "inactive" && (
                      <span className="rounded-full bg-[#90A1B9]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 font-['Inter'] text-xs font-normal leading-4 text-[#90A1B9]">
                    {cat.subcategories?.length || 0} sub-categories
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.subcategories?.map((sub) => (
                      <span
                        key={sub.id}
                        className="inline-flex items-center gap-1 rounded-[14px] border border-[#E2E8F0] bg-white px-2.5 py-1 font-['Inter'] text-xs font-bold leading-4 text-[#45556C] shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
                      >
                        <SubCategoryIcon />
                        {sub.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => onEditCategory(cat)}
                className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                title="Edit Category"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(cat)}
                className={`rounded-lg p-2 transition-colors ${cat.status === "inactive"
                  ? "text-[#00BC7D] hover:bg-[#00BC7D]/10"
                  : "text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                  }`}
                title={cat.status === "inactive" ? "Activate" : "Deactivate"}
              >
                <Power className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {categories?.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] text-[#90A1B9]">
            No categories found.
          </div>
        )}
      </div>
    </div>
  );
}
