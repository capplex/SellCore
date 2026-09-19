export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ProductType = "license" | "digital_file" | "account" | "service" | "subscription" | "generated" | "custom";
export type ProductStatus = "draft" | "active" | "archived";
export type OrderPaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";
export type FulfillmentStatus = "pending" | "processing" | "fulfilled" | "failed" | "manual" | "refunded";

export type PlatformPlan = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_free: boolean;
  is_active: boolean;
  monthly_price_minor: number;
  yearly_price_minor: number;
  currency: string;
  stripe_monthly_price_id: string | null;
  stripe_yearly_price_id: string | null;
  sort_order: number;
};
