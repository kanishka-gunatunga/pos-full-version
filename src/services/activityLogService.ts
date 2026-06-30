import axiosInstance from "@/lib/api/axiosInstance";
import type { ActivityLogEntry, ActivityType, UserRole } from "@/app/dashboard/activity/ActivityContent";

export interface ActivityLogParams {
  search?: string;
  activityType?: string;
  userRole?: string;
  branchId?: number;
  fromDate?: string;
  toDate?: string;
  withManagerApproval?: boolean;
  page?: number;
  limit?: number;
}

export interface ActivityLogResponse {
  items: ActivityLogEntry[];
  total?: number;
  page?: number;
  limit?: number;
}

/** Raw activity log item from API (camelCase / flexible) */
export interface ActivityLogApiItem {
  id: string | number;
  dateTime?: string;
  createdAt?: string;
  activityType?: string;
  description?: string;
  userName?: string;
  user_name?: string;
  role?: string;
  branchName?: string;
  branch_name?: string;
  branchId?: number;
  orderId?: string | null;
  order_id?: string | null;
  amount?: number;
  currency?: string;
  hasManagerApproval?: boolean;
  has_manager_approval?: boolean;
}

const LABEL_TO_ACTIVITY_TYPE: Record<string, ActivityType> = {
  "Order Placed": "order_placed",
  "Order Refunded": "order_refunded",
  "Cash Out": "cash_out",
  "Cash In": "cash_in",
  "Payment Received": "payment_received",
  "Discount Applied": "discount_applied",
  "Product Created": "order_placed",
  "Product Updated": "order_placed",
};

const NORMALIZE_ROLE: Record<string, UserRole> = {
  cashier: "Cashier",
  manager: "Manager",
  admin: "Admin",
  Cashier: "Cashier",
  Manager: "Manager",
  Admin: "Admin",
};

function mapApiItemToEntry(item: ActivityLogApiItem, index: number): ActivityLogEntry {
  const dateTime = item.dateTime ?? item.createdAt ?? "";
  const rawType = (item.activityType ?? "").trim();
  const normalizedType = rawType ? (rawType.toLowerCase().replace(/\s+/g, "_") as ActivityType) : undefined;
  const activityType: ActivityType =
    LABEL_TO_ACTIVITY_TYPE[rawType] ?? normalizedType ?? "order_placed";
  const roleKey = (item.role ?? "").toLowerCase();
  const role: UserRole = NORMALIZE_ROLE[roleKey] ?? "Cashier";
  const branchName = item.branchName ?? item.branch_name ?? "";
  const orderId = item.orderId ?? item.order_id ?? null;
  const hasManagerApproval =
    item.hasManagerApproval ?? item.has_manager_approval ?? false;

  return {
    id: String(item.id ?? index),
    dateTime,
    activityType,
    description: item.description ?? "",
    userName: item.userName ?? item.user_name ?? "",
    role,
    branchName,
    orderId: orderId ? String(orderId) : null,
    amount: Number(item.amount) ?? 0,
    currency: item.currency ?? "Rs.",
    hasManagerApproval,
  };
}

export async function getActivityLogs(
  params?: ActivityLogParams
): Promise<ActivityLogResponse> {
  const query: Record<string, string | number | boolean | undefined> = {};
  if (params?.search) query.search = params.search;
  if (params?.activityType && params.activityType !== "all")
    query.activityType = params.activityType;
  if (params?.userRole && params.userRole !== "all")
    query.userRole = params.userRole.toLowerCase();
  if (params?.branchId != null) query.branchId = params.branchId;
  if (params?.fromDate) query.fromDate = params.fromDate;
  if (params?.toDate) query.toDate = params.toDate;
  if (params?.withManagerApproval != null)
    query.withManagerApproval = params.withManagerApproval;
  if (params?.page != null) query.page = params.page;
  if (params?.limit != null) query.limit = params.limit;

  const res = await axiosInstance.get<
    | ActivityLogApiItem[]
    | { data: ActivityLogApiItem[]; total?: number; page?: number; limit?: number }
    | { items: ActivityLogApiItem[]; total?: number; page?: number; limit?: number }
  >(
    "/activity-logs",
    { params: query }
  );

  if (Array.isArray(res.data)) {
    return {
      items: res.data.map((item, i) => mapApiItemToEntry(item, i)),
      page: params?.page,
      limit: params?.limit,
    };
  }

  const rawList = ("items" in res.data ? res.data.items : res.data.data) ?? [];
  const items = rawList.map((item, i) => mapApiItemToEntry(item, i));
  return {
    items,
    total: res.data.total,
    page: res.data.page ?? params?.page,
    limit: res.data.limit ?? params?.limit,
  };
}
