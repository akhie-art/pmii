import type { Metadata } from "next";
import { TwibbonPublicContent } from "./_components/TwibbonPublicContent";

export const metadata: Metadata = {
  title: "Twibbon Resmi Kegiatan | PC PMII Grobogan",
  description: "Pasang twibbon kampanye resmi kegiatan kaderisasi PMII. Generator twibbon interaktif, gratis, tanpa iklan, dan beresolusi tinggi.",
  openGraph: {
    title: "Twibbon Resmi Kegiatan | PC PMII Grobogan",
    description: "Pasang twibbon kampanye resmi kegiatan kaderisasi PMII secara gratis dan berkualitas tinggi.",
    type: "website",
    locale: "id_ID",
  }
};

export default function TwibbonPage() {
  return <TwibbonPublicContent />;
}
