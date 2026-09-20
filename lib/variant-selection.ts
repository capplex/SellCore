export type VariantReference = {
  id: string;
  product_id: string;
};

export function selectRequiredVariant<T extends VariantReference>(variants: T[], productId: string, variantId?: string | null) {
  const productVariants = variants.filter((variant) => variant.product_id === productId);
  if (!variantId) {
    if (productVariants.length) throw new Error("VARIANT_REQUIRED");
    return null;
  }
  const variant = productVariants.find((candidate) => candidate.id === variantId);
  if (!variant) throw new Error("VARIANT_UNAVAILABLE");
  return variant;
}
