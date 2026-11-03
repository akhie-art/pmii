import type { Metadata } from "next";
import { db } from "@/lib/db";
import { DEFAULT_COMMISSARIATS } from "@/lib/services/defaults";
import { getKomisariatSlug, normalizeTenantName } from "@/lib/tenancy";
import { KomisariatLandingContent } from "./_components/KomisariatLandingContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const targetSlug = slug.toLowerCase().trim();

  let matchedComm = DEFAULT_COMMISSARIATS.find((c) => {
    const cSlug = getKomisariatSlug(c);
    return (
      cSlug === targetSlug ||
      c.id === targetSlug ||
      normalizeTenantName(c.name).includes(targetSlug) ||
      targetSlug.includes(normalizeTenantName(c.name))
    );
  });

  try {
    const remoteComms = await db.getCommissariats(DEFAULT_COMMISSARIATS);
    const found = remoteComms.find((c) => {
      const cSlug = getKomisariatSlug(c);
      return (
        cSlug === targetSlug ||
        c.id === targetSlug ||
        normalizeTenantName(c.name).includes(targetSlug) ||
        targetSlug.includes(normalizeTenantName(c.name))
      );
    });
    if (found) matchedComm = found;
  } catch {}

  if (!matchedComm) {
    return {
      title: "Komisariat Tidak Ditemukan | PC PMII Grobogan",
      description: "Halaman profil komisariat tidak dapat ditemukan.",
    };
  }

  const campus = matchedComm.university || (matchedComm as any).campusName || "Perguruan Tinggi";
  const title = `${matchedComm.name} - ${campus} | PC PMII Grobogan`;
  const description = `Portal Resmi, Profil Kepengurusan, dan Pendaftaran Kaderisasi MAPABA ${matchedComm.name} (${campus}) - Pengurus Cabang PMII Grobogan.`;
  const image = matchedComm.logo || "/image/landing_page.png";

  return {
    title,
    description,
    keywords: [
      matchedComm.name,
      campus,
      "PMII",
      "PC PMII Grobogan",
      "Mapaba",
      "Kaderisasi",
      "Mahasiswa",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: image,
          alt: matchedComm.name,
        },
      ],
      siteName: "Portal Resmi PC PMII Grobogan",
      locale: "id_ID",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function KomisariatPage({ params }: PageProps) {
  const { slug } = await params;
  return <KomisariatLandingContent slug={slug} />;
}

