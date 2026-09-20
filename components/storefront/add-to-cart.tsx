"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/utils";

type VariantOption = {
  id: string;
  name: string;
  priceMinor: number | null;
  currency: string;
};

export function AddToCart({
  storeSlug,
  productId,
  variants,
  basePath,
}: {
  storeSlug: string;
  productId: string;
  variants: VariantOption[];
  basePath?: string;
}) {
  const [variant, setVariant] = useState(variants[0]?.id || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function add() {
    setPending(true);
    setError("");
    const response = await fetch("/api/storefront/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeSlug, productId, variantId: variant || null, quantity: 1 }),
    });
    const body = await response.json().catch(() => ({}));
    setPending(false);
    if (!response.ok) {
      setError(body.error || "Could not add to cart");
      return;
    }
    void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storeSlug, eventType: "add_to_cart", productId }) });
    router.push(`${basePath ?? `/store/${storeSlug}`}/cart`);
  }

  return <div className="space-y-3">
    {variants.length > 0 && <label className="block text-sm">
      <span className="mb-1 block opacity-60">Variant</span>
      <select value={variant} onChange={(event) => setVariant(event.target.value)} className="border-white/10 bg-black/30">
        {variants.map((option) => <option key={option.id} value={option.id}>
          {option.name}{option.priceMinor === null ? "" : ` — ${formatMoney(option.priceMinor, option.currency)}`}
        </option>)}
      </select>
    </label>}
    <button onClick={add} disabled={pending || (variants.length > 0 && !variant)} className="w-full rounded-[var(--radius)] bg-[var(--accent)] px-5 py-3 font-medium text-white disabled:opacity-50">
      {pending ? "Adding…" : "Add to cart"}
    </button>
    {error && <p className="text-sm text-red-300">{error}</p>}
  </div>;
}
