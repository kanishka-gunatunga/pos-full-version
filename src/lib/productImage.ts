export const PRODUCT_PLACEHOLDER_SRC = "/product-placeholder.jpg";

export function normalizeProductImageUrl(url: unknown): string | undefined {
  if (url == null) return undefined;
  const s = String(url).trim();
  return s.length > 0 ? s : undefined;
}

export function getProdImage(id: string): string {
  void id;
  return PRODUCT_PLACEHOLDER_SRC;
}

export function resolveProductImageSrc(
  image: string | undefined | null,
  fallbackId: string
): string {
  void fallbackId;
  const n = normalizeProductImageUrl(image);
  if (n) return n;
  return PRODUCT_PLACEHOLDER_SRC;
}
