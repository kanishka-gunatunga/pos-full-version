"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Percent, Package, Gift } from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAllBranches } from "@/hooks/useBranch";
import DiscountsTab from "@/components/inventory/DiscountsTab";
import ComboPacksTab from "@/components/promotions/ComboPacksTab";
import BogoTab from "@/components/promotions/BogoTab";
import AddComboModal from "@/components/promotions/AddComboModal";
import AddBogoModal from "@/components/promotions/AddBogoModal";
import AddDiscountModal from "@/components/inventory/AddDiscountModal";
import { Discount } from "@/types/product";
import { ComboPack } from "@/types/comboPack";
import { BogoPromotion } from "@/types/bogoPromotion";

type PromotionTabId = "productDiscounts" | "comboPacks" | "bogo";

const PROMOTION_TABS = [
  { id: "productDiscounts" as const, label: "Product Discounts", icon: Percent },
  { id: "comboPacks" as const, label: "Combo Packs", icon: Package },
  { id: "bogo" as const, label: "Buy One Get One", icon: Gift },
];

const PromotionsContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchIdParam = searchParams.get("branchId");
  const { isCashier } = useAuth();
  const { data: branches = [] } = useGetAllBranches("active");

  const branch = branches.find((b) => b.id.toString() === branchIdParam) || branches[0];
  const [activeTab, setActiveTab] = useState<PromotionTabId>("productDiscounts");
  const [searchQuery, setSearchQuery] = useState("");
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [isComboOverlayVisible, setIsComboOverlayVisible] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboPack | null>(null);

  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDiscountOverlayVisible, setIsDiscountOverlayVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const [isBogoModalOpen, setIsBogoModalOpen] = useState(false);
  const [isBogoOverlayVisible, setIsBogoOverlayVisible] = useState(false);
  const [editingBogo, setEditingBogo] = useState<BogoPromotion | null>(null);

  useEffect(() => {
    if (!isDiscountModalOpen) {
      setIsDiscountOverlayVisible(false);
      setEditingDiscount(null);
      return;
    }
    const raf = requestAnimationFrame(() => setIsDiscountOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isDiscountModalOpen]);

  useEffect(() => {
    if (!isComboModalOpen) {
      setIsComboOverlayVisible(false);
      return;
    }
    const raf = requestAnimationFrame(() => setIsComboOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isComboModalOpen]);

  useEffect(() => {
    if (!isBogoModalOpen) {
      setIsBogoOverlayVisible(false);
      return;
    }
    const raf = requestAnimationFrame(() => setIsBogoOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [isBogoModalOpen]);

  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  useEffect(() => {
    if (branchIdParam && branches.length > 0 && !branches.find(b => b.id.toString() === branchIdParam)) {
      router.replace(`${ROUTES.DASHBOARD_PROMOTIONS}?branchId=${branches[0].id}`);
    }
  }, [branchIdParam, router, branches]);

  if (isCashier) return null;
  if (!branch) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      
      {/* Header Container */}
      <div className="flex shrink-0 flex-col gap-6 border-b border-[#E2E8F0] bg-white px-6 py-6 pb-0">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Inter'] text-[24px] font-bold leading-8 text-[#1D293D]">
            Promotions
          </h1>
          <p className="font-['Inter'] text-[14px] leading-5 text-[#62748E]">
            Manage discounts, combo packs, and special offers
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mb-[1px] flex flex-wrap gap-2 pb-6">
          {PROMOTION_TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 rounded-[10px] px-6 py-2.5 font-['Inter'] text-sm font-medium transition-all ${isActive
                  ? "bg-[#EA580C] text-white shadow-[0px_1px_3px_#00000018]"
                  : "bg-[#F1F5F9] text-[#45556C] hover:bg-[#E2E8F0]"
                }`}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-[25px] pt-8 pb-8">
        <div className="mx-auto max-w-[1408px] space-y-8">
          {/* Search and Action Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#90A1B9]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search discounts...`}
                className="h-[50px] w-full rounded-[14px] border border-[#E2E8F0] bg-white pl-12 pr-4 font-['Inter'] text-base text-[#1D293D] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C] transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (activeTab === "productDiscounts") setIsDiscountModalOpen(true);
                if (activeTab === "comboPacks") setIsComboModalOpen(true);
                if (activeTab === "bogo") setIsBogoModalOpen(true);
              }}
              className="flex h-[50px] w-[189px] shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[#EA580C] px-6 font-['Inter'] text-base font-bold text-white shadow-[0px_10px_15px_-3px_#0000001A,0px_4px_6px_-4px_#0000001A] transition-all hover:bg-[#c2410c]"
            >
              <Plus className="h-5 w-5" />
              {activeTab === "productDiscounts" ? "Add Discount" : activeTab === "comboPacks" ? "Add Combo" : "Add BOGO"}
            </button>
          </div>

          {/* List Content */}
          <div className="space-y-4">
            {activeTab === "productDiscounts" && (
              <div className="rounded-[16px] border border-[#F1F5F9] bg-white p-6 shadow-sm">
                <DiscountsTab 
                  onEdit={(discount) => {
                    setEditingDiscount(discount);
                    setIsDiscountModalOpen(true);
                  }}
                />
              </div>
            )}
            {activeTab === "comboPacks" && (
              <ComboPacksTab
                searchQuery={searchQuery}
                onEdit={(combo) => {
                  setEditingCombo(combo);
                  setIsComboModalOpen(true);
                }}
              />
            )}
            {activeTab === "bogo" && (
              <BogoTab 
                searchQuery={searchQuery}
                onEdit={(bogo) => {
                  setEditingBogo(bogo);
                  setIsBogoModalOpen(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      <AddComboModal
        open={isComboModalOpen}
        overlayVisible={isComboOverlayVisible}
        onClose={() => {
          setIsComboModalOpen(false);
          setEditingCombo(null);
        }}
        editingCombo={editingCombo}
      />

      <AddBogoModal
        open={isBogoModalOpen}
        overlayVisible={isBogoOverlayVisible}
        onClose={() => {
          setIsBogoModalOpen(false);
          setEditingBogo(null);
        }}
        editingBogo={editingBogo}
      />

      <AddDiscountModal
        key={`${isDiscountModalOpen}-${editingDiscount?.id ?? "new"}`}
        open={isDiscountModalOpen}
        overlayVisible={isDiscountOverlayVisible}
        editingDiscount={editingDiscount}
        onClose={() => setIsDiscountModalOpen(false)}
      />
    </div>
  );
};

export default PromotionsContent;
