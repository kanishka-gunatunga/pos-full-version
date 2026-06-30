"use client";

import { useState, useCallback, useMemo } from "react";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import NewOrderDetailsModal from "@/components/menu/NewOrderDetailsModal";
import ProcessPaymentModal from "@/components/payments/ProcessPaymentModal";
import EditOrderModal from "@/components/orders/EditOrderModal";
import OrderDetailsViewModal from "@/components/orders/OrderDetailsViewModal";
import ManagerAuthorizationModal from "@/components/orders/ManagerAuthorizationModal";
import OrdersHeader from "@/components/orders/OrdersHeader";
import OrdersFilterSection from "@/components/orders/OrdersFilterSection";
import OrdersTable from "@/components/orders/OrdersTable";
import { useOrdersFilters } from "@/domains/orders/hooks/useOrdersFilters";
import { mapOrderToRow } from "@/domains/orders/types";
import { useOrderModals } from "@/domains/orders/hooks/useOrderModals";
import { useGetOrderById } from "@/hooks/useOrder";
import {
  buildCreatePaymentDraftFromOrder,
  ORDER_MONEY_EPS,
} from "@/domains/orders/orderCollectionAmount";
import { fetchOrderStateForPaymentCreate } from "@/services/paymentService";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type ProcessingPayment = {
  orderId: number;
  orderNo: string | number;
  customerName: string;
  customerMobile: string;
  total: number;
  isAdditionalPayment?: boolean;
};

export default function OrdersContent() {
  const [processingPayment, setProcessingPayment] = useState<ProcessingPayment | null>(null);

  const {
    search,
    setSearch,
    orderStatusFilter,
    setOrderStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    onlyMyOrders,
    setOnlyMyOrders,
    listMeta,
    filteredOrders,
    isLoading,
  } = useOrdersFilters();

  const emptyTableMessage = useMemo(() => {
    if (filteredOrders.length > 0) return undefined;
    if (onlyMyOrders) return "You haven't placed any orders in this view yet.";
    if (search.trim()) return "No orders match your search.";
    if (orderStatusFilter !== "All" || paymentStatusFilter !== "All") {
      return "No orders match your filters.";
    }
    return "No orders found.";
  }, [
    filteredOrders.length,
    onlyMyOrders,
    search,
    orderStatusFilter,
    paymentStatusFilter,
  ]);

  const clearPaymentIfCancelled = useCallback((orderNo: string) => {
    setProcessingPayment((prev) => (prev?.orderNo === orderNo ? null : prev));
  }, []);

  const {
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
    isUpdatingOrder,
  } = useOrderModals({
    onOrderCancelled: clearPaymentIfCancelled,
  });

  const { data: viewOrderDetails } = useGetOrderById(viewOrder?.id);
  const activeViewOrder = useMemo(() => {
    if (!viewOrder) return null;
    if (viewOrderDetails) return mapOrderToRow(viewOrderDetails);
    const fromList = filteredOrders.find((o) => o.id === viewOrder.id);
    return fromList ?? viewOrder;
  }, [viewOrder, viewOrderDetails, filteredOrders]);

  const openPaymentFlow = async (order: {
    id: string;
    orderNo: string;
    customerName: string;
    phone: string;
    totalAmount: number;
    balanceDue?: number | null;
  }) => {
    let fresh;
    try {
      fresh = await fetchOrderStateForPaymentCreate(order.id);
    } catch {
      toast.error("Could not load this order from the server. Try again.");
      return;
    }
    const draft = buildCreatePaymentDraftFromOrder(fresh);
    if (draft.amount <= ORDER_MONEY_EPS) {
      toast.message(
        "Nothing to collect on this order (already fully covered, per server). Refresh the list if that looks wrong."
      );
      return;
    }
    setProcessingPayment({
      orderId: Number(fresh.id),
      orderNo: String(fresh.id),
      customerName: fresh.customer?.name ?? order.customerName,
      customerMobile: fresh.customer?.mobile ?? order.phone,
      total: draft.amount,
      isAdditionalPayment: draft.paymentRole === "balance_due",
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DashboardPageHeader />
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="">
          <OrdersHeader
            search={search}
            onSearchChange={setSearch}
            onlyMyOrders={onlyMyOrders}
            onOnlyMyOrdersChange={setOnlyMyOrders}
          />
          <OrdersFilterSection
            orderStatusFilter={orderStatusFilter}
            paymentStatusFilter={paymentStatusFilter}
            onOrderStatusChange={setOrderStatusFilter}
            onPaymentStatusChange={setPaymentStatusFilter}
          />

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#EA580C]" />
            </div>
          ) : (
            <>
              <OrdersTable
                orders={filteredOrders}
                onView={handleViewOrder}
                onPay={openPaymentFlow}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                emptyMessage={emptyTableMessage}
              />
              {listMeta && !isLoading && (
                <div className="mt-4 flex flex-col gap-3 rounded-[16px] border border-[#F1F5F9] bg-[#FAFBFC] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3 font-['Inter'] text-sm text-[#62748E]">
                    <span>
                      {listMeta.total === 0
                        ? "Showing 0 of 0"
                        : `Showing ${(listMeta.page - 1) * listMeta.pageSize + 1}–${Math.min(
                            listMeta.page * listMeta.pageSize,
                            listMeta.total
                          )} of ${listMeta.total}`}
                    </span>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <span className="text-[#90A1B9]">Rows per page</span>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="rounded-lg border border-[#E2E8F0] bg-white px-2 py-1 text-xs text-[#314158]"
                      >
                        {[25, 50, 100].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={listMeta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-1.5 font-['Inter'] text-xs font-bold text-[#45556C] disabled:pointer-events-none disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="font-['Inter'] text-xs text-[#90A1B9]">
                      Page {listMeta.page} of {listMeta.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={listMeta.page >= listMeta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded-[12px] border border-[#E2E8F0] bg-white px-3 py-1.5 font-['Inter'] text-xs font-bold text-[#45556C] disabled:pointer-events-none disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {editOrderModal && (
        <EditOrderModal
          isSubmitting={isUpdatingOrder}
          order={{
            id: editOrderModal.id,
            orderNo: editOrderModal.orderNo,
            customerName: editOrderModal.customerName,
            totalAmount: editOrderModal.totalAmount,
            orderType: editOrderModal.orderType,
            orderDiscount: editOrderModal.orderDiscount ?? 0,
            serviceCharge: editOrderModal.serviceCharge ?? 0,
            deliveryChargeAmount: editOrderModal.deliveryChargeAmount ?? 0,
            items: editOrderModal.items?.map((item, index) => ({
              id: item.id ?? `line-${editOrderModal.orderNo}-${index}-${item.name}`,
              productId: item.productId,
              variationId: item.variationId,
              variationOptionId: item.variationOptionId,
              name: item.name,
              qty: item.qty,
              price: item.price,
              productDiscount: item.productDiscount ?? 0,
              image: item.image,
              variant: item.variant,
              addOns: item.addOns,
              modifications: item.modifications,
              bogoPromotionId: item.bogoPromotionId,
              productBundleId: item.productBundleId,
              isFreeItem: item.isFreeItem,
              linkId: item.linkId,
              buyQuantity: item.buyQuantity,
              getQuantity: item.getQuantity,
            })),
          }}
          onSubmit={handleEditOrderSubmit}
          onClose={closeEditModal}
          onOrderAndPay={async ({ items }) => {
            const row = editOrderModal;
            if (!row) return null;
            const additional = await handleEditOrderAndPay({ items });
            if (additional != null && additional > 0.02) {
              setProcessingPayment({
                orderId: Number(row.id),
                orderNo: row.orderNo,
                customerName: row.customerName,
                customerMobile: row.phone,
                total: additional,
                isAdditionalPayment: true,
              });
            }
            return additional;
          }}
        />
      )}

      {editOrderInfoModal && (
        <NewOrderDetailsModal
          title="Edit Order Details"
          submitButtonText="Save Details"
          initialData={{
            customerName: editOrderInfoModal.customerName,
            phone: editOrderInfoModal.phone,
            orderType: editOrderInfoModal.orderType ?? "Dine In",
            tableNumber: editOrderInfoModal.tableNumber,
            deliveryAddress: editOrderInfoModal.deliveryAddress,
            landmark: editOrderInfoModal.landmark,
            zipCode: editOrderInfoModal.zipCode,
            deliveryInstructions: editOrderInfoModal.deliveryInstructions,
          }}
          isSubmitting={isUpdatingOrder}
          onSubmit={handleEditOrderInfoSubmit}
          onClose={closeEditInfoModal}
        />
      )}

      {activeViewOrder && (
        <OrderDetailsViewModal
          order={orderToView(activeViewOrder)}
          onClose={closeViewModal}
          onEditInfo={() => openEditInfoFromView(activeViewOrder)}
          onPayNow={(details) => {
            void openPaymentFlow({
              id: details.id,
              orderNo: details.orderNo,
              customerName: details.customerName,
              phone: details.phone,
              totalAmount: details.totalAmount,
              balanceDue: details.balanceDue,
            });
            closeViewModal();
          }}
          onEdit={
            activeViewOrder.status === "pending"
              ? () => openEditFromView(activeViewOrder)
              : undefined
          }
          onCancel={() => openCancelFromView(activeViewOrder.id)}
        />
      )}

      {processingPayment && (
        <ProcessPaymentModal
          payment={{
            id: processingPayment.orderId,
            orderNo: Number(processingPayment.orderNo),
            customerName: processingPayment.customerName,
            customerMobile: processingPayment.customerMobile,
            dateTime: new Date().toISOString(),
            method: null,
            paymentStatus: "pending",
            amount: processingPayment.total,
            isAdditionalCharge: processingPayment.isAdditionalPayment,
          }}
          amountCaption={
            processingPayment.isAdditionalPayment ? "Amount to collect" : "Total"
          }
          onClose={() => setProcessingPayment(null)}
        />
      )}

      {authModal.orderNo && (
        <ManagerAuthorizationModal
          orderNo={authModal.orderNo}
          isOpen={authModal.isOpen}
          onClose={handleCloseAuthModal}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}
