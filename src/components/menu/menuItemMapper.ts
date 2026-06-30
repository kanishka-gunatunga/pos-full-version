import type { MenuItem, ProductAddOn, ProductVariant } from "./types";
import type { Modification, Product, ModificationItem } from "@/types/product";
import { normalizeProductImageUrl } from "@/lib/productImage";

/**
 * Collects all unique add-ons for a product, checking both nested data 
 * and falling back to a global modifications list.
 */
export function collectAddOns(
  product: Product,
  allModifications: Modification[]
): ProductAddOn[] {
  const addOns: ProductAddOn[] = [];
  const seenItemIds = new Set<string>();

  const processModGroup = (mId: number, nestedMod?: Modification) => {
    // Priority 1: Use nested items in the product data if available
    if (nestedMod?.items && nestedMod.items.length > 0) {
      nestedMod.items.forEach((mi: ModificationItem) => {
        const itemId = mi.id.toString();
        if (!seenItemIds.has(itemId)) {
          addOns.push({
            id: itemId,
            name: mi.title,
            price: Number(mi.price),
          });
          seenItemIds.add(itemId);
        }
      });
      return;
    }

    // Priority 2: Fallback to global list if nested items are missing
    const modGroup = allModifications.find((m) => m.id === mId);
    modGroup?.items?.forEach((mi: ModificationItem) => {
      const itemId = mi.id.toString();
      if (!seenItemIds.has(itemId)) {
        addOns.push({
          id: itemId,
          name: mi.title,
          price: Number(mi.price),
        });
        seenItemIds.add(itemId);
      }
    });
  };

  // Check top-level product modifications
  product.productModifications?.forEach((pm) => 
    processModGroup(pm.modificationId, pm.Modification)
  );

  // Check variation-specific modifications
  product.variations?.forEach((v) => {
    v.variationModifications?.forEach((vm) => 
      processModGroup(vm.modificationId, vm.Modification)
    );
  });

  return addOns;
}

export function mapProductToMenuItem(
  product: Product,
  branchId: number,
  allModifications: Modification[]
): MenuItem {
  const variants: ProductVariant[] = [];

  product.variations?.forEach((variation) => {
    variation.options?.forEach((option) => {
      const branchPrice = option.prices?.find((price) => price.branchId === branchId);

      if (!branchPrice) return;

      const isGeneric =
        variation.name.toLowerCase().includes("variant") ||
        variation.name.toLowerCase().includes("standard");

      variants.push({
        id: option.id,
        variationId: variation.id,
        name: isGeneric ? option.name : `${variation.name}: ${option.name}`,
        price: Number(branchPrice.price),
        barcode: option.barcode,
      });
    });
  });

  const addOns = collectAddOns(product, allModifications);
  const basePrice = variants.length > 0 ? variants[0].price : 0;

  return {
    id: `${product.id}-${product.code}`,
    productId: product.id,
    name: product.name,
    category: product.category?.name || "Other",
    subCategory: product.subCategory?.name || "General",
    price: basePrice,
    image: normalizeProductImageUrl(product.image) || undefined,
    description: product.description || undefined,
    barcode: product.barcode || undefined,
    variants: variants.length > 0 ? variants : undefined,
    addOns: addOns.length > 0 ? addOns : undefined,
  };
}

export function mapProductsToMenuItems(
  products: Product[],
  branchId: number,
  allModifications: Modification[]
): MenuItem[] {
  const uniqueItems: MenuItem[] = [];
  const seenIds = new Set<string>();

  products.forEach((product) => {
    const item = mapProductToMenuItem(product, branchId, allModifications);
    if (seenIds.has(item.id)) return;
    uniqueItems.push(item);
    seenIds.add(item.id);
  });

  return uniqueItems;
}
