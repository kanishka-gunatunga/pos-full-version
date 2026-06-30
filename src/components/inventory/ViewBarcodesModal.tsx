"use client";

import { X, Printer, Tag, Download, Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import { toast } from "sonner";
import axios from "axios";

type ViewBarcodesModalProps = {
  open: boolean;
  product: Product | null;
  onClose: () => void;
};

export default function ViewBarcodesModal({ open, product, onClose }: ViewBarcodesModalProps) {
  if (!open || !product) return null;

  const handlePrint = async (id: number, type: "product" | "variation", barcode: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/products/print-barcode/${id}?type=${type}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `barcode-${barcode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Barcode label generated");
    } catch (err: any) {
      console.error("Failed to print barcode:", err);
      toast.error("Failed to generate barcode label");
    }
  };

  const barcodes: { id: number; name: string; barcode: string; type: "product" | "variation" }[] = [];
  
  if (product.variations && product.variations.length > 0) {
    product.variations.forEach(v => {
      v.options?.forEach(o => {
        if (o.barcode) {
          barcodes.push({
            id: o.id,
            name: `${product.name} (${o.name})`,
            barcode: o.barcode,
            type: "variation" as const
          });
        }
      });
    });
  } else if (product.barcode) {
    barcodes.push({
      id: product.id,
      name: product.name,
      barcode: product.barcode,
      type: "product" as const
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 transition-opacity duration-300">
      <div 
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-[20px] border border-[#E2E8F0] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex shrink-0 items-start justify-between">
          <div>
            <h2 className="font-['Inter'] text-[20px] font-bold text-[#1D293D]">
              Product Barcodes
            </h2>
            <p className="mt-1 font-['Inter'] text-sm text-[#90A1B9]">
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-2 [scrollbar-width:thin]">
          {barcodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Tag className="mb-2 h-10 w-10 text-[#E2E8F0]" />
              <p className="text-sm text-[#90A1B9]">No barcodes available for this product</p>
            </div>
          ) : (
            barcodes.map((item, idx) => (
              <div 
                key={idx} 
                className="group relative rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-4 transition-all hover:border-[#EA580C]/30 hover:bg-white hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-['Inter'] text-xs font-bold uppercase tracking-wider text-[#90A1B9]">
                      {item.type === 'variation' ? 'Variation' : 'Base Product'}
                    </p>
                    <p className="truncate font-['Inter'] text-sm font-bold text-[#1D293D]">
                      {item.name}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePrint(item.id, item.type, item.barcode)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#EA580C] shadow-sm transition-colors hover:bg-[#EA580C] hover:text-white"
                    title="Download/Print Label"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center justify-center rounded-lg bg-white p-3 border border-[#F1F5F9]">
                  {/* Visual Barcode Placeholder using a font or external API */}
                  <img 
                    src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${item.barcode}&scale=2&rotate=N&includetext`} 
                    alt={item.barcode}
                    className="h-16 max-w-full object-contain"
                  />
                  <p className="mt-2 font-mono text-sm tracking-[0.2em] text-[#45556C]">
                    {item.barcode}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full rounded-[14px] bg-[#1D293D] py-3 font-['Inter'] text-sm font-bold text-white transition-colors hover:bg-[#2D3C52]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
