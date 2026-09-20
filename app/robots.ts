import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sellcore.shop").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/dashboard/", "/account/", "/api/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
