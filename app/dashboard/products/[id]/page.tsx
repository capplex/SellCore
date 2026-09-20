import { notFound } from "next/navigation";
import { getDashboardContext } from "@/lib/dashboard-context";
import { ProductForm } from "@/components/dashboard/product-form";
import {
  addVariantAction,
  assignProductCategoryAction,
  configureCustomDeliveryAction,
  configureGeneratedProductAction,
  deleteProductAction,
  duplicateProductAction,
  importAccountsAction,
  importLicensesAction,
  uploadDigitalFileAction,
  uploadProductImageAction,
} from "@/lib/product-actions";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  inventory_quantity: number | null;
  active: boolean;
};

function VariantTarget({ variants }: { variants: Variant[] }) {
  return <label className="text-sm">
    <span className="mb-1 block text-sc-secondary">Assign to</span>
    <select name="variantId" defaultValue={variants[0]?.id ?? ""}>
      <option value="">Product-level inventory</option>
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}{variant.sku ? ` · ${variant.sku}` : ""}</option>)}
    </select>
  </label>;
}

function targetName(variants: Variant[], variantId: string | null) {
  return variantId ? variants.find((variant) => variant.id === variantId)?.name ?? "Unknown variant" : "Product-level";
}

export default async function ProductEdit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getDashboardContext();
  const { data: product } = await ctx.db.from("products").select("*").eq("id", id).eq("store_id", ctx.store?.id ?? "").maybeSingle();
  if (!product) notFound();

  const [
    { data: variantRows },
    { data: images },
    { data: files },
    { data: categories },
    { data: assigned },
    { data: generated },
    { data: customDelivery },
    { data: licensePools },
    { data: accountPools },
  ] = await Promise.all([
    ctx.db.from("product_variants").select("*").eq("product_id", id).order("created_at"),
    ctx.db.from("product_images").select("*").eq("product_id", id),
    ctx.db.from("digital_files").select("id,variant_id,original_name,size_bytes").eq("product_id", id).order("created_at"),
    ctx.db.from("categories").select("id,name").eq("store_id", product.store_id).order("name"),
    ctx.db.from("product_categories").select("category_id").eq("product_id", id),
    ctx.db.from("generated_products").select("endpoint_url").eq("product_id", id).maybeSingle(),
    ctx.db.from("custom_delivery").select("instructions").eq("product_id", id).maybeSingle(),
    ctx.db.from("license_pools").select("id,variant_id,name").eq("product_id", id).order("created_at"),
    ctx.db.from("account_pools").select("id,variant_id,name").eq("product_id", id).order("created_at"),
  ]);
  const variants = (variantRows ?? []) as Variant[];

  const licenseStats = product.type === "license" ? await Promise.all((licensePools ?? []).map(async (pool) => {
    const [{ count: total }, { count: available }] = await Promise.all([
      ctx.db.from("licenses").select("id", { count: "exact", head: true }).eq("pool_id", pool.id),
      ctx.db.from("licenses").select("id", { count: "exact", head: true }).eq("pool_id", pool.id).eq("status", "available"),
    ]);
    return { ...pool, total: total ?? 0, available: available ?? 0 };
  })) : [];

  const accountStats = product.type === "account" ? await Promise.all((accountPools ?? []).map(async (pool) => {
    const [{ count: total }, { count: available }] = await Promise.all([
      ctx.db.from("account_inventory").select("id", { count: "exact", head: true }).eq("pool_id", pool.id),
      ctx.db.from("account_inventory").select("id", { count: "exact", head: true }).eq("pool_id", pool.id).eq("status", "available"),
    ]);
    return { ...pool, total: total ?? 0, available: available ?? 0 };
  })) : [];

  return <>
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{product.name}</h1>
        <p className="mt-1 text-sm text-sc-secondary">Edit product, variants, and the fulfillment inventory assigned to each variant.</p>
      </div>
      <div className="flex gap-2">
        <form action={duplicateProductAction}>
          <input type="hidden" name="productId" value={id}/>
          <button className="rounded-lg border border-sc-border px-3 py-2 text-sm">Duplicate</button>
        </form>
        <form action={deleteProductAction}>
          <input type="hidden" name="productId" value={id}/>
          <button className="rounded-lg border border-red-950 bg-red-950/20 px-3 py-2 text-sm text-red-300">Delete</button>
        </form>
      </div>
    </div>

    <ProductForm storeId={product.store_id} product={product}/>

    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Variants</h2>
        <p className="mt-1 text-sm text-sc-secondary">Inventory uploaded below can be assigned to any individual variant.</p>
        <div className="mt-3 space-y-2">
          {variants.map((variant) => <div key={variant.id} className="grid grid-cols-3 rounded-lg border border-sc-border px-3 py-2 text-sm">
            <span>{variant.name}</span>
            <span className="text-sc-secondary">{variant.sku || "No SKU"}</span>
            <span className="text-right text-sc-secondary">{variant.inventory_quantity ?? "∞"}</span>
          </div>)}
          {!variants.length && <p className="text-sm text-sc-muted">No variants yet. Add one before assigning variant-specific inventory.</p>}
        </div>
        <form action={addVariantAction} className="mt-4 grid grid-cols-2 gap-2">
          <input type="hidden" name="productId" value={id}/>
          <input name="name" required placeholder="Variant name"/>
          <input name="sku" placeholder="SKU"/>
          <input name="price" type="number" min="0" step="0.01" placeholder="Override price"/>
          <input name="inventoryQuantity" type="number" min="0" placeholder="Numeric inventory (optional)"/>
          <button className="col-span-2 rounded-lg border border-sc-border px-3 py-2 text-sm">Add variant</button>
        </form>
      </section>

      <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Images</h2>
        <p className="mt-2 text-sm text-sc-secondary">{images?.length ?? 0} image(s)</p>
        <form action={uploadProductImageAction} className="mt-4 flex gap-2">
          <input type="hidden" name="productId" value={id}/>
          <input type="file" name="file" accept="image/*" required/>
          <button className="rounded-lg border border-sc-border px-3 text-sm">Upload</button>
        </form>
      </section>

      {product.type === "license" && <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">License inventory by variant</h2>
        <div className="mt-3 space-y-2">
          {licenseStats.map((pool) => <div key={pool.id} className="flex items-center justify-between rounded-lg border border-sc-border px-3 py-2 text-sm">
            <span>{targetName(variants, pool.variant_id)}</span>
            <span className="text-sc-secondary">{pool.available} available · {pool.total} total</span>
          </div>)}
          {!licenseStats.length && <p className="text-sm text-sc-muted">No license keys stored yet.</p>}
        </div>
        <form action={importLicensesAction} className="mt-4 space-y-2">
          <input type="hidden" name="productId" value={id}/>
          <VariantTarget variants={variants}/>
          <textarea name="keys" rows={6} placeholder="One license key per line" required/>
          <button className="rounded-lg bg-sc-red px-3 py-2 text-sm">Import keys for selected variant</button>
        </form>
      </section>}

      {product.type === "account" && <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Account inventory by variant</h2>
        <div className="mt-3 space-y-2">
          {accountStats.map((pool) => <div key={pool.id} className="flex items-center justify-between rounded-lg border border-sc-border px-3 py-2 text-sm">
            <span>{targetName(variants, pool.variant_id)}</span>
            <span className="text-sc-secondary">{pool.available} available · {pool.total} total</span>
          </div>)}
          {!accountStats.length && <p className="text-sm text-sc-muted">No encrypted accounts stored yet.</p>}
        </div>
        <form action={importAccountsAction} className="mt-4 space-y-2">
          <input type="hidden" name="productId" value={id}/>
          <VariantTarget variants={variants}/>
          <textarea name="accounts" rows={6} placeholder="user@example.com:secret or one JSON object per line" required/>
          <button className="rounded-lg bg-sc-red px-3 py-2 text-sm">Import accounts for selected variant</button>
        </form>
      </section>}

      {product.type === "digital_file" && <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Private files by variant</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(files ?? []).map((file) => <div key={file.id} className="rounded-lg border border-sc-border px-3 py-2">
            <div>{file.original_name} · {Math.ceil(file.size_bytes / 1024)} KB</div>
            <div className="mt-1 text-xs text-sc-muted">{targetName(variants, file.variant_id)}</div>
          </div>)}
          {!files?.length && <p className="text-sc-muted">No private files uploaded yet.</p>}
        </div>
        <form action={uploadDigitalFileAction} className="mt-4 space-y-2">
          <input type="hidden" name="productId" value={id}/>
          <VariantTarget variants={variants}/>
          <input type="file" name="file" required/>
          <input type="number" name="maxDownloads" min="1" placeholder="Max downloads per purchase (optional)"/>
          <button className="rounded-lg bg-sc-red px-3 py-2 text-sm">Upload file for selected variant</button>
        </form>
      </section>}

      {product.type === "generated" && <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Generation endpoint</h2>
        <p className="mt-2 text-sm text-sc-secondary">SellCore signs the order-item request with your shared secret after verified payment. The request includes the selected variant.</p>
        <form action={configureGeneratedProductAction} className="mt-4 space-y-2">
          <input type="hidden" name="productId" value={id}/>
          <input type="url" name="endpointUrl" defaultValue={generated?.endpoint_url ?? ""} required placeholder="https://api.example.com/generate"/>
          <input type="password" name="secret" placeholder={generated ? "Leave blank to keep current secret" : "Signing secret"}/>
          <button className="rounded-lg bg-sc-red px-3 py-2 text-sm">Save generator</button>
        </form>
      </section>}

      {product.type === "custom" && <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Custom fulfillment</h2>
        <form action={configureCustomDeliveryAction} className="mt-4 space-y-2">
          <input type="hidden" name="productId" value={id}/>
          <textarea rows={5} name="instructions" defaultValue={customDelivery?.instructions ?? ""} placeholder="Instructions delivered after payment"/>
          <button className="rounded-lg bg-sc-red px-3 py-2 text-sm">Save instructions</button>
        </form>
      </section>}

      <section className="rounded-xl border border-sc-border bg-sc-card p-5">
        <h2 className="font-semibold">Categories</h2>
        <div className="mt-2 text-xs text-sc-secondary">Assigned: {(assigned ?? []).map((item) => categories?.find((category) => category.id === item.category_id)?.name).filter(Boolean).join(", ") || "None"}</div>
        {categories?.length ? <form action={assignProductCategoryAction} className="mt-4 flex gap-2">
          <input type="hidden" name="productId" value={id}/>
          <select name="categoryId">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <button className="rounded-lg border border-sc-border px-3 py-2 text-sm">Assign</button>
        </form> : <p className="mt-3 text-sm text-sc-secondary">Create a category from Products → Categories.</p>}
      </section>
    </div>
  </>;
}
