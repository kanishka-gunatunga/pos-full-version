"use client";

import { useState, useEffect } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateModification, useUpdateModification } from "@/hooks/useModification";
import { Modification } from "@/types/product";

type AddGroupModalProps = {
  open: boolean;
  overlayVisible: boolean;
  editingModification?: Modification | null;
  onClose: () => void;
};

export default function AddGroupModal({
  open,
  overlayVisible,
  editingModification,
  onClose,
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [items, setItems] = useState<{ id?: number; name: string; price: string }[]>([
    { name: "", price: "" },
    { name: "", price: "" },
  ]);

  const createMutation = useCreateModification();
  const updateMutation = useUpdateModification();

  const isEditing = !!editingModification;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open) {
      if (editingModification) {
        setGroupName(editingModification.title);
        setItems(
          editingModification.items?.map((item) => ({
            id: item.id,
            name: item.title,
            price: item.price.toString(),
          })) || [
            { name: "", price: "" },
            { name: "", price: "" },
          ]
        );
      } else {
        setGroupName("");
        setItems([
          { name: "", price: "" },
          { name: "", price: "" },
        ]);
      }
    }
  }, [open, editingModification]);

  const handleSave = async () => {
    if (!groupName.trim()) return;

    const validItems = items
      .filter((item) => item.name.trim() && item.price.trim())
      .map((item) => ({
        id: item.id,
        title: item.name,
        price: parseFloat(item.price) || 0,
      }));

    try {
      if (isEditing && editingModification) {
        await updateMutation.mutateAsync({
          id: editingModification.id,
          payload: {
            title: groupName,
            items: validItems,
          },
        });
        toast.success("Add-on group updated successfully");
      } else {
        await createMutation.mutateAsync({
          title: groupName,
          items: validItems,
        });
        toast.success("Add-on group created successfully");
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save addon group:", error);
      toast.error(error?.response?.data?.message || "Failed to save add-on group");
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-group-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
      style={{ opacity: overlayVisible ? 1 : 0 }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-[16px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex shrink-0 items-center justify-between">
          <h2 id="add-group-title" className="font-['Inter'] text-[20px] font-bold text-[#1D293D]">
            {isEditing ? "Edit Add-on Group" : "New Add-on Group"}
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

        <div className="space-y-4 overflow-y-auto pr-2 [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2E8F0] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
          <div className="shrink-0">
            <label
              htmlFor="group-name"
              className="mb-1.5 block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]"
            >
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Large Pizza Add-ons"
              className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
              disabled={isLoading}
            />
          </div>

          <div>
            <div className="mb-3 mt-2 flex shrink-0 items-center justify-between">
              <label className="block font-['Inter'] text-xs font-bold uppercase tracking-wide text-[#45556C]">
                Items in Group
              </label>
              <button
                type="button"
                onClick={() => setItems([...items, { name: "", price: "" }])}
                className="flex items-center gap-1 font-['Inter'] text-sm font-bold text-[#EA580C]"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
                Add Another Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="flex shrink-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block font-['Inter'] text-xs font-medium text-[#45556C]">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const next = [...items];
                        next[index].name = e.target.value;
                        setItems(next);
                      }}
                      placeholder="Item Name"
                      className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="w-24 shrink-0">
                    <label className="mb-1 block font-['Inter'] text-xs font-medium text-[#45556C]">
                      Price (Rs.)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.price}
                      onChange={(e) => {
                        const next = [...items];
                        next[index].price = e.target.value;
                        setItems(next);
                      }}
                      placeholder="1000"
                      className="w-full rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <button
                      type="button"
                      onClick={() => setItems(items.filter((_, i) => i !== index))}
                      className="rounded-lg p-2 text-[#90A1B9] hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-[#F1F5F9] pt-4">
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
            onClick={handleSave}
            disabled={isLoading || !groupName.trim()}
            className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] hover:bg-[#c2410c] disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Update Group" : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
}
