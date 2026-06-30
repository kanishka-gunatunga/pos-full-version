import { Suspense } from "react";
import InventoryContent from "./InventoryContent";

export default function InventoryPage() {
  return (
    <Suspense fallback={null}>
      <InventoryContent />
    </Suspense>
  );
}
