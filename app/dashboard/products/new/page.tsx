import { getDashboardContext } from "@/lib/dashboard-context";
import { ProductForm } from "@/components/dashboard/product-form";
import { EmptyState } from "@/components/ui/empty-state";
export default async function NewProduct(){const ctx=await getDashboardContext(); if(!ctx.store)return <EmptyState title="No store"/>; return <><h1 className="mb-6 text-2xl font-semibold">New product</h1><ProductForm storeId={ctx.store.id}/></>}
