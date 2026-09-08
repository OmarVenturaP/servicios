import { siteConfig } from "@/config/site";

export default function robots() {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/u/", "/api/"],
    }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
