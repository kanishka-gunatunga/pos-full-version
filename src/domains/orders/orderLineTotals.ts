export type OrderLineItemLike = {
  name: string;
  qty: number;
  price: number;
  productDiscount?: number;
  modifications?: { price: number }[];
};

export function getOrderLineTaxRate(): number {
  return 0;
}

function modificationUnitSum(item: OrderLineItemLike): number {
  return (item.modifications ?? []).reduce((s, m) => s + Number(m.price || 0), 0);
}

/**
 * Per line: (unitPrice × qty) − (productDiscount × qty) + (sum mod prices) × qty
 */
export function lineNetBeforeOrderDiscount(item: OrderLineItemLike): number {
  const mod = modificationUnitSum(item);
  return (
    item.qty * item.price -
    item.qty * (item.productDiscount ?? 0) +
    mod * item.qty
  );
}

export function isPlaceholderOrderLineItems(items: OrderLineItemLike[] | undefined): boolean {
  return (
    !items ||
    items.length === 0 ||
    (items.length === 1 && items[0].name === "Order items")
  );
}

export type OrderLineTotals = {

  grossSubtotal: number;
  itemsSubtotal: number;
  itemDiscountSum: number;
  orderDiscount: number;
  totalDiscountAmount: number;
  netBeforeTax: number;
  taxAmount: number;
  taxRate: number;
  totalAmount: number;
};

export function totalsFromOrderLineItems(
  items: OrderLineItemLike[] | undefined,
  orderDiscount: number | undefined
): OrderLineTotals | null {
  if (isPlaceholderOrderLineItems(items)) return null;
  const list = items!;
  const orderDisc = Math.max(0, Number(orderDiscount) || 0);
  const itemDiscountSum = list.reduce(
    (sum, i) => sum + i.qty * (i.productDiscount ?? 0),
    0
  );
  const grossWithMods = list.reduce(
    (sum, i) => sum + i.qty * i.price + modificationUnitSum(i) * i.qty,
    0
  );
  const lineSum = list.reduce((sum, i) => sum + lineNetBeforeOrderDiscount(i), 0);
  const netBeforeTax = Math.max(0, lineSum - orderDisc);
  const rate = getOrderLineTaxRate();
  const taxAmount = netBeforeTax * rate;
  const totalAmount = netBeforeTax;
  return {
    grossSubtotal: grossWithMods,
    itemsSubtotal: lineSum,
    itemDiscountSum,
    orderDiscount: orderDisc,
    totalDiscountAmount: itemDiscountSum + orderDisc,
    netBeforeTax,
    taxAmount,
    taxRate: rate,
    totalAmount,
  };
}
