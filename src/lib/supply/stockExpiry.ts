import type { StockItem, StockStatus } from "@/types/supply";

/** Returns display state for a stock row; mirrors backend `status` and `expired`. */
export function getStockRowDisplay(row: StockItem): {
  showExpired: boolean;
  displayStatus: StockStatus;
} {
  return {
    showExpired: row.expired,
    displayStatus: row.status,
  };
}
