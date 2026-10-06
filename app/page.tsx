import type { Metadata } from "next";
import { LandingContent } from "./_components/LandingContent";

export const metadata: Metadata = {
  title: "PMII - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
  description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu PK PMII Ki Ageng Getas Pendawa. Akses pendaftaran kaderisasi, basis data anggota, warta pergerakan, dan tata kelola organisasi digital.",
  keywords: [
    "PMII",
    "Pergerakan Mahasiswa Islam Indonesia",
    "Ki Ageng Getas Pendawa",
    "Kaderisasi",
    "Mapaba",
    "PKD",
    "Aswaja",
    "Mahasiswa",
    "Organisasi Kampus"
  ],
  openGraph: {
    title: "PMII - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
    description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu PK PMII Ki Ageng Getas Pendawa.",
    url: "https://pmii.org",
    siteName: "Portal Resmi PMII",
    images: [
      {
        url: "/image/landing_page.png",
        width: 1200,
        height: 630,
        alt: "Kader PK PMII Ki Ageng Getas Pendawa",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PMII - Portal Resmi & Sistem Informasi Kaderisasi Terpadu",
    description: "Sistem Informasi Manajemen Organisasi & Kaderisasi Terpadu PK PMII Ki Ageng Getas Pendawa.",
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
