import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pmii.or.id";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard/",
        "/dashboard",
        "/api/",
        "/auth/",
        "/onboarding",
        "/lengkapi-data/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
