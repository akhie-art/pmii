import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isValidUUID } from "@/lib/utils";
import { verifySuratByIdServer } from "@/lib/verify-surat-server";
import { VerifyLetterClient } from "./_components/VerifyLetterClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verifikasi Keaslian Surat Resmi | PMII",
  description: "Pemeriksaan validitas dan keaslian surat keluar resmi PMII melalui pemindaian QR Code.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function VerifikasiSuratPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cleanId = decodeURIComponent(String(id || "")).trim();

  if (!isValidUUID(cleanId)) {
    return (
      <VerifyLetterClient
        letterId={cleanId}
        initialStatus="invalid_format"
        initialLetter={null}
        supabaseReady={isSupabaseConfigured}
      />
    );
  }

  const result = await verifySuratByIdServer(cleanId);

  return (
    <VerifyLetterClient
      letterId={cleanId}
      initialStatus={result.status}
      initialLetter={result.letter}
      supabaseReady={isSupabaseConfigured}
    />
  );
}
