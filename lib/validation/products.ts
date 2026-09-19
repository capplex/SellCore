import { z } from "zod";

export const productSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
  description: z.string().max(20000).optional().default(""),
  shortDescription: z.string().max(300).optional().default(""),
  type: z.enum(["license","digital_file","account","service","subscription","generated","custom"]),
  priceMinor: z.coerce.number().int().min(0).max(100_000_000),
  currency: z.string().length(3).transform((x) => x.toUpperCase()),
  sku: z.string().trim().max(100).optional().or(z.literal("")),
  status: z.enum(["draft","active","archived"]).default("draft"),
  trackInventory: z.coerce.boolean().default(false),
  inventoryQuantity: z.coerce.number().int().min(0).optional(),
  seoTitle: z.string().max(120).optional().default(""),
  seoDescription: z.string().max(300).optional().default(""),
  subscriptionInterval: z.enum(["week","month","year"]).optional(),
});
