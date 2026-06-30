import type {
  Order as ApiOrder,
  OrderItem as ApiOrderItem,
  OrderItemModification,
} from "@/types/order";
import { formatDate, formatTime } from "@/lib/format";
import { totalsFromOrderLineItems } from "./orderLineTotals";
import { buildOrderRefundSummary, reconcileBalanceDueWithPaymentRows } from "./orderRefundSummary";

export function readBalanceDueFromOrderPayload(
  o: Record<string, unknown> | null | undefined
): number | undefined {
  if (!o || typeof o !== "object") return undefined;
  const v = o.balanceDue ?? o.balance_due;
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function readBalanceDueFromApi(o: ApiOrder & Record<string, unknown>): number | undefined {
  return readBalanceDueFromOrderPayload(o as Record<string, unknown>);
}

function readRequiresAdditionalPaymentFromApi(
  o: ApiOrder & Record<string, unknown>
): boolean | undefined {
  const v: unknown = o.requiresAdditionalPayment ?? o.requires_additional_payment;
  if (v === true || v === 1 || String(v).toLowerCase() === "true") return true;
  if (v === false || v === 0 || String(v).toLowerCase() === "false") return false;
  return undefined;
}

export type OrderStatus = "pending" | "preparing" | "ready" | "hold" | "complete" | "cancel";
export type PaymentStatus = "pending" | "paid" | "refund" | "partial_refund";

function readPaymentStatusFromApi(o: ApiOrder & Record<string, unknown>): PaymentStatus {
  const raw = o.paymentStatus ?? o.payment_status;
  if (raw == null || raw === "") return "pending";
  const s = String(raw).trim().toLowerCase().replace(/\s+/g, "_");
  const allowed: PaymentStatus[] = ["pending", "paid", "refund", "partial_refund"];
  if (allowed.includes(s as PaymentStatus)) return s as PaymentStatus;
  return "pending";
}

export type OrderType = "takeaway" | "dining" | "delivery";
export type OrderTypeLabel = "Dine In" | "Take Away" | "Delivery";

export type OrderDetailAddonLine = {
  qty: number;
  name: string;
};

export type OrderDetailItem = {
  id?: string;
  productId?: string;
  variationId?: string;
  variationOptionId?: string;
  name: string;
  qty: number;
  price: number;
  productDiscount?: number;
  image?: string;
  variant?: string;
  addOns?: string[];
  addonLines?: OrderDetailAddonLine[];
  modifications?: { modificationId: number; price: number }[];
  bogoPromotionId?: string | number;
  productBundleId?: string | number;
  isFreeItem?: boolean;
  linkId?: string;
  buyQuantity?: number;
  getQuantity?: number;
};

export type OrderDetailsView = {
  id: string;
  orderNo: string;
  date: string;
  time: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string;
  phone: string;
  customerId?: string | number;
  totalAmount: number;
  orderType?: OrderTypeLabel;
  tableId?: number | null;
  tableName?: string | null;
  tableNumber?: string;
  deliveryAddress?: string;
  landmark?: string;
  zipCode?: string;
  deliveryInstructions?: string;
  items?: OrderDetailItem[];
  subtotal?: number;
  discount?: number;
  orderDiscount?: number;
  serviceCharge?: number;
  deliveryChargeAmount?: number;
  deliveryChargeId?: number | null;
  balanceDue?: number;
  requiresAdditionalPayment?: boolean;
  totalRefunded?: number;
  outstandingRefund?: number;
  totalPaidForOrder?: number;
};

export type OrderRow = {
  id: string;
  orderNo: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  customerId?: string | number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderType?: OrderTypeLabel;
  tableId?: number | null;
  tableName?: string | null;
  tableNumber?: string;
  deliveryAddress?: string;
  landmark?: string;
  zipCode?: string;
  deliveryInstructions?: string;
  items?: OrderDetailItem[];
  subtotal?: number;
  discount?: number;
  orderDiscount?: number;
  serviceCharge?: number;
  deliveryChargeAmount?: number;
  deliveryChargeId?: number | null;
  balanceDue?: number;
  requiresAdditionalPayment?: boolean;
  totalRefunded?: number;
  outstandingRefund?: number;
  totalPaidForOrder?: number;
};

export function mapOrderToRow(apiOrder: ApiOrder): OrderRow {
  const raw = apiOrder as ApiOrder & Record<string, unknown>;
  const apiBalanceDue = readBalanceDueFromApi(raw);
  const apiRequiresAdditionalPayment = readRequiresAdditionalPaymentFromApi(raw);

  const orderType =
    apiOrder.orderType === "dining"
      ? "Dine In"
      : apiOrder.orderType === "takeaway"
        ? "Take Away"
        : apiOrder.orderType === "delivery"
          ? "Delivery"
          : undefined;

  const itemDiscountSum =
    apiOrder.items?.reduce(
      (sum, item) => sum + Number(item.productDiscount || 0) * item.quantity,
      0
    ) || 0;
  const orderDiscount = Number(apiOrder.orderDiscount || 0);
  const aggregateDiscount = orderDiscount + itemDiscountSum;
  const items = apiOrder.items?.map(mapOrderItemToDetail);
  const fromLines = totalsFromOrderLineItems(items, orderDiscount);
  const subtotalFromApi =
    Number(apiOrder.totalAmount) -
    Number(apiOrder.tax || 0) +
    Number(apiOrder.orderDiscount || 0) +
    itemDiscountSum;
  const serviceChargeRaw = Number(raw.serviceCharge ?? raw.service_charge ?? 0);
  const serviceCharge = Number.isFinite(serviceChargeRaw) ? serviceChargeRaw : 0;
  const deliveryChargeAmountRaw = Number(
    raw.deliveryChargeAmount ?? raw.delivery_charge_amount ?? 0
  );
  const deliveryChargeAmount = Number.isFinite(deliveryChargeAmountRaw)
    ? deliveryChargeAmountRaw
    : 0;
  const deliveryChargeIdRaw = raw.deliveryChargeId ?? raw.delivery_charge_id;
  const parsedDeliveryChargeId =
    deliveryChargeIdRaw == null || deliveryChargeIdRaw === "" ? null : Number(deliveryChargeIdRaw);
  const deliveryChargeId =
    parsedDeliveryChargeId != null && Number.isFinite(parsedDeliveryChargeId)
      ? parsedDeliveryChargeId
      : null;
  const apiTotalAmountRaw = Number(apiOrder.totalAmount);
  const apiTotalAmount = Number.isFinite(apiTotalAmountRaw) ? apiTotalAmountRaw : NaN;

  const currentTotal = Number.isFinite(apiTotalAmount)
    ? apiTotalAmount
    : (fromLines?.totalAmount ?? 0);
  const refundSummary = buildOrderRefundSummary(apiOrder, raw, currentTotal);
  const orderPaymentStatus = readPaymentStatusFromApi(raw);

  const { balanceDue, requiresAdditionalPayment } = reconcileBalanceDueWithPaymentRows(
    apiOrder,
    currentTotal,
    apiBalanceDue,
    apiRequiresAdditionalPayment
  );

  return {
    id: String(apiOrder.id),
    orderNo: String(apiOrder.id),
    date: formatDate(apiOrder.createdAt),
    time: formatTime(apiOrder.createdAt),
    customerName: apiOrder.customer?.name || "Guest",
    phone: apiOrder.customer?.mobile || "N/A",
    customerId: apiOrder.customerId || apiOrder.customer?.id,
    totalAmount: Number.isFinite(apiTotalAmount) ? apiTotalAmount : (fromLines?.totalAmount ?? 0),
    status: apiOrder.status || "pending",
    paymentStatus: orderPaymentStatus,
    orderType,
    tableId:
      apiOrder.tableId != null && Number.isFinite(Number(apiOrder.tableId))
        ? Number(apiOrder.tableId)
        : null,
    tableName:
      (raw.tableName as string | undefined) ??
      (raw.table_name as string | undefined) ??
      apiOrder.tableNumber ??
      null,
    tableNumber: apiOrder.tableNumber,
    deliveryAddress: apiOrder.deliveryAddress,
    landmark: apiOrder.landmark,
    zipCode: apiOrder.zipcode,
    deliveryInstructions: apiOrder.deliveryInstructions,
    items,
    subtotal: fromLines?.itemsSubtotal ?? subtotalFromApi,
    discount: fromLines?.totalDiscountAmount ?? aggregateDiscount,
    orderDiscount,
    serviceCharge,
    deliveryChargeAmount,
    deliveryChargeId,
    balanceDue,
    ...(requiresAdditionalPayment !== undefined ? { requiresAdditionalPayment } : {}),
    totalRefunded: refundSummary.totalRefunded,
    outstandingRefund: refundSummary.outstandingRefund,
    totalPaidForOrder: refundSummary.totalPaidForOrder,
  };
}

/** Group/placeholder names — not a real customer-facing choice; hide "Variant:" row. */
const VARIANT_LABEL_PLACEHOLDERS = new Set(
  [
    "variants",
    "variant",
    "variations",
    "variation",
    "size",
    "sizes",
    "options",
    "option",
    "select option",
    "choose variant",
    "choose size",
  ].map((s) => s.toLowerCase())
);

function normalizeVariantLabelForCompare(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, " ");
}

function isPlaceholderVariantLabel(label: string | undefined): boolean {
  if (label == null || label.trim() === "") return true;
  return VARIANT_LABEL_PLACEHOLDERS.has(normalizeVariantLabelForCompare(label));
}

function readOrderItemVariantLabel(
  item: ApiOrderItem & Record<string, unknown>
): string | undefined {
  const vo = item.variationOption ?? (item.variation_option as { name?: string } | undefined);
  if (vo && typeof vo === "object" && vo.name != null && String(vo.name).trim() !== "") {
    const name = String(vo.name).trim();
    if (!isPlaceholderVariantLabel(name)) return name;
  }
  const v = item.variation;
  if (
    v &&
    typeof v === "object" &&
    "name" in v &&
    String((v as { name?: string }).name || "").trim() !== ""
  ) {
    const name = String((v as { name: string }).name).trim();
    if (!isPlaceholderVariantLabel(name)) return name;
  }
  return undefined;
}

const MODIFICATION_ARRAY_KEYS = [
  "modifications",
  "order_modifications",
  "orderModifications",
] as const;

/** Prefer first array with at least one row (`[]` must not block `order_modifications`). */
function firstNonEmptyModificationsArray(item: Record<string, unknown>): unknown[] {
  for (const key of MODIFICATION_ARRAY_KEYS) {
    const v = item[key];
    if (Array.isArray(v) && v.length > 0) return v;
  }
  return [];
}

function readNestedModificationRow(
  r: Record<string, unknown>
): Record<string, unknown> | undefined {
  const n = r.modification ?? r.Modification ?? r.modification_item ?? r.modificationItem;
  if (n != null && typeof n === "object") return n as Record<string, unknown>;
  return undefined;
}

function titleFromModificationRecord(nested: Record<string, unknown> | undefined): string {
  if (!nested) return "";
  return String(
    nested.title ?? nested.name ?? nested.label ?? nested.Title ?? nested.Name ?? nested.Label ?? ""
  ).trim();
}

function parseOrderItemModificationRow(r: Record<string, unknown>): OrderItemModification | null {
  const modificationId = r.modificationId ?? r.modification_id;
  if (modificationId == null || modificationId === "") return null;
  const price = Number(r.price ?? 0);
  const qtyRaw = r.quantity ?? r.qty;
  const quantity = Math.max(1, Math.floor(Number(qtyRaw) || 1));
  const nested = readNestedModificationRow(r);
  const nestedTitle = titleFromModificationRecord(nested);
  const rowTitle = String(r.title ?? r.name ?? r.label ?? "").trim();
  const title = nestedTitle || rowTitle;
  const modId = modificationId as string | number;
  const rid = r.id;
  const oid = r.orderItemId ?? r.order_item_id;
  const nestedPrice = nested
    ? Number(nested.price ?? nested.Price ?? nested.unit_price ?? nested.unitPrice ?? NaN)
    : NaN;
  const unitPrice = Number.isFinite(nestedPrice) ? nestedPrice : price;

  return {
    id: (typeof rid === "string" || typeof rid === "number" ? rid : "") as string | number,
    orderItemId: (typeof oid === "string" || typeof oid === "number" ? oid : "") as string | number,
    modificationId: modId,
    price,
    quantity,
    modification:
      title || nested
        ? {
            id: (nested?.id ?? nested?.modificationId ?? nested?.modification_id ?? modId) as
              | string
              | number,
            title: title || "Add-on",
            price: unitPrice,
            modificationId: modId,
          }
        : undefined,
  };
}

/** Normalize order line modifications from API (camelCase / snake_case / nested / row-level title). */
function normalizeModificationsFromOrderItem(
  item: Record<string, unknown>
): OrderItemModification[] {
  const raw = firstNonEmptyModificationsArray(item);
  const out: OrderItemModification[] = [];
  for (const row of raw) {
    if (row == null || typeof row !== "object") continue;
    const parsed = parseOrderItemModificationRow(row as Record<string, unknown>);
    if (parsed) out.push(parsed);
  }
  return out;
}

/** Group by modificationId; each row contributes `quantity` (default 1) or duplicate rows. */
function addonLinesFromModifications(
  modifications: OrderItemModification[] | undefined
): OrderDetailAddonLine[] {
  if (!modifications?.length) return [];
  const byId = new Map<string, OrderDetailAddonLine>();
  for (const m of modifications) {
    const title = m.modification?.title?.trim() || "Add-on";
    const key = String(m.modificationId);
    const rowQty = Math.max(1, Math.floor(Number(m.quantity) || 1));
    const cur = byId.get(key);
    if (cur) cur.qty += rowQty;
    else byId.set(key, { qty: rowQty, name: title });
  }
  return Array.from(byId.values()).filter((line) => line.name && line.name !== "Add-on");
}

/** Expand `quantity` on a mod row into repeated unit prices for `lineNetBeforeOrderDiscount`. */
function flattenModificationsForTotals(mods: OrderItemModification[]): {
  modificationId: number;
  price: number;
}[] {
  const out: { modificationId: number; price: number }[] = [];
  for (const m of mods) {
    const q = Math.max(1, Math.floor(Number(m.quantity) || 1));
    const p = Number(m.price || 0);
    for (let i = 0; i < q; i++) {
      out.push({ modificationId: Number(m.modificationId), price: p });
    }
  }
  return out;
}

function mapOrderItemToDetail(item: ApiOrderItem): OrderDetailItem {
  const rawItem = item as ApiOrderItem & Record<string, unknown>;
  const rawVariationOption =
    rawItem.variation_option && typeof rawItem.variation_option === "object"
      ? (rawItem.variation_option as { id?: unknown })
      : undefined;
  const rawMods = normalizeModificationsFromOrderItem(rawItem);
  const addonLines = addonLinesFromModifications(rawMods);
  const variant = readOrderItemVariantLabel(rawItem);
  const modifications = flattenModificationsForTotals(rawMods);
  return {
    id: String(item.id),
    productId: String(item.productId),
    variationId: item.variationId != null ? String(item.variationId) : undefined,
    variationOptionId:
      (item.variationOptionId ?? 
       rawItem.variation_option_id ?? 
       item.variationOption?.id ?? 
       rawVariationOption?.id) != null
        ? String(item.variationOptionId ?? rawItem.variation_option_id ?? item.variationOption?.id ?? rawVariationOption?.id)
        : undefined,
    name: (item.product as { name?: string } | undefined)?.name || "Unknown Product",
    qty: item.quantity,
    price: Number(item.unitPrice),
    productDiscount: Number(item.productDiscount || 0),
    image: item.product?.image,
    variant,
    addonLines: addonLines.length > 0 ? addonLines : undefined,
    addOns: addonLines.length > 0 ? addonLines.map((a) => `${a.qty}x ${a.name}`) : undefined,
    modifications: modifications.length > 0 ? modifications : undefined,
    bogoPromotionId: item.bogoPromotionId ?? (rawItem.bogo_promotion_id as string | number),
    productBundleId: item.productBundleId ?? (rawItem.product_bundle_id as string | number),
    isFreeItem: item.isFreeItem ?? (rawItem.is_free_item as boolean),
    linkId: item.linkId ?? (rawItem.link_id as string),
    buyQuantity: item.buyQuantity ?? (rawItem.buy_quantity as number),
    getQuantity: item.getQuantity ?? (rawItem.get_quantity as number),
  };
}
