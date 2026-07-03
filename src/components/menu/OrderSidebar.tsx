"use client";

import { AxiosError } from "axios";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import MenuProductImage from "./MenuProductImage";
import { toast } from "sonner";
import { User, Phone, ChefHat, Trash2, X, Gem, ShoppingBasket } from "lucide-react";
import { useOrder } from "@/contexts/OrderContext";
import { useCreateOrder } from "@/hooks/useOrder";
import {
  useUpdateCustomer,
  useGetCustomerByMobile,
} from "@/hooks/useCustomer";
import { useAuth } from "@/contexts/AuthContext";
import { useServiceCharge } from "@/hooks/useServiceCharge";
import {
  useGetAllDiscounts,
  findApplicableDiscount,
  calculateItemDiscount,
} from "@/hooks/useDiscount";
import NewOrderDetailsModal from "./NewOrderDetailsModal";
import ManualDiscountModal from "./ManualDiscountModal";
import ProcessPaymentModal from "./ProcessPaymentModal";
import type { OrderDetailsData, OrderItem, OrderDetailsModalMode } from "@/contexts/OrderContext";
import type { CreateOrderData, Order } from "@/types/order";
import {
  buildCreatePaymentDraftFromOrder,
  ORDER_MONEY_EPS,
} from "@/domains/orders/orderCollectionAmount";
import { fetchOrderStateForPaymentCreate } from "@/services/paymentService";
import {
  readMenuOpenCheckout,
  saveMenuOpenCheckout,
  clearMenuOpenCheckoutForSlot,
} from "@/lib/menuOpenCheckout";


type NoteModalType = "kitchen" | "order" | null;
type PaymentFlowState = {
  customerName: string;
  customerMobile?: string;
  settlementAmount: number;
  orderId?: number;
  localOrderId?: string;
};
const PENDING_PAYMENT_STORAGE_KEY = "pos_pending_payment_flow";

const isVoucherLineItem = (item: OrderItem): boolean => {
  if (item.itemType === "voucher") return true;
  if (item.itemType === "food") return false;
  const name = item.name.toLowerCase();
  return name.includes("voucher") || name.includes("gift voucher");
};

const isMockOnlyLineItem = (item: OrderItem): boolean =>
  item.itemType === "promotion";

function loadPendingPaymentFlow(): PaymentFlowState | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = sessionStorage.getItem(PENDING_PAYMENT_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<PaymentFlowState> & { total?: number };
    const settlement =
      typeof parsed.settlementAmount === "number" && Number.isFinite(parsed.settlementAmount)
        ? parsed.settlementAmount
        : typeof parsed.total === "number" && Number.isFinite(parsed.total)
          ? parsed.total
          : null;
    if (typeof parsed.customerName === "string" && settlement != null && typeof parsed.orderId === "number") {
      return {
        customerName: parsed.customerName,
        ...(typeof parsed.customerMobile === "string" ? { customerMobile: parsed.customerMobile } : {}),
        settlementAmount: settlement,
        orderId: parsed.orderId,
        ...(typeof parsed.localOrderId === "string" && parsed.localOrderId
          ? { localOrderId: parsed.localOrderId }
          : {}),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function savePendingPaymentFlow(flow: PaymentFlowState | null) {
  if (typeof window === "undefined") return;
  try {
    if (flow) {
      sessionStorage.setItem(PENDING_PAYMENT_STORAGE_KEY, JSON.stringify(flow));
    } else {
      sessionStorage.removeItem(PENDING_PAYMENT_STORAGE_KEY);
    }
  } catch {
    return;
  }
}

function NoteModal({
  type,
  title,
  value,
  onSave,
  onClose,
}: {
  type: NoteModalType;
  title: string;
  value: string;
  onSave: (value: string) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  if (!type) return null;
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[16px] border border-[#F1F5F9] bg-white p-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-['Arial'] text-lg font-bold leading-6 text-[#1D293D]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Enter ${title.toLowerCase()}...`}
          rows={3}
          className="mt-3 w-full resize-none rounded-[10px] border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 font-['Arial'] text-sm leading-5 text-[#0A0A0A] placeholder:text-[#45556C80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20"
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[14px] border border-[#E2E8F0] bg-white py-2 font-['Arial'] text-sm font-bold leading-5 text-[#45556C] hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof onSave === "function") onSave(draft);
              onClose();
            }}
            className="flex-1 rounded-[14px] bg-[#EA580C] py-2 font-['Arial'] text-sm font-bold leading-5 text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D] hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderSidebar({ onEditItem }: { onEditItem?: (item: OrderItem) => void }) {
  const { mutateAsync: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { mutateAsync: updateCustomer } = useUpdateCustomer();
  const { user } = useAuth();

  const {
    orders,
    items,
    updateQty,
    removeItem,
    activeOrderDetails,
    setActiveOrderDetails,
    activeOrderId,
    activeKitchenNote,
    activeOrderNote,
    setActiveKitchenNote,
    setActiveOrderNote,
    clearOrderById,
    clearCheckoutSession,
    setCheckoutLockedOrderSlotId,
    registerOpenOrderDetails,
    flushPendingAddsAfterOrderDetails,
    clearPendingAddsAfterOrderDetails,
    manualDiscount,
    setManualDiscount,
  } = useOrder();


  const [editOrderId, setEditOrderId] = useState<string | null>(null);
  const [orderDetailsModalMode, setOrderDetailsModalMode] =
    useState<OrderDetailsModalMode>("full");
  const [noteModal, setNoteModal] = useState<NoteModalType>(null);
  const [paymentFlow, setPaymentFlow] = useState<PaymentFlowState | null>(null);
  const [pendingPaymentOrder, setPendingPaymentOrder] = useState<PaymentFlowState | null>(() =>
    loadPendingPaymentFlow()
  );
  const [isOrderAndPaySubmitting, setIsOrderAndPaySubmitting] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const orderSubmitLockRef = useRef(false);


  useEffect(() => {
    const p = loadPendingPaymentFlow();
    if (p?.localOrderId) setCheckoutLockedOrderSlotId(p.localOrderId);
  }, [setCheckoutLockedOrderSlotId]);

  useLayoutEffect(() => {
    registerOpenOrderDetails((mode) => {
      setOrderDetailsModalMode(mode);
      setEditOrderId(activeOrderId);
    });
    return () => registerOpenOrderDetails(null);
  }, [activeOrderId, registerOpenOrderDetails]);

  useEffect(() => {
    const p = pendingPaymentOrder;
    const orderId = p?.orderId;
    if (orderId == null) return;
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchOrderStateForPaymentCreate(orderId);
        if (cancelled) return;
        const draft = buildCreatePaymentDraftFromOrder(fresh);
        if (draft.amount <= ORDER_MONEY_EPS) {
          toast.message("Previous checkout was already completed. You can start a new order.");
          clearCheckoutSession(p?.localOrderId ?? null);
          setPendingPaymentOrder(null);
        }
      } catch {
        /* keep pending if we cannot verify */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingPaymentOrder, pendingPaymentOrder?.orderId, pendingPaymentOrder?.localOrderId, clearCheckoutSession]);

  const { data: discountsData } = useGetAllDiscounts({ status: "active" });
  const discounts = discountsData || [];
  const { data: customerData } = useGetCustomerByMobile(activeOrderDetails?.phone || "");

  const orderDetails = activeOrderDetails;
  const orderLabel = "Current Order";
  const hasDetails = orderDetails !== null;
  const showModal = editOrderId != null && activeOrderId != null && editOrderId === activeOrderId;
  const hasPendingPayment = !!pendingPaymentOrder;

  const handleOrderDetailsSubmit = (data: OrderDetailsData) => {
    setActiveOrderDetails(data);
    setEditOrderId(null);
    flushPendingAddsAfterOrderDetails();
  };

  const itemsWithDiscounts = items.map((item) => {
    const applicable = findApplicableDiscount(item, discounts);
    let discountAmount = 0;
    if (applicable) {
      discountAmount = calculateItemDiscount(item.price, item.qty, applicable.discountItem);
    }
    return {
      ...item,
      discountAmount,
      discountName: applicable?.discountName,
      discountOffer: applicable
        ? applicable.discountItem.discountType === "percentage"
          ? `${applicable.discountItem.discountValue}%`
          : `Rs.${Number(applicable.discountItem.discountValue).toLocaleString()}`
        : "",
    };
  });

  const subtotalBeforeDiscount = itemsWithDiscounts.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItemDiscount = itemsWithDiscounts.reduce((sum, i) => sum + i.discountAmount, 0);
  const subtotal = subtotalBeforeDiscount - totalItemDiscount;
  const hasVoucherItems = items.some((item) => isVoucherLineItem(item));
  const hasFoodItems = items.some((item) => !isVoucherLineItem(item));
  const isVoucherOnlyOrder = hasVoucherItems && !hasFoodItems;
  const hasMockOnlyItems = items.some((item) => isMockOnlyLineItem(item));
  const cartTaxAmount = 0;
  const serviceChargeBranchId = user?.branchId ?? null;
  const { data: serviceChargeSetting } = useServiceCharge(serviceChargeBranchId);
  const serviceChargePercentageRaw = Number(serviceChargeSetting?.percentage ?? 0);
  const serviceChargePercentage = Number.isFinite(serviceChargePercentageRaw)
    ? serviceChargePercentageRaw
    : 0;
  const serviceChargeAmount =
    !isVoucherOnlyOrder && orderDetails?.orderType === "Dine In"
      ? Number((subtotal * (serviceChargePercentage / 100)).toFixed(2))
      : 0;
  const deliveryChargeAmount =
    !isVoucherOnlyOrder && orderDetails?.orderType === "Delivery"
      ? Number(orderDetails.deliveryChargeAmount ?? 0)
      : 0;

  const manualDiscountAmountRaw = manualDiscount
    ? manualDiscount.type === "percentage"
      ? (subtotal * manualDiscount.value) / 100
      : manualDiscount.value
    : 0;
  const manualDiscountAmount = Math.min(manualDiscountAmountRaw, subtotal);

  const total = subtotal - manualDiscountAmount + cartTaxAmount + serviceChargeAmount + deliveryChargeAmount;



  const handleSubmitOrder = async (
    isPayNow = false
  ): Promise<{ serverOrderId: number; localSlotId: string; order: Order } | null> => {
    if (!orderDetails || items.length === 0) return null;

    const localSlotId = activeOrderId ?? orders[0]?.id;
    if (!localSlotId) return null;

    if (orderSubmitLockRef.current) {
      toast.message("Please wait — an order is already being sent.");
      return null;
    }
    orderSubmitLockRef.current = true;

    try {
      setCheckoutLockedOrderSlotId(localSlotId);

      const normalizedName = orderDetails.customerName.trim();
      const total = subtotal - manualDiscountAmount + cartTaxAmount + serviceChargeAmount + deliveryChargeAmount;

      const buildFingerprint = () => {
        const line = itemsWithDiscounts
          .map((i) => `${i.productId}|${i.id}|${i.qty}|${i.price}`)
          .sort()
          .join(";");
        const orderTypeForFingerprint = isVoucherOnlyOrder ? "voucher_only" : orderDetails.orderType;
        return `${line}@t${total.toFixed(2)}@p${orderDetails.phone.trim()}@${normalizedName}@${orderTypeForFingerprint}`;
      };

      if (hasMockOnlyItems) {
        if (!isPayNow) {
          clearOrderById(localSlotId);
          setCheckoutLockedOrderSlotId(null);
          toast.success("Mock order completed (frontend only).");
        }
        return null;
      }

      const fp = buildFingerprint();
      const open = readMenuOpenCheckout();
      if (open?.localSlotId === localSlotId) {
        if (open.fingerprint !== fp) {
          clearMenuOpenCheckoutForSlot(localSlotId);
        } else if (open.serverOrderId) {
          if (isPayNow) {
            toast.message(`Resuming order #${open.serverOrderId} — not creating a duplicate.`);
            try {
              const order = await fetchOrderStateForPaymentCreate(open.serverOrderId);
              return { serverOrderId: open.serverOrderId, localSlotId, order };
            } catch {
              toast.error(
                "Could not load that order. Open the Orders page before trying again, or change the cart."
              );
              setCheckoutLockedOrderSlotId(null);
              return null;
            }
          }
          toast.message(
            `Order #${open.serverOrderId} may already exist for this cart. Check Orders before placing again, or change items in the cart.`
          );
          setCheckoutLockedOrderSlotId(null);
          return null;
        }
      }

      const normalizedOriginalName = (orderDetails.originalCustomerName ?? "").trim();
      const shouldUpdateExistingCustomerName =
        !!orderDetails.customerId &&
        normalizedName.length > 0 &&
        !!normalizedOriginalName &&
        normalizedName.localeCompare(normalizedOriginalName, undefined, {
          sensitivity: "accent",
        }) !== 0;

      if (shouldUpdateExistingCustomerName) {
        try {
          await updateCustomer({
            id: orderDetails.customerId!,
            data: { name: normalizedName },
          });
        } catch (err) {
          setCheckoutLockedOrderSlotId(null);
          const message =
            err instanceof AxiosError
              ? (err.response?.data as { message?: string } | undefined)?.message
              : err instanceof Error
                ? err.message
                : "Unknown error";
          toast.error("Failed to update customer name", { description: message });
          return null;
        }
      }

      const resolvedOrderType =
        orderDetails.orderType === "Dine In"
          ? "dining"
          : orderDetails.orderType === "Take Away"
            ? "takeaway"
            : "delivery";

      const orderProductsPayload = items.map((item) => {
          const modificationUnitSum = (item.modifications ?? []).reduce(
            (sum, m) => sum + Number(m.price || 0),
            0
          );
          const baseUnitPrice = Math.max(0, Number(item.price) - modificationUnitSum);

          // Backend expects `variationOptionId` (row id from `variationoptions`) only.
          // Never send the parent `variationId` (row id from `variations`) — the backend
          // treats that as a FK into `variationoptions` and rejects it.
          // Omit the field entirely when the line has no variation (do not send 0/"").
          const hasVariationOption =
            typeof item.variationOptionId === "number" && item.variationOptionId > 0;

          const isBundleLine = item.promotionType === "COMBO";
          const isBogoLine = item.promotionType === "BOGO";

          return {
            // Bundle lines are identified solely by productBundleId on the backend.
            ...(isBundleLine ? {} : { productId: item.productId }),
            ...(hasVariationOption && !isBundleLine
              ? { variationOptionId: item.variationOptionId }
              : {}),
            quantity: item.qty,
            unitPrice: Number(baseUnitPrice.toFixed(2)),
            productDiscount:
              (itemsWithDiscounts.find((i) => i.id === item.id)?.discountAmount || 0) / item.qty,
            ...(item.modifications && item.modifications.length > 0
              ? {
                  modifications: item.modifications.map((m) => ({
                    modificationId: m.modificationId,
                    price: m.price,
                  })),
                }
              : {}),
            ...(isBogoLine && item.promotionId ? { bogoPromotionId: item.promotionId } : {}),
            ...(isBundleLine && item.promotionId ? { productBundleId: item.promotionId } : {}),
            ...(item.recipientName || item.recipientMobile
              ? {
                  notes: `Recipient${item.recipientName ? `: ${item.recipientName}` : ""}${
                    item.recipientMobile ? ` ${item.recipientMobile}` : ""
                  }`,
                }
              : {}),
          };
        });

      const payload: CreateOrderData = isVoucherOnlyOrder
        ? {
            customerName: normalizedName,
            customerMobile: orderDetails.phone,
            customerId: orderDetails.customerId,
            totalAmount: total,
            orderType: "takeaway",
            orderDiscount: manualDiscountAmount,
            tax: cartTaxAmount,
            orderNote: activeOrderNote,
            kitchenNote: activeKitchenNote,
            order_products: orderProductsPayload,
          }
        : {
            customerName: normalizedName,
            customerMobile: orderDetails.phone,
            customerId: orderDetails.customerId,
            totalAmount: total,
            orderType: resolvedOrderType,
            tableId: orderDetails.tableId ?? null,
            tableNumber: orderDetails.tableNumber,
            orderDiscount: manualDiscountAmount,
            tax: cartTaxAmount,
            orderNote: activeOrderNote,
            kitchenNote: activeKitchenNote,
            deliveryAddress: orderDetails.deliveryAddress,
            landmark: orderDetails.landmark,
            zipcode: orderDetails.zipCode,
            deliveryInstructions: orderDetails.deliveryInstructions,
            serviceCharge: serviceChargeAmount,
            deliveryChargeAmount,
            deliveryChargeId:
              orderDetails.orderType === "Delivery" ? (orderDetails.deliveryChargeId ?? null) : null,
            deliveryChargeSelectedId:
              orderDetails.orderType === "Delivery" ? (orderDetails.deliveryChargeId ?? null) : null,
            order_products: orderProductsPayload,
          };

      const result = await createOrder(payload);
      const serverOrderId = Number(result.id);
      saveMenuOpenCheckout({ localSlotId, serverOrderId, fingerprint: fp });

      if (!isPayNow) {
        clearOrderById(localSlotId);
        toast.success("Order submitted successfully");
        setCheckoutLockedOrderSlotId(null);
      }
      return { serverOrderId, localSlotId, order: result };
    } catch (err) {
      setCheckoutLockedOrderSlotId(null);
      const message =
        err instanceof AxiosError
          ? (err.response?.data as { message?: string } | undefined)?.message
          : err instanceof Error
            ? err.message
            : "Unknown error";
      const networkOrTimeout =
        err instanceof AxiosError &&
        (!err.response || err.code === "ECONNABORTED" || err.message === "Network Error");
      toast.error("Failed to submit order", {
        description: networkOrTimeout
          ? `${message ? `${message} ` : ""}If you are unsure, open Orders — the order may still have been created. Do not retry until you check.`.trim()
          : message,
      });
      return null;
    } finally {
      orderSubmitLockRef.current = false;
    }
  };

  const handleOrderAndPay = async () => {
    if (paymentFlow) return;

    if (pendingPaymentOrder) {
      setPaymentFlow(pendingPaymentOrder);
      if (pendingPaymentOrder.localOrderId) {
        setCheckoutLockedOrderSlotId(pendingPaymentOrder.localOrderId);
      }
      return;
    }

    if (isOrderAndPaySubmitting || !orderDetails || items.length === 0) return;

    const paymentSnapshot = { customerName: orderDetails.customerName, customerMobile: orderDetails.phone };

    if (hasMockOnlyItems) {
      const localSlotId = activeOrderId ?? orders[0]?.id;
      setPaymentFlow({
        customerName: paymentSnapshot.customerName,
        customerMobile: paymentSnapshot.customerMobile,
        settlementAmount: total,
        localOrderId: localSlotId ?? undefined,
      });
      if (localSlotId) setCheckoutLockedOrderSlotId(localSlotId);
      return;
    }

    setIsOrderAndPaySubmitting(true);

    try {
      const submitted = await handleSubmitOrder(true);
      if (submitted) {
        const draft = buildCreatePaymentDraftFromOrder(submitted.order);
        if (draft.amount <= ORDER_MONEY_EPS) {
          toast.message(
            "This order is already fully paid on the server. Your basket will be cleared so you can continue."
          );
          clearCheckoutSession(submitted.localSlotId);
          setPendingPaymentOrder(null);
          return;
        }
        const nextPaymentFlow: PaymentFlowState = {
          customerName: paymentSnapshot.customerName,
          customerMobile: paymentSnapshot.customerMobile,
          settlementAmount: draft.amount,
          orderId: submitted.serverOrderId,
          localOrderId: submitted.localSlotId,
        };
        setPendingPaymentOrder(nextPaymentFlow);
        savePendingPaymentFlow(nextPaymentFlow);
        setPaymentFlow(nextPaymentFlow);
      }
    } finally {
      setIsOrderAndPaySubmitting(false);
    }
  };

  return (
    <>
      <aside
        className="fixed right-0 z-40 flex w-[320px] flex-col overflow-hidden border-l border-t border-zinc-200 bg-white shadow-lg md:w-[380px]"
        style={{
          top: "var(--order-sidebar-top)",
          height: "var(--order-sidebar-height)",
        }}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          {hasDetails ? (
            <>
              <div className="mt-3 flex items-center justify-between px-5 py-2.5">
                <h2 className="font-['Arial'] text-xl font-bold leading-7 text-[#0F172B]">
                  {orderLabel}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOrderDetailsModalMode("full");
                    setEditOrderId(activeOrderId);
                  }}
                  disabled={hasPendingPayment}
                  className="font-['Arial'] text-xs font-bold uppercase leading-4 text-[#E26522] transition-opacity duration-300 ease-out hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
                >
                  EDIT INFO
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b border-[#F1F5F9] bg-[#F8FAFC80] px-5 pb-3 pt-1">
                <div className="flex min-w-0 items-center gap-2 font-['Arial'] text-[14px] leading-5 text-[#45556C]">
                  <User className="h-4 w-4 shrink-0 text-[#90A1B9]" />
                  <span className="truncate">{orderDetails.customerName}</span>
                </div>
                <div className="flex min-w-0 items-center gap-2 font-['Arial'] text-[14px] leading-5 text-[#45556C]">
                  <Phone className="h-4 w-4 shrink-0 text-[#90A1B9]" />
                  <span className="truncate">{orderDetails.phone}</span>
                </div>
                {!isVoucherOnlyOrder && (
                  <div className="flex min-w-0 items-center gap-2 font-['Arial'] text-[14px] font-bold leading-5 text-[#E26522]">
                    <ShoppingBasket className="h-4 w-4 shrink-0" />
                    <span className="truncate">{orderDetails.orderType}</span>
                  </div>
                )}
                <div className="flex min-w-0 items-center gap-2 font-['Arial'] text-[14px] font-bold leading-5 text-[#F58F00]">
                  <Gem className="h-4 w-4 shrink-0" />
                  <span className="truncate">{customerData?.loyalty_points || 0} Points</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="px-5 pt-4 pb-2">
                <p className="font-['Arial'] text-base font-bold leading-7 text-[#EA580C] mt-2">
                  Choose a menu option to start a new order.
                </p>
              </div>
              <div className="flex items-center bg-[#F8FAFC80] px-5 pb-2.5 mt-1">
                <div className="flex w-1/2 items-center gap-1.5 font-['Arial'] text-sm leading-5 text-[#45556C]">
                  <User className="h-3.5 w-3.5" />
                  <span>—</span>
                </div>
                <div className="flex w-1/2 items-center gap-1.5 font-['Arial'] text-sm leading-5 text-[#45556C]">
                  <Phone className="h-3.5 w-3.5" />
                  <span>—</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 border-b border-[#F1F5F9] bg-[#F8FAFC80] px-5 py-1.5">
                <svg
                  className="h-4 w-4 shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 7.33331L9.33337 13.3333"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.6667 7.33335L10 2.66669"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M1.33337 7.33331H14.6667"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M2.33337 7.33331L3.40004 12.2666C3.46238 12.5723 3.62994 12.8465 3.87356 13.0414C4.11719 13.2363 4.42145 13.3396 4.73337 13.3333H11.2667C11.5786 13.3396 11.8829 13.2363 12.1265 13.0414C12.3701 12.8465 12.5377 12.5723 12.6 12.2666L13.7334 7.33331"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3 10.3333H13"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M3.33337 7.33335L6.00004 2.66669"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 7.33331L6.66667 13.3333"
                    stroke="#E26522"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="font-['Arial'] text-sm font-bold leading-5 text-[#E26522]">—</span>
              </div>
            </>
          )}

          <div className="flex-1 overflow-y-auto px-5">
            <div className="space-y-3 py-1">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <svg
                    className="h-6 w-6 text-[#90A1B9]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                  <p className="mt-2 font-['Arial'] text-xs font-bold uppercase leading-4 text-[#90A1B9]">
                    NO ITEMS IN CART
                  </p>
                </div>
              ) : (
                itemsWithDiscounts.map((item) => {
                  const variant = item.variant || "";
                  const addOns = item.addOnsList || [];

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (hasPendingPayment) return;
                        if (item.promotionType === "BOGO" || item.promotionType === "COMBO") return; // Disable edit for BOGO and Combo offers
                        onEditItem?.(item);
                      }}
                      className={`flex gap-4 rounded-[14px] border border-[#F1F5F9] bg-white px-3 pb-2.5 pt-3 transition-colors ${onEditItem && item.promotionType !== "BOGO" && item.promotionType !== "COMBO" ? "cursor-pointer hover:bg-[#F8FAFC]" : ""}`}
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                        <MenuProductImage
                          productImageUrl={item.image}
                          fallbackImageId={String(item.productId)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="font-['Arial'] text-sm font-bold leading-[17.5px] text-[#1D293D]">
                              {item.name}
                            </p>
                            <p className="font-['Arial'] text-[10px] font-bold uppercase leading-[15px] text-[#EA580C]">
                              {variant}
                            </p>
                            {addOns.length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {addOns.map((addOn, idx) => {
                                  const match = addOn.match(/^(.+?)\s*x(\d+)$/);
                                  const label = match ? `+${match[2]} ${match[1]}` : `+${addOn}`;
                                  return (
                                    <span
                                      key={`${addOn}-${idx}`}
                                      className="inline-block rounded bg-[#F1F5F9] px-1.5 py-0.5 font-['Arial'] text-[9px] leading-[13.5px] text-[#62748E]"
                                    >
                                      {label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {(item.recipientName || item.recipientMobile) && (
                              <p className="mt-0.5 font-['Arial'] text-[10px] leading-[15px] text-[#62748E]">
                                Recipient: {item.recipientName || "—"}
                                {item.recipientMobile ? ` (${item.recipientMobile})` : ""}
                              </p>
                            )}
                          </div>
                          {!item.isFreeItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.id);
                              }}
                              disabled={hasPendingPayment}
                              className="shrink-0 text-[#CAD5E2] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[#CAD5E2]"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span className="font-['Arial'] text-sm font-bold leading-5 text-[#0F172B]">
                            Rs.
                            {(item.price * item.qty).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          {!item.isFreeItem ? (
                            <div className="flex items-center gap-3 rounded-[10px] border border-[#F1F5F9] bg-[#F8FAFC] px-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQty(item.id, -1);
                                }}
                                disabled={hasPendingPayment}
                                className="py-1 text-[#90A1B9] hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[#90A1B9]"
                              >
                                −
                              </button>
                              <span className="flex min-w-[16px] items-center justify-center font-['Arial'] text-xs font-black text-[#0A0A0A]">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQty(item.id, 1);
                                }}
                                disabled={hasPendingPayment}
                                className="py-1 text-[#90A1B9] hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[#90A1B9]"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 px-2">
                              <span className="font-['Arial'] text-[10px] font-black tracking-wider text-[#90A1B9] uppercase">QTY:</span>
                              <span className="font-['Arial'] text-xs font-black text-[#0A0A0A]">
                                {item.qty}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-2 border-t border-zinc-200 px-5 py-2">
            <div className="flex flex-col gap-2 rounded-[14px] border border-[#E2E8F0] bg-white px-3 py-2.5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
              <p className="font-['Arial'] text-[10px] font-black uppercase leading-[15px] tracking-[1px] text-[#90A1B9]">
                Estimated Preparation
              </p>
              <input
                type="text"
                defaultValue="15 mins"
                placeholder="e.g. 15 mins"
                className="w-full rounded-[10px] border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-1.5 font-['Arial'] text-xs leading-[100%] text-[#45556C80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNoteModal("kitchen")}
                disabled={hasPendingPayment}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#E2E8F0] bg-white py-2 font-['Arial'] text-xs font-bold leading-4 text-[#45556C] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <ChefHat className="h-4 w-4" />
                Kitchen Note
              </button>
              <button
                type="button"
                onClick={() => setNoteModal("order")}
                disabled={hasPendingPayment}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-[#E2E8F0] bg-white py-2 font-['Arial'] text-xs font-bold leading-4 text-[#45556C] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.6667 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V5.33333L10.6667 2Z"
                    stroke="#45556C"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 2V4.66667C10 5.02029 10.1405 5.35943 10.3905 5.60948C10.6406 5.85952 10.9797 6 11.3333 6H14"
                    stroke="#45556C"
                    strokeWidth="1.33333"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Order Note
              </button>
            </div>

            <div className="flex flex-col gap-1 rounded-[14px] border-2 border-[#E2E8F0] bg-white px-3 py-2 font-['Arial'] text-sm font-bold leading-5 text-[#62748E]">
              <div className="flex items-center justify-between">
                <p className="font-['Arial'] text-[14px] font-bold leading-4 text-[#62748E]">
                  % Discount Applied
                </p>
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(true)}
                  disabled={hasPendingPayment || items.length === 0}
                  className="font-['Arial'] text-[10px] font-bold uppercase text-[#E26522] hover:opacity-70 disabled:opacity-50"
                >
                  {manualDiscount ? "Edit" : "Add Manual"}
                </button>
              </div>
              {totalItemDiscount > 0 || manualDiscountAmount > 0 ? (
                <div className="mt-1 space-y-1">
                  {itemsWithDiscounts
                    .filter((i) => i.discountAmount > 0)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-[11px] font-normal text-[#45556C]"
                      >
                        <span className="truncate pr-2">
                          {item.name} ({item.discountName})
                        </span>
                        <span className="shrink-0">
                          - Rs.
                          {item.discountAmount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    ))}
                  {manualDiscount && (
                    <div className="flex justify-between border-t border-dashed border-[#E2E8F0] pt-1 text-[11px] font-bold text-[#EA580C]">
                      <span>Manual Discount ({manualDiscount.type === "percentage" ? `${manualDiscount.value}%` : "Flat"})</span>
                      <span>
                        - Rs.{manualDiscountAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-xs font-normal text-[#90A1B9] mt-1">
                  No discounts available
                </p>
              )}
            </div>


            <div className="space-y-1">
              <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#62748E]">
                <span>Subtotal</span>
                <span>
                  Rs.{subtotalBeforeDiscount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              {(totalItemDiscount > 0 || manualDiscountAmount > 0) && (
                <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#10B981]">
                  <span>Total Discount</span>
                  <span>
                    - Rs.{(totalItemDiscount + manualDiscountAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {/* Tax UI hidden for now; we still send tax: 0 in payload for future tax-rule support. */}
              {/*
              <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#62748E]">
                <span>Tax</span>
                <span>
                  Rs.{cartTaxAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              */}
              {serviceChargeAmount > 0 && (
                <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#62748E]">
                  <span>Service Charge</span>
                  <span>
                    Rs.{serviceChargeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {deliveryChargeAmount > 0 && (
                <div className="flex justify-between font-['Arial'] text-sm leading-5 text-[#62748E]">
                  <span>Delivery</span>
                  <span>
                    Rs.{deliveryChargeAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-zinc-200 pt-1.5">
                <span className="font-['Arial'] text-base font-bold leading-6 text-[#0F172B]">
                  Total Amount
                </span>
                <span className="font-['Arial'] text-2xl font-black leading-8 text-[#EA580C]">
                  Rs.{total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => void handleSubmitOrder(false)}
                disabled={
                  isCreatingOrder ||
                  isOrderAndPaySubmitting ||
                  hasPendingPayment ||
                  !!paymentFlow ||
                  !hasDetails ||
                  items.length === 0
                }
                className="flex-1 rounded-[14px] border-2 border-[#EA580C] bg-white py-2.5 font-['Arial'] text-base font-bold leading-6 text-[#EA580C] transition-all duration-300 ease-out hover:bg-primary-muted active:scale-95 disabled:opacity-50"
              >
                {isCreatingOrder ? "..." : "Order Now"}
              </button>
              <button
                type="button"
                onClick={handleOrderAndPay}
                disabled={
                  isCreatingOrder ||
                  isOrderAndPaySubmitting ||
                  !!paymentFlow ||
                  !hasDetails ||
                  items.length === 0
                }
                className="flex-1 rounded-[14px] bg-[#EA580C] py-2.5 font-['Arial'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D] transition-all duration-300 ease-out hover:bg-[#DC4C04] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isOrderAndPaySubmitting
                  ? "..."
                  : hasPendingPayment
                    ? "Continue Payment"
                    : "Order & Pay"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {showModal && (
        <NewOrderDetailsModal
          key={activeOrderId}
          variant={orderDetailsModalMode === "minimalVoucher" ? "voucherSale" : "full"}
          onSubmit={handleOrderDetailsSubmit}
          onClose={() => {
            setEditOrderId(null);
            clearPendingAddsAfterOrderDetails();
          }}
          initialData={orderDetails}
        />
      )}

      {isDiscountModalOpen && (
        <ManualDiscountModal
          onSave={setManualDiscount}
          onClose={() => setIsDiscountModalOpen(false)}
          initialDiscount={manualDiscount}
          subtotal={subtotal}
        />
      )}

      <NoteModal

        key={noteModal ?? "closed"}
        type={noteModal}
        title={noteModal === "kitchen" ? "Kitchen Note" : noteModal === "order" ? "Order Note" : ""}
        value={
          noteModal === "kitchen" ? activeKitchenNote : noteModal === "order" ? activeOrderNote : ""
        }
        onSave={(value) => {
          if (noteModal === "kitchen") setActiveKitchenNote(value);
          else if (noteModal === "order") setActiveOrderNote(value);
        }}
        onClose={() => setNoteModal(null)}
      />

      {paymentFlow && (
        <ProcessPaymentModal
          customerName={paymentFlow.customerName}
          customerMobile={paymentFlow.customerMobile ?? orderDetails?.phone}
          amountDue={paymentFlow.settlementAmount}
          orderId={paymentFlow.orderId}
          customerId={orderDetails?.customerId}
          loyaltyPoints={customerData?.loyalty_points}
          onClose={() => {
            setPaymentFlow(null);
            setCheckoutLockedOrderSlotId(null);
          }}
          onComplete={() => {
            clearCheckoutSession(paymentFlow.localOrderId ?? null);
            setPaymentFlow(null);
            setPendingPaymentOrder(null);
          }}
        />
      )}

    </>
  );
}
