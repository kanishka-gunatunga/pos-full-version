"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Calendar, Clock, ChefHat, CheckCircle2, Pause, Wallet, AlertTriangle, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { getFirstName, formatCurrency } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import { useGetCashierDashboard } from "@/hooks/useDashboard";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function useRealTimeClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
  useEffect(() => {
    const interval = setInterval(
      () =>
        setTime(
          new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        ),
      1000
    );
    return () => clearInterval(interval);
  }, []);
  return time;
}


export default function CashierDashboardContent() {
  const { user } = useAuth();
  const time = useRealTimeClock();
  const { data: dashboardData, isLoading, isError } = useGetCashierDashboard();
  
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#EA580C]" />
          <p className="font-['Inter'] text-sm font-medium text-[#62748E]">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="rounded-[24px] border border-red-100 bg-red-50 p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-4 font-['Inter'] text-lg font-bold text-red-900">
            Failed to load dashboard
          </h2>
          <p className="mt-1 font-['Inter'] text-sm text-red-600">
            Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-red-600 px-6 py-2 font-['Inter'] text-sm font-bold text-white transition-colors hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = {
    pending: dashboardData?.pendingOrdersCount || 0,
    preparing: dashboardData?.preparingOrdersCount || 0,
    ready: dashboardData?.readyOrdersCount || 0,
    hold: dashboardData?.holdOrdersCount || 0,
    drawerCash: formatCurrency(dashboardData?.drawerCash || 0),
  };

  const readyOrders = dashboardData?.readyOrdersList || [];
  const holdOrders = dashboardData?.holdOrdersList || [];
  const lowStockProducts = dashboardData?.lowStockProductsList || [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Header */}
      <DashboardPageHeader />
      <header className="mt-2 flex shrink-0 flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h1 className="font-['Inter'] text-xl font-bold leading-tight text-[#1D293D] sm:text-3xl sm:leading-9">
            {getGreeting()}, {getFirstName(user?.name) || "Cashier"}!
          </h1>
          <div className="mt-1 flex items-center gap-2 font-['Inter'] text-base font-normal leading-6 text-[#62748E]">
            <Calendar className="h-4 w-4" />
            <span>{getFormattedDate()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={ROUTES.DASHBOARD_MENU}
            className="flex h-14 items-center justify-center gap-2 rounded-[16px] bg-[#EA580C] px-5 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_8px_10px_-6px_#EA580C4D,0px_20px_25px_-5px_#EA580C4D] transition-colors duration-300 ease-out hover:bg-[#c2410c]"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3 6H21"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Start New Order
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto space-y-4 sm:space-y-6">
          {/* Metric cards */}
          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#FEF3C6]">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 28 28"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M14 25.6668C20.4434 25.6668 25.6667 20.4435 25.6667 14.0002C25.6667 7.55684 20.4434 2.3335 14 2.3335C7.55672 2.3335 2.33337 7.55684 2.33337 14.0002C2.33337 20.4435 7.55672 25.6668 14 25.6668Z"
                    stroke="#E17100"
                    strokeWidth="2.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 7V14L18.6667 16.3333"
                    stroke="#E17100"
                    strokeWidth="2.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                {metrics.pending}
              </p>
              <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                Pending Orders
              </p>
            </div>
            <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#DBEAFE]">
                <ChefHat className="h-7 w-7 text-[#155DFC]" />
              </div>
              <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                {metrics.preparing}
              </p>
              <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                Preparing Orders
              </p>
            </div>
            <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#F3E8FF]">
                <CheckCircle2 className="h-7 w-7 text-[#9810FA]" />
              </div>
              <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                {metrics.ready}
              </p>
              <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                Ready Orders
              </p>
            </div>
            <div className="min-w-0 rounded-[24px] border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#FFE4E6]">
                <Pause className="h-7 w-7 text-[#EC003F]" />
              </div>
              <p className="mt-3 font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#1D293D]">
                {metrics.hold}
              </p>
              <p className="font-['Inter'] text-sm font-medium leading-5 text-[#62748E]">
                Hold Orders
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[24px] border border-white/20 p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] sm:p-5 bg-[linear-gradient(135deg,#00BC7D_0%,#009966_100%)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-white/20">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <div className="scrollbar-subtle mt-3 min-w-0 overflow-x-auto">
                <p className="whitespace-nowrap font-['Inter'] text-[clamp(1.25rem,2.5vw+0.75rem,1.875rem)] font-bold leading-tight text-[#FFFFFF]">
                  {metrics.drawerCash}
                </p>
              </div>
              <p className="font-['Inter'] text-sm font-medium leading-5 text-[#D0FAE5]">
                Drawer Cash
              </p>
            </div>
          </div>

          {/* Two columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left: Ready & Hold orders */}
            <div className="space-y-6">
              {/* Ready Orders */}
              <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F3E8FF]">
                      <CheckCircle2 className="h-5 w-5 text-[#9810FA]" />
                    </div>
                    <div>
                      <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                        Ready Orders
                      </h2>
                      <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                        Orders ready for pickup/delivery
                      </p>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#F3E8FF] font-['Inter'] text-sm font-bold leading-5 text-[#9810FA]">
                    {readyOrders.length}
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  {readyOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 rounded-[16px] border border-[#E9D4FF] bg-[#FAF5FF] px-4 py-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="shrink-0 rounded-[14px] border-2 border-[#DAB2FF] bg-white px-2.5 py-3 font-['Inter'] text-base font-bold leading-6 text-[#8200DB]">
                          #{order.id}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                              {order.customer?.name || "Guest"}
                            </p>
                            <span className="rounded-[10px] border border-[#E9D4FF] bg-white px-2 py-1 font-['Inter'] text-[10px] font-bold uppercase leading-[15px] text-[#8200DB]">
                              {order.orderType} {order.tableNumber ? `• ${order.tableNumber}` : ""}
                            </span>
                            <span className="rounded-[10px] border border-[#A4F4CF] bg-[#ECFDF5] px-2 py-1 font-['Inter'] text-[10px] font-bold uppercase leading-[15px] text-[#009966]">
                              {order.paymentStatus}
                            </span>
                          </div>
                          <p className="flex items-center gap-1 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })} • {order.itemsCount} items
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 font-['Inter'] text-right text-[20px] font-bold leading-7 text-[#8200DB]">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hold Orders */}
              <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FFE4E6]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_hold_icon)">
                          <path
                            d="M9.99996 18.3332C14.6023 18.3332 18.3333 14.6022 18.3333 9.99984C18.3333 5.39746 14.6023 1.6665 9.99996 1.6665C5.39759 1.6665 1.66663 5.39746 1.66663 9.99984C1.66663 14.6022 5.39759 18.3332 9.99996 18.3332Z"
                            stroke="#EC003F"
                            strokeWidth="1.66667"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.33337 12.5V7.5"
                            stroke="#EC003F"
                            strokeWidth="1.66667"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M11.6666 12.5V7.5"
                            stroke="#EC003F"
                            strokeWidth="1.66667"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_hold_icon">
                            <rect width="20" height="20" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                    <div>
                      <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                        Hold Orders
                      </h2>
                      <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                        Orders on hold
                      </p>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FFE4E6] font-['Inter'] text-sm font-bold leading-5 text-[#EC003F]">
                    {holdOrders.length}
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  {holdOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-4 rounded-[16px] border border-[#FFCCD3] bg-[#FFF1F2] px-4 py-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <span className="shrink-0 rounded-[14px] border-2 border-[#FFA1AD] bg-white px-2.5 py-3 font-['Inter'] text-base font-bold leading-6 text-[#C70036]">
                          #{order.id}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                              {order.customer?.name || "Guest"}
                            </p>
                            <span className="rounded-[10px] border border-[#FFCCD3] bg-white px-2 py-1 font-['Inter'] text-[10px] font-bold uppercase leading-[15px] text-[#C70036]">
                              {order.orderType} {order.tableNumber ? `• ${order.tableNumber}` : ""}
                            </span>
                            <span className="rounded-[10px] border border-[#A4F4CF] bg-[#ECFDF5] px-2 py-1 font-['Inter'] text-[10px] font-bold uppercase leading-[15px] text-[#009966]">
                              {order.paymentStatus}
                            </span>
                          </div>
                          <p className="flex items-center gap-1 font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })} • {order.itemsCount} items
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 font-['Inter'] text-right text-[20px] font-bold leading-7 text-[#C70036]">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Low / Out of Stock */}
            <div className="rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#FFE2E2]">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.5 8.33341V6.66675C17.4997 6.37448 17.4225 6.08742 17.2763 5.83438C17.13 5.58134 16.9198 5.37122 16.6667 5.22508L10.8333 1.89175C10.58 1.74547 10.2926 1.66846 10 1.66846C9.70744 1.66846 9.42003 1.74547 9.16667 1.89175L3.33333 5.22508C3.08022 5.37122 2.86998 5.58134 2.72372 5.83438C2.57745 6.08742 2.5003 6.37448 2.5 6.66675V13.3334C2.5003 13.6257 2.57745 13.9127 2.72372 14.1658C2.86998 14.4188 3.08022 14.6289 3.33333 14.7751L9.16667 18.1084C9.42003 18.2547 9.70744 18.3317 10 18.3317C10.2926 18.3317 10.58 18.2547 10.8333 18.1084L12.5 17.1584"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.25 3.55811L13.75 7.84977"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2.74164 5.8335L9.99997 10.0002L17.2583 5.8335"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 18.3333V10"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14.1667 10.8335L18.3334 15.0002M14.1667 15.0002L18.3334 10.8335"
                        stroke="#E7000B"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-['Inter'] text-[18px] font-bold leading-7 text-[#1D293D]">
                      Low / Out of Stock
                    </h2>
                    <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                      Items running low or unavailable
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#FB2C36]" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#FFE2E2]">
                    <span className="font-['Inter'] text-sm font-bold text-[#E7000B]">
                      {lowStockProducts.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="scrollbar-subtle mt-7 max-h-[380px] space-y-3 overflow-y-auto pr-1">
                {lowStockProducts.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-4 rounded-[16px] border-2 px-4 py-4 ${
                      item.quantity === 0
                        ? "border-[#FFC9C9] bg-[#FEF2F2]"
                        : "border-[#FEE685] bg-[#FFFBEB]"
                    }`}
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
                          <ChefHat className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {item.productName}
                      </p>
                      <p className="font-['Inter'] text-xs font-normal leading-4 text-[#62748E]">
                        {item.categoryName} • {item.variationName}
                      </p>
                      <span
                        className={`mt-2 inline-flex items-center gap-1 rounded-[10px] border px-2 py-0.5 font-['Inter'] text-xs font-bold leading-4 ${
                          item.quantity === 0
                            ? "border-[#FFC9C9] bg-[#FFE2E2] text-[#EC003F]"
                            : "border-[#FEE685] bg-[#FEF3C6] text-[#E17100]"
                        }`}
                      >
                        {item.quantity === 0 ? (
                          <>
                            <span className="font-bold">®</span> OUT OF STOCK
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3" /> LOW: {item.quantity} left
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <p className="font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
                        This Week
                      </p>
                      <p className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
                        {item.unitsSoldThisWeek}
                      </p>
                      <p className="font-['Inter'] text-xs font-normal leading-4 text-[#90A1B9]">
                        units sold
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
