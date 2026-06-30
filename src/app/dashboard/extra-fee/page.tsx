import { Suspense } from "react";
import ExtraFeeContent from "./ExtraFeeContent";

export default function ExtraFeePage() {
  return (
    <Suspense fallback={null}>
      <ExtraFeeContent />
    </Suspense>
  );
}
