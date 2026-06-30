import type { DeliveryFeeItem, ServiceChargeItem } from "./types";

export const MAX_FEES_PER_BRANCH = 5;

const TODAY = "2026-03-20";

export const DELIVERY_FEE_MOCKS: DeliveryFeeItem[] = [
  {
    id: 1001,
    branchId: 1,
    branchName: "Maharagama",
    branchLocation: "123 Main St, City Center",
    zoneName: "City Center Zone",
    price: 350,
    addedOn: "2026-03-15",
  },
  {
    id: 1002,
    branchId: 1,
    branchName: "Maharagama",
    branchLocation: "123 Main St, City Center",
    zoneName: "Suburb Zone",
    price: 450,
    addedOn: "2026-03-15",
  },
  {
    id: 1003,
    branchId: 1,
    branchName: "Maharagama",
    branchLocation: "123 Main St, City Center",
    zoneName: "Express Delivery",
    price: 250,
    addedOn: TODAY,
  },
  {
    id: 1004,
    branchId: 2,
    branchName: "Nugegoda",
    branchLocation: "456 West Ave, West District",
    zoneName: "West District",
    price: 350,
    addedOn: "2026-03-10",
  },
];

export const SERVICE_CHARGE_MOCKS: ServiceChargeItem[] = [
  {
    id: 2001,
    branchId: 11,
    title: "Downtown",
    location: "123 Main St, City Center",
    rate: 10,
    addedOn: "2026-03-01",
  },
  {
    id: 2002,
    branchId: 12,
    title: "Westside",
    location: "456 West Ave, West District",
    rate: 12,
    addedOn: "2026-03-01",
  },
  {
    id: 2003,
    branchId: 13,
    title: "Airport",
    location: "789 Airport Rd, Terminal 2",
    rate: 15,
    addedOn: "2026-03-10",
  },
];

export function formatAddedOn(dateIso: string): string {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "";
  return `Added on ${d.toLocaleDateString("en-US")}`;
}

export function formatLkr(value: number): string {
  return `Rs. ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
