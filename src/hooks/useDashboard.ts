import { useQuery } from "@tanstack/react-query";
import * as dashboardService from "@/services/dashboardService";

export const DASHBOARD_KEYS = {
  all: ["dashboard"] as const,
  cashier: () => [...DASHBOARD_KEYS.all, "cashier"] as const,
  manager: () => [...DASHBOARD_KEYS.all, "manager"] as const,
  admin: () => [...DASHBOARD_KEYS.all, "admin"] as const,
  kitchen: () => [...DASHBOARD_KEYS.all, "kitchen"] as const,
};

export const useGetCashierDashboard = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.cashier(),
    queryFn: dashboardService.getCashierDashboardStats,
    staleTime: 0.1 * 60 * 1000, // 30 seconds
    refetchInterval: 0.2* 60 * 1000, // 1 minute
  });
};

export const useGetManagerDashboard = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.manager(),
    queryFn: dashboardService.getManagerDashboardStats,
    staleTime: 0.5 * 60 * 1000,
  });
};

export const useGetAdminDashboard = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.admin(),
    queryFn: dashboardService.getAdminDashboardStats,
    staleTime: 0.5 * 60 * 1000,
  });
};

export const useGetKitchenDashboard = () => {
  return useQuery({
    queryKey: DASHBOARD_KEYS.kitchen(),
    queryFn: dashboardService.getKitchenDashboardStats,
    staleTime: 0.1 * 60 * 1000,
    refetchInterval: 0.2 * 60 * 1000, 
  });
};
