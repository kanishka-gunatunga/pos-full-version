"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useMemo, useState } from "react";
import { PRODUCT_PLACEHOLDER_SRC, resolveProductImageSrc } from "@/lib/productImage";

type MenuProductImageProps = Omit<ImageProps, "src" | "onError" | "alt"> & {
  productImageUrl?: string | null;
  fallbackImageId: string;
  alt: string;
};

export default function MenuProductImage({
  productImageUrl,
  fallbackImageId,
  alt,
  ...imgProps
}: MenuProductImageProps) {
  const resolved = useMemo(
    () => resolveProductImageSrc(productImageUrl ?? undefined, fallbackImageId),
    [productImageUrl, fallbackImageId]
  );

  const imageIdentity = `${productImageUrl ?? ""}\0${fallbackImageId}`;
  const [prevIdentity, setPrevIdentity] = useState(imageIdentity);
  const [loadFailed, setLoadFailed] = useState(false);

  if (imageIdentity !== prevIdentity) {
    setPrevIdentity(imageIdentity);
    setLoadFailed(false);
  }

  const src = loadFailed ? PRODUCT_PLACEHOLDER_SRC : resolved;

  const onError = useCallback(() => {
    setLoadFailed(true);
  }, []);

  return <Image src={src} alt={alt} onError={onError} {...imgProps} />;
}
