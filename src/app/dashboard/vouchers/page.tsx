import VouchersPageContent from "./VouchersPageContent";
import { MOCK_ISSUED_VOUCHERS, VOUCHER_PAGE_SUMMARY } from "@/domains/vouchers/mockData";

export default function VouchersPage() {
  return (
    <VouchersPageContent
      initialSummary={VOUCHER_PAGE_SUMMARY}
      initialIssuedVouchers={MOCK_ISSUED_VOUCHERS}
    />
  );
}
