import type { MetadataRoute } from "next";
import { marketingFeatures } from "@/lib/marketing-features";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sellcore.shop").replace(/\/$/, "");
  const routes = ["", "/features", "/pricing", "/docs", "/legal", "/terms", "/privacy", "/refunds", "/acceptable-use", "/disclaimer"];
  return [
    ...routes.map((route) => ({ url: `${base}${route}`, changeFrequency: route === "" ? "weekly" as const : "monthly" as const, priority: route === "" ? 1 : route === "/features" ? 0.9 : 0.7 })),
    ...marketingFeatures.map((feature) => ({ url: `${base}/features/${feature.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
