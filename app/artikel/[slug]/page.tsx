import type { Metadata } from "next";
import { db, DEFAULT_ARTICLES } from "@/lib/db";
import { BacaArtikelContent } from "./_components/BacaArtikelContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let article = DEFAULT_ARTICLES.find(
    (a) => a.slug === slug || a.id === slug
  );

  try {
    const remoteArticles = await db.getArticles();
    const found = remoteArticles.find(
      (a) => a.slug === slug || a.id === slug
    );
    if (found) article = found;
  } catch {}

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
      publishedTime: article.createdAt,
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
