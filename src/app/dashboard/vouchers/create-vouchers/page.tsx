import CreatedVouchersPageContent from "./CreatedVouchersPageContent";
import { MOCK_CREATED_VOUCHER_TEMPLATES } from "@/domains/vouchers/mockData";

export default function CreatedVouchersPage() {
  return <CreatedVouchersPageContent initialTemplates={MOCK_CREATED_VOUCHER_TEMPLATES} />;
}
