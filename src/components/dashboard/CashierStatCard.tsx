import { LucideIcon } from "lucide-react";

interface CashierStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
  showTodayBadge?: boolean;
  trendUp?: boolean;
}

export default function CashierStatCard({
  label,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  showTodayBadge,
  trendUp,
}: CashierStatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-xl ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {showTodayBadge && (
          <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">
            TODAY
          </span>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        {trendUp && <span className="text-green-500 text-sm font-bold">↑</span>}
      </div>
      <p className="text-sm text-gray-500 font-medium mt-1">{label}</p>
    </div>
  );
}
