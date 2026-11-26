import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isValidUUID } from "@/lib/utils";
import { BacaArtikelContent } from "./_components/BacaArtikelContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface ArticleMetadataRow {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  image?: string;
  thumbnail?: string;
  author?: string;
  authorName?: string;
  created_at?: string;
  createdAt?: string;
}

async function fetchArticleMetadataBySlug(slug: string): Promise<ArticleMetadataRow | null> {
  try {
    const serverClient = await createSupabaseServerClient();
    if (!serverClient) return null;

    const column = isValidUUID(slug) ? "id" : "slug";
    const { data, error } = await serverClient
      .from("articles")
      .select("id, slug, title, excerpt, image, author, created_at")
      .eq(column, slug)
      .eq("status", "DITAMPILKAN")
      .maybeSingle();

    if (!error && data) {
      return data as ArticleMetadataRow;
    }
  } catch {
    // Graceful fallback when Supabase is not configured in build/preview environments
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticleMetadataBySlug(slug);

  if (!article) {
    return {
      title: "Artikel Tidak Ditemukan | PMII",
      description: "Artikel yang Anda cari tidak dapat ditemukan.",
    };
  }

  const title = `${article.title} | Warta PMII`;
  const description = article.excerpt || "Warta dan opini kader PMII.";
  const image = article.image || article.thumbnail || "/image/landing_page.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: [
        {
          url: image,
          alt: article.title,
        },
      ],
      publishedTime: article.created_at || article.createdAt,
      authors: [article.authorName || article.author || "Sahabat PMII"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function Page() {
  return <BacaArtikelContent />;
}
