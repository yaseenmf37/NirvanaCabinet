import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/projects", "/planning", "/cutting", "/assembly", "/installation", "/logistics", "/reports", "/employees", "/settings", "/tasks", "/api/"] }],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://new-nirvana.example"}/sitemap.xml`,
  };
}
