"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useLayoutEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { clearMenuOpenCheckoutForSlot } from "@/lib/menuOpenCheckout";

export type OrderType = "Dine In" | "Take Away" | "Delivery";

export type OrderDetailsData = {
  customerName: string;
  phone: string;
  customerId?: string | number;
  originalCustomerName?: string;
  orderType: OrderType;
  tableId?: number | null;
  tableNumber?: string;
  deliveryAddress?: string;
  landmark?: string;
  zipCode?: string;
  deliveryInstructions?: string;
  deliveryChargeId?: number | null;
  deliveryChargeAmount?: number;
  deliveryChargeTitle?: string;
  loyaltyPoints?: number;
};

export type ManualDiscount = {
  value: number;
  type: "percentage" | "amount";
};

export type OrderItem = {
  id: string;
  productId: number;
  variationId?: number;
  variationOptionId?: number;
  modifications?: { modificationId: number; price: number }[];
  name: string;
  details: string;
  variant?: string;
  addOnsList?: string[];
  price: number;
  qty: number;
  image?: string;
  linkId?: string;
  isFreeItem?: boolean;
  promotionType?: "BOGO" | "COMBO";
  buyQuantity?: number;
  getQuantity?: number;
  promotionId?: number;
  itemType?: "food" | "voucher" | "promotion";
  recipientName?: string;
  recipientMobile?: string;
};

export type Order = {
  id: string;
  items: OrderItem[];
  orderDetails: OrderDetailsData | null;
  kitchenNote?: string;
  orderNote?: string;
  manualDiscount?: ManualDiscount | null;
};


type OrderContextType = {
  orders: Order[];
  activeOrderId: string | null;
  setActiveOrderId: (id: string | null) => void;
  addOrder: () => void;
  closeOrder: (orderId: string) => void;
  clearActiveOrder: () => void;
  clearOrderById: (orderId: string) => void;
  clearCheckoutSession: (preferredOrderSlotId?: string | null) => void;
  getActiveOrder: () => Order | null;
  checkoutLockedOrderSlotId: string | null;
  setCheckoutLockedOrderSlotId: (orderId: string | null) => void;
  items: OrderItem[];
  activeOrderDetails: OrderDetailsData | null;
  setActiveOrderDetails: (data: OrderDetailsData) => void;
  activeKitchenNote: string;
  activeOrderNote: string;
  setActiveKitchenNote: (value: string) => void;
  setActiveOrderNote: (value: string) => void;
  manualDiscount: ManualDiscount | null;
  setManualDiscount: (discount: ManualDiscount | null) => void;

  addItem: (
    productId: number,
    name: string,
    price: number,
    details?: string,
    image?: string,
    variant?: string,
    addOnsList?: string[],
    variationId?: number,
    variationOptionId?: number,
    modifications?: { modificationId: number; price: number }[],
    options?: AddItemOptions,
    linkId?: string,
    isFreeItem?: boolean,
    promotionType?: "BOGO" | "COMBO",
    buyQuantity?: number,
    getQuantity?: number,
    promotionId?: number,
    qty?: number
  ) => void;
  registerOpenOrderDetails: (fn: ((mode: OrderDetailsModalMode) => void) | null) => void;
  flushPendingAddsAfterOrderDetails: () => void;
  clearPendingAddsAfterOrderDetails: () => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  updateItem: (
    itemId: string,
    productId: number,
    name: string,
    price: number,
    details?: string,
    image?: string,
    variant?: string,
    addOnsList?: string[],
    variationId?: number,
    variationOptionId?: number,
    modifications?: { modificationId: number; price: number }[],
    qty?: number,
    options?: AddItemOptions
  ) => void;
  canAddOrder: boolean;
  canCloseOrder: boolean;
  loadOrderById: (orderId: string, orderData?: Partial<Order>) => void;
};

export type MenuOrderSurface = "menu" | "vouchers" | "promotions";

export type OrderDetailsModalMode = "full" | "minimalVoucher";

export type AddItemOptions = {
  skipOrderDetailsCheck?: boolean;
  itemType?: "food" | "voucher" | "promotion";
  recipientName?: string;
  recipientMobile?: string;
};

/** Params for one add-item call. Used when blocking add (e.g. no drawer session) so we can replay after session starts. */
export type PendingAddParams = {
  productId: number;
  name: string;
  price: number;
  details?: string;
  image?: string;
  variant?: string;
  addOnsList?: string[];
  variationId?: number;
  variationOptionId?: number;
  modifications?: { modificationId: number; price: number }[];
  linkId?: string;
  isFreeItem?: boolean;
  promotionType?: "BOGO" | "COMBO";
  buyQuantity?: number;
  getQuantity?: number;
  promotionId?: number;
  qty?: number;
  itemType?: "food" | "voucher" | "promotion";
  recipientName?: string;
  recipientMobile?: string;
};

const OrderContext = createContext<OrderContextType | null>(null);

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const createEmptyOrder = (): Order => ({
  id: generateId(),
  items: [],
  orderDetails: null,
  kitchenNote: "",
  orderNote: "",
  manualDiscount: null,
});


const hasOrderData = (order: Order): boolean => {
  if (order.orderDetails != null) {
    return true;
  }

  if (order.items && order.items.length > 0) return true;
  if (order.kitchenNote && order.kitchenNote.trim().length > 0) return true;
  if (order.orderNote && order.orderNote.trim().length > 0) return true;
  if (order.manualDiscount != null) return true;

  return false;
};


function applyClearOrderSlot(prev: Order[], orderId: string): Order[] | null {
  const clearedOrder = prev.find((o) => o.id === orderId);
  if (!clearedOrder) return null;

  const cleared: Order = {
    ...clearedOrder,
    items: [],
    orderDetails: null,
    kitchenNote: "",
    orderNote: "",
    manualDiscount: null,
  };


  const updated = prev.map((order) => (order.id === orderId ? cleared : order));
  const ordersWithData = updated.filter((o) => o.id === orderId || hasOrderData(o));
  return ordersWithData.length > 0 ? ordersWithData : [cleared];
}

const INITIAL_ORDER = createEmptyOrder();
const STORAGE_KEY = "pos_orders";
const ACTIVE_ORDER_KEY = "pos_active_order_id";
const PENDING_PAYMENT_STORAGE_KEY = "pos_pending_payment_flow";

const hasPendingPaymentLock = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return !!sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
  } catch {
    return false;
  }
};

const loadOrdersFromStorage = (): Order[] => {
  if (typeof window === "undefined") return [INITIAL_ORDER];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    return [INITIAL_ORDER];
  }
  return [INITIAL_ORDER];
};

const saveOrdersToStorage = (orders: Order[]) => {
  if (typeof window === "undefined") return;
  try {
    const ordersWithData = orders.filter(hasOrderData);

    if (ordersWithData.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ordersWithData));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be full or unavailable; fail silently
  }
};

const loadActiveOrderIdFromStorage = (): string | null => {
  if (typeof window === "undefined") return INITIAL_ORDER.id;
  try {
    return sessionStorage.getItem(ACTIVE_ORDER_KEY);
  } catch {
    return INITIAL_ORDER.id;
  }
};

const saveActiveOrderIdToStorage = (orderId: string | null) => {
  if (typeof window === "undefined") return;
  try {
    if (orderId) {
      sessionStorage.setItem(ACTIVE_ORDER_KEY, orderId);
    } else {
      sessionStorage.removeItem(ACTIVE_ORDER_KEY);
    }
  } catch {
    return;
  }
};

export function OrderProvider({
  children,
  beforeAddItem,
  beforeAddOrder,
  menuSurfaceRef: menuSurfaceRefProp,
}: {
  children: ReactNode;
  beforeAddItem?: (pending?: PendingAddParams) => boolean;
  beforeAddOrder?: () => boolean;
  menuSurfaceRef?: MutableRefObject<MenuOrderSurface>;
}) {
  const defaultMenuSurfaceRef = useRef<MenuOrderSurface>("menu");
  const menuSurfaceRef = menuSurfaceRefProp ?? defaultMenuSurfaceRef;
  const pendingAfterOrderDetailsRef = useRef<PendingAddParams[]>([]);
  const openOrderDetailsRef = useRef<((mode: OrderDetailsModalMode) => void) | null>(null);

  const initialOrders = (() => {
    const loaded = loadOrdersFromStorage();
    const ordersWithData = loaded.filter(hasOrderData);

    if (ordersWithData.length === 0) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(ACTIVE_ORDER_KEY);
      }
      return [INITIAL_ORDER];
    }

    const validated = ordersWithData.slice(0, 2);
    saveOrdersToStorage(validated);

    return validated;
  })();

  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const [activeOrderId, setActiveOrderIdState] = useState<string | null>(() => {
    const storedId = loadActiveOrderIdFromStorage();
    if (storedId && initialOrders.some((o) => o.id === storedId)) {
      return storedId;
    }
    return initialOrders[0]?.id ?? INITIAL_ORDER.id;
  });

  const setActiveOrderId = useCallback((id: string | null) => {
    setActiveOrderIdState(id);
    saveActiveOrderIdToStorage(id);
  }, []);

  const getActiveOrder = useCallback(() => {
    return orders.find((o) => o.id === activeOrderId) ?? orders[0] ?? null;
  }, [orders, activeOrderId]);

  const items = getActiveOrder()?.items ?? [];
  const activeOrderDetails = getActiveOrder()?.orderDetails ?? null;
  const activeKitchenNote = getActiveOrder()?.kitchenNote ?? "";
  const activeOrderNote = getActiveOrder()?.orderNote ?? "";
  const manualDiscount = getActiveOrder()?.manualDiscount ?? null;


  const setActiveOrderDetails = useCallback(
    (data: OrderDetailsData) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;
      setOrders((prev) => {
        const updated = prev.map((order) =>
          order.id === orderId ? { ...order, orderDetails: data } : order
        );
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const setActiveKitchenNote = useCallback(
    (value: string) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;
      setOrders((prev) => {
        const updated = prev.map((order) =>
          order.id === orderId ? { ...order, kitchenNote: value } : order
        );
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const setActiveOrderNote = useCallback(
    (value: string) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;
      setOrders((prev) => {
        const updated = prev.map((order) =>
          order.id === orderId ? { ...order, orderNote: value } : order
        );
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const setManualDiscount = useCallback(
    (discount: ManualDiscount | null) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;
      setOrders((prev) => {
        const updated = prev.map((order) =>
          order.id === orderId ? { ...order, manualDiscount: discount } : order
        );
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );


  const addOrder = useCallback(() => {
    if (hasPendingPaymentLock()) return;
    if (beforeAddOrder && !beforeAddOrder()) return;
    if (orders.length >= 2) return;
    const newOrder = createEmptyOrder();
    setOrders((prev) => {
      const updated = [...prev, newOrder];
      const ordersWithData = updated.filter(hasOrderData);
      if (ordersWithData.length > 0) {
        saveOrdersToStorage(ordersWithData);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
      return updated;
    });
    setActiveOrderIdState(newOrder.id);
    saveActiveOrderIdToStorage(newOrder.id);
  }, [beforeAddOrder, orders.length]);

  const closeOrder = useCallback((orderId: string) => {
    setOrders((prev) => {
      if (prev.length <= 1) {
        if (prev.length === 1 && prev[0].id === orderId) {
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(ACTIVE_ORDER_KEY);
        }
        return prev;
      }

      const filtered = prev.filter((o) => o.id !== orderId);
      saveOrdersToStorage(filtered);

      setActiveOrderIdState((current) => {
        if (current === orderId) {
          const newActiveId = filtered[0]?.id ?? null;
          saveActiveOrderIdToStorage(newActiveId);
          return newActiveId;
        }
        return current;
      });

      return filtered;
    });
  }, []);

  const clearOrderById = useCallback((orderId: string) => {
    clearMenuOpenCheckoutForSlot(orderId);
    setOrders((prev) => {
      const finalOrders = applyClearOrderSlot(prev, orderId);
      if (!finalOrders) return prev;
      saveOrdersToStorage(finalOrders);
      return finalOrders;
    });
  }, []);

  const clearActiveOrder = useCallback(() => {
    const orderId = activeOrderId;
    if (!orderId) return;
    clearOrderById(orderId);
  }, [activeOrderId, clearOrderById]);

  const registerOpenOrderDetails = useCallback(
    (fn: ((mode: OrderDetailsModalMode) => void) | null) => {
      openOrderDetailsRef.current = fn;
    },
    []
  );

  const clearPendingAddsAfterOrderDetails = useCallback(() => {
    pendingAfterOrderDetailsRef.current = [];
  }, []);

  const addItem = useCallback(
    (
      productId: number,
      name: string,
      price: number,
      details = "REGULAR",
      image?: string,
      variant?: string,
      addOnsList?: string[],
      variationId?: number,
      variationOptionId?: number,
      modifications?: { modificationId: number; price: number }[],
      options?: AddItemOptions,
      linkId?: string,
      isFreeItem?: boolean,
      promotionType?: "BOGO" | "COMBO",
      buyQuantity?: number,
      getQuantity?: number,
      promotionId?: number,
      qty = 1
    ) => {
      if (hasPendingPaymentLock()) return;
      const pending: PendingAddParams = {
        productId,
        name,
        price,
        details,
        image,
        variant,
        addOnsList,
        variationId,
        variationOptionId,
        modifications,
        itemType: options?.itemType,
        recipientName: options?.recipientName,
        recipientMobile: options?.recipientMobile,
        linkId,
        isFreeItem,
        promotionType,
        buyQuantity,
        getQuantity,
        promotionId,
        qty,
      };

      if (!options?.skipOrderDetailsCheck) {
        const surface = menuSurfaceRef.current;
        const orderIdForActive = activeOrderId ?? orders[0]?.id;
        const activeOrder = orders.find((o) => o.id === orderIdForActive);
        const hasOrderDetails = activeOrder?.orderDetails != null;

        if (!hasOrderDetails && (surface === "menu" || surface === "promotions" || surface === "vouchers")) {
          pendingAfterOrderDetailsRef.current = [...pendingAfterOrderDetailsRef.current, pending];
          openOrderDetailsRef.current?.(surface === "vouchers" ? "minimalVoucher" : "full");
          return;
        }
      }

      if (beforeAddItem && !beforeAddItem(pending)) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;

      setOrders((prev) => {
        const updated = prev.map((order) => {
          if (order.id !== orderId) return order;
          // For equality check, we should probably check variation and modifications too
          const existing = order.items.find(
            (i) =>
              i.productId === productId &&
              i.variationId === variationId &&
              i.variationOptionId === variationOptionId &&
              JSON.stringify(i.modifications) === JSON.stringify(modifications) &&
              i.details === details &&
              i.linkId === linkId &&
              i.isFreeItem === isFreeItem &&
              i.itemType === options?.itemType &&
              (i.recipientName ?? "") === (options?.recipientName ?? "") &&
              (i.recipientMobile ?? "") === (options?.recipientMobile ?? "")
          );
          if (existing) {
            return {
              ...order,
              items: order.items.map((i) =>
                i.id === existing.id ? { ...i, qty: i.qty + qty } : i
              ),
            };
          }
          return {
            ...order,
            items: [
              ...order.items,
              {
                id: generateId(),
                productId,
                variationId,
                variationOptionId,
                modifications,
                name,
                details,
                price,
                image,
                variant,
                addOnsList,
                itemType: options?.itemType,
                recipientName: options?.recipientName,
                recipientMobile: options?.recipientMobile,
                linkId,
                isFreeItem,
                promotionType,
                buyQuantity,
                getQuantity,
                promotionId,
                qty,
              },
            ],
          };
        });
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, beforeAddItem, menuSurfaceRef, orders]
  );

  const flushPendingAddsAfterOrderDetails = useCallback(() => {
    const pending = pendingAfterOrderDetailsRef.current;
    if (pending.length === 0) return;
    pendingAfterOrderDetailsRef.current = [];
    for (const p of pending) {
      addItem(
        p.productId,
        p.name,
        p.price,
        p.details,
        p.image,
        p.variant,
        p.addOnsList,
        p.variationId,
        p.variationOptionId,
        p.modifications,
        {
          skipOrderDetailsCheck: true,
          itemType: p.itemType,
          recipientName: p.recipientName,
          recipientMobile: p.recipientMobile,
        },
        p.linkId,
        p.isFreeItem,
        p.promotionType,
        p.buyQuantity,
        p.getQuantity,
        p.promotionId,
        p.qty
      );
    }
  }, [addItem]);

  const updateQty = useCallback(
    (itemId: string, delta: number) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;

      setOrders((prev) => {
        const updated = prev.map((order) => {
          if (order.id !== orderId) return order;

          const targetItem = order.items.find(i => i.id === itemId);
          if (!targetItem) return order;

          let actualDelta = delta;
          if (targetItem.promotionType === "BOGO" && !targetItem.isFreeItem && targetItem.buyQuantity) {
            // Treat +/- 1 as +/- one full pack
            if (Math.abs(delta) === 1) {
              actualDelta = delta > 0 ? targetItem.buyQuantity : -targetItem.buyQuantity;
            }
          }

          const newQty = Math.max(0, targetItem.qty + actualDelta);

          let updatedItems = order.items.map((i) =>
            i.id === itemId ? { ...i, qty: newQty } : i
          );

          // Sync linked BOGO items
          if (targetItem.promotionType === "BOGO" && targetItem.linkId) {
            if (!targetItem.isFreeItem) {
              // This is a "Buy" item, sync the "Free" one
              const freeItem = updatedItems.find(i => i.linkId === targetItem.linkId && i.isFreeItem);
              if (freeItem && freeItem.buyQuantity && freeItem.getQuantity) {
                const newFreeQty = Math.floor(newQty / freeItem.buyQuantity) * freeItem.getQuantity;
                updatedItems = updatedItems.map(i =>
                  i.id === freeItem.id ? { ...i, qty: newFreeQty } : i
                );
              }
            }
          }

          return {
            ...order,
            items: updatedItems.filter((i) => i.qty > 0),
          };
        });
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;

      setOrders((prev) => {
        const updated = prev.map((order) => {
          if (order.id !== orderId) return order;

          const targetItem = order.items.find(i => i.id === itemId);
          if (!targetItem) return order;

          const filteredItems = order.items.filter((i) => {
            if (i.id === itemId) return false;
            // If we remove a BOGO "buy" item, remove all its linked items
            if (targetItem.promotionType === "BOGO" && targetItem.linkId && !targetItem.isFreeItem) {
              if (i.linkId === targetItem.linkId) return false;
            }
            return true;
          });

          return {
            ...order,
            items: filteredItems,
          };
        });
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const updateItem = useCallback(
    (
      itemId: string,
      productId: number,
      name: string,
      price: number,
      details = "REGULAR",
      image?: string,
      variant?: string,
      addOnsList?: string[],
      variationId?: number,
      variationOptionId?: number,
      modifications?: { modificationId: number; price: number }[],
      qty?: number,
      options?: AddItemOptions
    ) => {
      if (hasPendingPaymentLock()) return;
      const orderId = activeOrderId ?? orders[0]?.id;
      if (!orderId) return;

      setOrders((prev) => {
        const updated = prev.map((order) => {
          if (order.id !== orderId) return order;
          return {
            ...order,
            items: order.items.map((i) =>
              i.id === itemId
                ? {
                  ...i,
                  productId,
                  variationId,
                  variationOptionId,
                  modifications,
                  name,
                  details,
                  price,
                  qty: qty !== undefined ? qty : i.qty,
                  image,
                  variant,
                  addOnsList,
                  itemType: options?.itemType ?? i.itemType,
                  recipientName: options?.recipientName ?? i.recipientName,
                  recipientMobile: options?.recipientMobile ?? i.recipientMobile,
                }
                : i
            ),
          };
        });
        saveOrdersToStorage(updated);
        return updated;
      });
    },
    [activeOrderId, orders]
  );

  const loadOrderById = useCallback(
    (orderId: string, orderData?: Partial<Order>) => {
      const existingOrder = orders.find((o) => o.id === orderId);
      if (existingOrder) {
        if (orderData) {
          setOrders((prev) => {
            const updated = prev.map((o) =>
              o.id === orderId
                ? {
                  ...o,
                  orderDetails: orderData.orderDetails !== undefined ? orderData.orderDetails : o.orderDetails,
                  items: orderData.items !== undefined ? orderData.items : o.items,
                  kitchenNote: orderData.kitchenNote !== undefined ? orderData.kitchenNote : o.kitchenNote,
                  orderNote: orderData.orderNote !== undefined ? orderData.orderNote : o.orderNote,
                  manualDiscount: orderData.manualDiscount !== undefined ? orderData.manualDiscount : o.manualDiscount,
                }

                : o
            );
            saveOrdersToStorage(updated);
            return updated;
          });
        }
        setActiveOrderIdState(orderId);
        saveActiveOrderIdToStorage(orderId);
        return;
      }

      const newOrder: Order = {
        id: orderId,
        items: orderData?.items ?? [],
        orderDetails: orderData?.orderDetails ?? null,
        kitchenNote: orderData?.kitchenNote ?? "",
        orderNote: orderData?.orderNote ?? "",
        manualDiscount: orderData?.manualDiscount ?? null,
      };


      setOrders((prev) => {
        let updated: Order[];
        if (prev.length < 2) {
          updated = [...prev, newOrder];
        } else {
          const emptyOrderIndex = prev.findIndex(
            (o) => !o.orderDetails && o.items.length === 0 && !o.kitchenNote && !o.orderNote
          );
          if (emptyOrderIndex !== -1) {
            updated = prev.map((o, i) => (i === emptyOrderIndex ? newOrder : o));
          } else {
            updated = [prev[1], newOrder];
          }
        }
        const ordersToSave = updated.slice(0, 2);
        saveOrdersToStorage(ordersToSave);
        return updated;
      });
      setActiveOrderIdState(orderId);
      saveActiveOrderIdToStorage(orderId);
    },
    [orders]
  );

  const canAddOrder = orders.length < 2;
  const canCloseOrder = orders.length > 1;

  const [checkoutLockedOrderSlotId, setCheckoutLockedOrderSlotId] = useState<string | null>(null);

  const activeOrderIdRef = useRef(activeOrderId);
  const checkoutLockedOrderSlotIdRef = useRef(checkoutLockedOrderSlotId);

  useLayoutEffect(() => {
    activeOrderIdRef.current = activeOrderId;
    checkoutLockedOrderSlotIdRef.current = checkoutLockedOrderSlotId;
  }, [activeOrderId, checkoutLockedOrderSlotId]);

  const clearCheckoutSession = useCallback((preferredOrderSlotId?: string | null) => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
      } catch {
        /* */
      }
    }
    setCheckoutLockedOrderSlotId(null);

    const tryIds = [
      preferredOrderSlotId,
      checkoutLockedOrderSlotIdRef.current,
      activeOrderIdRef.current,
    ].filter((id): id is string => id != null && String(id).length > 0);

    const targetId =
      tryIds.find((id) => orders.some((o) => o.id === id)) ?? orders[0]?.id;
    if (targetId) {
      clearMenuOpenCheckoutForSlot(targetId);
    }

    setOrders((prev) => {
      const resolved =
        tryIds.find((id) => prev.some((o) => o.id === id)) ?? prev[0]?.id;
      if (!resolved) return prev;

      const finalOrders = applyClearOrderSlot(prev, resolved);
      if (!finalOrders) return prev;
      saveOrdersToStorage(finalOrders);
      return finalOrders;
    });
  }, [orders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        activeOrderId,
        setActiveOrderId,
        addOrder,
        closeOrder,
        clearActiveOrder,
        clearOrderById,
        clearCheckoutSession,
        checkoutLockedOrderSlotId,
        setCheckoutLockedOrderSlotId,
        getActiveOrder,
        items,
        activeOrderDetails,
        setActiveOrderDetails,
        activeKitchenNote,
        activeOrderNote,
        setActiveKitchenNote,
        setActiveOrderNote,
        manualDiscount,
        setManualDiscount,
        addItem,
        registerOpenOrderDetails,
        flushPendingAddsAfterOrderDetails,
        clearPendingAddsAfterOrderDetails,
        updateQty,
        removeItem,
        updateItem,
        canAddOrder,
        canCloseOrder,
        loadOrderById,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return ctx;
}
