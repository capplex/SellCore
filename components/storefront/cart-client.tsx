"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";

type CartItem = {
  id: string;
  quantity: number;
  product_id: string;
  variant_id: string | null;
  products: { name: string; price_minor: number; currency: string; status: string };
  product_variants: { name: string; price_minor: number | null; active: boolean } | null;
};

function itemsFromResponse(body: unknown): CartItem[] {
  if (!body || typeof body !== "object" || !("items" in body) || !Array.isArray(body.items)) return [];
  return body.items as CartItem[];
}

export function CartClient({ storeSlug }: { storeSlug: string }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [coupon, setCoupon] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/storefront/cart?storeSlug=${encodeURIComponent(storeSlug)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((body: unknown) => {
        setItems(itemsFromResponse(body));
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError("Could not load the cart.");
        setLoading(false);
      });
    return () => controller.abort();
  }, [storeSlug]);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch(`/api/storefront/cart?storeSlug=${encodeURIComponent(storeSlug)}`, { cache: "no-store" });
      setItems(itemsFromResponse(await response.json()));
    } finally {
      setLoading(false);
    }
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.product_variants?.price_minor ?? item.products.price_minor) * item.quantity, 0),
    [items],
  );

  async function update(id: string, quantity: number) {
    await fetch("/api/storefront/cart", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeSlug, itemId: id, quantity }),
    });
    await refresh();
  }

  async function remove(id: string) {
    await fetch("/api/storefront/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeSlug, itemId: id }),
    });
    await refresh();
  }

  async function checkout() {
    setError("");
    const response = await fetch("/api/storefront/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storeSlug, email, name, couponCode: coupon || null }),
    });
    const body = await response.json() as { error?: string; url?: string };
    if (!response.ok || !body.url) {
      setError(body.error || "Checkout failed");
      return;
    }
    window.location.assign(body.url);
  }

  if (loading) return <div className="py-10 opacity-60">Loading cart…</div>;
  if (!items.length) return <div className="rounded-[var(--radius)] border border-white/10 p-8 opacity-60">Your cart is empty.</div>;

  const currency = items[0].products.currency;
  return <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
    <div className="space-y-3">
      {items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-white/10 p-4">
        <div>
          <div className="font-medium">{item.products.name}</div>
          {item.product_variants && <div className="text-sm opacity-60">{item.product_variants.name}</div>}
          <div className="mt-2 text-sm">{formatMoney((item.product_variants?.price_minor ?? item.products.price_minor) * item.quantity, item.products.currency)}</div>
        </div>
        <div className="flex items-center gap-2">
          <input aria-label="Quantity" type="number" min={1} max={100} value={item.quantity} onChange={(event) => void update(item.id, Math.max(1, Number(event.target.value)))} className="w-20 border-white/10 bg-black/30"/>
          <button onClick={() => void remove(item.id)} className="text-sm opacity-60">Remove</button>
        </div>
      </div>)}
    </div>
    <aside className="rounded-[var(--radius)] border border-white/10 p-5">
      <h2 className="font-semibold">Checkout</h2>
      <div className="mt-4 space-y-3">
        <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="border-white/10 bg-black/30"/>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name (optional)" className="border-white/10 bg-black/30"/>
        <input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Coupon code" className="border-white/10 bg-black/30"/>
        <div className="flex justify-between border-t border-white/10 pt-4"><span className="opacity-60">Subtotal</span><span className="font-semibold">{formatMoney(total, currency)}</span></div>
        <button onClick={() => void checkout()} disabled={!email} className="w-full rounded-[var(--radius)] bg-[var(--accent)] px-4 py-3 font-medium text-white disabled:opacity-40">Continue to secure checkout</button>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <p className="text-xs leading-5 opacity-45">Final price, coupon validity and inventory are recalculated on the server. Eligible card, Apple Pay, Google Pay, Cash App Pay and stablecoin options are shown by Stripe for the buyer and connected merchant.</p>
      </div>
    </aside>
  </div>;
}
