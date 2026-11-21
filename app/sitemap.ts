import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/services/articles";
import { getCommissariats } from "@/lib/services/commissariats";
import { getKomisariatSlug } from "@/lib/tenancy";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pmii.or.id";
  const now = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/artikel`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kegiatan`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/anggota`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/twibbon`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  try {
    const articles = await getArticles();
    if (Array.isArray(articles)) {
      for (const article of articles) {
        if (article.slug) {
          routes.push({
            url: `${baseUrl}/artikel/${article.slug}`,
            lastModified: article.createdAt ? new Date(article.createdAt) : now,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        }
      }
    }
  } catch (error) {
    console.error("Gagal menambahkan artikel ke sitemap:", error);
  }

  try {
    const commissariats = await getCommissariats();
    if (Array.isArray(commissariats)) {
      for (const com of commissariats) {
        if (com.level !== "CABANG") {
          const slug = getKomisariatSlug(com);
          if (slug) {
            routes.push({
              url: `${baseUrl}/komisariat/${slug}`,
              lastModified: now,
              changeFrequency: "weekly",
              priority: 0.6,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Gagal menambahkan komisariat ke sitemap:", error);
  }

  return routes;
}
