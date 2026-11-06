import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/wallet", "/dashboard", "/messages", "/profile", "/security", "/pay", "/post", "/login", "/forgot", "/reset", "/auth", "/api", "/*?q=", "/*?sort=", "/*?page="] }, sitemap: `${base}/sitemap.xml`, host: base };
}
