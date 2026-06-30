"use client";

import { useSyncExternalStore, useState, useEffect } from "react";
import { Clock, CheckCircle2, XCircle, Users, Tag, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import BranchBuildingIcon from "@/components/icons/BranchBuildingIcon";
import ExpiredBadgeIcon from "@/components/icons/ExpiredBadgeIcon";
import ExpiredCalendarIcon from "@/components/icons/ExpiredCalendarIcon";
import RestockPackageIcon from "@/components/icons/RestockPackageIcon";
import SystemOverviewIcon from "@/components/icons/SystemOverviewIcon";
import TotalUsersIcon from "@/components/icons/TotalUsersIcon";
import TodayCalendarIcon from "@/components/icons/TodayCalendarIcon";
import RevenueChartIcon from "@/components/icons/RevenueChartIcon";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { getFirstName } from "@/lib/format";
import { getAdminDashboardStats, type AdminDashboardData } from "@/services/dashboardService";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function AdminDashboardContent() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const stats = await getAdminDashboardStats();
        setData(stats);
      } catch (err) {
        const res = (err as { response?: { status?: number; data?: unknown } })?.response;
        console.error("Error fetching admin dashboard stats:", err, "status:", res?.status, "data:", res?.data);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted) return null;

  const metrics = {
    totalCustomers: data?.totalCustomersCount || 0,
    totalBranches: data?.totalBranchesCount || 0,
    totalUsers: data?.totalUsersCount || 0,
    totalRevenue: data ? `Rs.${parseFloat(data.totalRevenue).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : "Rs.0.00",
    completedOrders: data?.todayCompletedOrdersCount || 0,
    activeOrders: data?.todayActiveOrdersCount || 0,
    cancelledOrders: data?.todayCancelledOrdersCount || 0,
  };

  const expiredItems = data?.expiredProductsList || [];
  const restockAlerts = data?.restockAlertsList || [];
  const discountAlerts = data?.discountAlertsList || [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <DashboardPageHeader />
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <header className="mb-4 flex shrink-0 flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-['Inter'] text-xl font-bold leading-tight text-[#1D293D] sm:text-3xl sm:leading-9">
              {getGreeting()}, {getFirstName(user?.name) || "Admin"}!
            </h1>
            <div className="mt-1 flex items-center gap-2 font-['Inter'] text-base font-normal leading-6 text-[#62748E]">
              <SystemOverviewIcon className="h-4 w-4 shrink-0 text-[#62748E]" />
              <span>System Overview</span>
            </div>
          </div>
          <button
            type="button"
            className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-4 font-['Inter'] text-sm font-bold leading-5 text-[#45556C] hover:bg-[#F8FAFC]"
          >
            <TodayCalendarIcon className="h-4 w-4 shrink-0 text-[#45556C]" />
            Today
          </button>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#155DFC]" />
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <main className="space-y-4 sm:space-y-6">
            {/* Row 1: System Metrics */}
            <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {/* Total Customers */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F3E8FF]">
                  <Users className="h-7 w-7 text-[#9810FA]" />
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.totalCustomers}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Total Customers
                </p>
              </div>

              {/* Total Branches */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#E0E7FF]">
                  <BranchBuildingIcon className="h-7 w-7 text-[#4F39F6]" />
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.totalBranches}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Total Branches
                </p>
              </div>

              {/* Total Users */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#CEFAFE]">
                  <TotalUsersIcon className="h-7 w-7 text-[#0092B8]" />
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.totalUsers}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Total Users
                </p>
              </div>

              {/* Total Revenue */}
              <div className="relative min-w-0 overflow-hidden rounded-[24px] border border-[#51A2FF] p-4 shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A] sm:p-5 bg-[linear-gradient(135deg,#00BC7D_0%,#009966_100%)]">
                <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                  <RevenueChartIcon className="h-6 w-6" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white/20">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
                  <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#FFFFFF]">
                    {metrics.totalRevenue}
                  </p>
                </div>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-white/90">
                  Total Revenue
                </p>
              </div>

              {/* Completed Orders */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#DCFCE7]">
                    <CheckCircle2 className="h-7 w-7 text-[#00A63E]" />
                  </div>
                  <span className="rounded-[10px] bg-[#F0FDF4] px-2 py-0.5 font-['Inter'] text-[10px] font-bold uppercase leading-4 text-[#00A63E]">
                    TODAY
                  </span>
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.completedOrders}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Completed Orders
                </p>
              </div>

              {/* Active Orders */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#DBEAFE]">
                  <Clock className="h-7 w-7 text-[#155DFC]" />
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.activeOrders}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Active Orders
                </p>
              </div>

              {/* Cancelled Orders */}
              <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#FFE4E6]">
                  <XCircle className="h-7 w-7 text-[#EC003F]" />
                </div>
                <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                  {metrics.cancelledOrders}
                </p>
                <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                  Cancelled Orders
                </p>
              </div>
            </div>

            {/* Row 2: Alert Panels */}
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Expired Items */}
              <div className="flex max-h-[643px] flex-col overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <div className="shrink-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FFE4E6]">
                        <ExpiredCalendarIcon className="h-5 w-5 text-[#E7000B]" />
                      </div>
                      <div>
                        <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                          Expired Items
                        </h2>
                        <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                          All branches
                        </p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FFE4E6]">
                      <span className="font-['Inter'] text-sm font-bold leading-5 text-[#EC003F]">
                        {expiredItems.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="scrollbar-subtle mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
                  {expiredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-[16px] border-2 border-[#FFC9C9] bg-[#FEF2F2] px-4 py-4"
                    >
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 font-bold text-lg">{item.productName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                          {item.productName}
                        </p>
                        <span className="flex flex-wrap items-center gap-x-2 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                          {[item.categoryName, item.variationName, `${item.quantity} units`, item.batchNo ? `${item.batchNo} ${item.branchName}` : item.branchName]
                            .filter(Boolean)
                            .map((part, i) => (
                              <span key={i} className="contents">
                                {i > 0 && <span className="text-[#CAD5E2]">•</span>}
                                <span>{part}</span>
                              </span>
                            ))}
                        </span>
                        {item.expiredDaysText && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-[10px] border border-[#FFC9C9] bg-[#FFE2E2] px-2 py-1 font-['Inter'] text-xs font-bold leading-4 text-[#C10007]">
                            <ExpiredBadgeIcon className="h-3 w-3 text-[#C10007]" />
                            {item.expiredDaysText}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {expiredItems.length === 0 && (
                    <p className="text-center text-sm text-gray-400 pb-4">No expired items.</p>
                  )}
                </div>
              </div>

              {/* Restock Alerts */}
              <div className="flex max-h-[643px] flex-col overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <div className="shrink-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FEF3C6]">
                        <RestockPackageIcon className="h-5 w-5 text-[#E17100]" />
                      </div>
                      <div>
                        <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                          Restock Alerts
                        </h2>
                        <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                          Low stock items
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[#FE9A00]" />
                      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FEF3C6] font-['Inter'] text-sm font-bold leading-5 text-[#E17100]">
                        {restockAlerts.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="scrollbar-subtle mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
                  {restockAlerts.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 rounded-[16px] border-2 border-[#FEE685] bg-[#FFFBEB] px-4 py-4"
                    >
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 font-bold text-lg">{item.productName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                          {item.productName}
                        </p>
                        <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                          {item.categoryName} {item.variationName ? `• ${item.variationName}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0 font-['Inter'] text-xs leading-4">
                          <span className="inline-flex items-center gap-1 rounded-[10px] border border-[#FEE685] bg-[#FEF3C6] px-2 py-1 font-bold text-[#E17100]">
                            <AlertTriangle className="h-3 w-3" />
                            {item.leftQuantityText || `Only ${item.quantity} left`}
                          </span>
                          <span className="font-normal text-[#90A1B9]">{item.averageSaleForWeek}/week avg</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {restockAlerts.length === 0 && (
                    <p className="text-center text-sm text-gray-400 pb-4">No restock alerts.</p>
                  )}
                </div>
              </div>

              {/* Discount Alerts */}
              <div className="flex max-h-[643px] flex-col overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <div className="shrink-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                        <Tag className="h-5 w-5 text-[#155DFC]" />
                      </div>
                      <div>
                        <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                          Discount Alerts
                        </h2>
                        <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                          Expiring within 7 days
                        </p>
                      </div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#DBEAFE]">
                      <span className="font-['Inter'] text-sm font-bold leading-5 text-[#155DFC]">
                        {discountAlerts.length}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="scrollbar-subtle mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-6 pb-6 pr-5">
                  {discountAlerts.map((item) => {
                    const isPercentage = item.discountValueText?.includes("%");
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-1 rounded-[16px] border-2 border-[#BEDBFF] bg-[#EFF6FF] p-[18px]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                            {item.title}
                          </p>
                          <button
                            type="button"
                            className="shrink-0 rounded-[10px] text-[#EA580C] px-3 py-1.5 font-['Inter'] text-xs font-bold hover:text-[#c2410c]"
                          >
                            MORE
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-[10px] border px-2 py-1 font-['Inter'] text-[10px] font-bold leading-4 ${
                              isPercentage
                                ? "border-[#E9D4FF] bg-[#F3E8FF] text-[#8200DB]"
                                : "border-[#A4F4CF] bg-[#D0FAE5] text-[#007A55]"
                            }`}
                          >
                            {item.discountValueText}
                          </span>
                        </div>
                        <p className="font-['Inter'] mt-1 text-xs font-bold leading-4 text-[#62748E]">
                          {item.itemsSummary}
                        </p>
                        <p className="font-['Inter'] text-xs font-normal leading-4 text-[#90A1B9]">
                          Expires: {new Date(item.expireDate).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  })}
                  {discountAlerts.length === 0 && (
                    <p className="text-center text-sm text-gray-400 pb-4">No active discount alerts.</p>
                  )}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
