import { Suspense } from "react";
import AddProductContent from "./AddProductContent";

export default function AddProductPage() {
  return (
    <Suspense fallback={null}>
      <AddProductContent />
    </Suspense>
  );
}
