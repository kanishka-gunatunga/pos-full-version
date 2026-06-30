"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Filter,
  Calendar,
  Building,
  Package,
} from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { useGetAllBranches } from "@/hooks/useBranch";
import { useGetAllProducts } from "@/hooks/useProduct";

import { useGenerateReport } from "@/hooks/useReport";
import {
  generateOrdersReport,
  generateProductWiseReport,
  generatePaymentReport,
  generateSalesReport,
} from "@/lib/pdfGenerator";
import { format } from "date-fns";

export type ReportType =
  | "sales"
  | "inventory"
  | "user_activity"
  | "order_summary"
  | "payment"
  | "product_performance"
  | "branch_performance"
  | "discount_usage"
  | "products";

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: "sales", label: "Sales Report" },
  { id: "order_summary", label: "Orders Report" },
  { id: "payment", label: "Payment Report" },
  { id: "product_performance", label: "Product Performance Report" },
  { id: "products", label: "Products Report" },
];

export default function ReportsContent() {
  const { data: branches = [], isLoading: branchesLoading } = useGetAllBranches("all");
  const { data: products = [], isLoading: productsLoading } = useGetAllProducts({ status: "all" });
  
  const [selectedReport, setSelectedReport] = useState<ReportType>("sales");
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [branch, setBranch] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [printSalesReport, setPrintSalesReport] = useState(false);

  const generateReportMutation = useGenerateReport();

  const branchSelectValue =
    branch === "all" || branches.some((b) => String(b.id) === branch)
      ? branch
      : "all";

  const handleGenerateReport = async () => {
    try {
      let reportTypePath: string = selectedReport;
      if (selectedReport === "order_summary") reportTypePath = "orders";
      if (selectedReport === "product_performance") reportTypePath = "product-performance";
      if (selectedReport === "payment") reportTypePath = "payments";

      const reportDataRaw = await generateReportMutation.mutateAsync({
        startDate: fromDate,
        endDate: toDate,
        branch: branch === "all" ? "all" : branch,
        reportTypePath,
        product: selectedProduct !== "all" ? selectedProduct : undefined,
        print: selectedReport === "sales" ? printSalesReport : undefined,
      });

      if (selectedReport === "sales" && printSalesReport) {
        if (reportDataRaw.success !== false) {
          toast.success(reportDataRaw.message || "Sales report has been sent to the printer successfully.");
        } else {
          toast.error(reportDataRaw.message || "Failed to process the sales report.");
        }
        return;
      }

      const reportData = reportDataRaw.data || [];
      const reportSummary = reportDataRaw.summary || {};

      if (!reportData || reportData.length === 0) {
        toast.error("No data found for the selected criteria.");
        return;
      }

      const branchName = branch === "all" ? "All Branches" : branches.find((b) => String(b.id) === branch)?.name || "N/A";
      const conf = {
        title: REPORT_TYPES.find(r => r.id === selectedReport)?.label || "Report",
        dateRange: `${format(new Date(fromDate), "MMM dd, yyyy")} - ${format(new Date(toDate), "MMM dd, yyyy")}`,
        branchName,
        summary: reportSummary,
      };

      if (selectedReport === "product_performance" || selectedReport === "products") {
        generateProductWiseReport(reportData, {
          ...conf,
          dateRange: selectedReport === "products" ? "N/A" : conf.dateRange
        });
      } else if (selectedReport === "payment") {
        generatePaymentReport(reportData, conf);
      } else if (selectedReport === "order_summary") {
        generateOrdersReport(reportData, conf);
      } else if (selectedReport === "sales") {
        generateSalesReport(reportData, conf);
      }
    } catch (error) {
      console.error("Failed to generate report", error);
      toast.error("An error occurred while generating the report.");
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-['Inter'] text-[30px] font-bold leading-9 text-[#1D293D]">
              Reports
            </h1>
            <p className="mt-1 font-['Inter'] text-[16px] font-normal leading-6 text-[#62748E]">
              Performance reports with real-time metrics and insights
            </p>
          </div>

          {/* Report Configuration */}
          <div className="flex w-full flex-col gap-4 rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                <Filter className="h-4 w-4 text-[#155DFC]" />
              </div>
              <span className="font-['Inter'] text-[20px] font-bold leading-7 text-[#1D293D]">
                Report Configuration
              </span>
            </div>

            <div className="rounded-[18px] bg-[#F8FAFC] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-6">
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                    Select Report
                  </label>
                  <div className="relative">
                    <select
                      value={selectedReport}
                      onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                      className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white px-4 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {REPORT_TYPES.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#90A1B9]">
                      ▼
                    </span>
                  </div>
                </div>

                {selectedReport !== "products" && (
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                      Select Date Range
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                      <div className="flex h-11 w-full items-center gap-2 rounded-[14px] border-2 border-[#E2E8F0] bg-white pl-10 pr-3">
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1D293D] outline-none"
                          aria-label="From date"
                        />
                        <span className="text-[#90A1B9]">—</span>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1D293D] outline-none"
                          aria-label="To date"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedReport !== "products" && (
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                      Branch
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                      <select
                        value={branchSelectValue}
                        onChange={(e) => setBranch(e.target.value)}
                        disabled={branchesLoading}
                        className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white pl-10 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="all">
                          {branchesLoading ? "Loading branches…" : "All Branches"}
                        </option>
                        {branches.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#90A1B9]">
                        ▼
                      </span>
                    </div>
                  </div>
                )}

                {(selectedReport === "sales" || selectedReport === "product_performance") && (
                  <div className="min-w-0 flex-1">
                    <label className="mb-1.5 block font-['Inter'] text-[12px] font-bold uppercase leading-4 text-[#45556C]">
                      Product (Optional)
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        disabled={productsLoading}
                        className="h-11 w-full appearance-none rounded-[14px] border-2 border-[#E2E8F0] bg-white pl-10 pr-10 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="all">
                          {productsLoading ? "Loading products…" : "All Products"}
                        </option>
                        {products && Array.isArray(products) && products.map((p: any) => (
                          <option key={p.id} value={String(p.id)}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#90A1B9]">
                        ▼
                      </span>
                    </div>
                  </div>
                )}

                {(selectedReport === "sales") && (
                  <div className="min-w-0 flex-1 flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printSalesReport}
                        onChange={(e) => setPrintSalesReport(e.target.checked)}
                        className="h-5 w-5 rounded border-[#E2E8F0] text-primary focus:ring-primary"
                      />
                      <span className="font-['Inter'] text-[14px] font-medium text-[#1D293D]">
                        Print Report
                      </span>
                    </label>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                  className="h-11 w-full flex-1 rounded-[14px] bg-[#EA580C] px-6 font-['Inter'] text-[14px] font-bold leading-5 text-white shadow-[0px_4px_6px_-4px_#EA580C33,0px_10px_15px_-3px_#EA580C33] transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {generateReportMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Generating...
                    </span>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
