import { Clock, Pencil, Trash2, Eye } from "lucide-react";
import type { OrderRow } from "@/domains/orders/types";
import {
  collectibleOrderAmount,
  orderNeedsPaymentCollection,
} from "@/domains/orders/orderCollectionAmount";

const PAY_SHOW_EPS = 0.02;
import { StatusPill, PaymentStatusPill } from "./StatusPills";

type Props = {
  orders: OrderRow[];
  onView: (order: OrderRow) => void;
  onPay: (order: OrderRow) => void;
  onEdit: (order: OrderRow) => void;
  onDelete: (orderNo: string) => void;
  emptyMessage?: string;
};

export default function OrdersTable({
  orders,
  onView,
  onPay,
  onEdit,
  onDelete,
  emptyMessage,
}: Props) {
  const emptyLabel = emptyMessage ?? "No orders match your search.";
  return (
    <div className="mt-5 rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]">
      <div className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] border-collapse font-['Arial']">
            <thead>
              <tr className="border-b  border-[#E2E8F0]">
                <th className="p-4 text-left font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Order No
                </th>
                <th className="p-4 text-left font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Date & Time
                </th>
                <th className="p-4 text-left font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Customer Details
                </th>
                <th className="p-4 text-right font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Total Amount
                </th>
                <th className="p-4 text-left font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Order Status
                </th>
                <th className="p-4 text-left font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Payment Status
                </th>
                <th className="w-px whitespace-nowrap p-4 text-right font-['Inter'] text-[10px] font-bold leading-[15px] tracking-[1px] uppercase text-[#90A1B9]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center font-['Arial'] text-sm text-[#62748E]"
                  >
                    {emptyLabel}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onView(order)}
                    onKeyDown={(e) => e.key === "Enter" && onView(order)}
                    className="cursor-pointer border-b border-[#F1F5F9] transition-colors hover:bg-[#F8FAFC]/50"
                  >
                    <td className="p-4 font-['Inter'] text-base font-bold leading-6 text-[#314158]">
                      #{order.orderNo}
                    </td>
                    <td className="p-4">
                      <span className="block font-['Inter'] text-sm font-semibold leading-5 text-[#314158]">
                        {order.date}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 font-['Inter'] text-[11px] font-normal leading-[16.5px] text-[#90A1B9]">
                        <Clock className="h-3.5 w-3.5" />
                        {order.time}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="block font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
                        {order.customerName}
                      </span>
                      <span className="font-['Inter'] text-xs font-normal leading-4 text-[#90A1B9]">
                        {order.phone}
                      </span>
                    </td>
                    <td className="p-4 text-right font-['Inter'] text-sm font-bold leading-5 text-[#1D293D]">
                      Rs.
                      {order.totalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-4">
                      <StatusPill status={order.status} />
                    </td>
                    <td className="p-4">
                      <PaymentStatusPill status={order.paymentStatus} />
                    </td>
                    <td className="w-px whitespace-nowrap p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {order.status !== "cancel" &&
                          orderNeedsPaymentCollection(order) &&
                          (collectibleOrderAmount(order) > PAY_SHOW_EPS ||
                            order.requiresAdditionalPayment === true) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPay(order);
                            }}
                            className="flex h-[25px] min-w-[60px] shrink-0 items-center justify-center rounded-[14px] bg-[#00BC7D] px-4 font-['Inter'] text-sm font-bold leading-5 text-white transition-colors hover:bg-[#009966]"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(order);
                          }}
                          disabled={order.status !== "pending"}
                          className={`rounded-lg p-1.5 transition-colors ${order.status === "pending"
                            ? "text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C] cursor-pointer"
                            : "text-[#CAD5E2] cursor-not-allowed opacity-50"
                            }`}
                          aria-label="Edit order"
                          title={
                            order.status !== "pending"
                              ? "Only pending orders can be edited"
                              : "Edit order"
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(order);
                          }}
                          className="rounded-lg p-1.5 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
                          aria-label="View order"
                          title="View order"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(order.orderNo);
                          }}
                          className="rounded-lg p-1.5 text-[#90A1B9] transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Delete order"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="flex flex-col gap-3 md:hidden">
          {orders.map((order) => (
            <div
              key={order.id}
              role="button"
              tabIndex={0}
              onClick={() => onView(order)}
              onKeyDown={(e) => e.key === "Enter" && onView(order)}
              className="cursor-pointer rounded-[14px] border border-[#F1F5F9] bg-white p-4 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-['Inter'] text-base font-bold leading-6 text-[#314158]">
                    #{order.orderNo}
                  </span>
                  <span className="ml-2">
                    <StatusPill status={order.status} />
                  </span>
                  <span className="ml-2">
                    <PaymentStatusPill status={order.paymentStatus} />
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {order.status !== "cancel" &&
                    orderNeedsPaymentCollection(order) &&
                    (collectibleOrderAmount(order) > PAY_SHOW_EPS ||
                      order.requiresAdditionalPayment === true) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPay(order);
                      }}
                      className="flex h-[25px] min-w-[60px] shrink-0 items-center justify-center rounded-[14px] bg-[#00BC7D] px-4 font-['Inter'] text-sm font-bold leading-5 text-white transition-colors hover:bg-[#009966]"
                    >
                      Pay
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(order);
                    }}
                    disabled={order.status !== "pending"}
                    className={`rounded-lg p-1.5 transition-colors ${order.status === "pending"
                      ? "text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C] cursor-pointer"
                      : "text-[#CAD5E2] cursor-not-allowed opacity-50"
                      }`}
                    aria-label="Edit order"
                    title={
                      order.status !== "pending"
                        ? "Only pending orders can be edited"
                        : "Edit order"
                    }
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(order);
                    }}
                    className="rounded-lg p-1.5 text-[#90A1B9] hover:bg-[#F1F5F9] hover:text-[#45556C]"
                    aria-label="View order"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(order.orderNo);
                    }}
                    className="rounded-lg p-1.5 text-[#90A1B9] hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete order"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 font-['Inter'] text-sm font-bold leading-5 text-[#314158]">
                {order.customerName}
              </p>
              <p className="font-['Inter'] text-xs font-normal leading-4 text-[#90A1B9]">
                {order.phone}
              </p>
              <p className="mt-1 font-['Inter'] text-[11px] font-normal leading-[16.5px] text-[#90A1B9]">
                <Clock className="mr-1 inline h-3 w-3" />
                {order.date} · {order.time}
              </p>
              <p className="mt-2 font-['Inter'] text-sm font-bold leading-5 text-[#1D293D]">
                Rs.{order.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="py-8 text-center font-['Arial'] text-sm text-[#62748E]">
              {emptyLabel}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
