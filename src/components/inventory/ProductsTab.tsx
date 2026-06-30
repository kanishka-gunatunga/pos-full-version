"use client";

import { Package, Pencil, Trash2, Calendar, FileText, Loader2, Power, Hash, Tag, Barcode } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllProducts,
  useSearchProducts,
  useActivateProduct,
  useDeactivateProduct
} from "@/hooks/useProduct";
import { Product } from "@/types/product";
import { formatDate } from "@/lib/format";
import { useState } from "react";
import ViewBarcodesModal from "./ViewBarcodesModal";

type ProductsTabProps = {
  branchId: string;
  searchQuery: string;
  onEditProduct: (product: Product) => void;
};

export default function ProductsTab({ branchId, searchQuery, onEditProduct }: ProductsTabProps) {
  const { data: allProducts, isLoading: isAllLoading, error: allWarning } = useGetAllProducts({ status: "all" });
  const { data: searchResults, isLoading: isSearchLoading } = useSearchProducts(searchQuery, "all");
  const activateMutation = useActivateProduct();
  const deactivateMutation = useDeactivateProduct();

  const [selectedProductForBarcode, setSelectedProductForBarcode] = useState<Product | null>(null);

  const products = searchQuery ? searchResults : allProducts;
  const isLoading = searchQuery ? isSearchLoading : isAllLoading;

  const handleToggleStatus = async (product: Product) => {
    try {
      if (product.status === "active") {
        await deactivateMutation.mutateAsync(product.id);
        toast.success("Product deactivated successfully");
      } else {
        await activateMutation.mutateAsync(product.id);
        toast.success("Product activated successfully");
      }
    } catch (err: any) {
      console.error("Failed to toggle product status:", err);
      toast.error(err?.response?.data?.message || "Failed to change product status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-[#F1F5F9] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]  font-['Inter']">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <th className="p-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Product Name
                </th>
                <th className="p-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Category
                </th>
                <th className="p-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Sub Category
                </th>
                <th className="p-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Image
                </th>
                <th className="p-4 text-left text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Product Description
                </th>
                <th className="p-4 text-right text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products && products.length > 0 ? (
                products.map((product) => {
                  const variationOption = product.variations?.[0]?.options?.[0];
                  // const branchPrice = variationOption?.prices?.find(p => p.branchId.toString() === branchId);

                  return (
                    <tr key={product.id} className={`border-b border-[#F1F5F9] transition-opacity hover:bg-[#F8FAFC]/50 ${product.status === 'inactive' ? 'opacity-60 bg-[#F8FAFC]' : ''}`}>
                      <td className="p-4">
                        <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                          {product.name}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-['Inter'] text-sm font-medium text-[#45556C]">
                          {product.category?.name || "-"}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-['Inter'] text-sm font-medium text-[#45556C]">
                          {product.subCategory?.name || "-"}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#E2E8F0]">
                          {product.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="absolute inset-0 m-auto h-6 w-6 text-[#90A1B9]" />
                          )}
                        </div>
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="font-['Inter'] text-sm text-[#62748E] line-clamp-2">
                          {product.description || "-"}
                        </p>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProductForBarcode(product)}
                            className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#EA580C1A] hover:text-[#EA580C]"
                            title="View Barcodes"
                          >
                            <Barcode className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            className="rounded-lg p-2 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(product)}
                            className="rounded-lg p-2 text-[#90A1B9] hover:bg-red-50 hover:text-red-500"
                            title={product.status === "inactive" ? "Activate" : "Deactivate"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center font-['Inter'] text-sm text-[#90A1B9]">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="h-10 w-10 opacity-20" />
                      No results available
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ViewBarcodesModal
        open={!!selectedProductForBarcode}
        product={selectedProductForBarcode}
        onClose={() => setSelectedProductForBarcode(null)}
      />
    </div>
  );
}
