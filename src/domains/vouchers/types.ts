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
  valueFormatted: string;
  validityLabel: string;
  expiryDate: string;
  issuedToName: string | null;
  issuedToPhone: string | null;
  branchName: string;
  status: IssuedVoucherStatus;
}

export type CreatedVoucherTemplateStatus = "active" | "inactive" | "redeemed";

export interface CreatedVoucherTemplate {
  id: string;
  valueFormatted: string;
  imageUrl: string;
  validityLabel: string;
  status: CreatedVoucherTemplateStatus;
}
