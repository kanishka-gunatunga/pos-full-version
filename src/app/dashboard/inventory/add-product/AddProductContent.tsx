"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  FileText,
  Layers,
  Store,
  Plus,
  X,
  Check,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { ROUTES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useGetAllCategories } from "@/hooks/useCategory";
import { useGetAllModifications } from "@/hooks/useModification";
import { useCreateProduct, useUpdateProduct, useGetProductById } from "@/hooks/useProduct";
import { useGetAllBranches } from "@/hooks/useBranch";
import { readIsUnlimitedFromPrice } from "@/types/product";

const PRIMARY = "#EA580C";

interface VariantGroup {
  id: string;
  name: string;
  options: string[];
}

interface VariantCombination {
  combination: string;
  values: Record<string, string>;
}

interface BranchVariantConfig {
  price: string;
  quantity: string;
  isUnlimited: boolean;
  addonGroups: number[];
  expireDate: string;
  batchNo: string;
}

export default function AddProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");
  const isEditing = !!productId;

  const { isCashier } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [productName, setProductName] = useState("");
  const [productCode, setProductCode] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);

  // Step 2
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [branchConfigs, setBranchConfigs] = useState<
    Record<string, { branchId: string; variants: Record<string, BranchVariantConfig> }>
  >({});

  const { data: categories, isLoading: isCategoriesLoading } = useGetAllCategories("active");
  const { data: modificationGroups } = useGetAllModifications("active");
  const { data: allBranches } = useGetAllBranches("active");

  const { data: productData, isLoading: isProductLoading } = useGetProductById(
    productId ? parseInt(productId) : 0
  );

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const isMutating = createProductMutation.isPending || updateProductMutation.isPending;

  useEffect(() => {
    if (isEditing && productData) {
      setProductName(productData.name);
      setProductCode(productData.code);
      setDescription(productData.description || "");
      setSelectedCategory(productData.categoryId ?? null);
      setSelectedSubCategory(productData.subCategoryId ?? null);

      if (productData.image) {
        setImagePreview(productData.image);
      }

      const branchIds = productData.branches?.map((b) => b.branchId.toString()) || [];
      setSelectedBranches(branchIds);

      // Reconstruct variant groups if possible
      // For now, let's at least populate the configs
      if (productData.variations && productData.variations.length > 0) {
        const variation = productData.variations[0];
        const configs: Record<
          string,
          { branchId: string; variants: Record<string, BranchVariantConfig> }
        > = {};

        // Attempt to reconstruct groups from variation options if they are not just "Standard"
        const options = variation.options || [];
        if (options.length > 0) {
          if (options.length === 1 && options[0].name === "Standard") {
            setVariantGroups([]);
          } else {
            // Very basic reconstruction: one group with all options
            // This is better than nothing, but multi-dim is still hard without metadata
            // For now, let's just use the option names as they are
            setVariantGroups([
              {
                id: "vg-reconstructed",
                name: "Options",
                options: options.map((o) => o.name),
              },
            ]);
          }

          branchIds.forEach((bId) => {
            const bIdNum = parseInt(bId);
            const branchVariantConfig: Record<string, BranchVariantConfig> = {};

            options.forEach((opt) => {
              const priceData = opt.prices?.find((p) => Number(p.branchId) === bIdNum);
              branchVariantConfig[opt.name] = {
                price: priceData?.price?.toString() || "",
                quantity: priceData?.quantity?.toString() || "",
                isUnlimited: readIsUnlimitedFromPrice(priceData),
                addonGroups: variation.variationModifications?.map((m) => m.modificationId) || [], // This is a bit simplified
                expireDate: priceData?.expireDate || "",
                batchNo: priceData?.batchNo || "",
              };
            });

            configs[bId] = { branchId: bId, variants: branchVariantConfig };
          });
        }
        setBranchConfigs(configs);
      }
    }
  }, [isEditing, productData]);

  const selectedCategoryData = categories?.find((c) => c.id === selectedCategory);

  const generateVariantCombinations = (): VariantCombination[] => {
    if (variantGroups.length === 0) {
      return [{ combination: "Standard", values: {} }];
    }
    const combinations: VariantCombination[] = [];
    const generateRecursive = (index: number, current: Record<string, string>) => {
      if (index === variantGroups.length) {
        combinations.push({ combination: Object.values(current).join("-"), values: current });
        return;
      }
      const group = variantGroups[index];
      for (const option of group.options.filter(Boolean)) {
        generateRecursive(index + 1, { ...current, [group.name]: option });
      }
    };
    generateRecursive(0, {});
    return combinations;
  };

  const variantCombinations = generateVariantCombinations();

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !selectedCategory) {
      return;
    }
    setCurrentStep(2);
  };

  const handleAddVariantGroup = () => {
    setVariantGroups([...variantGroups, { id: `vg-${Date.now()}`, name: "", options: [""] }]);
  };

  const handleRemoveVariantGroup = (groupId: string) => {
    setVariantGroups(variantGroups.filter((g) => g.id !== groupId));
  };

  const handleUpdateVariantGroup = (
    groupId: string,
    field: "name" | "options",
    value: string | string[]
  ) => {
    setVariantGroups(variantGroups.map((g) => (g.id === groupId ? { ...g, [field]: value } : g)));
  };

  const handleAddVariantOption = (groupId: string) => {
    setVariantGroups(
      variantGroups.map((g) => (g.id === groupId ? { ...g, options: [...g.options, ""] } : g))
    );
  };

  const handleRemoveVariantOption = (groupId: string, index: number) => {
    setVariantGroups(
      variantGroups.map((g) =>
        g.id === groupId ? { ...g, options: g.options.filter((_, i) => i !== index) } : g
      )
    );
  };

  const handleToggleBranch = (branchId: string) => {
    if (selectedBranches.includes(branchId)) {
      setSelectedBranches(selectedBranches.filter((id) => id !== branchId));
      const next = { ...branchConfigs };
      delete next[branchId];
      setBranchConfigs(next);
    } else {
      setSelectedBranches([...selectedBranches, branchId]);
      const initialConfig: Record<string, BranchVariantConfig> = {};
      variantCombinations.forEach((combo) => {
        initialConfig[combo.combination] = {
          price: "",
          quantity: "",
          isUnlimited: false,
          addonGroups: [],
          expireDate: "",
          batchNo: "",
        };
      });
      setBranchConfigs({
        ...branchConfigs,
        [branchId]: { branchId, variants: initialConfig },
      });
    }
  };

  const handleUpdateBranchVariant = (
    branchId: string,
    combination: string,
    field: keyof BranchVariantConfig,
    value: string | string[] | number[] | boolean
  ) => {
    setBranchConfigs({
      ...branchConfigs,
      [branchId]: {
        ...branchConfigs[branchId],
        variants: {
          ...branchConfigs[branchId]?.variants,
          [combination]: {
            ...(branchConfigs[branchId]?.variants[combination] || {
              price: "",
              quantity: "",
              isUnlimited: false,
              addonGroups: [],
              expireDate: "",
              batchNo: "",
            }),
            [field]: value,
          },
        },
      },
    });
  };

  const handleToggleAddonGroup = (branchId: string, combination: string, addonGroupId: number) => {
    const config = branchConfigs[branchId]?.variants[combination];
    const current = config?.addonGroups ?? [];
    const newGroups = current.includes(addonGroupId)
      ? current.filter((id) => id !== addonGroupId)
      : [...current, addonGroupId];
    handleUpdateBranchVariant(branchId, combination, "addonGroups", newGroups);
  };

  const handleFinalSubmit = async () => {
    if (isMutating) return;

    for (const branchId of selectedBranches) {
      const config = branchConfigs[branchId];
      const hasValid = Object.values(config?.variants ?? {}).some(
        (v) => v.price && (v.isUnlimited || v.quantity)
      );
      if (!hasValid) {
        alert(
          `Please complete configuration for branch: ${allBranches?.find((b) => b.id.toString() === branchId)?.name}`
        );
        return;
      }
    }

    try {
      const payload = {
        name: productName,
        code: productCode,
        shortDescription: description ? description.substring(0, 160) : "",
        description: description,
        sku: productCode,
        categoryId: selectedCategory || undefined,
        subCategoryId: selectedSubCategory || undefined,
        branches: selectedBranches.map((id) => parseInt(id)),
        modifications: [],
        variations: [
          {
            name: variantGroups.length > 0 ? "Variants" : "Standard",
            options: variantCombinations.map((combo) => ({
              name: combo.combination,
              prices: selectedBranches.map((branchId) => {
                const variantData = branchConfigs[branchId]?.variants[combo.combination];
                const unlimited = Boolean(variantData?.isUnlimited);
                return {
                  branchId: parseInt(branchId),
                  price: parseFloat(variantData?.price || "0"),
                  discountPrice: 0, // Added discountPrice
                  quantity: unlimited ? 0 : parseInt(variantData?.quantity || "0", 10),
                  isUnlimited: unlimited,
                  batchNo: variantData?.batchNo,
                  expireDate: variantData?.expireDate || null,
                };
              }),
            })),
            modifications: variantCombinations[0]
              ? branchConfigs[selectedBranches[0]]?.variants[
                  variantCombinations[0].combination
                ]?.addonGroups.map((id) => ({ modificationId: id }))
              : [],
          },
        ],
      };

      if (isEditing && productId) {
        await updateProductMutation.mutateAsync({
          id: parseInt(productId),
          data: payload as any,
          imageFile: imageFile || undefined,
        });
        toast.success("Product updated successfully");
      } else {
        await createProductMutation.mutateAsync({
          data: payload as any,
          imageFile: imageFile || undefined,
        });
        toast.success("Product created successfully");
      }

      router.push(ROUTES.DASHBOARD_INVENTORY);
    } catch (error: any) {
      console.error(`Failed to ${isEditing ? "update" : "create"} product:`, error);
      toast.error(error?.response?.data?.message || `Failed to ${isEditing ? "update" : "create"} product`);
    }
  };

  if (isCashier) {
    router.replace(ROUTES.DASHBOARD_MENU);
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
            ) : (
              <Link
                href={ROUTES.DASHBOARD_INVENTORY}
                className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </Link>
            )}
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: PRIMARY }}
              >
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-['Inter'] text-2xl font-bold text-[#1D293D]">
                  {isEditing ? "Edit Product" : "Add New Product"}
                </h1>
                <p className="font-['Inter'] text-sm text-[#62748E]">
                  Step {currentStep} of 2:{" "}
                  {currentStep === 1 ? "Basic Details" : "Branch & Variants"}
                </p>
              </div>
            </div>
            <div className="w-20" />
          </div>

          {/* Progress Bar */}
          <div className="mb-8 flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-['Inter'] text-sm font-bold transition-all ${
                currentStep >= 1 ? "text-white shadow-lg" : "bg-[#E2E8F0] text-[#90A1B9]"
              }`}
              style={{ backgroundColor: currentStep >= 1 ? PRIMARY : undefined }}
            >
              {currentStep > 1 ? <Check className="h-5 w-5" /> : "1"}
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: currentStep >= 2 ? "100%" : "0%",
                  backgroundColor: PRIMARY,
                }}
              />
            </div>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-['Inter'] text-sm font-bold transition-all ${
                currentStep >= 2 ? "text-white shadow-lg" : "bg-[#E2E8F0] text-[#90A1B9]"
              }`}
              style={{ backgroundColor: currentStep >= 2 ? PRIMARY : undefined }}
            >
              2
            </div>
          </div>

          {/* Step 1 */}
          {currentStep === 1 && (
            <form
              onSubmit={handleStep1Submit}
              className="rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-8"
            >
              <h2 className="mb-6 flex items-center gap-2 font-['Inter'] text-xl font-bold text-[#1D293D]">
                <FileText className="h-6 w-6" />
                Basic Product Information
              </h2>

              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                      Product Name <span className="text-[#EC003F]">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name..."
                      className="w-full rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                      Product Code <span className="text-[#EC003F]">*</span>
                    </label>
                    <input
                      type="text"
                      value={productCode}
                      onChange={(e) => setProductCode(e.target.value)}
                      placeholder="e.g. PRD-001"
                      className="w-full rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description..."
                    rows={4}
                    className="w-full resize-none rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                    Attach Image
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (imagePreview) URL.revokeObjectURL(imagePreview);
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 font-['Inter'] text-sm text-left transition-colors hover:border-[#CAD5E2] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    >
                      <span
                        className={imageFile ? "min-w-0 truncate text-[#1D293D]" : "text-[#90A1B9]"}
                      >
                        {imageFile ? imageFile.name : "Attach Image here"}
                      </span>
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="ml-auto shrink-0"
                      >
                        <path
                          d="M5 21C4.45 21 3.97933 20.8043 3.588 20.413C3.19667 20.0217 3.00067 19.5507 3 19V5C3 4.45 3.196 3.97933 3.588 3.588C3.98 3.19667 4.45067 3.00067 5 3H19C19.55 3 20.021 3.196 20.413 3.588C20.805 3.98 21.0007 4.45067 21 5V19C21 19.55 20.8043 20.021 20.413 20.413C20.0217 20.805 19.5507 21.0007 19 21H5ZM5 19H19V5H5V19ZM6 17H18L14.25 12L11.25 16L9 13L6 17Z"
                          fill="#8F8F8F"
                        />
                      </svg>
                    </button>
                    {imagePreview && (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 border-[#E2E8F0]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="relative">
                    <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                      Category <span className="text-[#EC003F]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryDropdown(!showCategoryDropdown);
                        setShowSubCategoryDropdown(false);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-left font-['Inter'] text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                    >
                      <span className={selectedCategory ? "text-[#1D293D]" : "text-[#90A1B9]"}>
                        {selectedCategory
                          ? categories?.find((c) => c.id === selectedCategory)?.name
                          : "Select category..."}
                      </span>
                      <ChevronDown className="h-5 w-5 text-[#90A1B9]" />
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-auto scrollbar-subtle rounded-xl border-2 border-[#E2E8F0] bg-white shadow-lg">
                        {categories?.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setSelectedSubCategory(null);
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left font-['Inter'] text-sm font-medium text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                      Sub Category
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSubCategoryDropdown(!showSubCategoryDropdown);
                        setShowCategoryDropdown(false);
                      }}
                      disabled={!selectedCategory}
                      className="flex w-full items-center justify-between rounded-xl border-2 border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-left font-['Inter'] text-sm focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className={selectedSubCategory ? "text-[#1D293D]" : "text-[#90A1B9]"}>
                        {selectedSubCategory
                          ? selectedCategoryData?.subcategories?.find(
                              (s) => s.id === selectedSubCategory
                            )?.name
                          : "Select sub category..."}
                      </span>
                      <ChevronDown className="h-5 w-5 text-[#90A1B9]" />
                    </button>
                    {showSubCategoryDropdown && selectedCategoryData && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-2 max-h-60 overflow-auto scrollbar-subtle rounded-xl border-2 border-[#E2E8F0] bg-white shadow-lg">
                        {selectedCategoryData.subcategories?.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setSelectedSubCategory(sub.id);
                              setShowSubCategoryDropdown(false);
                            }}
                            className="w-full px-4 py-3 text-left font-['Inter'] text-sm font-medium text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end border-t border-[#E2E8F0] pt-6">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-2xl px-8 py-4 font-['Inter'] text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl"
                  style={{ backgroundColor: PRIMARY }}
                >
                  Next Step
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Variant Groups */}
              <div className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-['Inter'] text-xl font-bold text-[#1D293D]">
                    <Layers className="h-6 w-6" />
                    Variant Groups
                  </h2>
                  <button
                    type="button"
                    onClick={handleAddVariantGroup}
                    className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 font-['Inter'] text-sm font-bold text-[#45556C] transition-colors hover:bg-[#F8FAFC]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Variant Group
                  </button>
                </div>

                {variantGroups.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] py-12 text-center">
                    <Layers className="mx-auto mb-3 h-12 w-12 text-[#90A1B9]" />
                    <p className="font-['Inter'] text-sm font-medium text-[#62748E]">
                      No variant groups added yet. Click &quot;Add Variant Group&quot; to create
                      variants like Size, Crust, etc.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantGroups.map((group) => (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6"
                      >
                        <div className="mb-4 flex items-start gap-4">
                          <div className="flex-1">
                            <label className="mb-2 block font-['Inter'] text-sm font-bold text-[#45556C]">
                              Group Name (e.g., Size, Crust)
                            </label>
                            <input
                              type="text"
                              value={group.name}
                              onChange={(e) =>
                                handleUpdateVariantGroup(group.id, "name", e.target.value)
                              }
                              placeholder="Enter group name..."
                              className="w-full rounded-xl border-2 border-[#E2E8F0] bg-white px-4 py-3 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantGroup(group.id)}
                            className="mt-8 rounded-xl p-2 text-red-500 transition-colors hover:bg-red-50"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="block font-['Inter'] text-sm font-bold text-[#45556C]">
                            Options
                          </label>
                          {group.options.map((option, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const next = [...group.options];
                                  next[idx] = e.target.value;
                                  handleUpdateVariantGroup(group.id, "options", next);
                                }}
                                placeholder={`Option ${idx + 1}...`}
                                className="flex-1 rounded-xl border-2 border-[#E2E8F0] bg-white px-4 py-2 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                              />
                              {group.options.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantOption(group.id, idx)}
                                  className="rounded-xl p-2 text-[#90A1B9] transition-colors hover:bg-red-50 hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleAddVariantOption(group.id)}
                            className="flex items-center gap-1 font-['Inter'] text-sm font-bold text-[#EA580C]"
                          >
                            <Plus className="h-4 w-4" />
                            Add Option
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {variantGroups.length > 0 && (
                  <div className="mt-6 border-t border-[#E2E8F0] pt-6">
                    <h3 className="mb-3 font-['Inter'] text-sm font-bold text-[#45556C]">
                      Generated Combinations ({variantCombinations.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {variantCombinations.map((combo, i) => (
                        <span
                          key={i}
                          className="rounded-lg bg-[#F1F5F9] px-3 py-1.5 font-['Inter'] text-sm font-medium text-[#45556C]"
                        >
                          {combo.combination}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Branch Configuration */}
              <div className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-8">
                <h2 className="mb-6 flex items-center gap-2 font-['Inter'] text-xl font-bold text-[#1D293D]">
                  <Store className="h-6 w-6" />
                  Branch Configuration
                </h2>

                <div className="mb-6">
                  <label className="mb-3 block font-['Inter'] text-sm font-bold text-[#45556C]">
                    Select Branches <span className="text-[#EC003F]">*</span>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {allBranches?.map((branch) => (
                      <button
                        key={branch.id}
                        type="button"
                        onClick={() => handleToggleBranch(branch.id.toString())}
                        className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          selectedBranches.includes(branch.id.toString())
                            ? "border-[#EA580C] bg-[#EA580C]/5"
                            : "border-[#E2E8F0] hover:border-[#CAD5E2]"
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${
                            selectedBranches.includes(branch.id.toString())
                              ? "border-[#EA580C] bg-[#EA580C]"
                              : "border-[#E2E8F0]"
                          }`}
                        >
                          {selectedBranches.includes(branch.id.toString()) && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-['Inter'] text-sm font-bold text-[#1D293D]">
                            {branch.name}
                          </div>
                          <div className="font-['Inter'] text-xs text-[#62748E]">
                            {branch.location}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedBranches.map((branchId) => {
                  const branch = allBranches?.find((b) => b.id.toString() === branchId);
                  if (!branch) return null;

                  return (
                    <div key={branchId} className="mb-8 last:mb-0">
                      <div className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                        <h3 className="mb-4 flex items-center gap-2 font-['Inter'] text-base font-bold text-[#1D293D]">
                          <Store className="h-5 w-5" />
                          {branch.name}
                        </h3>

                        <div className="space-y-4">
                          {variantCombinations.map((combo) => {
                            const rawVariantData =
                              branchConfigs[branchId]?.variants[combo.combination];
                            const variantData: BranchVariantConfig = {
                              price: rawVariantData?.price ?? "",
                              quantity: rawVariantData?.quantity ?? "",
                              isUnlimited: rawVariantData?.isUnlimited ?? false,
                              addonGroups: rawVariantData?.addonGroups ?? [],
                              expireDate: rawVariantData?.expireDate ?? "",
                              batchNo: rawVariantData?.batchNo ?? "",
                            };

                            return (
                              <div
                                key={combo.combination}
                                className="rounded-xl border border-[#E2E8F0] bg-white p-4"
                              >
                                <div className="mb-3 font-['Inter'] text-sm font-bold text-[#45556C]">
                                  {combo.combination}
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                  <div>
                                    <label className="mb-1 block font-['Inter'] text-xs font-bold text-[#45556C]">
                                      Price (Rs.) <span className="text-[#EC003F]">*</span>
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.01}
                                      value={variantData.price}
                                      onChange={(e) =>
                                        handleUpdateBranchVariant(
                                          branchId,
                                          combo.combination,
                                          "price",
                                          e.target.value
                                        )
                                      }
                                      placeholder="0.00"
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block font-['Inter'] text-xs font-bold text-[#45556C]">
                                      Quantity{" "}
                                      {!variantData.isUnlimited && (
                                        <span className="text-[#EC003F]">*</span>
                                      )}
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      step={1}
                                      value={variantData.quantity}
                                      disabled={variantData.isUnlimited}
                                      onChange={(e) =>
                                        handleUpdateBranchVariant(
                                          branchId,
                                          combo.combination,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      placeholder="0"
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    />
                                    <label className="mt-2 flex cursor-pointer items-center gap-2 font-['Inter'] text-xs text-[#45556C]">
                                      <input
                                        type="checkbox"
                                        checked={variantData.isUnlimited}
                                        onChange={(e) =>
                                          handleUpdateBranchVariant(
                                            branchId,
                                            combo.combination,
                                            "isUnlimited",
                                            e.target.checked
                                          )
                                        }
                                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#CAD5E2] accent-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/35"
                                      />
                                      <span>Unlimited quantity (prepared on demand)</span>
                                    </label>
                                  </div>
                                  <div>
                                    <label className="mb-1 block font-['Inter'] text-xs font-bold text-[#45556C]">
                                      Batch No
                                    </label>
                                    <input
                                      type="text"
                                      value={variantData.batchNo}
                                      onChange={(e) =>
                                        handleUpdateBranchVariant(
                                          branchId,
                                          combo.combination,
                                          "batchNo",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Batch..."
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-['Inter'] text-sm text-[#1D293D] placeholder:text-[#90A1B9] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block font-['Inter'] text-xs font-bold text-[#45556C]">
                                      Expiry Date
                                    </label>
                                    <input
                                      type="date"
                                      value={variantData.expireDate}
                                      onChange={(e) =>
                                        handleUpdateBranchVariant(
                                          branchId,
                                          combo.combination,
                                          "expireDate",
                                          e.target.value
                                        )
                                      }
                                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-['Inter'] text-sm text-[#1D293D] focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="mb-2 block font-['Inter'] text-xs font-bold text-[#45556C]">
                                      Add-on Groups
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                      {modificationGroups?.map((g) => (
                                        <button
                                          key={g.id}
                                          type="button"
                                          onClick={() =>
                                            handleToggleAddonGroup(
                                              branchId,
                                              combo.combination,
                                              g.id
                                            )
                                          }
                                          className={`rounded-lg px-3 py-1.5 font-['Inter'] text-xs font-bold transition-all ${
                                            variantData.addonGroups.includes(g.id)
                                              ? "bg-[#EA580C] text-white"
                                              : "bg-[#F1F5F9] text-[#45556C] hover:bg-[#E2E8F0]"
                                          }`}
                                        >
                                          {g.title}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isMutating}
                  className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-6 py-3 font-['Inter'] text-sm font-bold text-[#45556C] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Previous Step
                </button>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={selectedBranches.length === 0 || isMutating}
                  aria-busy={isMutating}
                  className="flex min-w-44 items-center justify-center gap-2 rounded-xl px-8 py-3 font-['Inter'] text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: PRIMARY }}
                >
                  {isMutating ? (
                    <>
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                      <span>{isEditing ? "Updating…" : "Creating…"}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 shrink-0" aria-hidden />
                      <span>{isEditing ? "Update Product" : "Create Product"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
