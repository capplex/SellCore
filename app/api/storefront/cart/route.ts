import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCartSnapshot, getOrCreateCart, resolveStore } from "@/lib/cart";
import { selectRequiredVariant } from "@/lib/variant-selection";

const addSchema = z.object({
  storeSlug: z.string().min(1),
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  quantity: z.number().int().min(1).max(100),
});

const cookieName = (storeId: string) => `sc_cart_${storeId.slice(0, 8)}`;

export async function GET(req: NextRequest) {
  try {
    const store = await resolveStore(req.nextUrl.searchParams.get("storeSlug") || "");
    const snap = await getCartSnapshot(store.id, req.cookies.get(cookieName(store.id))?.value);
    return NextResponse.json(snap ?? { cart: null, items: [] });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CART_ERROR" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = addSchema.parse(await req.json());
    const store = await resolveStore(body.storeSlug);
    const db = createSupabaseAdminClient();
    const { data: product } = await db
      .from("products")
      .select("id,status,store_id")
      .eq("id", body.productId)
      .eq("store_id", store.id)
      .eq("status", "active")
      .maybeSingle();
    if (!product) throw new Error("PRODUCT_UNAVAILABLE");

    const { data: variants, error: variantError } = await db
      .from("product_variants")
      .select("id,product_id")
      .eq("product_id", product.id)
      .eq("active", true);
    if (variantError) throw variantError;
    selectRequiredVariant(variants ?? [], product.id, body.variantId);

    const current = req.cookies.get(cookieName(store.id))?.value;
    const { cart, token, created } = await getOrCreateCart(store.id, current);
    let existingQuery = db
      .from("cart_items")
      .select("id,quantity")
      .eq("cart_id", cart.id)
      .eq("product_id", body.productId);
    existingQuery = body.variantId ? existingQuery.eq("variant_id", body.variantId) : existingQuery.is("variant_id", null);
    const { data: existing } = await existingQuery.maybeSingle();
    if (existing) {
      await db.from("cart_items").update({ quantity: Math.min(100, existing.quantity + body.quantity) }).eq("id", existing.id);
    } else {
      await db.from("cart_items").insert({ cart_id: cart.id, product_id: body.productId, variant_id: body.variantId ?? null, quantity: body.quantity });
    }

    const response = NextResponse.json({ ok: true });
    if (created) response.cookies.set(cookieName(store.id), token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CART_ERROR" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = z.object({ storeSlug: z.string(), itemId: z.string().uuid(), quantity: z.number().int().min(1).max(100) }).parse(await req.json());
    const store = await resolveStore(body.storeSlug);
    const snap = await getCartSnapshot(store.id, req.cookies.get(cookieName(store.id))?.value);
    if (!snap) throw new Error("CART_NOT_FOUND");
    const db = createSupabaseAdminClient();
    const { data } = await db.from("cart_items").select("id").eq("id", body.itemId).eq("cart_id", snap.cart.id).maybeSingle();
    if (!data) throw new Error("ITEM_NOT_FOUND");
    await db.from("cart_items").update({ quantity: body.quantity }).eq("id", body.itemId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CART_ERROR" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = z.object({ storeSlug: z.string(), itemId: z.string().uuid() }).parse(await req.json());
    const store = await resolveStore(body.storeSlug);
    const snap = await getCartSnapshot(store.id, req.cookies.get(cookieName(store.id))?.value);
    if (!snap) throw new Error("CART_NOT_FOUND");
    const db = createSupabaseAdminClient();
    await db.from("cart_items").delete().eq("id", body.itemId).eq("cart_id", snap.cart.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CART_ERROR" }, { status: 400 });
  }
}
