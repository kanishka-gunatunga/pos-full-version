"use client";

import { useState } from "react";
import { User, Phone, Home, MapPin, Navigation, ChevronDown } from "lucide-react";
import { X } from "lucide-react";
import type { OrderDetailsData, OrderType } from "@/contexts/OrderContext";
import { useGetCustomerByMobile } from "@/hooks/useCustomer";
import { useAuth } from "@/contexts/AuthContext";
import { useDeliveryChargesByBranch } from "@/hooks/useDeliveryCharge";
import { useGetTables } from "@/hooks/useTable";

type Props = {
  onSubmit: (data: OrderDetailsData) => void;
  onClose: () => void;
  initialData?: OrderDetailsData | null;
  title?: string;
  submitButtonText?: string;
  isSubmitting?: boolean;
  variant?: "full" | "voucherSale";
};

const DineInIcon = ({ active }: { active: boolean }) => (
  <svg
    className="h-6 w-6"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2V4"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 8C16.2652 8 16.5196 8.10536 16.7071 8.29289C16.8946 8.48043 17 8.73478 17 9V17C17 18.0609 16.5786 19.0783 15.8284 19.8284C15.0783 20.5786 14.0609 21 13 21H7C5.93913 21 4.92172 20.5786 4.17157 19.8284C3.42143 19.0783 3 18.0609 3 17V9C3 8.73478 3.10536 8.48043 3.29289 8.29289C3.48043 8.10536 3.73478 8 4 8H18C19.0609 8 20.0783 8.42143 20.8284 9.17157C21.5786 9.92172 22 10.9391 22 12C22 13.0609 21.5786 14.0783 20.8284 14.8284C20.0783 15.5786 19.0609 16 18 16H17"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 2V4"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TakeAwayIcon = ({ active }: { active: boolean }) => (
  <svg
    className="h-6 w-6"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 11L14 20"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 11L15 4"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M2 11H22"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3.5 11L5.1 18.4C5.19357 18.8585 5.44491 19.2697 5.81034 19.5621C6.17578 19.8545 6.63217 20.0094 7.1 20H16.9C17.3678 20.0094 17.8242 19.8545 18.1897 19.5621C18.5551 19.2697 18.8064 18.8585 18.9 18.4L20.6 11"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 15.5H19.5"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 11L9 4"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11L10 20"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DeliveryIcon = ({ active }: { active: boolean }) => (
  <svg
    className="h-6 w-6"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 18V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V15C2 15.5304 2.21071 16.0391 2.58579 16.4142C2.96086 16.7893 3.46957 17 4 17H5"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 8H17L20 11V17H19"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="18.5" r="1.5" stroke={active ? "#E26522" : "#62748E"} strokeWidth="1.5" />
    <circle cx="16.5" cy="18.5" r="1.5" stroke={active ? "#E26522" : "#62748E"} strokeWidth="1.5" />
    <path
      d="M9 18H15"
      stroke={active ? "#E26522" : "#62748E"}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function NewOrderDetailsModal({
  onSubmit,
  onClose,
  initialData,
  title,
  submitButtonText,
  isSubmitting = false,
  variant = "full",
}: Props) {
  const resolvedTitle = title ?? (variant === "voucherSale" ? "Customer details" : "New Order Details");
  const resolvedSubmitText =
    submitButtonText ?? (variant === "voucherSale" ? "Continue" : "Proceed to Menu");
  const [customerName, setCustomerName] = useState(initialData?.customerName ?? "");
  const [phone, setPhone] = useState(initialData?.phone ?? "");
  const [hasManualNameEdit, setHasManualNameEdit] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>(initialData?.orderType ?? "Dine In");
  const [tableId, setTableId] = useState(
    initialData?.tableId != null && Number.isFinite(Number(initialData.tableId))
      ? String(initialData.tableId)
      : ""
  );
  const [deliveryAddress, setDeliveryAddress] = useState(initialData?.deliveryAddress ?? "");
  const [landmark, setLandmark] = useState(initialData?.landmark ?? "");
  const [zipCode, setZipCode] = useState(initialData?.zipCode ?? "");
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    initialData?.deliveryInstructions ?? ""
  );
  const [deliveryCharge, setDeliveryCharge] = useState(
    initialData?.deliveryChargeId != null ? String(initialData.deliveryChargeId) : ""
  );
  const [toast, setToast] = useState<string | null>(null);
  const { user } = useAuth();
  const userBranchId = user?.branchId ?? null;
  const { data: allTables = [], isLoading: isLoadingTables } = useGetTables();
  const { data: deliveryChargesByBranch = [], isLoading: isLoadingDeliveryCharges } =
    useDeliveryChargesByBranch(userBranchId);
  const { data: customerData, isLoading: isLoadingCustomer } = useGetCustomerByMobile(phone.length >= 10 ? phone : "");
  const resolvedCustomerName =
    !hasManualNameEdit && customerData?.name ? customerData.name : customerName;
  const resolvedCustomerId = customerData?.id ?? initialData?.customerId;
  const resolvedOriginalCustomerName =
    customerData?.name ?? initialData?.originalCustomerName ?? "";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = () => {
    const mobileDigits = phone.replace(/[-\s]/g, "");
    if (mobileDigits.length > 0 && !/^0{1}7{1}[01245678]{1}[0-9]{7}$/.test(mobileDigits)) {
      return showToast("Invalid mobile number.");
    }
    if (variant === "voucherSale") {
      onSubmit({
        customerName: resolvedCustomerName.trim(),
        phone: phone.trim(),
        customerId: resolvedCustomerId,
        originalCustomerName: resolvedOriginalCustomerName,
        loyaltyPoints: customerData?.loyalty_points,
        orderType: "Take Away",
      });
      return;
    }
    if (orderType === "Dine In" && !tableId)
      return showToast("Please select a table.");
    if (orderType === "Delivery" && !deliveryAddress.trim())
      return showToast("Please enter delivery address.");
    if (orderType === "Delivery" && !deliveryCharge)
      return showToast("Please select a delivery charge.");

    const selectedTable = availableTables.find((table) => String(table.id) === tableId);
    const selectedDeliveryCharge = deliveryChargeOptions.find((option) => option.value === deliveryCharge);

    onSubmit({
      customerName: resolvedCustomerName.trim(),
      phone: phone.trim(),
      customerId: resolvedCustomerId,
      originalCustomerName: resolvedOriginalCustomerName,
      loyaltyPoints: customerData?.loyalty_points,
      orderType,
      ...(orderType === "Dine In" && {
        tableId: selectedTable?.id ?? null,
        tableNumber: selectedTable?.table_name ?? "",
      }),
      ...(orderType === "Delivery" && {
        deliveryAddress,
        landmark,
        zipCode,
        deliveryInstructions,
        deliveryChargeId: selectedDeliveryCharge ? Number(selectedDeliveryCharge.value) : null,
        deliveryChargeAmount: selectedDeliveryCharge?.amount ?? 0,
        deliveryChargeTitle: selectedDeliveryCharge?.title ?? "",
      }),
    });
  };

  const labelClass = "font-['Arial'] text-sm leading-5 text-[#62748E]";
  const inputClass =
    "w-full rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] py-3 pr-4 pl-11 font-['Arial'] text-base leading-[100%] text-[#0A0A0A80] placeholder:text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20";
  const selectClass =
    "w-full appearance-none rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] py-3 pr-10 pl-4 font-['Arial'] text-base leading-[100%] text-[#0A0A0A80] focus:border-[#EA580C] focus:outline-none focus:ring-1 focus:ring-[#EA580C]/20";
  const iconClass = "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]";

  const orderTypes: OrderType[] = ["Dine In", "Take Away", "Delivery"];
  const availableTables = allTables.filter((table) => table.status === "available");
  const deliveryChargeOptions = deliveryChargesByBranch.map((charge) => ({
    value: String(charge.id),
    title: charge.title,
    amount: Number(charge.amount),
    label: `${charge.title} - Rs. ${Number(charge.amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`,
  }));

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-y-auto rounded-[16px] border border-[#F1F5F9] bg-white px-8 py-5 shadow-[0px_1px_2px_-1px_#0000001A,0px_1px_3px_0px_#0000001A] [scrollbar-color:#E2E8F0_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#E2E8F0] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[#90A1B9] transition-colors hover:bg-[#F1F5F9] hover:text-[#45556C]"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="font-['Arial'] text-2xl font-bold leading-8 text-[#1D293D]">{resolvedTitle}</h2>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Mobile Number</label>
            <div className="relative mt-1.5">
              <Phone className={iconClass} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d+\-\s]/g, "");
                  setPhone(val);
                  setHasManualNameEdit(false);
                }}
                placeholder="07X-XXXX-XXX"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Customer Name</label>
            <div className="relative mt-1.5">
              <User className={iconClass} />
              <input
                type="text"
                value={resolvedCustomerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setHasManualNameEdit(true);
                }}
                placeholder={isLoadingCustomer ? "Searching..." : "Enter name"}
                className={inputClass}
                disabled={isLoadingCustomer}
              />
              {isLoadingCustomer && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#EA580C] border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {variant === "full" && (
          <>
        <div className="mt-6">
          <label className={labelClass}>Order Type</label>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {orderTypes.map((type) => {
              const isActive = orderType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`flex flex-col items-center gap-2 rounded-[14px] border px-4 py-4 transition-all duration-300 ease-out ${
                    isActive
                      ? "border-[#E26522] bg-[#E265220D]"
                      : "border-[#E2E8F0] bg-white hover:bg-zinc-50"
                  }`}
                >
                  {type === "Dine In" && <DineInIcon active={isActive} />}
                  {type === "Take Away" && <TakeAwayIcon active={isActive} />}
                  {type === "Delivery" && <DeliveryIcon active={isActive} />}
                  <span
                    className={`font-['Arial'] text-sm font-bold leading-5 ${
                      isActive ? "text-[#E26522]" : "text-[#62748E]"
                    }`}
                  >
                    {type}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {orderType === "Dine In" && (
          <div className="mt-6">
            <label className={labelClass}>Table</label>
            <div className="relative mt-1.5">
              <select
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                className={selectClass}
              >
                <option value="" disabled>
                  {isLoadingTables
                    ? "Loading tables..."
                    : availableTables.length > 0
                      ? "Select table"
                      : "No available tables"}
                </option>
                {availableTables.map((table) => (
                  <option key={table.id} value={String(table.id)}>
                    {table.table_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
            </div>
          </div>
        )}

        {orderType === "Delivery" && (
          <>
            <div className="mt-6">
              <label className={labelClass}>Delivery Address</label>
              <div className="relative mt-1.5">
                <Home className={iconClass} />
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, House No, Building name"
                  className={inputClass}
                />
              </div>
            </div>

            {/* <div className="mt-4 grid grid-cols-2 gap-4"> */}
            <div className="mt-4">
              <div>
                <label className={labelClass}>Landmark</label>
                <div className="relative mt-1.5">
                  <MapPin className={iconClass} />
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Eg: Near Petrol Pump"
                    className={inputClass}
                  />
                </div>
              </div>
              {/*
              <div>
                <label className={labelClass}>Zip Code</label>
                <div className="relative mt-1.5">
                  <Navigation className={iconClass} />
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Eg: 10280"
                    className={inputClass}
                  />
                </div>
              </div>
              */}
            </div>

            <div className="mt-4">
              <label className={labelClass}>Delivery Instructions</label>
              <div className="relative mt-1.5">
                <svg
                  className={iconClass}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="Eg: Leave at front door"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className={labelClass}>Delivery Charges</label>
              <div className="relative mt-1.5">
                <select
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  className={selectClass}
                >
                  <option value="" disabled>
                    {isLoadingDeliveryCharges
                      ? "Loading delivery charges..."
                      : deliveryChargeOptions.length > 0
                        ? "Select delivery charge"
                        : "No delivery charges available"}
                  </option>
                  {deliveryChargeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#90A1B9]" />
              </div>
            </div>
          </>
        )}
          </>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-8 w-full rounded-[14px] bg-[#EA580C] py-4 font-['Arial'] text-lg font-bold leading-7 text-white shadow-[0px_4px_6px_-4px_#EA580C4D,0px_10px_15px_-3px_#EA580C4D] transition-all duration-300 ease-out hover:bg-[#DC4C04] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : resolvedSubmitText}
        </button>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-0 right-0 z-70 flex justify-center animate-[fadeInUp_0.3s_ease-out]">
          <div className="rounded-[14px] border border-red-200 bg-red-500 px-6 py-3 font-['Arial'] text-sm font-bold text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
