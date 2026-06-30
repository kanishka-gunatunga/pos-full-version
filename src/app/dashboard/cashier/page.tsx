"use client";

import { ShoppingBag, DollarSign, Plus, Calendar, CircleCheck, Timer, TrendingUp } from "lucide-react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import CashierStatCard from "@/components/dashboard/CashierStatCard";
import ActiveOrders from "@/components/dashboard/ActiveOrders";
import CashierPerformance from "@/components/dashboard/CashierPerformance";

export default function CashierDashboardPage() {
  const stats = [
    {
      label: "Total Orders",
      value: "12",
      icon: ShoppingBag,
      iconBgColor: "bg-[#DBEAFE]",
      iconColor: "text-[#155DFC]",
      showTodayBadge: true,
    },
    {
      label: "Revenue Today",
      value: "Rs.20,000.00",
      icon: DollarSign,
      iconBgColor: "bg-[#D0FAE5]",
      iconColor: "text-[#009966]",
      trendUp: true,
    },
    {
      label: "Completed Orders",
      value: "10",
      icon: CircleCheck,
      iconBgColor: "bg-[#F3E8FF]",
      iconColor: "text-[#9810FA]",
    },
    {
        label: "Pending Orders",
        value: "0",
        icon: Timer,
        iconBgColor: "bg-[#FEF3C6]",
        iconColor: "text-[#E17100]",
      },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      <DashboardPageHeader />
      
      <main className="flex-1 overflow-auto p-8 lg:p-12">
        <div className="mx-auto max-w-[1600px] space-y-10">
          {/* Greeting Section */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[32px] font-black tracking-tight text-[#1D293D]">
                Good Afternoon, Sarah!
              </h1>
              <p className="mt-2 flex items-center gap-2 text-[16px] font-medium text-[#62748E]">
                <span><Calendar /></span> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            
            <button className="group flex h-14 items-center gap-3 rounded-2xl bg-primary px-8 text-[16px] font-bold text-white shadow-base transition-all cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center">
                <ShoppingBag className="h-5 w-5" />
              </div>
              Start New Order
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <CashierStatCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActiveOrders />
            </div>
            <div>
              <CashierPerformance />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
