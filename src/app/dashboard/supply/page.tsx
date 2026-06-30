import { Suspense } from "react";
import SupplyContent from "./SupplyContent";

export default function SupplyPage() {
  return (
    <Suspense fallback={null}>
      <SupplyContent />
    </Suspense>
  );
}
