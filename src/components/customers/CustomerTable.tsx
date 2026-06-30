"use client";

import { User, Phone, MapPin, Pencil, Power, PowerOff, Check } from "lucide-react";
import { Customer } from "@/types/customer";

interface CustomerTableProps {
  searchTerm: string;
  customers: Customer[];
  isLoading: boolean;
  onEdit: (customer: Customer) => void;
  onToggleStatus: (customer: Customer) => void;
  onTogglePromotion: (customer: Customer) => void;
}

export default function CustomerTable({
  searchTerm,
  customers = [],
  isLoading,
  onEdit,
  onToggleStatus,
  onTogglePromotion,
}: CustomerTableProps) {
  const displayCustomers = customers || [];

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#F1F5F9] bg-[#F8FAFC]">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                ID
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                Customer Info
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                Mobile
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                Address
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                Category
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
                Promotions
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9] text-center">
                Orders
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9] text-center">
                Loyalty
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-[#90A1B9] text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-[14px] font-medium text-[#62748E]">Loading customers...</p>
                  </div>
                </td>
              </tr>
            ) : displayCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-[14px] font-medium text-[#62748E]">
                    {searchTerm
                      ? "No customers found matching your search."
                      : "No customers available."}
                  </p>
                </td>
              </tr>
            ) : (
              displayCustomers.map((customer) => (
                <tr key={customer.id} className="group hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 text-[11px] font-bold text-[#90A1B9]">{customer.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center border border-[#F1F5F9] justify-center rounded-full bg-[#F8FAFC] text-[#90A1B9]">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#314158]">{customer.name}</p>
                        {customer.latest_order_date && (
                          <p className="text-[10px] text-[#90A1B9]">
                            Last visit: {new Date(customer.latest_order_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[14px] text-[#45556C] font-semibold">
                      <Phone className="h-3.5 w-3.5 text-[#90A1B9]" />
                      {customer.mobile}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-[12px] text-[#45556C] font-medium max-w-[250px] truncate">
                      <MapPin className="h-3.5 w-3.5 text-[#90A1B9] shrink-0" />
                      {customer.address || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        customer.category === "management"
                          ? "bg-purple-100 text-purple-700 border border-purple-200"
                          : customer.category === "staff"
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {customer.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onTogglePromotion(customer)}
                      className={`flex h-5 w-5 cursor-pointer items-center justify-center rounded-[4px] transition-all hover:scale-110 active:scale-95 ${
                        customer.promotions_enabled
                          ? "bg-[#EA580C] shadow-sm shadow-primary/20"
                          : "border-2 border-[#E2E8F0] hover:border-[#EA580C]/30"
                      }`}
                    >
                      {customer.promotions_enabled && (
                        <Check className="h-3.5 w-3.5 text-white stroke-[3px]" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-7 min-w-[32px] items-center justify-center rounded-full bg-[#EEF2FF] px-3 text-[12px] font-bold text-[#4F39F6]">
                      {customer.orders_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-7 min-w-[32px] items-center justify-center border border-1-[#FFE6BE] rounded-full bg-[#FEF7DB80] px-3 text-[12px] font-bold text-[#F58F00]">
                      {customer.loyalty_points || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-[#90A1B9]">
                      <button
                        onClick={() => onEdit(customer)}
                        className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-xl border border-[#E2E8F0] hover:bg-white hover:text-primary transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onToggleStatus(customer)}
                        title={
                          customer.status === "active" ? "Deactivate Customer" : "Activate Customer"
                        }
                        className={`flex h-8 w-8 items-center cursor-pointer justify-center rounded-xl border border-[#E2E8F0] transition-colors ${
                          customer.status === "active"
                            ? "hover:bg-red-50 hover:text-red-500"
                            : "hover:bg-green-50 hover:text-green-500"
                        }`}
                      >
                        {customer.status === "active" ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
