import type { Article, UserAccount } from "@/lib/db";

export const PRESET_CATEGORIES = [
  "Kaderisasi",
  "Opini & Pergerakan",
  "Tata Kelola",
  "Warta Gerakan",
  "Wawasan Islam"
];

export interface ArticleFormData {
  title: string;
  slug: string;
  category: string;
  customCategory: string;
  content: string;
  authorName: string;
  authorRole: string;
  image: string;
  tagsInput: string;
  status: "DITAMPILKAN" | "DRAFT" | "ARSIP";
}

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
};

export const stripHtml = (html: string) => {
  return html.replace(/<[^>]*>?/gm, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
};

export const getAuthorDetails = (user: UserAccount | null) => {
  const name = user?.name || "Pengurus PMII";
  let role = (user as unknown as { jabatan?: string })?.jabatan;
  if (!role) {
    const r = (user?.role || "").toLowerCase();
    if (r === "admin") {
      role = "Administrator Komisariat";
    } else if (r === "pengurus") {
      role = "Pengurus Komisariat";
    } else {
      role = "Pengurus PMII";
    }
  }
  return { name, role };
};
