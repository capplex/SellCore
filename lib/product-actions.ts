"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMerchant } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validation/products";
import { canCreateProduct, canCreateWithinLimit, getPlanLimits, getMerchantUsage } from "@/lib/usage/service";
import { encryptSecret, sha256 } from "@/lib/crypto";
import { enqueueWebhookEvent } from "@/lib/webhooks/outgoing";

async function assertOwnedStore(storeId:string, merchantId:string){const db=createSupabaseAdminClient(); const {data}=await db.from("stores").select("id").eq("id",storeId).eq("merchant_id",merchantId).maybeSingle(); if(!data) throw new Error("FORBIDDEN"); return db;}
async function getOwnedProduct(productId:string, merchantId:string){const db=createSupabaseAdminClient(); const {data}=await db.from("products").select("*,stores!inner(merchant_id)").eq("id",productId).eq("stores.merchant_id",merchantId).maybeSingle(); if(!data) throw new Error("FORBIDDEN"); return {db,product:data};}
function bool(v:FormDataEntryValue|null){return v==="on"||v==="true"||v==="1";}

export async function createProductAction(formData:FormData){const {merchantId}=await requireMerchant(); const storeId=String(formData.get("storeId")); await assertOwnedStore(storeId,merchantId); const cap=await canCreateProduct(merchantId); if(!cap.allowed) redirect("/dashboard/settings/billing?limit=products"); const parsed=productSchema.parse({storeId,name:formData.get("name"),slug:formData.get("slug"),description:formData.get("description"),shortDescription:formData.get("shortDescription"),type:formData.get("type"),priceMinor:Math.round(Number(formData.get("price")||0)*100),currency:formData.get("currency")||"USD",sku:formData.get("sku")||"",status:formData.get("status")||"draft",trackInventory:bool(formData.get("trackInventory")),inventoryQuantity:formData.get("inventoryQuantity")||undefined,seoTitle:formData.get("seoTitle")||"",seoDescription:formData.get("seoDescription")||"",subscriptionInterval:formData.get("subscriptionInterval")||undefined}); const db=createSupabaseAdminClient(); const {data,error}=await db.from("products").insert({store_id:parsed.storeId,name:parsed.name,slug:parsed.slug,description:parsed.description,short_description:parsed.shortDescription,type:parsed.type,price_minor:parsed.priceMinor,currency:parsed.currency,sku:parsed.sku||null,status:parsed.status,track_inventory:parsed.trackInventory,inventory_quantity:parsed.trackInventory?(parsed.inventoryQuantity??0):null,seo_title:parsed.seoTitle||null,seo_description:parsed.seoDescription||null,subscription_interval:parsed.type==="subscription"?(parsed.subscriptionInterval??"month"):null}).select("id").single(); if(error||!data) throw new Error(error?.message??"CREATE_FAILED"); await db.from("audit_logs").insert({merchant_id:merchantId,store_id:storeId,actor_user_id:(await requireMerchant()).user.id,action:"product.created",resource_type:"product",resource_id:data.id}); await enqueueWebhookEvent(merchantId,"product.created",{product_id:data.id,store_id:storeId}); redirect(`/dashboard/products/${data.id}`);}

export async function updateProductAction(formData:FormData){const {merchantId,user}=await requireMerchant(); const productId=String(formData.get("productId")); const {db,product}=await getOwnedProduct(productId,merchantId); const parsed=productSchema.parse({storeId:product.store_id,name:formData.get("name"),slug:formData.get("slug"),description:formData.get("description"),shortDescription:formData.get("shortDescription"),type:formData.get("type"),priceMinor:Math.round(Number(formData.get("price")||0)*100),currency:formData.get("currency")||"USD",sku:formData.get("sku")||"",status:formData.get("status")||"draft",trackInventory:bool(formData.get("trackInventory")),inventoryQuantity:formData.get("inventoryQuantity")||undefined,seoTitle:formData.get("seoTitle")||"",seoDescription:formData.get("seoDescription")||"",subscriptionInterval:formData.get("subscriptionInterval")||undefined}); const {error}=await db.from("products").update({name:parsed.name,slug:parsed.slug,description:parsed.description,short_description:parsed.shortDescription,type:parsed.type,price_minor:parsed.priceMinor,currency:parsed.currency,sku:parsed.sku||null,status:parsed.status,track_inventory:parsed.trackInventory,inventory_quantity:parsed.trackInventory?(parsed.inventoryQuantity??0):null,seo_title:parsed.seoTitle||null,seo_description:parsed.seoDescription||null,subscription_interval:parsed.type==="subscription"?(parsed.subscriptionInterval??"month"):null}).eq("id",productId); if(error) throw new Error(error.message); await db.from("audit_logs").insert({merchant_id:merchantId,store_id:product.store_id,actor_user_id:user.id,action:"product.updated",resource_type:"product",resource_id:productId}); await enqueueWebhookEvent(merchantId,"product.updated",{product_id:productId,store_id:product.store_id}); revalidatePath(`/dashboard/products/${productId}`); revalidatePath(`/store/${product.stores?.slug??""}`);}

export async function setProductStatusAction(formData:FormData){const {merchantId}=await requireMerchant(); const id=String(formData.get("productId")); const status=String(formData.get("status")); if(!["draft","active","archived"].includes(status)) throw new Error("INVALID_STATUS"); const {db}=await getOwnedProduct(id,merchantId); await db.from("products").update({status}).eq("id",id); revalidatePath("/dashboard/products");}
export async function deleteProductAction(formData:FormData){const {merchantId}=await requireMerchant(); const id=String(formData.get("productId")); const {db,product}=await getOwnedProduct(id,merchantId); const storeId=product.store_id; const {error}=await db.from("products").delete().eq("id",id); if(error) throw new Error("Product cannot be deleted while historical records depend on it. Archive it instead."); await enqueueWebhookEvent(merchantId,"product.deleted",{product_id:id,store_id:storeId}); redirect("/dashboard/products");}
export async function duplicateProductAction(formData:FormData){const {merchantId}=await requireMerchant(); const id=String(formData.get("productId")); const cap=await canCreateProduct(merchantId); if(!cap.allowed) redirect("/dashboard/settings/billing?limit=products"); const {db,product}=await getOwnedProduct(id,merchantId); const {id:_id,created_at:_c,updated_at:_u,stores:_s,...copy}=product; void _id;void _c;void _u;void _s; const base=`${product.slug}-copy`; const {data,error}=await db.from("products").insert({...copy,name:`${product.name} copy`,slug:`${base}-${Date.now().toString(36)}`,status:"draft"}).select("id").single(); if(error||!data) throw new Error(error?.message??"DUPLICATE_FAILED"); redirect(`/dashboard/products/${data.id}`);}

export async function addVariantAction(formData:FormData){const {merchantId}=await requireMerchant(); const productId=String(formData.get("productId")); const {db}=await getOwnedProduct(productId,merchantId); const {count}=await db.from("product_variants").select("id",{count:"exact",head:true}).eq("product_id",productId); const cap=await canCreateWithinLimit(merchantId,"product_variants",count??0); if(!cap.allowed) throw new Error("PLAN_LIMIT:product_variants"); const priceRaw=String(formData.get("price")||""); const {error}=await db.from("product_variants").insert({product_id:productId,name:String(formData.get("name")),sku:String(formData.get("sku")||"")||null,price_minor:priceRaw?Math.round(Number(priceRaw)*100):null,inventory_quantity:formData.get("inventoryQuantity")?Number(formData.get("inventoryQuantity")):null,metadata:{}}); if(error) throw new Error(error.message); revalidatePath(`/dashboard/products/${productId}`);}

export async function uploadProductImageAction(formData:FormData){const {merchantId}=await requireMerchant(); const productId=String(formData.get("productId")); const {db,product}=await getOwnedProduct(productId,merchantId); const file=formData.get("file"); if(!(file instanceof File)||file.size===0) throw new Error("NO_FILE"); if(file.size>8*1024*1024) throw new Error("IMAGE_TOO_LARGE"); if(!file.type.startsWith("image/")) throw new Error("INVALID_IMAGE"); const path=`${product.store_id}/${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`; const {error}=await db.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false}); if(error) throw new Error(error.message); await db.from("product_images").insert({product_id:productId,storage_path:path,alt_text:product.name}); revalidatePath(`/dashboard/products/${productId}`);}

export async function importLicensesAction(formData:FormData){const {merchantId}=await requireMerchant(); const productId=String(formData.get("productId")); const {db,product}=await getOwnedProduct(productId,merchantId); if(product.type!=="license") throw new Error("WRONG_PRODUCT_TYPE"); const variantId=String(formData.get("variantId")||"")||null; let {data:pool}=await db.from("license_pools").select("id").eq("product_id",productId).is("variant_id",variantId).maybeSingle(); if(!pool){const r=await db.from("license_pools").insert({product_id:productId,variant_id:variantId,name:"Default"}).select("id").single();pool=r.data;} if(!pool) throw new Error("POOL_CREATE_FAILED"); const keys=String(formData.get("keys")||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean); if(!keys.length) throw new Error("NO_LICENSES"); const rows=keys.map(key=>({pool_id:pool!.id,key_value:key,key_hash:sha256(key),status:"available"})); const {error}=await db.from("licenses").upsert(rows,{onConflict:"pool_id,key_hash",ignoreDuplicates:true}); if(error) throw new Error(error.message); revalidatePath(`/dashboard/products/${productId}`);}

export async function importAccountsAction(formData:FormData){const {merchantId}=await requireMerchant(); const productId=String(formData.get("productId")); const {db,product}=await getOwnedProduct(productId,merchantId); if(product.type!=="account") throw new Error("WRONG_PRODUCT_TYPE"); const variantId=String(formData.get("variantId")||"")||null; let {data:pool}=await db.from("account_pools").select("id").eq("product_id",productId).is("variant_id",variantId).maybeSingle(); if(!pool){const r=await db.from("account_pools").insert({product_id:productId,variant_id:variantId,name:"Default"}).select("id").single();pool=r.data;} if(!pool) throw new Error("POOL_CREATE_FAILED"); const lines=String(formData.get("accounts")||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean); const rows=lines.map(line=>{let payload:unknown; try{payload=JSON.parse(line);}catch{const [username,...rest]=line.split(":");payload={username,password:rest.join(":")};} const raw=JSON.stringify(payload); return {pool_id:pool!.id,encrypted_payload:encryptSecret(raw),fingerprint:sha256(raw),status:"available"};}); const {error}=await db.from("account_inventory").upsert(rows,{onConflict:"pool_id,fingerprint",ignoreDuplicates:true}); if(error) throw new Error(error.message); revalidatePath(`/dashboard/products/${productId}`);}

export async function uploadDigitalFileAction(formData:FormData){const {merchantId}=await requireMerchant(); const productId=String(formData.get("productId")); const {db,product}=await getOwnedProduct(productId,merchantId); if(product.type!=="digital_file") throw new Error("WRONG_PRODUCT_TYPE"); const file=formData.get("file"); if(!(file instanceof File)||file.size===0) throw new Error("NO_FILE"); const limits=await getPlanLimits(merchantId); const usage=await getMerchantUsage(merchantId); if(usage.storage_mb+Math.ceil(file.size/1024/1024)>limits.storage_mb) throw new Error("PLAN_LIMIT:storage_mb"); const path=`${product.store_id}/${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`; const {error}=await db.storage.from("digital-files").upload(path,file,{contentType:file.type||"application/octet-stream",upsert:false}); if(error) throw new Error(error.message); await db.from("digital_files").insert({product_id:productId,variant_id:String(formData.get("variantId")||"")||null,storage_path:path,original_name:file.name,mime_type:file.type,size_bytes:file.size,max_downloads:formData.get("maxDownloads")?Number(formData.get("maxDownloads")):null}); await db.rpc("increment_usage",{p_merchant:merchantId,p_metric:"storage_mb",p_amount:Math.ceil(file.size/1024/1024)}); revalidatePath(`/dashboard/products/${productId}`);}

export async function configureGeneratedProductAction(formData: FormData) {
  const { merchantId, user } = await requireMerchant();
  const productId = String(formData.get("productId"));
  const { db, product } = await getOwnedProduct(productId, merchantId);
  if (product.type !== "generated") throw new Error("WRONG_PRODUCT_TYPE");
  const endpoint = new URL(String(formData.get("endpointUrl")));
  if (process.env.NODE_ENV === "production" && endpoint.protocol !== "https:") throw new Error("GENERATOR_HTTPS_REQUIRED");
  const secret = String(formData.get("secret") || "").trim();
  const { data: current } = await db.from("generated_products").select("encrypted_secret").eq("product_id", productId).maybeSingle();
  if (!secret && !current?.encrypted_secret) throw new Error("GENERATOR_SECRET_REQUIRED");
  await db.from("generated_products").upsert({
    product_id: productId,
    mode: "webhook",
    endpoint_url: endpoint.toString(),
    encrypted_secret: secret ? encryptSecret(secret) : current?.encrypted_secret,
    config: {},
  }, { onConflict: "product_id" });
  await db.from("audit_logs").insert({ merchant_id: merchantId, store_id: product.store_id, actor_user_id: user.id, action: "product.generator_configured", resource_type: "product", resource_id: productId });
  revalidatePath(`/dashboard/products/${productId}`);
}

export async function configureCustomDeliveryAction(formData: FormData) {
  const { merchantId, user } = await requireMerchant();
  const productId = String(formData.get("productId"));
  const { db, product } = await getOwnedProduct(productId, merchantId);
  if (product.type !== "custom") throw new Error("WRONG_PRODUCT_TYPE");
  await db.from("custom_delivery").upsert({ product_id: productId, instructions: String(formData.get("instructions") || "").trim() || null, config: {} }, { onConflict: "product_id" });
  await db.from("audit_logs").insert({ merchant_id: merchantId, store_id: product.store_id, actor_user_id: user.id, action: "product.custom_delivery_configured", resource_type: "product", resource_id: productId });
  revalidatePath(`/dashboard/products/${productId}`);
}

export async function createCategoryAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const storeId = String(formData.get("storeId"));
  const db = await assertOwnedStore(storeId, merchantId);
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase();
  if (!name || !/^[a-z0-9-]+$/.test(slug)) throw new Error("INVALID_CATEGORY");
  const parentId = String(formData.get("parentId") || "") || null;
  if (parentId) {
    const { data: parent } = await db.from("categories").select("id").eq("id", parentId).eq("store_id", storeId).maybeSingle();
    if (!parent) throw new Error("INVALID_PARENT_CATEGORY");
  }
  const { error } = await db.from("categories").insert({ store_id: storeId, parent_id: parentId, name, slug, description: String(formData.get("description") || "") || null });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/products/categories");
}

export async function assignProductCategoryAction(formData: FormData) {
  const { merchantId } = await requireMerchant();
  const productId = String(formData.get("productId"));
  const categoryId = String(formData.get("categoryId"));
  const { db, product } = await getOwnedProduct(productId, merchantId);
  const { data: category } = await db.from("categories").select("id").eq("id", categoryId).eq("store_id", product.store_id).maybeSingle();
  if (!category) throw new Error("INVALID_CATEGORY");
  await db.from("product_categories").upsert({ product_id: productId, category_id: categoryId }, { onConflict: "product_id,category_id" });
  revalidatePath(`/dashboard/products/${productId}`);
}
