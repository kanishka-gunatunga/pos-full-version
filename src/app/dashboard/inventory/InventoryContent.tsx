"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { TABS, type TabId } from "@/domains/inventory/types";
import { useGetAllBranches } from "@/hooks/useBranch";
import { useExportProducts, useImportProducts } from "@/hooks/useProduct";
import AddCategoryModal from "@/components/inventory/AddCategoryModal";
import AddGroupModal from "@/components/inventory/AddGroupModal";
import CategoriesTab from "@/components/inventory/CategoriesTab";
import AddonsTab from "@/components/inventory/AddonsTab";
import ProductsTab from "@/components/inventory/ProductsTab";
import DiscountsTab from "@/components/inventory/DiscountsTab";
import { Category, Modification, Product } from "@/types/product";
import { toast } from "sonner";

export default function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branchIdParam = searchParams.get("branchId");
  const { isCashier } = useAuth();
  const { data: branches = [] } = useGetAllBranches("active");
  const exportProductsMutation = useExportProducts();
  const importProductsMutation = useImportProducts();

  const branch = branches.find((b) => b.id.toString() === branchIdParam) || branches[0];
  const branchId = branch?.id.toString() || "";
  const [activeTab, setActiveTab] = useState<TabId>("products");
  const [searchQuery, setSearchQuery] = useState("");

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addCategoryOverlayVisible, setAddCategoryOverlayVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addGroupOverlayVisible, setAddGroupOverlayVisible] = useState(false);
  const [editingModification, setEditingModification] = useState<Modification | null>(null);

  const [addProductOpen, textAddProductOpen] = useState(false); // Kept for other uses if any, but product editing now uses full page

  const openAddCategory = () => {
    setEditingCategory(null);
    setAddCategoryOverlayVisible(false);
    setAddCategoryOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setAddCategoryOverlayVisible(false);
    setAddCategoryOpen(true);
  };

  const openAddGroup = () => {
    setEditingModification(null);
    setAddGroupOverlayVisible(false);
    setAddGroupOpen(true);
  };

  const openEditGroup = (mod: Modification) => {
    setEditingModification(mod);
    setAddGroupOverlayVisible(false);
    setAddGroupOpen(true);
  };

  const openEditProduct = (product: Product) => {
    router.push(`${ROUTES.DASHBOARD_INVENTORY_ADD_PRODUCT}?id=${product.id}`);
  };

  useEffect(() => {
    if (!addCategoryOpen) return;
    const raf = requestAnimationFrame(() => setAddCategoryOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [addCategoryOpen]);

  useEffect(() => {
    if (!addGroupOpen) return;
    const raf = requestAnimationFrame(() => setAddGroupOverlayVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [addGroupOpen]);


  useEffect(() => {
    if (isCashier) router.replace(ROUTES.DASHBOARD_MENU);
  }, [isCashier, router]);

  useEffect(() => {
    if (branchIdParam && branches.length > 0 && !branches.find(b => b.id.toString() === branchIdParam)) {
      router.replace(`${ROUTES.DASHBOARD_INVENTORY}?branchId=${branches[0].id}`);
    }
  }, [branchIdParam, router, branches]);

  if (isCashier) return null;
  if (!branch) return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-['Inter'] text-[24px] font-bold leading-8 text-[#1D293D]">
                Inventory
              </h1>
              <p className="mt-1 font-['Inter'] text-[14px] leading-5 text-[#62748E]">
                Manage products, prices, Categories & Discounts
              </p>
            </div>
            {activeTab === "products" && (
              <div className="relative w-full max-w-xs shrink-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Product Name..."
                  className="w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] py-2.5 pl-10 pr-4 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]"
                />
              </div>
            )}
          </div>

          <div className="w-full overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="rounded-t-[20px] border-b border-[#E2E8F0] bg-white p-1">
              <div className="flex gap-1">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const isActive = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-center font-['Inter'] text-sm font-bold leading-5 transition-colors ${isActive
                        ? "bg-[#EA580C1A] text-[#EA580C]"
                        : "text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                        }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeTab === "products" && (
              <div className="flex items-center justify-between  px-10 py-3">
                <h2 className="font-['Inter'] text-[16px] font-bold leading-6 text-[#314158]">Products</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = ".xlsx";
                      fileInput.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          try {
                            await importProductsMutation.mutateAsync(file);
                            toast.success("Products imported successfully");
                          } catch (err: any) {
                            toast.error(err?.response?.data?.message || "Failed to import products");
                          }
                        }
                      };
                      fileInput.click();
                    }}
                    disabled={importProductsMutation.isPending}
                    className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] shadow-sm transition-opacity hover:bg-gray-50 disabled:opacity-50"
                  >
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await exportProductsMutation.mutateAsync();
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || "Failed to export products");
                      }
                    }}
                    disabled={exportProductsMutation.isPending}
                    className="flex items-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] shadow-sm transition-opacity hover:bg-gray-50 disabled:opacity-50"
                  >
                    Export
                  </button>
                  <Link
                    href={ROUTES.DASHBOARD_INVENTORY_ADD_PRODUCT}
                    className="flex shrink-0 items-center gap-2 rounded-[14px] bg-[#EA580C] px-4 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-opacity hover:bg-[#c2410c]"
                    style={{ transitionDuration: "300ms", transitionTimingFunction: "ease-out" }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Link>
                </div>
              </div>
            )}

            <div className="py-4 px-10">
              {activeTab === "categories" && (
                <CategoriesTab
                  onAddCategory={openAddCategory}
                  onEditCategory={openEditCategory}
                />
              )}
              {activeTab === "addons" && (
                <AddonsTab onAddGroup={openAddGroup} onEditGroup={openEditGroup} />
              )}
              {activeTab === "products" && (
                <ProductsTab
                  branchId={branchId}
                  searchQuery={searchQuery}
                  onEditProduct={openEditProduct}
                />
              )}
              {/* {activeTab === "discounts" && <DiscountsTab />} */}
            </div>
          </div>
        </div>
      </div>

      <AddCategoryModal
        open={addCategoryOpen}
        overlayVisible={addCategoryOverlayVisible}
        editingCategory={editingCategory}
        onClose={() => setAddCategoryOpen(false)}
      />

      <AddGroupModal
        open={addGroupOpen}
        overlayVisible={addGroupOverlayVisible}
        editingModification={editingModification}
        onClose={() => setAddGroupOpen(false)}
      />

    </div>
  );
}
