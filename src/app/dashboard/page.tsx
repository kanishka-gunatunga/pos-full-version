"use client";

import { useAuth } from "@/contexts/AuthContext";
import CashierDashboardContent from "./CashierDashboardContent";
import ManagerDashboardContent from "./ManagerDashboardContent";
import AdminDashboardContent from "./AdminDashboardContent";

export default function DashboardPage() {
  const { role } = useAuth();

  if (role === "cashier") {
    return <CashierDashboardContent />;
  }
  if (role === "manager") {
    return <ManagerDashboardContent />;
  }
  if (role === "admin") {
    return <AdminDashboardContent />;
  }

  return null;
}
