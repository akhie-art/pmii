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
        "/admin/",
        "/admin",
        "/cabang/",
        "/cabang",
        "/pc/",
        "/pc",
        "/pengurus/",
        "/pengurus",
        "/instruktur/",
        "/instruktur",
        "/superadmin/",
        "/superadmin",
        "/super_admin/",
        "/super_admin",
        "/anggota/",
        "/anggota",
        "/kader/",
        "/kader",
        "/peserta/",
        "/peserta",
        "/api/",
        "/auth/",
        "/onboarding",
        "/lengkapi-data/",
        "/verifikasi-surat/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
