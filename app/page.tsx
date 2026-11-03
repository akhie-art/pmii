import type { Metadata } from "next";
import { LandingContent } from "./_components/LandingContent";

export const metadata: Metadata = {
  title: "PC PMII Grobogan - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
  description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu Pengurus Cabang PMII Grobogan. Akses pendaftaran kaderisasi, basis data anggota, warta pergerakan, dan tata kelola organisasi digital seluruh komisariat se-Kabupaten Grobogan.",
  keywords: [
    "PMII",
    "PC PMII Grobogan",
    "PMII Grobogan",
    "Pergerakan Mahasiswa Islam Indonesia",
    "Grobogan",
    "Kaderisasi",
    "Mapaba",
    "PKD",
    "PKL",
    "Aswaja",
    "Mahasiswa",
    "Organisasi Kampus"
  ],
  openGraph: {
    title: "PC PMII Grobogan - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
    description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu Pengurus Cabang PMII Grobogan yang menaungi seluruh komisariat dan rayon di Kabupaten Grobogan.",
    url: "https://pmii.org",
    siteName: "Portal Resmi PC PMII Grobogan",
    images: [
      {
        url: "/image/landing_page.png",
        width: 1200,
        height: 630,
        alt: "Kader PC PMII Grobogan",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PC PMII Grobogan - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
    description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu Pengurus Cabang PMII Grobogan.",
    images: ["/image/landing_page.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <LandingContent />;
}
