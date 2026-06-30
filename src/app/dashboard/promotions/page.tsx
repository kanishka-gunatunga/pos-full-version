import { Suspense } from "react";
import PromotionsContent from "./PromotionsContent";

export default function PromotionsPage() {
  return (
    <Suspense fallback={null}>
      <PromotionsContent />
    </Suspense>
  );
}
