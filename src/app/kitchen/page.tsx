"use client";

import { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  Package,
  Timer,
  Pause,
  Play,
  Info,
  Check,
  CircleAlert,
  CircleCheck,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Box,
  CircleX,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

import { useUpdateOrderItemStatus, useUpdateOrderStatus, ORDER_KEYS } from "@/hooks/useOrder";
import { useGetKitchenDashboard, DASHBOARD_KEYS } from "@/hooks/useDashboard";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";

import { useMemo } from "react";
import ManagerAuthorizationModal from "@/components/orders/ManagerAuthorizationModal";
import { useAuth } from "@/contexts/AuthContext";
import { isInvalidManagerPasscodeError } from "@/lib/api/managerPasscodeError";

type OrderStatus = "Pending" | "Preparing" | "Ready" | "Hold";
type OrderType = "Dine In" | "Take Away" | "Delivery";

interface Addon {
  id: string;
  name: string;
  quantity: number;
}

interface OrderItem {
  id: string;
  quantity: number;
  name: string;
  size?: string;
  addons?: Addon[];
  completed?: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  time: string;
  minutesAgo: number;
  customerName: string;
  type: OrderType;
  table?: string;
  items: OrderItem[];
  payments: any[];
  kitchenNote?: string;
  orderNote?: string;
}

const mapBackendOrderToOrder = (backendOrder: any): Order => {
  const createdAt = new Date(backendOrder.createdAt || new Date());
  const now = new Date();
  const diffInMs = Math.abs(now.getTime() - createdAt.getTime());
  const minutesAgo = Math.floor(diffInMs / (1000 * 60));

  let type: OrderType = "Take Away";
  const backendType = (backendOrder.orderType || backendOrder.type || "").toLowerCase();
  if (
    backendType === "dine in" ||
    backendType === "dine-in" ||
    backendType === "dine_in" ||
    backendType === "dining"
  ) {
    type = "Dine In";
  } else if (backendType === "delivery") {
    type = "Delivery";
  } else if (backendType === "takeaway" || backendType === "take away") {
    type = "Take Away";
  }

  let mappedStatus: OrderStatus = "Pending";
  const bStatus = (backendOrder.status || "").toLowerCase();
  if (bStatus === "preparing") mappedStatus = "Preparing";
  else if (bStatus === "ready" || bStatus === "completed") mappedStatus = "Ready";
  else if (bStatus === "hold") mappedStatus = "Hold";

  return {
    id: backendOrder.id?.toString() || Math.random().toString(),
    orderNumber: backendOrder.orderNumber || `${backendOrder.id ? String(backendOrder.id).padStart(4, '0') : Math.floor(Math.random() * 10000)}`,
    status: mappedStatus,
    time: createdAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    minutesAgo: minutesAgo,
    customerName: backendOrder.customerName || backendOrder.customer?.name || "Walk-in Customer",
    type: type,
    table:
      backendOrder.tableNumber ||
      (backendOrder.tableId
        ? `Table ${backendOrder.tableNumber || backendOrder.tableId}`
        : undefined),
    items: (backendOrder.items || []).map((item: any) => {
      const addons: Addon[] = (item.modifications || []).map((mod: any, index: number) => {
        if (typeof mod === "string") {
          return { id: `mod-${index}`, name: mod, quantity: 1 };
        }
        return {
          id: mod.modification?.id?.toString() || mod.id?.toString(),
          name: mod.modification?.title || mod.name || "Unknown Modification",
          quantity: 1,
        };
      });

      return {
        id: item.id?.toString() || Math.random().toString(),
        quantity: item.quantity || 1,
        name: item.productName || item.product?.name || item.name || "Unknown Item",
        size: item.variationName || item.variation?.name || item.size,
        addons: addons.length > 0 ? addons : undefined,
        completed: item.status === "complete" || false,
      };
    }),
    payments: backendOrder.payments || [],
    kitchenNote: backendOrder.kitchenNote || "",
    orderNote: backendOrder.orderNote || backendOrder.notes || "",
  };
};

export default function KitchenPage() {
  const { data: dashboardData, isLoading: isQueryLoading } = useGetKitchenDashboard();
  const updateItemStatus = useUpdateOrderItemStatus();
  const updateOrderStatus = useUpdateOrderStatus();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<OrderStatus | "All Orders">("All Orders");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authOrder, setAuthOrder] = useState<{ id: string | number; orderNumber: string } | null>(
    null
  );

  const orders = useMemo(() => {
    if (!dashboardData?.orders || !Array.isArray(dashboardData.orders)) {
      return [];
    }

    return dashboardData.orders
      .filter((o: any) => {
        const status = (o.status || "").toLowerCase();
        return status !== "complete" && status !== "completed" && status !== "delivered" && status !== "cancel";
      })
      .map(mapBackendOrderToOrder)
      .sort((a: Order, b: Order) => {
        if (a.status === "Ready" && b.status !== "Ready") return 1;
        if (a.status !== "Ready" && b.status === "Ready") return -1;
        return b.minutesAgo - a.minutesAgo;
      });
  }, [dashboardData]);

  const isLoading = isQueryLoading;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn("Pusher environment variables are missing.");
      return;
    }

    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    const channel = pusher.subscribe("orders-channel");

    channel.bind("new-order", () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEYS.kitchen() });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [queryClient]);

  const counts = {
    "All Orders": dashboardData?.metrics?.allOrdersCount || 0,
    Pending: dashboardData?.metrics?.pendingOrdersCount || 0,
    Preparing: dashboardData?.metrics?.preparingOrdersCount || 0,
    Ready: dashboardData?.metrics?.readyOrdersCount || 0,
    Hold: dashboardData?.metrics?.holdOrdersCount || 0,
  };

  const filteredOrders =
    filter === "All Orders" ? orders : orders.filter((o: Order) => o.status === filter);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  };

  const toggleItemCompletion = (orderId: string, itemId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status !== "Preparing") return;

    const item = order.items.find((i) => i.id === itemId);
    if (!item) return;

    const newStatus = item.completed ? "pending" : "complete";

    toast.success(`${item.name} marked as ${newStatus}`);
    updateItemStatus.mutate({ itemId, status: newStatus as any }, {
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to update ${item.name}`);
      }
    });
  };

  const handleUpdateStatus = (id: string | number, status: string) => {
    if (status === "cancel") {
      const order = orders.find((o: Order) => o.id === String(id));
      if (order) {
        const hasStarted = order.items.some((i: OrderItem) => i.completed);
        if (hasStarted) {
          alert("Cannot cancel an order that has already been started.");
          return;
        }
        setAuthOrder({ id, orderNumber: order.orderNumber });
        setIsAuthModalOpen(true);
      }
      return;
    }
    const statusText = status === "complete" ? "served" : status;
    toast.success(`Order ${statusText} successfully`);
    updateOrderStatus.mutate({ id, data: { status: status as any } }, {
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || `Failed to update order to ${statusText}`);
      }
    });
  };

  const handleVerifyCancel = async (passcode: string) => {
    if (!authOrder) return;

    try {
      await updateOrderStatus.mutateAsync({
        id: authOrder.id,
        data: { status: "cancel" as any, passcode },
      });

      toast.success("Order cancelled successfully");
      setIsAuthModalOpen(false);
      setAuthOrder(null);
    } catch (err: unknown) {
      if (!isInvalidManagerPasscodeError(err)) {
        const ax = err as { response?: { data?: { message?: string } } };
        toast.error(ax?.response?.data?.message || "Failed to cancel order");
      }
      throw err;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F8F9FA]">
      {/* Header */}
      <header className="flex flex-col p-6 bg-white border-b border-[#E2E8F0] shrink-0">
        <div className="flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary"
              style={{
                boxShadow: "var(--shadow-primary)",
              }}
            >
              <ChefHat className="text-white w-6 h-6" />
            </div>
            <div className="items-center">
              <h1 className="text-[24px] font-bold leading-[22.5px] tracking-normal text-[#1D293D]">
                Kitchen Order Display
              </h1>
              <p className="mt-1 text-[14px] font-normal text-[#62748E]">
                Manage incoming orders and track preparation
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[30px] font-bold text-[#1D293D]">{formatTime(currentTime)}</div>
            <div className="text-[12px] font-medium text-[#62748E]">{formatDate(currentTime)}</div>
          </div>
        </div>

        <div className="flex justify-between items-end mt-4 shrink-0 gap-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {(["All Orders", "Pending", "Preparing", "Ready", "Hold"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-[14px] text-[16px] font-bold transition-colors whitespace-nowrap ${
                  filter === f
                    ? "bg-[#1D293D] text-white drop-shadow-[#0000001A]"
                    : "bg-[#F1F5F9] text-[#45556C] border border-[#F1F5F9] hover:bg-gray-50"
                }`}
              >
                {f === "All Orders" && <Package className="w-4 h-4" />}
                {f === "Pending" && <CircleAlert className="w-4 h-4" />}
                {f === "Preparing" && <Timer className="w-4 h-4" />}
                {f === "Ready" && <CircleCheck className="w-4 h-4" />}
                {f === "Hold" && <Pause className="w-4 h-4 fill-current stroke-none" />}
                {f}
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    filter === f ? "bg-[#314158] text-white" : "bg-[#E2E8F0] text-[#314158]"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex flex-col items-center cursor-pointer gap-1 text-[#90A1B9] transition-colors hover:text-zinc-700 min-[1920px]:gap-1.5 min-[2560px]:gap-2 mb-1"
          >
            <LogOut className="h-5 w-5 min-[1920px]:h-6 min-[1920px]:w-6 min-[2560px]:h-7 min-[2560px]:w-7" />
            <span className="text-[10px] font-medium uppercase tracking-wider min-[1920px]:text-[11px] min-[2560px]:text-[12px]">
              Logout
            </span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pt-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#62748E]">
            <Package className="w-16 h-16 mb-4 text-[#CBD5E1]" />
            <h3 className="text-xl font-bold text-[#1D293D]">No orders found</h3>
            <p className="mt-2 text-sm">
              There are no {filter !== "All Orders" ? filter.toLowerCase() : ""} orders at the
              moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {filteredOrders.map((order: Order) => (
              <OrderCard
                key={order.id}
                order={order}
                onToggleItem={toggleItemCompletion}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      {authOrder && (
        <ManagerAuthorizationModal
          isOpen={isAuthModalOpen}
          orderNo={authOrder.orderNumber}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthOrder(null);
          }}
          onVerify={handleVerifyCancel}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  onToggleItem,
  onUpdateStatus,
}: {
  order: Order;
  onToggleItem: (orderId: string, itemId: string) => void;
  onUpdateStatus: (id: string | number, status: string) => void;
}) {
  const getTheme = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return {
          border: "border-[#FFD230]",
          bg: "bg-[#FEF3C6]",
          badge: "text-[#BB4D00] bg-[#FFFFFF33] border-[#FFD230]",
          button: "bg-[#2B7FFF] hover:bg-[#2563EB]",
        };
      case "Preparing":
        return {
          border: "border-[#8EC5FF]",
          bg: "bg-[#DBEAFE]",
          badge: "text-[#1447E6] bg-[#FFFFFF33] border-[#8EC5FF]",
          button: "bg-[#00BC7D] hover:bg-[#00BC7D]",
        };
      case "Ready":
        return {
          border: "border-[#5EE9B5]",
          bg: "bg-[#D0FAE5]",
          badge: "text-[#007A55] bg-[#FFFFFF33] border-[#5EE9B5]",
          button: "bg-[#AD46FF] hover:bg-[#9333EA]",
        };
      case "Hold":
        return {
          border: "border-[#FFA1AD]",
          bg: "bg-[#FFE4E6]",
          badge: "text-[#C70036] bg-[#FFFFFF33] border-[#FFA1AD]",
          button: "bg-[#2B7FFF] hover:bg-[#2563EB]",
        };
    }
  };

  const theme = getTheme(order.status);
  const completedItems = order.items.filter((i) => i.completed).length;
  const allItemsCompleted = completedItems === order.items.length;

  return (
    <div
      className={`h-full border-2 rounded-2xl flex flex-col bg-white overflow-hidden shadow-sm whitespace-normal ${theme.border}`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b shrink-0 ${theme.bg} ${theme.border.replace("border-", "border-b-")}`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className={`text-[30px] font-[900] ${order.status === "Pending" ? "text-[#D97706]" : order.status === "Preparing" ? "text-[#2563EB]" : order.status === "Hold" ? "text-[#E11D48]" : "text-[#059669]"}`}>
              #{order.orderNumber}
            </h2>
            <div
              className={`flex items-center ${order.status === "Pending" ? "text-[#D97706]" : order.status === "Preparing" ? "text-[#2563EB]" : order.status === "Hold" ? "text-[#E11D48]" : "text-[#059669]"} gap-1 text-sm font-bold`}
            >
              <Clock className="w-3.5 h-3.5" />
              {order.time} • {order.minutesAgo}m ago
            </div>
          </div>
          <div
            className={`px-3 py-3 rounded-[14px] text-xs font-bold border-2 ${theme.badge} uppercase tracking-wide`}
          >
            {order.status}
          </div>
        </div>

        <div className="flex justify-between items-end mt-4">
          <div>
            <div
              className={`font-bold text-[18px] ${order.status === "Pending" ? "text-[#D97706]" : order.status === "Preparing" ? "text-[#2563EB]" : order.status === "Hold" ? "text-[#E11D48]" : "text-[#059669]"}`}
            >
              {order.customerName}
            </div>
            <div
              className={`flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded border border-transparent w-fit ${
                order.type === "Dine In"
                  ? "bg-[#F3E8FF] text-[#8200DB]"
                  : order.type === "Take Away"
                    ? "bg-[#DBEAFE] text-[#1447E6]"
                    : order.type === "Delivery"
                      ? "bg-[#FFEDD4] text-[#CA3500]"
                      : ""
              }`}
            >
              {order.type === "Dine In" ? (
                <UtensilsCrossed className="w-4 h-4" />
              ) : order.type === "Take Away" ? (
                <ShoppingBag className="w-4 h-4" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              {order.type}
              {order.table ? ` • ${order.table}` : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 font-medium uppercase">Items</div>
            <div className="font-bold">
              <span
                className={
                  allItemsCompleted
                    ? "text-green-600"
                    : `${order.status === "Pending" ? "text-[#D97706]" : order.status === "Preparing" ? "text-[#2563EB]" : order.status === "Hold" ? "text-[#E11D48]" : "text-[#059669]"} text-xl`
                }
              >
                {completedItems}
              </span>
              <span className="text-gray-400"> / {order.items.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-white no-scrollbar">
        {order.items.map((item) => (
          <div
            key={item.id}
            onClick={() => onToggleItem(order.id, item.id)}
            className={`p-3 rounded-xl border flex gap-3 transition-all ${order.status === "Preparing" ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""} ${item.completed ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}
          >
            <div
              className={`w-6 h-6 rounded-full border flex flex-shrink-0 items-center justify-center transition-all ${
                item.completed
                  ? "bg-green-500 border-green-500 text-white"
                  : order.status === "Preparing"
                    ? "bg-white border-gray-300"
                    : "bg-gray-100 border-gray-200 opacity-50"
              }`}
            >
              {item.completed && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </div>
            <div className="flex-1">
              <div className="flex gap-2 items-start text-gray-900 font-semibold text-sm">
                <span
                  className={`${item.completed ? "text-green-700 bg-green-100" : "text-[#FF6B00] bg-[#FFF0E5]"} px-1.5 rounded text-xs py-0.5 transition-colors`}
                >
                  {item.quantity}x
                </span>
                <span
                  className={
                    item.completed
                      ? "line-through text-gray-500 transition-colors"
                      : "transition-colors"
                  }
                >
                  {item.name}
                </span>
              </div>
              {item.size && (
                <div className="mt-2 flex">
                  <span className="text-xs flex items-center gap-1 font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-2 py-0.5">
                    <Box className="w-3 h-3" />
                    {item.size}
                  </span>
                </div>
              )}
              {item.addons && item.addons.length > 0 && (
                <div className="mt-2">
                  <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">ADD-ONS:</div>
                  <div className="flex flex-wrap gap-2">
                    {item.addons.map((addon) => (
                      <span
                        key={addon.id || addon.name}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-lg pl-1 pr-2 py-1 shadow-sm"
                      >
                        <span className="bg-[#FEF3C7] text-[#D97706] px-1.5 py-0.5 rounded-md text-[10px] border border-[#FDE68A]">
                          {addon.quantity}x
                        </span>
                        {addon.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Notes */}
        {order.kitchenNote && (
          <div className="p-3 bg-[#FFFBEB] border border-[#FFD230] rounded-xl text-left">
            <div className="flex gap-2 items-center text-[12px] uppercase font-bold text-[#BB4D00] mb-1">
              <Info className="w-4 h-4" />
              Kitchen Note
            </div>
            <div className="text-sm font-normal ml-5 text-[#7B3306]">{order.kitchenNote}</div>
          </div>
        )}

        {order.orderNote && (
          <div className="p-3 bg-[#FFFBEB] border border-[#FFD230] rounded-xl text-left">
            <div className="flex gap-2 items-center text-[12px] uppercase font-bold text-[#BB4D00] mb-1">
              <Info className="w-4 h-4" />
              Order Note
            </div>
            <div className="text-sm font-normal ml-5 text-[#7B3306]">{order.orderNote}</div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t space-y-2 mt-auto shrink-0">
        {order.status === "Pending" && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "preparing")}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${theme.button}`}
            >
              <Play className="w-4 h-4" /> Start Preparing
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(order.id, "hold")}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer flex justify-center items-center gap-2 transition-colors"
              >
                <Pause className="w-4 h-4" /> Hold
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, "cancel")}
                className="flex-1 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl cursor-pointer flex justify-center items-center gap-2 border border-red-200 transition-colors"
              >
                <CircleX className="w-4 h-4" /> Cancel
              </button>
            </div>
          </>
        )}
        {order.status === "Preparing" && (
          <>
            <button
              disabled={!allItemsCompleted}
              onClick={() => onUpdateStatus(order.id, "ready")}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-colors flex items-center justify-center gap-2 ${
                allItemsCompleted
                  ? `cursor-pointer ${theme.button}`
                  : "bg-gray-300 text-gray-500 cursor-not-allowed border border-gray-200"
              }`}
            >
              <CircleCheck className="w-4 h-4" />
              {allItemsCompleted ? "Mark as Ready" : "Complete All Items"}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, "hold")}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer flex justify-center items-center gap-2 transition-colors"
            >
              <Pause className="w-4 h-4" /> Hold
            </button>
          </>
        )}
        {order.status === "Ready" && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "complete")}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${theme.button}`}
            >
              <CircleCheck className="w-4 h-4" /> Mark as Served
            </button>
          </>
        )}
        {order.status === "Hold" && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, "preparing")}
              className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 ${theme.button}`}
            >
              <Play className="w-4 h-4" /> Resume Order
            </button>
            {!order.items.some((i) => i.completed) && (
              <button
                onClick={() => onUpdateStatus(order.id, "cancel")}
                className="w-full mt-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl cursor-pointer flex justify-center items-center gap-2 transition-colors"
              >
                <CircleX className="w-4 h-4" /> Cancel Order
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
