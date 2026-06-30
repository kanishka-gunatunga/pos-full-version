import axiosInstance from "@/lib/api/axiosInstance";
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  OrderSearchParams,
  OrderFilterParams,
  OrderStatus,
  OrderItem,
  OrdersListQueryParams,
  OrdersPageResponse,
  OrdersListMeta,
} from "@/types/order";

const DEFAULT_PAGE_SIZE = 25;

function buildOrdersListParams(
  list: OrdersListQueryParams | undefined,
  extra?: Record<string, string | number | boolean | undefined>
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  const page = Number(list?.page);
  const pageSize = Math.min(100, Math.max(1, Number(list?.pageSize) || DEFAULT_PAGE_SIZE));
  out.page = Number.isFinite(page) && page >= 1 ? page : 1;
  out.pageSize = pageSize;
  if (list?.placedByMe === true) out.placedByMe = true;
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== "") out[k] = v;
    }
  }
  return out;
}

export function normalizeOrdersPageResponse(raw: unknown): OrdersPageResponse {
  if (Array.isArray(raw)) {
    const data = raw as Order[];
    const n = data.length;
    return {
      data,
      meta: {
        total: n,
        page: 1,
        pageSize: n || DEFAULT_PAGE_SIZE,
        totalPages: 1,
        placedByMe: false,
      },
    };
  }
  const o = raw as { data?: unknown; meta?: Record<string, unknown> };
  const data = Array.isArray(o.data) ? (o.data as Order[]) : [];
  const m = o.meta ?? {};
  const page = Math.max(1, Number(m.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(m.pageSize) || DEFAULT_PAGE_SIZE));
  const total = Number(m.total);
  const totalSafe = Number.isFinite(total) ? Math.max(0, total) : data.length;
  let totalPages = Number(m.totalPages);
  if (!Number.isFinite(totalPages) || totalPages < 0) {
    totalPages = totalSafe === 0 ? 1 : Math.ceil(totalSafe / pageSize);
  }
  const meta: OrdersListMeta = {
    total: totalSafe,
    page,
    pageSize,
    totalPages: Math.max(1, totalPages),
    placedByMe: Boolean(m.placedByMe),
  };
  return { data, meta };
}

export const getAllOrders = async (params?: OrdersListQueryParams): Promise<OrdersPageResponse> => {
  const res = await axiosInstance.get("/orders", {
    params: buildOrdersListParams({
      page: params?.page ?? 1,
      pageSize: params?.pageSize ?? DEFAULT_PAGE_SIZE,
      placedByMe: params?.placedByMe,
    }),
  });
  return normalizeOrdersPageResponse(res.data);
};

export const getOrdersExcludeStatus = async (
  status: string,
  list?: OrdersListQueryParams
): Promise<OrdersPageResponse> => {
  const res = await axiosInstance.get("/orders/exclude-status", {
    params: buildOrdersListParams(
      {
        page: list?.page ?? 1,
        pageSize: list?.pageSize ?? DEFAULT_PAGE_SIZE,
        placedByMe: list?.placedByMe,
      },
      { status }
    ),
  });
  return normalizeOrdersPageResponse(res.data);
};

export const searchOrders = async (params: OrderSearchParams): Promise<OrdersPageResponse> => {
  const { q, orderId, customerName, phone, page, pageSize, placedByMe } = params;
  const res = await axiosInstance.get("/orders/search", {
    params: buildOrdersListParams(
      { page: page ?? 1, pageSize: pageSize ?? DEFAULT_PAGE_SIZE, placedByMe },
      {
        ...(q != null && String(q).trim() !== "" ? { q: String(q).trim() } : {}),
        ...(orderId ? { orderId: String(orderId) } : {}),
        ...(customerName ? { customerName: String(customerName) } : {}),
        ...(phone ? { phone: String(phone) } : {}),
      }
    ),
  });
  return normalizeOrdersPageResponse(res.data);
};

export const filterOrders = async (params: OrderFilterParams): Promise<OrdersPageResponse> => {
  const { status, paymentStatus, page, pageSize, placedByMe } = params;
  const res = await axiosInstance.get("/orders/filter", {
    params: buildOrdersListParams(
      { page: page ?? 1, pageSize: pageSize ?? DEFAULT_PAGE_SIZE, placedByMe },
      {
        ...(status ? { status } : {}),
        ...(paymentStatus ? { paymentStatus: String(paymentStatus).toLowerCase() } : {}),
      }
    ),
  });
  return normalizeOrdersPageResponse(res.data);
};

export const getOrderById = async (id: string | number): Promise<Order> => {
  const res = await axiosInstance.get(`/orders/${id}`);
  return res.data;
};

export const createOrder = async (data: CreateOrderData): Promise<Order> => {
  console.log("[createOrder] POST /orders payload:", data);
  const res = await axiosInstance.post("/orders", data);
  return res.data;
};

export const updateOrder = async (id: string | number, data: UpdateOrderData): Promise<Order> => {
  const res = await axiosInstance.put(`/orders/${id}`, data);
  return res.data;
};

export const updateOrderStatus = async (
  id: string | number, 
  data: { status: OrderStatus; rejectReason?: string; passcode?: string }
): Promise<Order> => {
  const res = await axiosInstance.put(`/orders/${id}/status`, data, {
    skipAuthRedirectOn401: Boolean(data.passcode != null && String(data.passcode).trim() !== ""),
  });
  return res.data;
};

export const updateOrderItemStatus = async (
  itemId: string | number, 
  status: OrderStatus
): Promise<OrderItem> => {
  const res = await axiosInstance.put(`/orders/item/${itemId}/status`, { status });
  return res.data;
};

export const deleteOrder = async (id: string | number): Promise<void> => {
  await axiosInstance.delete(`/orders/${id}`);
};
