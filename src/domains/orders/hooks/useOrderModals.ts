import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readBalanceDueFromOrderPayload, type OrderDetailsView, type OrderRow } from "../types";
import { EditOrderLineItem } from "@/components/orders/EditOrderModal";
import { useUpdateOrderStatus, useUpdateOrder, ORDER_KEYS } from "@/hooks/useOrder";
import { useUpdateCustomer } from "@/hooks/useCustomer";
import { useUpdatePaymentStatus, PAYMENT_KEYS } from "@/hooks/usePayment";
import { getPaymentsByOrder, normalizePaymentsByOrderApiResponse } from "@/services/paymentService";
import { readLineSettlementStatus } from "@/domains/orders/paymentRowFields";
import type { OrderDetailsData } from "@/contexts/OrderContext";
import {
  patchOrderPaymentInQueryCache,
  readOrderPaymentFieldsFromRefundResponse,
  readOrderSnapshotFromPaymentResponse,
} from "@/domains/orders/patchOrderPaymentInCache";
import { isInvalidManagerPasscodeError } from "@/lib/api/managerPasscodeError";
import type { Order } from "@/types/order";
import { getOrderById } from "@/services/orderService";
import { debugOrderEditRefund } from "@/lib/debug/orderEditRefund";

const MONEY_EPS = 0.02;

function normalizeAggregateStatus(s: string | undefined): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

/**
 * Toast must reflect server `orders.paymentStatus` after refund, not the refund_type we requested.
 */
function toastAfterEditOrderRefund(serverAggregate: string | undefined): string {
  const agg = normalizeAggregateStatus(serverAggregate);
  if (agg === "partial_refund") {
    return "Order updated. Server payment status: partial refund.";
  }
  if (agg === "refund") {
    return "Order updated. Server payment status: full refund.";
  }
  if (agg === "paid") {
    return "Order updated. Refund was recorded on the payment line; the new total is still fully covered, so order payment status remains paid.";
  }
  if (agg === "pending") {
    return "Order updated. Server reports payment status: pending.";
  }
  if (!agg) {
    return "Order updated. Refund call succeeded but the response had no order payment status — refresh the order or check the Network tab.";
  }
  return `Order updated. Server payment status: ${serverAggregate}.`;
}

function axiosErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { message?: string } } }).response?.data;
    const m = data?.message;
    if (typeof m === "string" && m.trim()) return m;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Payment update failed";
}

function paymentRowAmount(p: { amount?: unknown }): number {
  const n = Number(p.amount);
  return Number.isFinite(n) ? n : 0;
}

/** API may return a bare array, envelope `{ payments }`, or `{ data: ... }`. */
function normalizePaymentsResponse(raw: unknown): unknown[] {
  return normalizePaymentsByOrderApiResponse(raw);
}

function pickRefundTargetPayment(
  rows: unknown[]
): { id: number; remainingCollectible: number } | undefined {
  type Cand = { id: number; gross: number; remainingCollectible: number };
  const candidates: Cand[] = [];
  for (const raw of rows) {
    if (raw == null || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const id = Number(r.id);
    if (!Number.isFinite(id)) continue;
    const status = readLineSettlementStatus(r);
    if (status !== "paid" && status !== "partial_refund") continue;
    const role = String(r.paymentRole ?? r.payment_role ?? "sale").toLowerCase();
    if (role === "balance_due") continue;
    const gross = paymentRowAmount({ amount: r.amount });
    const refunded = paymentRowAmount({
      amount: r.refundedAmount ?? r.refunded_amount,
    });
    const remainingCollectible = Math.max(0, gross - refunded);
    if (remainingCollectible <= MONEY_EPS) continue;
    candidates.push({ id, gross, remainingCollectible });
  }
  if (candidates.length === 0) return undefined;
  candidates.sort((a, b) => b.gross - a.gross);
  const best = candidates[0];
  return { id: best.id, remainingCollectible: best.remainingCollectible };
}

function mapOrderTypeToApi(orderType: OrderDetailsData["orderType"]) {
  if (orderType === "Dine In") return "dining";
  if (orderType === "Take Away") return "takeaway";
  return "delivery";
}

type UseOrderModalsOptions = {
  onOrderCancelled?: (orderNo: string) => void;
};

async function resolveCollectAmountAfterPut(
  updated: Order,
  fallbackBasketDelta: number,
  orderId: string
): Promise<number> {
  let serverBalance = readBalanceDueFromOrderPayload(updated as unknown as Record<string, unknown>);
  if ((serverBalance == null || serverBalance <= MONEY_EPS) && fallbackBasketDelta > MONEY_EPS) {
    try {
      const fresh = await getOrderById(orderId);
      serverBalance = readBalanceDueFromOrderPayload(fresh as unknown as Record<string, unknown>);
    } catch {
      /* keep */
    }
  }
  return serverBalance != null && serverBalance > MONEY_EPS ? serverBalance : fallbackBasketDelta;
}

export function useOrderModals(options?: UseOrderModalsOptions) {
  const { onOrderCancelled } = options ?? {};
  const queryClient = useQueryClient();
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; orderNo: string | null }>({
    isOpen: false,
    orderNo: null,
  });
  const [editOrderModal, setEditOrderModal] = useState<OrderRow | null>(null);
  const [editOrderInfoModal, setEditOrderInfoModal] = useState<OrderRow | null>(null);
  const [viewOrder, setViewOrder] = useState<OrderRow | null>(null);

  const orderToView = useCallback(
    (order: OrderRow): OrderDetailsView => ({
      id: order.id,
      orderNo: order.orderNo,
      date: order.date,
      time: order.time,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      phone: order.phone,
      customerId: order.customerId,
      totalAmount: order.totalAmount,
      orderType: order.orderType,
      tableId: order.tableId,
      tableName: order.tableName,
      tableNumber: order.tableNumber,
      deliveryAddress: order.deliveryAddress,
      landmark: order.landmark,
      zipCode: order.zipCode,
      deliveryInstructions: order.deliveryInstructions,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      orderDiscount: order.orderDiscount ?? 0,
      serviceCharge: order.serviceCharge ?? 0,
      deliveryChargeAmount: order.deliveryChargeAmount ?? 0,
      deliveryChargeId: order.deliveryChargeId ?? null,
      balanceDue: order.balanceDue,
      requiresAdditionalPayment: order.requiresAdditionalPayment,
      totalRefunded: order.totalRefunded,
      outstandingRefund: order.outstandingRefund,
      totalPaidForOrder: order.totalPaidForOrder,
    }),
    []
  );

  const updateStatusMutation = useUpdateOrderStatus();
  const updateOrderMutation = useUpdateOrder();
  const updateCustomerMutation = useUpdateCustomer();
  const updatePaymentStatusMutation = useUpdatePaymentStatus();

  const handleDeleteClick = useCallback((orderNo: string) => {
    setAuthModal({ isOpen: true, orderNo });
  }, []);

  const handleVerify = useCallback(
    async (passcode: string) => {
      if (!authModal.orderNo) return;
      const cancelledOrderNo = authModal.orderNo;

      try {
        await updateStatusMutation.mutateAsync({
          id: cancelledOrderNo,
          data: {
            status: "cancel",
            passcode,
          },
        });

        toast.success("Order cancelled successfully");
        setAuthModal({ isOpen: false, orderNo: null });
        onOrderCancelled?.(cancelledOrderNo);
      } catch (error: unknown) {
        console.error("Cancellation process failed:", error);
        if (!isInvalidManagerPasscodeError(error)) {
          const ax = error as { response?: { data?: { message?: string } }; message?: string };
          toast.error(
            ax?.response?.data?.message ||
              (error instanceof Error ? error.message : null) ||
              "Failed to cancel order"
          );
        }
        throw error;
      }
    },
    [authModal.orderNo, updateStatusMutation, onOrderCancelled]
  );

  const handleCloseAuthModal = useCallback(() => {
    setAuthModal({ isOpen: false, orderNo: null });
  }, []);

  const handleViewOrder = useCallback((order: OrderRow) => {
    setViewOrder(order);
  }, []);

  const handleEditClick = useCallback((order: OrderRow) => {
    if (order.status === "pending") {
      setEditOrderModal(order);
    }
  }, []);

  const handleEditOrderSubmit = useCallback(
    async (data: { items: EditOrderLineItem[] }) => {
      const modalOrder = editOrderModal;
      if (!modalOrder) return;

      const orderIdStr = String(modalOrder.id);
      const orderIdNum = Number(modalOrder.id);

      const payload = {
        order_products: data.items.map((item) => ({
          productId: Number(item.productId || item.id),
          variationOptionId: item.variationOptionId ? Number(item.variationOptionId) : undefined,
          quantity: item.qty,
          unitPrice: item.price,
          productDiscount: item.productDiscount ?? 0,
          modifications: item.modifications,
          bogoPromotionId: item.bogoPromotionId,
          productBundleId: item.productBundleId,
          isFreeItem: item.isFreeItem,
          linkId: item.linkId,
          buyQuantity: item.buyQuantity,
          getQuantity: item.getQuantity,
        })),
      };

      try {
        const updatedOrder = await updateOrderMutation.mutateAsync({
          id: modalOrder.id,
          data: payload,
        });
        const originalTotal = Number(modalOrder.totalAmount || 0);
        const updatedTotal = Number(updatedOrder.totalAmount || 0);
        const refundAmount = originalTotal - updatedTotal;
        const additionalDue = updatedTotal - originalTotal;
        const shouldRecordRefund = refundAmount > MONEY_EPS && additionalDue <= MONEY_EPS;

        const paymentStatusAfterPut =
          updatedOrder.paymentStatus ??
          (updatedOrder as { payment_status?: string }).payment_status;

        debugOrderEditRefund("PUT /orders done", {
          orderId: orderIdStr,
          paymentStatus: paymentStatusAfterPut,
          totalAmount: updatedOrder.totalAmount,
          shouldRecordRefund,
          refundAmount,
          additionalDue,
        });

        try {
          if (shouldRecordRefund) {
            await queryClient.invalidateQueries({ queryKey: PAYMENT_KEYS.byOrder(orderIdNum) });
            const rawRows = await queryClient.fetchQuery({
              queryKey: PAYMENT_KEYS.byOrder(orderIdNum),
              queryFn: () => getPaymentsByOrder(orderIdNum),
            });
            const rows = normalizePaymentsResponse(rawRows);
            debugOrderEditRefund("payments rows for refund target", {
              orderId: orderIdStr,
              rowCount: rows.length,
            });
            const payment = pickRefundTargetPayment(rows);
            if (payment) {
              const isFullRefund = refundAmount >= payment.remainingCollectible - MONEY_EPS;
              debugOrderEditRefund("calling PUT /payments/:id/status", {
                paymentId: payment.id,
                refund_amount: refundAmount,
                refund_type: isFullRefund ? "full" : "partial",
                remainingCollectible: payment.remainingCollectible,
              });
              const refundResponse = await updatePaymentStatusMutation.mutateAsync({
                id: payment.id,
                payload: {
                  is_refund: 1,
                  refund_type: isFullRefund ? "full" : "partial",
                  refund_amount: refundAmount,
                  status: isFullRefund ? "refund" : "partial_refund",
                },
              });
              const fromApi = readOrderPaymentFieldsFromRefundResponse(refundResponse);
              const oid = fromApi.orderId ?? modalOrder.id;
              debugOrderEditRefund("refund response parsed", {
                orderPaymentStatus: fromApi.orderPaymentStatus,
                balanceDue: fromApi.balanceDue,
                orderId: oid,
                responseKeys:
                  refundResponse &&
                  typeof refundResponse === "object" &&
                  !Array.isArray(refundResponse)
                    ? Object.keys(refundResponse as object).slice(0, 25)
                    : [],
              });
              if (fromApi.orderPaymentStatus) {
                patchOrderPaymentInQueryCache(
                  queryClient,
                  oid,
                  fromApi.orderPaymentStatus,
                  fromApi.balanceDue,
                  fromApi.totalRefunded,
                  fromApi.requiresAdditionalPayment,
                  readOrderSnapshotFromPaymentResponse(refundResponse)
                );
              } else {
                debugOrderEditRefund(
                  "warning: no order aggregate in refund body — cache not patched",
                  {
                    orderId: orderIdStr,
                  }
                );
              }
              void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(modalOrder.id) });
              void queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() });
              toast.success(toastAfterEditOrderRefund(fromApi.orderPaymentStatus));
            } else {
              debugOrderEditRefund("no sale payment row to refund — PUT payment not sent", {
                orderId: orderIdStr,
                rowCount: rows.length,
              });
              toast.error(
                "Order was updated but no paid sale payment was found to record the refund. Open Network: only PUT /orders ran — PUT /payments/…/status is required to persist line refunds."
              );
            }
          }
          if (additionalDue > MONEY_EPS) {
            const collect = await resolveCollectAmountAfterPut(
              updatedOrder,
              additionalDue,
              orderIdStr
            );
            if (collect > MONEY_EPS) {
              toast.success(
                "Order saved. Use Pay on the orders list or Order & Pay when you are ready to collect the balance."
              );
            } else {
              toast.message(
                "Order saved. If a balance is still due, use Pay on the orders list after refresh."
              );
            }
          } else if (!shouldRecordRefund) {
            toast.success("Order saved.");
          }
        } catch (err: unknown) {
          toast.error(axiosErrorMessage(err));
        } finally {
          setEditOrderModal(null);
        }
      } catch (err: unknown) {
        toast.error(axiosErrorMessage(err));
      }
    },
    [editOrderModal, updateOrderMutation, updatePaymentStatusMutation, queryClient]
  );

  /**
   * Save edited lines first, then caller opens payment for **additionalDue only** (new total − previous).
   * Avoids POSTing the full order total on an already-paid order (backend "over-cover" error).
   */
  const handleEditOrderAndPay = useCallback(
    async (data: { items: EditOrderLineItem[] }): Promise<number | null> => {
      if (!editOrderModal) return null;

      const order_products = data.items.map((item) => ({
        productId: Number(item.productId || item.id),
        variationOptionId: item.variationOptionId ? Number(item.variationOptionId) : undefined,
        quantity: item.qty,
        unitPrice: item.price,
        productDiscount: item.productDiscount ?? 0,
        modifications: item.modifications,
        bogoPromotionId: item.bogoPromotionId,
        productBundleId: item.productBundleId,
        isFreeItem: item.isFreeItem,
        linkId: item.linkId,
        buyQuantity: item.buyQuantity,
        getQuantity: item.getQuantity,
      }));

      let updated: Order;
      try {
        updated = await updateOrderMutation.mutateAsync({
          id: editOrderModal.id,
          data: {
            order_products,
          },
        });
      } catch (err: unknown) {
        toast.error(axiosErrorMessage(err));
        throw err;
      }
      const originalTotal = Number(editOrderModal.totalAmount || 0);
      const updatedTotal = Number(updated.totalAmount || 0);
      const additionalDue = updatedTotal - originalTotal;
      if (additionalDue <= MONEY_EPS) {
        toast.error("No additional payment is due for this basket.");
        return null;
      }

      const collectAmount = await resolveCollectAmountAfterPut(
        updated,
        additionalDue,
        String(editOrderModal.id)
      );
      const serverBalance = readBalanceDueFromOrderPayload(
        updated as unknown as Record<string, unknown>
      );
      const amountDiffers =
        serverBalance != null &&
        serverBalance > MONEY_EPS &&
        Math.abs(serverBalance - additionalDue) > MONEY_EPS;
      toast.success(
        amountDiffers
          ? `Order updated. Pay Rs.${collectAmount.toFixed(2)} (invoice amount) to finish.`
          : "Order updated. Complete payment for the additional amount."
      );
      return collectAmount;
    },
    [editOrderModal, updateOrderMutation]
  );

  const closeEditModal = useCallback(() => setEditOrderModal(null), []);
  const closeEditInfoModal = useCallback(() => setEditOrderInfoModal(null), []);
  const closeViewModal = useCallback(() => setViewOrder(null), []);

  const openEditFromView = useCallback((order: OrderRow) => {
    setViewOrder(null);
    setEditOrderModal(order);
  }, []);

  const openEditInfoFromView = useCallback((order: OrderRow) => {
    setViewOrder(null);
    setEditOrderInfoModal(order);
  }, []);

  const handleEditOrderInfoSubmit = useCallback(
    (data: OrderDetailsData) => {
      if (editOrderInfoModal) {
        const isDineIn = data.orderType === "Dine In";
        const isDelivery = data.orderType === "Delivery";
        const existingServiceCharge = Number(editOrderInfoModal.serviceCharge ?? 0);
        const existingDeliveryChargeAmount = Number(editOrderInfoModal.deliveryChargeAmount ?? 0);
        const existingDeliveryChargeId = editOrderInfoModal.deliveryChargeId ?? null;
        const payloadServiceCharge = isDineIn
          ? Number.isFinite(existingServiceCharge)
            ? existingServiceCharge
            : 0
          : 0;
        const payloadDeliveryChargeAmount = isDelivery
          ? Number(
              data.deliveryChargeAmount ??
                (Number.isFinite(existingDeliveryChargeAmount) ? existingDeliveryChargeAmount : 0)
            ) || 0
          : 0;
        const payloadDeliveryChargeId = isDelivery
          ? (data.deliveryChargeId ?? existingDeliveryChargeId ?? null)
          : null;

        updateOrderMutation.mutate(
          {
            id: editOrderInfoModal.id,
            data: {
              customerName: data.customerName,
              customerMobile: data.phone,
              orderType: mapOrderTypeToApi(data.orderType),
              tableId: data.orderType === "Dine In" ? data.tableId : null,
              tableNumber: data.orderType === "Dine In" ? data.tableNumber : undefined,
              deliveryAddress: data.orderType === "Delivery" ? data.deliveryAddress : undefined,
              landmark: data.orderType === "Delivery" ? data.landmark : undefined,
              zipcode: data.orderType === "Delivery" ? data.zipCode : undefined,
              deliveryInstructions:
                data.orderType === "Delivery" ? data.deliveryInstructions : undefined,
              serviceCharge: payloadServiceCharge,
              deliveryChargeAmount: payloadDeliveryChargeAmount,
              deliveryChargeId: payloadDeliveryChargeId,
              deliveryChargeSelectedId: payloadDeliveryChargeId,
            },
          },
          {
            onSuccess: () => {
              // Update the customer record as well if we have a customerId
              if (editOrderInfoModal.customerId) {
                updateCustomerMutation.mutate({
                  id: editOrderInfoModal.customerId,
                  data: {
                    name: data.customerName,
                    mobile: data.phone,
                  },
                });
              }
              setEditOrderInfoModal(null);
            },
          }
        );
      }
    },
    [editOrderInfoModal, updateOrderMutation, updateCustomerMutation]
  );

  const openCancelFromView = useCallback((orderNo: string) => {
    setAuthModal({ isOpen: true, orderNo });
    setViewOrder(null);
  }, []);

  return {
    authModal,
    editOrderModal,
    editOrderInfoModal,
    viewOrder,
    orderToView,
    handleDeleteClick,
    handleVerify,
    handleCloseAuthModal,
    handleViewOrder,
    handleEditClick,
    handleEditOrderSubmit,
    handleEditOrderAndPay,
    handleEditOrderInfoSubmit,
    closeEditModal,
    closeEditInfoModal,
    closeViewModal,
    openEditFromView,
    openEditInfoFromView,
    openCancelFromView,
    isUpdatingOrder: updateOrderMutation.isPending || updatePaymentStatusMutation.isPending,
  };
}
