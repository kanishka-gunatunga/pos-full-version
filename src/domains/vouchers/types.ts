export type IssuedVoucherStatus = "active" | "inactive" | "redeemed";

export interface VoucherPageSummary {
  totalActiveCount: number;
  activeValueFormatted: string;
  redeemedCount: number;
  redeemedValueFormatted: string;
}

export interface IssuedVoucherRow {
  id: string;
  code: string;
  createdAt: string;
  barcode: string;
  value: number;
  validityLabel: string;
  expiryDate: string;
  issuedToName: string | null;
  issuedToPhone: string | null;
  branchName: string;
  issuedByName?: string | null;
  status: IssuedVoucherStatus;
}

export type CreatedVoucherTemplateStatus = "active" | "inactive" | "redeemed";

export interface CreatedVoucherTemplate {
  id: string;
  value: number;
  imageUrl: string;
  validityLabel: string;
  status: CreatedVoucherTemplateStatus;
}
