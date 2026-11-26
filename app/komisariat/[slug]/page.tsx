import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { DEFAULT_COMMISSARIATS } from "@/lib/services/defaults";
import { getKomisariatSlug, normalizeTenantName } from "@/lib/tenancy";
import { KomisariatLandingContent } from "./_components/KomisariatLandingContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface TenantMetaRow {
  id: string;
  name: string;
  university?: string;
  campusName?: string;
  logo?: string;
}

async function fetchCommissariatMetadataBySlug(slug: string): Promise<TenantMetaRow | null> {
  const targetSlug = slug.toLowerCase().trim();
  const matchTenant = (c: TenantMetaRow) => {
    const cSlug = getKomisariatSlug(c);
    return (
      cSlug === targetSlug ||
      c.id === targetSlug ||
      normalizeTenantName(c.name).includes(targetSlug) ||
      targetSlug.includes(normalizeTenantName(c.name))
    );
  };

  try {
    const serverClient = await createSupabaseServerClient();
    if (serverClient) {
      const { data, error } = await serverClient
        .from("tenant")
        .select("id, name, university, logo");
      if (!error && Array.isArray(data)) {
        const found = (data as TenantMetaRow[]).find(matchTenant);
        if (found) return found;
      }
    }
  } catch {
    // Fallback ke default lokal jika offline
  }

  return (DEFAULT_COMMISSARIATS as TenantMetaRow[]).find(matchTenant) || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const matchedComm = await fetchCommissariatMetadataBySlug(slug);

  if (!matchedComm) {
    return {
      title: "Komisariat Tidak Ditemukan | PC PMII Grobogan",
      description: "Halaman profil komisariat tidak dapat ditemukan.",
    };
  }

  const campus = matchedComm.university || matchedComm.campusName || "Perguruan Tinggi";
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
