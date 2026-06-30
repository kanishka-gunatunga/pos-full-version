"use client";

import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import TableManagement from "@/components/customers/TableManagement";

export default function TablesContent() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <TableManagement />
      </div>
    </div>
  );
}
