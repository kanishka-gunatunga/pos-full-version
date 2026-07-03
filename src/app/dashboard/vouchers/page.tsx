import VouchersPageContent from "./VouchersPageContent";

export default function VouchersPage() {
  return (
    <VouchersPageContent
      initialSummary={{ totalActiveCount: 0, activeValueFormatted: 'Rs.0.00', redeemedCount: 0, redeemedValueFormatted: 'Rs.0.00' }}
      initialIssuedVouchers={[]}
    />
  );
}
