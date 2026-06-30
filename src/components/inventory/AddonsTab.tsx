"use client";

import { Plus, Pencil, Power, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllModifications,
  useActivateModification,
  useDeactivateModification
} from "@/hooks/useModification";
import { Modification } from "@/types/product";

type AddonsTabProps = {
  onAddGroup: () => void;
  onEditGroup: (modification: Modification) => void;
};

export default function AddonsTab({ onAddGroup, onEditGroup }: AddonsTabProps) {
  const { data: modifications, isLoading, error } = useGetAllModifications("all");
  const activateMutation = useActivateModification();
  const deactivateMutation = useDeactivateModification();

  const handleToggleStatus = async (mod: Modification) => {
    try {
      if (mod.status === "active") {
        await deactivateMutation.mutateAsync(mod.id);
        toast.success("Add-on group deactivated successfully");
      } else {
        await activateMutation.mutateAsync(mod.id);
        toast.success("Add-on group activated successfully");
      }
    } catch (err: any) {
      console.error("Failed to toggle modification status:", err);
      toast.error(err?.response?.data?.message || "Failed to change add-on group status");
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
        <p>Failed to load add-on groups</p>
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
          Add-on Groups
        </h2>
        <button
          type="button"
          onClick={onAddGroup}
          className="flex items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 text-center font-['Inter'] text-sm font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-opacity hover:bg-[#c2410c]"
          style={{ transitionDuration: "300ms", transitionTimingFunction: "ease-out" }}
        >
          <Plus className="h-4 w-4" />
          Add Group
        </button>
      </div>
      <div className="space-y-6">
        {modifications?.map((group) => (
          <div
            key={group.id}
            className={`rounded-[16px] border border-[#F1F5F9] p-6 transition-opacity ${group.status === "inactive" ? "bg-[#F1F5F9] opacity-60" : "bg-[#F8FAFC]"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-['Inter'] text-base font-bold text-[#1D293D]">
                  {group.title}
                </h3>
                {group.status === "inactive" && (
                  <span className="rounded-full bg-[#90A1B9]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                    Inactive
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onEditGroup(group)}
                  className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                  title="Edit Group"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(group)}
                  className={`rounded-lg p-2 transition-colors ${group.status === "inactive"
                    ? "text-[#00BC7D] hover:bg-[#00BC7D]/10"
                    : "text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                    }`}
                  title={group.status === "inactive" ? "Activate" : "Deactivate"}
                >
                  <Power className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-[5px]">
              {group.items?.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-[5px] rounded-[14px] border border-[#E2E8F0] bg-white py-[9px] px-[17px] font-['Inter'] text-xs font-bold leading-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
                >
                  <span className="text-[#45556C]">{item.title}</span>
                  <span className="text-[#EA580C]">Rs. {item.price}</span>
                </span>
              ))}
            </div>
          </div>
        ))}
        {modifications?.length === 0 && (
          <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-[#E2E8F0] text-[#90A1B9]">
            No add-on groups found.
          </div>
        )}
      </div>
    </div>
  );
}
