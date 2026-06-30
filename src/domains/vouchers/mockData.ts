import type {
  CreatedVoucherTemplate,
  IssuedVoucherRow,
  VoucherPageSummary,
} from "./types";

export const VOUCHER_PAGE_SUMMARY: VoucherPageSummary = {
  totalActiveCount: 3,
  activeValueFormatted: "Rs. 11,000.00",
  redeemedCount: 1,
  redeemedValueFormatted: "Rs. 1,000.00",
};

export const MOCK_ISSUED_VOUCHERS: IssuedVoucherRow[] = [
  {
    id: "v1",
    code: "GV25-ABCD-1234",
    createdAt: "2026-03-30T10:00:00.000Z",
    barcode: "5901234123457",
    valueFormatted: "Rs. 1,000.00",
    validityLabel: "6 months",
    expiryDate: "2026-09-30",
    issuedToName: "Jane Perera",
    issuedToPhone: "+94 77 123 4567",
    branchName: "Downtown",
    status: "active",
  },
  {
    id: "v2",
    code: "GV25-EFGH-5678",
    createdAt: "2026-02-15T09:30:00.000Z",
    barcode: "5909876543210",
    valueFormatted: "Rs. 2,500.00",
    validityLabel: "12 months",
    expiryDate: "2027-02-15",
    issuedToName: "Kamal Silva",
    issuedToPhone: "+94 71 555 8899",
    branchName: "Suburb",
    status: "active",
  },
  {
    id: "v3",
    code: "GV25-IJKL-9012",
    createdAt: "2026-01-10T14:20:00.000Z",
    barcode: "5901111222333",
    valueFormatted: "Rs. 500.00",
    validityLabel: "6 months",
    expiryDate: "2026-07-10",
    issuedToName: null,
    issuedToPhone: null,
    branchName: "Downtown",
    status: "inactive",
  },
  {
    id: "v4",
    code: "GV24-MNOP-3456",
    createdAt: "2025-12-01T11:00:00.000Z",
    barcode: "5904444555666",
    valueFormatted: "Rs. 7,000.00",
    validityLabel: "12 months",
    expiryDate: "2026-06-01",
    issuedToName: "Walk-in",
    issuedToPhone: "+94 76 000 1122",
    branchName: "Suburb",
    status: "redeemed",
  },
];

/** Placeholder thumbnails — swap for CDN URLs when wired to the API */
const PLACEHOLDER_THUMB = "/product-placeholder.svg";

export const MOCK_CREATED_VOUCHER_TEMPLATES: CreatedVoucherTemplate[] = [
  {
    id: "t1",
    valueFormatted: "Rs. 2,000.00",
    imageUrl: PLACEHOLDER_THUMB,
    validityLabel: "6 months",
    status: "active",
  },
  {
    id: "t2",
    valueFormatted: "Rs. 5,000.00",
    imageUrl: PLACEHOLDER_THUMB,
    validityLabel: "12 months",
    status: "active",
  },
  {
    id: "t3",
    valueFormatted: "Rs. 1,000.00",
    imageUrl: PLACEHOLDER_THUMB,
    validityLabel: "6 months",
    status: "inactive",
  },
];
