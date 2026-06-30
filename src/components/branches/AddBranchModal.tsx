"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateBranch, useUpdateBranch } from "@/hooks/useBranch";
import { Branch } from "@/types/branch";

interface AddBranchModalProps {
    open: boolean;
    overlayVisible: boolean;
    onClose: () => void;
    branch?: Branch | null;
}

export default function AddBranchModal({
    open,
    overlayVisible,
    onClose,
    branch,
}: AddBranchModalProps) {
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const createMutation = useCreateBranch();
    const updateMutation = useUpdateBranch();

    const isEditing = !!branch;
    const isLoading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (open) {
            if (branch) {
                setName(branch.name);
                setLocation(branch.location || "");
            } else {
                setName("");
                setLocation("");
            }
        }
    }, [open, branch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            if (isEditing && branch) {
                await updateMutation.mutateAsync({
                    id: branch.id,
                    data: {
                        name: name.trim(),
                        location: location.trim() || undefined,
                    },
                });
            } else {
                await createMutation.mutateAsync({
                    name: name.trim(),
                    location: location.trim() || undefined,
                });
            }
            onClose();
        } catch (err) {
            console.error(`Failed to ${isEditing ? "update" : "create"} branch:`, err);
        }
    };

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ease-out"
            style={{ opacity: overlayVisible ? 1 : 0 }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md scale-95 rounded-[32px] bg-white p-8 shadow-2xl transition-all duration-300 ease-out"
                style={{
                    transform: overlayVisible ? "scale(1)" : "scale(0.95)",
                    opacity: overlayVisible ? 1 : 0,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 rounded-full p-2 text-[#90A1B9] transition-colors hover:bg-gray-100 hover:text-[#45556C]"
                >
                    <X className="h-6 w-6" />
                </button>

                <h2 className="font-['Inter'] text-2xl font-bold text-[#1D293D]">
                    {isEditing ? "Edit Branch" : "Create New Branch"}
                </h2>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <label className="font-['Inter'] text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                            Branch Name
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Maharagama Branch"
                            className="w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="font-['Inter'] text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. 18, Main Road, Maharagama"
                            className="w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-[14px] border border-[#E2E8F0] py-3 font-['Inter'] text-sm font-bold text-[#45556C] transition-colors hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim()}
                            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#EA580C] py-3 font-['Inter'] text-sm font-bold text-white shadow-lg transition-opacity hover:bg-[#c2410c] disabled:opacity-50"
                        >
                            {isLoading && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {isEditing ? "Save Changes" : "Create Branch"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
