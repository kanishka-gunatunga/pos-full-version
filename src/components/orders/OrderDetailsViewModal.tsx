"use client";

import { useId } from "react";
import {
  X,
  Clock,
  Package,
  User,
  Phone,
  UtensilsCrossed,
  DollarSign,
  CreditCard,
} from "lucide-react";
import type { OrderDetailsView } from "@/domains/orders/types";
import {
  isPlaceholderOrderLineItems,
  lineNetBeforeOrderDiscount,
  totalsFromOrderLineItems,
} from "@/domains/orders/orderLineTotals";
import {
  collectibleOrderAmount,
  orderNeedsPaymentCollection,
} from "@/domains/orders/orderCollectionAmount";

import {
  STATUS_STYLES,
  DEFAULT_STATUS_STYLE,
  formatPaymentStatusLabel,
} from "@/domains/orders/constants";

const MONEY_EPS = 0.02;

const formatRs = (n: number) =>
  `Rs.${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Props = {
  order: OrderDetailsView;
  onClose: () => void;
  onEdit?: () => void;
  onEditInfo?: () => void;
  onCancel?: () => void;
  onPayNow?: (order: OrderDetailsView) => void;
};

export default function OrderDetailsViewModal({
  order,
  onClose,
  onEdit,
  onEditInfo,
  onCancel,
  onPayNow,
}: Props) {
  const paymentClipId = useId();
  const cancelIconClipId = useId();
  const items =
    order.items && order.items.length > 0
      ? order.items
      : [{ name: "Order items", qty: 1, price: order.totalAmount }];
  const deriveFromLines = !isPlaceholderOrderLineItems(order.items);
  const fromLines = deriveFromLines
    ? totalsFromOrderLineItems(order.items, order.orderDiscount ?? 0)
    : null;
  const subtotal = fromLines?.grossSubtotal ?? order.subtotal ?? order.totalAmount;
  const discount = fromLines?.totalDiscountAmount ?? order.discount ?? 0;
  const serviceChargeAmountRaw = Number(order.serviceCharge ?? 0);
  const serviceChargeAmount = Number.isFinite(serviceChargeAmountRaw) ? serviceChargeAmountRaw : 0;
  const deliveryFeeAmountRaw = Number(order.deliveryChargeAmount ?? 0);
  const deliveryFeeAmount = Number.isFinite(deliveryFeeAmountRaw) ? deliveryFeeAmountRaw : 0;
  const totalAmountRaw = Number(order.totalAmount ?? fromLines?.totalAmount ?? 0);
  const totalAmount = Number.isFinite(totalAmountRaw) ? totalAmountRaw : 0;
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const orderTypeLabel = order.orderType ?? "Dine In";
  const paymentStatusLabel = formatPaymentStatusLabel(order.paymentStatus);
  const tableLabel = order.tableName || order.tableNumber ? `Table ${order.tableName || order.tableNumber}` : "";
  const amountToCollect = collectibleOrderAmount(order);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_25px_50px_-12px_#00000040]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-[#E2E8F0] bg-white p-5">
          {/* Left: icon */}
          <div className="shrink-0">
            <span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#EA580C] text-white shadow-[0px_4px_6px_-4px_#0000001A,0px_10px_15px_-3px_#0000001A]">
              <Package className="h-8 w-8" />
            </span>
          </div>

          {/* Right: title, status chip, meta */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-['Inter'] text-2xl font-bold leading-8 text-[#1D293D]">
                Order #{order.orderNo}
              </span>
              <span
                className="inline-flex rounded-[14px] border-2 px-3 py-1 font-['Inter'] text-xs font-bold uppercase leading-4"
                style={{
                  backgroundColor: (STATUS_STYLES[order.status] || DEFAULT_STATUS_STYLE).bg,
                  borderColor: (STATUS_STYLES[order.status] || DEFAULT_STATUS_STYLE).border,
                  color: (STATUS_STYLES[order.status] || DEFAULT_STATUS_STYLE).text,
                }}
              >
                {order.status}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-['Inter'] text-sm font-normal leading-5 text-[#62748E]">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {order.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {order.time}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - 2 columns: left (Customer, Order Type, Payment) | right (Order Items, Price Breakdown) */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#F1F5F9] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#CBD5E1] [&::-webkit-scrollbar-thumb]:hover:bg-[#94A3B8]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            {/* Left column */}
            <div className="flex flex-1 min-w-0 flex-col gap-3">
              {/* Customer Details */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                    Customer Details
                  </span>
                  {order.status === "pending" && (
                    <button
                      type="button"
                      onClick={onEditInfo}
                      disabled={!onEditInfo}
                      className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#EA580C] hover:underline"
                    >
                      EDIT INFO
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#EA580C1A]">
                      <User className="h-4 w-4 text-[#EA580C]" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-['Inter'] text-xs font-medium leading-4 text-[#62748E]">
                        Name
                      </span>
                      <span className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {order.customerName}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#DBEAFE]">
                      <Phone className="h-4 w-4 text-[#155DFC]" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="font-['Inter'] text-xs font-medium leading-4 text-[#62748E]">
                        Phone Number
                      </span>
                      <span className="font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {order.phone}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Type */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                    <UtensilsCrossed className="h-4 w-4 text-[#1D293D]" />
                    Order Type
                  </span>
                  {order.status === "pending" && (
                    <button
                      type="button"
                      onClick={onEditInfo}
                      disabled={!onEditInfo}
                      className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#EA580C] hover:underline"
                    >
                      EDIT INFO
                    </button>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2 rounded-[14px] border-2 border-[#E9D4FF] bg-[#F3E8FF] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-4 w-4 text-[#8200DB]" />
                    <span className="font-['Inter'] text-lg font-bold leading-7 text-[#8200DB]">
                      {orderTypeLabel}
                    </span>
                  </div>
                  {tableLabel && (
                    <>
                      <span className="font-['Inter'] text-sm font-bold leading-5 text-[#8200DB]">
                        {tableLabel}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center gap-2 font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                  <DollarSign className="h-4 w-4 text-[#EA580C]" />
                  Payment Information
                </div>
                <div className="inline-flex items-center gap-3 rounded-[14px] border-2 border-[#FFD230] bg-[#FEF3C6] pl-4 pr-3 py-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="shrink-0"
                    aria-hidden
                  >
                    <g clipPath={`url(#${paymentClipId})`}>
                      <path
                        d="M10 18.3333C14.6024 18.3333 18.3334 14.6023 18.3334 9.99996C18.3334 5.39759 14.6024 1.66663 10 1.66663C5.39765 1.66663 1.66669 5.39759 1.66669 9.99996C1.66669 14.6023 5.39765 18.3333 10 18.3333Z"
                        stroke="#BB4D00"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M7.5 10L9.16667 11.6667L12.5 8.33337"
                        stroke="#BB4D00"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                    <defs>
                      <clipPath id={paymentClipId}>
                        <rect width="20" height="20" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                  <span className="font-['Inter'] text-base font-bold leading-6 text-[#BB4D00]">
                    Payment Status: {paymentStatusLabel}
                  </span>
                </div>
                {order.balanceDue != null && order.balanceDue > MONEY_EPS && (
                  <div className="rounded-[14px] border-2 border-[#A4F4CF] bg-[#ECFDF5] px-4 py-3">
                    <p className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#007A55]">
                      Balance due
                    </p>
                    <p className="mt-1 font-['Inter'] text-xl font-bold leading-7 text-[#007A55]">
                      {formatRs(order.balanceDue)}
                    </p>
                  </div>
                )}
                {(order.paymentStatus === "partial_refund" || order.paymentStatus === "refund") &&
                  order.totalPaidForOrder != null &&
                  order.totalPaidForOrder > MONEY_EPS && (
                    <div className="rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-2">
                      <p className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#62748E]">
                        Payment collected
                      </p>
                      <p className="mt-0.5 font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {formatRs(order.totalPaidForOrder)}
                      </p>
                    </div>
                  )}
                {order.totalRefunded != null && order.totalRefunded > MONEY_EPS && (
                  <div className="rounded-[14px] border-2 border-[#FECACA] bg-[#FEF2F2] px-4 py-3">
                    <p className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#B91C1C]">
                      Refunded (recorded)
                    </p>
                    <p className="mt-1 font-['Inter'] text-xl font-bold leading-7 text-[#B91C1C]">
                      {formatRs(order.totalRefunded)}
                    </p>
                  </div>
                )}
                {order.outstandingRefund != null && order.outstandingRefund > MONEY_EPS && (
                  <div className="rounded-[14px] border-2 border-[#FCD34D] bg-[#FFFBEB] px-4 py-3">
                    <p className="font-['Inter'] text-xs font-bold uppercase leading-4 text-[#B45309]">
                      Still to return to customer
                    </p>
                    <p className="mt-1 font-['Inter'] text-xl font-bold leading-7 text-[#B45309]">
                      {formatRs(order.outstandingRefund)}
                    </p>
                    <p className="mt-1 font-['Inter'] text-[11px] leading-4 text-[#92400E]">
                      Difference between amount collected and current order total, after recorded
                      refunds. Process this amount at the register if not yet returned.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-1 min-w-0 flex-col gap-3">
              {/* Order Items - scroll only inside this list when many items */}
              <div className="flex max-h-[min(220px,30vh)] flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="shrink-0 flex items-center gap-2 font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                  <Package className="h-5 w-5 text-[#EA580C]" />
                  Order Items
                </div>
                <div className="min-h-0 overflow-y-auto space-y-2 pr-1">
                  {items.map((item, i) => (
                    <div
                      key={item.id ?? `order-item-${i}`}
                      className="flex items-start justify-between gap-4 rounded-[14px] border border-[#E2E8F0] bg-white px-4 py-4"
                    >
                      <div className="min-w-0 flex-1 font-['Inter']">
                        <p className="text-base font-bold leading-6 text-[#1D293D]">
                          {item.qty}x {item.name}
                        </p>
                        {item.variant ? (
                          <p className="mt-2 text-sm leading-5 text-[#62748E]">
                            <span className="font-bold text-[#62748E]">Variant:</span>{" "}
                            <span className="font-normal">{item.variant}</span>
                          </p>
                        ) : null}
                        {item.addonLines && item.addonLines.length > 0 ? (
                          <p className="mt-2 text-sm leading-5 text-[#62748E]">
                            <span className="font-bold text-[#62748E]">Add-ons:</span>{" "}
                            <span className="font-normal">
                              {item.addonLines.map((line, j) => (
                                <span key={`${item.id ?? i}-addon-${j}`}>
                                  {j > 0 ? ", " : ""}
                                  {line.qty}x {line.name}
                                </span>
                              ))}
                            </span>
                          </p>
                        ) : item.addOns && item.addOns.length > 0 ? (
                          <p className="mt-2 text-sm leading-5 text-[#62748E]">
                            <span className="font-bold text-[#62748E]">Add-ons:</span>{" "}
                            <span className="font-normal">
                              {item.addOns.map((line, j) => (
                                <span key={`${item.id ?? i}-legacy-${j}`}>
                                  {j > 0 ? ", " : ""}
                                  {line}
                                </span>
                              ))}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <span className="shrink-0 font-['Inter'] text-base font-bold leading-6 text-[#1D293D]">
                        {formatRs(
                          deriveFromLines
                            ? lineNetBeforeOrderDiscount({
                                name: item.name,
                                qty: item.qty,
                                price: item.price,
                                productDiscount: item.productDiscount,
                                modifications: item.modifications,
                              })
                            : item.qty * item.price
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="flex flex-col gap-4 rounded-[16px] border border-[#E2E8F0] bg-[#F8FAFC] p-5">
                <div className="flex items-center gap-2 font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                  <DollarSign className="h-4 w-4 text-[#EA580C]" />
                  Price Breakdown
                </div>
                <div className="space-y-2 font-['Inter']">
                  <div className="flex justify-between text-base leading-6">
                    <span className="font-normal text-[#45556C]">Subtotal</span>
                    <span className="font-bold text-[#1D293D]">{formatRs(subtotal)}</span>
                  </div>
                  {/* Tax is hidden for now; current POS tax rules are not active. */}
                  {/*
                  <div className="flex justify-between text-base leading-6">
                    <span className="font-normal text-[#45556C]">
                      Tax
                      {fromLines != null && fromLines.taxRate > MONEY_EPS && (
                        <span className="text-sm font-normal text-[#90A1B9]">
                          {" "}
                          · {`${Math.round(fromLines.taxRate * 1000) / 10}%`}
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-[#1D293D]">{formatRs(taxAmount)}</span>
                  </div>
                  */}
                  {discount > 0.02 && (
                    <div className="flex justify-between text-base leading-6">
                      <span className="font-normal text-[#45556C]">Discount</span>
                      <span className="font-bold text-[#009966]">{formatRs(discount)}</span>
                    </div>
                  )}
                  {orderTypeLabel === "Dine In" && serviceChargeAmount > MONEY_EPS && (
                    <div className="flex justify-between text-base leading-6">
                      <span className="font-normal text-[#45556C]">Service Charge</span>
                      <span className="font-bold text-[#1D293D]">{formatRs(serviceChargeAmount)}</span>
                    </div>
                  )}
                  {orderTypeLabel === "Delivery" && deliveryFeeAmount > MONEY_EPS && (
                    <div className="flex justify-between text-base leading-6">
                      <span className="font-normal text-[#45556C]">Delivery</span>
                      <span className="font-bold text-[#1D293D]">{formatRs(deliveryFeeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-[#CAD5E2] pt-3">
                    <span className="font-['Inter'] text-lg font-bold leading-7 text-[#1D293D]">
                      Total Amount
                    </span>
                    <span className="font-['Inter'] text-2xl font-bold leading-8 text-[#EA580C]">
                      {formatRs(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Close left, Edit + Cancel right */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-white p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[14px] bg-[#E2E8F0] px-5 py-3 font-['Inter'] text-base font-bold leading-6 text-[#314158] transition-colors hover:bg-[#CBD5E1]"
          >
            Close
          </button>
          <div className="flex items-center gap-3">
            {order.status !== "cancel" &&
              onPayNow &&
              orderNeedsPaymentCollection(order) &&
              (amountToCollect > MONEY_EPS || order.requiresAdditionalPayment === true) && (
                <button
                  type="button"
                  onClick={() =>
                    onPayNow({
                      ...order,
                      items: order.items,
                      subtotal,
                      discount,
                      totalAmount,
                      balanceDue: order.balanceDue,
                    })
                  }
                  className="flex items-center gap-2 rounded-[14px] bg-[#009966] px-5 py-3 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#0099664D,0px_10px_15px_-3px_#0099664D] transition-colors hover:bg-[#007A55] hover:shadow-[0px_4px_6px_-4px_#00996666,0px_10px_15px_-3px_#00996666]"
                >
                  <CreditCard className="h-5 w-5 shrink-0" />
                  Pay Now
                </button>
              )}
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-2 rounded-[14px] bg-[#2B7FFF] px-5 py-3 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#2B7FFF4D,0px_10px_15px_-3px_#2B7FFF4D] transition-colors hover:bg-[#1A6AE6] hover:shadow-[0px_4px_6px_-4px_#2B7FFF66,0px_10px_15px_-3px_#2B7FFF66]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                  aria-hidden
                >
                  <path
                    d="M9 2.25H3.75C3.35218 2.25 2.97064 2.40804 2.68934 2.68934C2.40804 2.97064 2.25 3.35218 2.25 3.75V14.25C2.25 14.6478 2.40804 15.0294 2.68934 15.3107C2.97064 15.592 3.35218 15.75 3.75 15.75H14.25C14.6478 15.75 15.0294 15.592 15.3107 15.3107C15.592 15.0294 15.75 14.6478 15.75 14.25V9"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.7812 1.9688C14.0796 1.67043 14.4842 1.50281 14.9062 1.50281C15.3282 1.50281 15.7328 1.67043 16.0312 1.9688C16.3296 2.26717 16.4972 2.67184 16.4972 3.0938C16.4972 3.51575 16.3296 3.92043 16.0312 4.2188L9.27145 10.9793C9.09336 11.1572 8.87335 11.2875 8.6317 11.358L6.47695 11.988C6.41241 12.0069 6.344 12.008 6.27888 11.9913C6.21376 11.9746 6.15432 11.9407 6.10678 11.8932C6.05925 11.8457 6.02536 11.7862 6.00868 11.7211C5.992 11.656 5.99312 11.5876 6.01195 11.523L6.64195 9.3683C6.71284 9.12684 6.84335 8.90709 7.02145 8.7293L13.7812 1.9688Z"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit Order
              </button>
            )}
            {onCancel && order.status !== "cancel" && (
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center gap-2 rounded-[14px] bg-[#FF2056] px-5 py-3 font-['Inter'] text-base font-bold leading-6 text-white shadow-[0px_4px_6px_-4px_#FF20564D,0px_10px_15px_-3px_#FF20564D] transition-colors hover:bg-[#E61A4A] hover:shadow-[0px_4px_6px_-4px_#FF205666,0px_10px_15px_-3px_#FF205666]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="shrink-0"
                  aria-hidden
                >
                  <g clipPath={`url(#${cancelIconClipId})`}>
                    <path
                      d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M11.25 6.75L6.75 11.25"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M6.75 6.75L11.25 11.25"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                  <defs>
                    <clipPath id={cancelIconClipId}>
                      <rect width="18" height="18" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
