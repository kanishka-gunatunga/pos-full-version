
const KEY = "pos_menu_open_checkout";

export type MenuOpenCheckoutRecord = {
  localSlotId: string;
  serverOrderId: number;
  fingerprint: string;
};

export function readMenuOpenCheckout(): MenuOpenCheckoutRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<MenuOpenCheckoutRecord>;
    if (
      typeof p.localSlotId === "string" &&
      typeof p.serverOrderId === "number" &&
      Number.isFinite(p.serverOrderId) &&
      typeof p.fingerprint === "string"
    ) {
      return {
        localSlotId: p.localSlotId,
        serverOrderId: p.serverOrderId,
        fingerprint: p.fingerprint,
      };
    }
  } catch {
    /* */
  }
  return null;
}

export function saveMenuOpenCheckout(record: MenuOpenCheckoutRecord): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    /* */
  }
}

/** Remove stored open checkout when it belongs to the cleared menu slot. */
export function clearMenuOpenCheckoutForSlot(slotId: string): void {
  if (typeof window === "undefined") return;
  const cur = readMenuOpenCheckout();
  if (cur?.localSlotId === slotId) {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* */
    }
  }
}
