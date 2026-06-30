"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateCategory, useUpdateCategory } from "@/hooks/useCategory";
import { Category } from "@/types/product";

type AddCategoryModalProps = {
  open: boolean;
  overlayVisible: boolean;
  editingCategory?: Category | null;
  onClose: () => void;
};

export default function AddCategoryModal({
  open,
  overlayVisible,
  editingCategory,
  onClose,
}: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [subCategories, setSubCategories] = useState<string[]>(["", ""]);

  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEditing = !!editingCategory;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (editingCategory) {
        setCategoryName(editingCategory.name);
        setSubCategories(editingCategory.subcategories?.map(s => s.name) || ["", ""]);
      } else {
        setCategoryName("");
        setSubCategories(["", ""]);
      }
    }
  }, [open, editingCategory]);

  const handleCreateOrUpdate = async () => {
    if (!categoryName.trim()) return;

    try {
      if (isEditing && editingCategory) {

        const formattedSubs = subCategories
          .filter(name => name.trim())
          .map(name => {
            const existing = editingCategory.subcategories?.find(s => s.name === name);
            return { id: existing?.id, name };
          });

        await updateMutation.mutateAsync({
          id: editingCategory.id,
          payload: {
            name: categoryName,
            subcategories: formattedSubs,
          },
        });
        toast.success("Category updated successfully");
      } else {
        await createMutation.mutateAsync({
          name: categoryName,
          subcategories: subCategories.filter(s => s.trim()),
        });
        toast.success("Category created successfully");
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      toast.error(error?.response?.data?.message || "Failed to save category");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
      style={{ opacity: overlayVisible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[14px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <h2 id="add-category-title" className="font-['Inter'] text-lg font-bold text-[#1D293D]">
            {isEditing ? "Edit Category" : "New Category"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="shrink-0">
            <label
              htmlFor="category-name"
              className="mb-1.5 block font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#90A1B9]"
            >
              Category Name
            </label>
            <input
              id="category-name"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g. Burgers"
              className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="mb-1.5 flex shrink-0 items-center justify-between">
              <label className="block font-['Inter'] text-xs font-medium uppercase tracking-wide text-[#90A1B9]">
                Sub-Categories
              </label>
              <button
                type="button"
                onClick={() => setSubCategories(prev => [...prev, ""])}
                className="flex items-center gap-1 font-['Inter'] text-sm font-bold text-[#EA580C]"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Add Sub-Category
              </button>
            </div>
            <div className="max-h-48 min-h-0 space-y-2 overflow-y-auto [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2E8F0] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
              {subCategories.map((value, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                      const next = [...subCategories];
                      next[index] = e.target.value;
                      setSubCategories(next);
                    }}
                    placeholder="e.g. Beef, Chicken"
                    className="min-w-0 flex-1 rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setSubCategories(prev => prev.filter((_, i) => i !== index))}
                    className="shrink-0 rounded-lg p-2 text-[#90A1B9] hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove sub-category"
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] hover:bg-[#F8FAFC]"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateOrUpdate}
            disabled={isLoading || !categoryName.trim()}
            className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] hover:bg-[#c2410c] disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Update Category" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
