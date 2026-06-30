"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Package, CheckCircle2, ShoppingCart, Truck } from "lucide-react";

const data = [
  { name: "Dine In", value: 55, color: "#6366F1", icon: CheckCircle2 },
  { name: "Take Away", value: 30, color: "#F59E0B", icon: ShoppingCart },
  { name: "Delivery", value: 15, color: "#10B981", icon: Truck },
];

export default function OrderDistributionChart() {
  return (
    <div className="flex h-full flex-col rounded-[40px] border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-[#1D293D]">Order Distribution</h3>
      </div>

      <div className="relative flex flex-1 items-center justify-center min-w-0">
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-bold text-[#1D293D]">642</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#90A1B9]">
            Total
          </span>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-3 w-3 items-center justify-center">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              </div>
              <span className="text-sm font-bold text-[#45556C]">{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1D293D]">{item.value}%</span>
              <item.icon className="h-4 w-4" style={{ color: item.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
