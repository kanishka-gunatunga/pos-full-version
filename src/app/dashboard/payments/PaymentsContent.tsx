"use client";

import { useState } from "react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import PaymentStats from "@/components/payments/PaymentStats";
import PaymentHistoryTable from "@/components/payments/PaymentHistoryTable";
import { Search, Filter } from "lucide-react";
import { useGetAllPaymentDetails, useSearchPaymentDetails, useFilterPaymentsByStatus } from "@/hooks/usePayment";

const FILTERS = ["All", "Pending", "Paid", "Refund"];

export default function PaymentsContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: allPayments, isLoading: isAllLoading } = useGetAllPaymentDetails();
  const { data: searchResults, isLoading: isSearchLoading } = useSearchPaymentDetails(searchTerm);
  const { data: filterResults, isLoading: isFilterLoading } = useFilterPaymentsByStatus(activeFilter);

  const getPaymentsToDisplay = () => {
    if (searchTerm) return searchResults || [];
    if (activeFilter !== "All") return filterResults || [];
    return allPayments || [];
  };

  const isLoading = isAllLoading || isSearchLoading || isFilterLoading;
  const payments = getPaymentsToDisplay();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[24px] font-bold text-[#1D293D]">Payment Transactions</h1>
              <p className="mt-1 text-[14px] text-[#62748E]">
                Detailed record of all financial transactions and payment statuses.
              </p>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#90A1B9]" />
              <input
                type="text"
                placeholder="Search by Order ID or Customer Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-14 w-full rounded-[20px] border border-[#E2E8F0] bg-white pl-12 pr-4 text-[14px] text-[#1D293D] outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
              />
            </div>
          </div>

          <PaymentStats />

          <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[#314158]" />
              <span className="text-[14px] font-bold text-[#314158]">Payment Status</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`h-11 rounded-[14px] px-6 text-[14px] font-bold transition-all active:scale-95 ${activeFilter === filter
                    ? "bg-[#00BC7D] text-white shadow-lg shadow-[#00BC7D]/20"
                    : "bg-[#F1F5F9] text-[#45556C] hover:bg-[#E2E8F0]"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <PaymentHistoryTable payments={payments} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
