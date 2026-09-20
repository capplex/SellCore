import { describe, expect, it } from "vitest";
import { selectRequiredVariant } from "../lib/variant-selection";

const variants = [
  { id: "variant-a", product_id: "product-a", name: "Basic" },
  { id: "variant-b", product_id: "product-a", name: "Pro" },
];

describe("selectRequiredVariant", () => {
  it("requires a variant when the product has variants", () => {
    expect(() => selectRequiredVariant(variants, "product-a", null)).toThrow("VARIANT_REQUIRED");
  });

  it("rejects a variant belonging to another product", () => {
    expect(() => selectRequiredVariant(variants, "product-b", "variant-a")).toThrow("VARIANT_UNAVAILABLE");
  });

  it("returns the selected variant and permits variantless products", () => {
    expect(selectRequiredVariant(variants, "product-a", "variant-b")?.name).toBe("Pro");
    expect(selectRequiredVariant(variants, "product-b", null)).toBeNull();
  });
});
