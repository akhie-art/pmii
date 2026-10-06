import type { Metadata } from "next";
import { SemuaArtikelContent } from "./_components/SemuaArtikelContent";

export const metadata: Metadata = {
  title: "Warta, Opini, & Artikel Kaderisasi | PK PMII Ki Ageng Getas Pendawa",
  description: "Kumpulan artikel opini, warta pergerakan, gagasan kaderisasi, dan khazanah intelektual kader PMII Ki Ageng Getas Pendawa.",
  openGraph: {
    title: "Warta, Opini, & Artikel Kaderisasi | PK PMII Ki Ageng Getas Pendawa",
    description: "Kumpulan artikel opini, warta pergerakan, dan khazanah intelektual kader PMII.",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Warta, Opini, & Artikel Kaderisasi | PK PMII Ki Ageng Getas Pendawa",
    description: "Kumpulan artikel opini, warta pergerakan, dan khazanah intelektual kader PMII.",
  }
};

export default function Page() {
  return <SemuaArtikelContent />;
}
