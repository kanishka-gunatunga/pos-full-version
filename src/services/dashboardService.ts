import axiosInstance from "@/lib/api/axiosInstance";

export interface ExpiredProduct {
  id: number;
  quantity: number;
  productName: string;
  categoryName: string;
  image: string | null;
  variationName: string;
  expireDate: string | null;
  expiredDaysText: string;
  batchNo: string | null;
  branchName: string;
}

export interface RestockAlert {
  id: number;
  quantity: number;
  productName: string;
  categoryName: string;
  image: string | null;
  variationName: string;
  expireDate: string | null;
  expiredDaysText: string;
  batchNo: string | null;
  branchName: string;
  averageSaleForWeek: number;
  leftQuantityText: string;
}

export interface DiscountAlert {
  id: number;
  title: string;
  discountValueText: string;
  itemsSummary: string;
  expireDate: string;
}

export interface AdminDashboardData {
  totalCustomersCount: number;
  totalBranchesCount: number;
  totalUsersCount: number;
  todayCompletedOrdersCount: number;
  todayActiveOrdersCount: number;
  todayCancelledOrdersCount: number;
  totalRevenue: string;
  expiredProductsList: ExpiredProduct[];
  restockAlertsList: RestockAlert[];
  discountAlertsList: DiscountAlert[];
}

export const getAdminDashboardStats = async (): Promise<AdminDashboardData> => {
  const res = await axiosInstance.get("/dashboard/admin");
  return res.data;
};

export interface ManagerDashboardData {
  completedOrdersCount: number;
  activeOrdersCount: number;
  holdOrdersCount: number;
  cancelledOrdersCount: number;
  activeCashiersCount: number;
  todaysRevenue: string;
  todaysCashOuts: string;
  drawerCashList: { cashierName: string; drawerCash: string }[];
  expiredProductsList: ExpiredProduct[];
  restockAlertsList: RestockAlert[];
  discountAlertsList: DiscountAlert[];
}

export const getManagerDashboardStats = async (): Promise<ManagerDashboardData> => {
  const res = await axiosInstance.get("/dashboard/manager");
  return res.data;
};

export interface CashierDashboardOrder {
  id: number;
  totalAmount: string | number;
  orderType: string;
  tableNumber: string | null;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
  };
  paymentStatus: "PAID" | "UNPAID";
  itemsCount: number;
}

export interface LowStockProduct {
  id: number;
  quantity: number;
  productName: string;
  categoryName: string;
  image: string | null;
  variationName: string;
  unitsSoldThisWeek: number;
}

export interface CashierDashboardData {
  pendingOrdersCount: number;
  preparingOrdersCount: number;
  readyOrdersCount: number;
  holdOrdersCount: number;
  drawerCash: number;
  readyOrdersList: CashierDashboardOrder[];
  holdOrdersList: CashierDashboardOrder[];
  lowStockProductsList: LowStockProduct[];
}

export const getCashierDashboardStats = async (): Promise<CashierDashboardData> => {
  const res = await axiosInstance.get("/dashboard/cashier");
  return res.data;
};

export interface KitchenDashboardOrder {
  id: number;
  status: string;
  orderType: string;
  tableNumber: string | null;
  createdAt: string;
  customerName: string;
  kitchenNote: string | null;
  orderNote: string | null;
  items: {
    id: number;
    status: string;
    quantity: number;
    productName: string;
    variationName: string | null;
    modifications: string[];
  }[];
}

export interface KitchenDashboardData {
  metrics: {
    allOrdersCount: number;
    pendingOrdersCount: number;
    preparingOrdersCount: number;
    readyOrdersCount: number;
    holdOrdersCount: number;
  };
  orders: KitchenDashboardOrder[];
}

export const getKitchenDashboardStats = async (): Promise<KitchenDashboardData> => {
  const res = await axiosInstance.get("/dashboard/kitchen");
  return res.data;
};
