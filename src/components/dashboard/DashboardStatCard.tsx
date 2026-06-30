"use client";

import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor: string;
  iconColor: string;
}

export default function DashboardStatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconBgColor,
  iconColor,
}: DashboardStatCardProps) {
  const TrendIcon = trend.isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = trend.isPositive ? "text-[#00BC7D]" : "text-[#FF2056]";

  return (
    <div className="flex flex-col rounded-[24px] border border-[#E2E8F0] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${iconBgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className={`flex items-center gap-1 text-[12px] font-bold ${trendColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
        </div>
      </div>
      <div className="mt-4">
        <p className="font-inter text-[12px] font-bold uppercase tracking-wider text-[#90A1B9]">
          {label}
        </p>
        <p className="mt-1 text-[24px] font-[900] text-[#1D293D]">{value}</p>
      </div>
    </div>
  );
}
