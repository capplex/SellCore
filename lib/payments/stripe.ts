import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env";

let stripe: Stripe | null = null;
export function getStripe() {
  const key = serverEnv().STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");
  stripe ??= new Stripe(key, { appInfo: { name: "SellCore", version: "0.1.0" } });
  return stripe;
}
