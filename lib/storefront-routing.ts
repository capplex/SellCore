import "server-only";
import { headers } from "next/headers";

function hostnameOnly(value: string) {
  return value.toLowerCase().split(":")[0];
}

export async function storefrontBasePath(slug: string) {
  const h = await headers();
  const hostname = hostnameOnly(h.get("x-forwarded-host") || h.get("host") || "");
  const platform = hostnameOnly(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "sellcore.shop");
  const isPlatformHost = hostname === platform || hostname === `www.${platform}` || hostname === `app.${platform}`;
  return isPlatformHost ? `/store/${slug}` : "";
}

export function storefrontUrl(slug: string) {
  const platform = hostnameOnly(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || "sellcore.shop");
  return `https://${slug}.${platform}`;
}
