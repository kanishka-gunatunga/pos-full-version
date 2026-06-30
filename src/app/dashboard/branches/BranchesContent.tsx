"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAllBranches } from "@/hooks/useBranch";
import { Branch } from "@/types/branch";
import AddBranchModal from "@/components/branches/AddBranchModal";

const BuildingIconSmall = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M2 7L6.41 2.59C6.59606 2.40283 6.81732 2.25434 7.06103 2.15308C7.30474 2.05182 7.56609 1.99979 7.83 2H16.17C16.4339 1.99979 16.6953 2.05182 16.939 2.15308C17.1827 2.25434 17.4039 2.40283 17.59 2.59L22 7" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 22V18C15 17.4696 14.7893 16.9609 14.4142 16.5858C14.0391 16.2107 13.5304 16 13 16H11C10.4696 16 9.96086 16.2107 9.58579 16.5858C9.21071 16.9609 9 17.4696 9 18V22" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 7H22" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 7V10C22 10.5304 21.7893 11.0391 21.4142 11.4142C21.0391 11.7893 20.5304 12 20 12C19.4157 11.9678 18.8577 11.7467 18.41 11.37C18.2907 11.2838 18.1472 11.2374 18 11.2374C17.8528 11.2374 17.7093 11.2838 17.59 11.37C17.1423 11.7467 16.5843 11.9678 16 12C15.4157 11.9678 14.8577 11.7467 14.41 11.37C14.2907 11.2838 14.1472 11.2374 14 11.2374C13.8528 11.2374 13.7093 11.2838 13.59 11.37C13.1423 11.7467 12.5843 11.9678 12 12C11.4157 11.9678 10.8577 11.7467 10.41 11.37C10.2907 11.2838 10.1472 11.2374 10 11.2374C9.85279 11.2374 9.70932 11.2838 9.59 11.37C9.14227 11.7467 8.58426 11.9678 8 12C7.41574 11.9678 6.85773 11.7467 6.41 11.37C6.29068 11.2838 6.14721 11.2374 6 11.2374C5.85279 11.2374 5.70932 11.2838 5.59 11.37C5.14227 11.7467 4.58426 11.9678 4 12C3.46957 12 2.96086 11.7893 2.58579 11.4142C2.21071 11.0391 2 10.5304 2 10V7" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BuildingIconLarge = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 opacity-100">
    <path d="M6.6665 23.3333L21.3665 8.63333C21.9867 8.00943 22.7242 7.51445 23.5366 7.17691C24.349 6.83938 25.2201 6.66596 26.0998 6.66666H53.8998C54.7795 6.66596 55.6507 6.83938 56.4631 7.17691C57.2754 7.51445 58.013 8.00943 58.6332 8.63333L73.3332 23.3333" stroke="#0A0A0A" strokeWidth="6.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13.3335 40V66.6667C13.3335 68.4348 14.0359 70.1305 15.2861 71.3807C16.5364 72.631 18.2321 73.3333 20.0002 73.3333H60.0002C61.7683 73.3333 63.464 72.631 64.7142 71.3807C65.9644 70.1305 66.6668 68.4348 66.6668 66.6667V40" stroke="#0A0A0A" strokeWidth="6.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M50 73.3333V60C50 58.2319 49.2976 56.5362 48.0474 55.286C46.7971 54.0357 45.1014 53.3333 43.3333 53.3333H36.6667C34.8986 53.3333 33.2029 54.0357 31.9526 55.286C30.7024 56.5362 30 58.2319 30 60V73.3333" stroke="#0A0A0A" strokeWidth="6.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6.6665 23.3333H73.3332" stroke="#0A0A0A" strokeWidth="6.66667" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M73.3332 23.3333V33.3333C73.3332 35.1015 72.6308 36.7971 71.3805 38.0474C70.1303 39.2976 68.4346 40 66.6665 40C64.719 39.8928 62.8589 39.1558 61.3665 37.9C60.9688 37.6126 60.4905 37.4579 59.9998 37.4579C59.5091 37.4579 59.0309 37.6126 58.6332 37.9C57.1407 39.1558 55.2807 39.8928 53.3332 40C51.3856 39.8928 49.5256 39.1558 48.0332 37.9C47.6354 37.6126 47.1572 37.4579 46.6665 37.4579C46.1758 37.4579 45.6976 37.6126 45.2998 37.9C43.8074 39.1558 41.9474 39.8928 39.9998 40C38.0523 39.8928 36.1923 39.1558 34.6998 37.9C34.3021 37.6126 33.8239 37.4579 33.3332 37.4579C32.8425 37.4579 32.3642 37.6126 31.9665 37.9C30.4741 39.1558 28.6141 39.8928 26.6665 40C24.719 39.8928 22.8589 39.1558 21.3665 37.9C20.9688 37.6126 20.4905 37.4579 19.9998 37.4579C19.5091 37.4579 19.0309 37.6126 18.6332 37.9C17.1407 39.1558 15.2807 39.8928 13.3332 40C11.5651 40 9.86937 39.2976 8.61913 38.0474C7.36888 36.7971 6.6665 35.1015 6.6665 33.3333V23.3333" stroke="#0A0A0A" strokeWidth="6.66667" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M6 12L10 8L6 4" stroke="#EA580C" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function BranchCard({
  branch,
  onEdit
}: {
  branch: Branch;
  onEdit: (branch: Branch) => void
}) {
  return (
    <div
      // href={`${ROUTES.DASHBOARD_INVENTORY}?branchId=${branchId}`}
      className="relative flex min-h-[246px] flex-col rounded-[40px] border border-[#E2E8F0] bg-white p-[33px] transition-all duration-300 ease-out hover:shadow-md"
    >
      <div className="absolute right-0.5 top-0.5 h-32 w-32 opacity-[0.05] pt-6 pr-1 pl-6">
        <BuildingIconLarge />
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#F1F5F9]">
        <BuildingIconSmall />
      </div>
      <h2 className="mt-4 font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
        {branch.name}
      </h2>
      <div className="mt-1.5 flex items-center gap-1.5 font-['Inter'] text-[14px] font-medium leading-5 text-[#90A1B9]">
        <MapPin className="h-4 w-4 shrink-0 text-[#90A1B9]" />
        <span>{branch.location || "No location set"}</span>
      </div>
      <button
        className="mt-auto pt-4 flex items-center gap-1.5 font-['Inter'] cursor-pointer text-[14px] font-bold leading-5 text-[#EA580C]"
        onClick={() => onEdit(branch)}
      >
        <span>Edit Details</span>
        <ArrowRightIcon />
      </button>
    </div>
  );
}

function AddBranchCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[140px] w-full flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#CAD5E2] bg-[#F1F5F9]/60 p-5 transition-colors hover:border-[#90A1B9] hover:bg-[#F1F5F9]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E2E8F0]">
        <Plus className="h-6 w-6 text-[#90A1B9]" />
      </div>
      <span className="font-['Inter'] text-sm font-medium text-[#62748E]">
        Add New Branch
      </span>
    </button>
  );
}

export default function BranchesContent() {
  const router = useRouter();
  const { isCashier } = useAuth();
  const { data: branches = [], isLoading } = useGetAllBranches("active");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalOverlayVisible, setAddModalOverlayVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const openAddModal = () => {
    setEditingBranch(null);
    setAddModalOverlayVisible(false);
    setAddModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setAddModalOverlayVisible(false);
    setAddModalOpen(true);
  };

  useEffect(() => {
    if (!addModalOpen) return;
    const raf = requestAnimationFrame(() => setAddModalOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [addModalOpen]);

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  if (isCashier) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-50/50">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="font-['Inter'] text-[24px] font-bold leading-8 text-[#1D293D]">
              Branches
            </h1>
            <p className="mt-1 font-['Inter'] text-[14px] leading-5 text-[#62748E]">
              Manage your restaurant branches and locations
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#EA580C] border-t-transparent" />
              </div>
            ) : (
              <>
                {branches.map((branch) => (
                  <BranchCard
                    key={branch.id}
                    branch={branch}
                    onEdit={openEditModal}
                  />
                ))}
                <AddBranchCard onClick={openAddModal} />
              </>
            )}
          </div>
        </div>
      </div>

      <AddBranchModal
        open={addModalOpen}
        overlayVisible={addModalOverlayVisible}
        branch={editingBranch}
        onClose={() => setAddModalOpen(false)}
      />
    </div>
  );
}
