import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { VerifiedLetterData } from "@/app/verifikasi-surat/[id]/_components/VerifyLetterClient";

export interface ServerVerifySuratResult {
  status: "valid" | "not_found" | "error" | "unconfigured";
  letter: VerifiedLetterData | null;
  missingRpc?: boolean;
}

function isMissingRpcError(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  return (
    err.code === "PGRST202" ||
    msg.includes("could not find the function") ||
    msg.includes("schema cache")
  );
}

function mapPayloadToLetter(
  payload: Record<string, unknown>,
  fallbackId: string
): VerifiedLetterData {
  return {
    id: String(payload.id || fallbackId),
    nomor: String(payload.nomor || "-"),
    subject: String(payload.subject || "-"),
    senderOrRecipient: String(payload.senderOrRecipient || "-"),
    classification: String(payload.classification || "-"),
    status: String(payload.status || "Terkirim"),
    date: String(payload.date || ""),
    dateIndo: String(payload.dateIndo || payload.date || "-"),
    senderTitle: String(payload.senderTitle || "-"),
    senderLocation: String(payload.senderLocation || "-"),
    commissariat: String(payload.commissariat || "Pengurus Cabang PMII Grobogan"),
    tenantLevel: String(payload.tenantLevel || "KOMISARIAT"),
    createdAt: payload.createdAt ? String(payload.createdAt) : undefined,
  };
}

/**
 * Memverifikasi keaslian surat keluar di sisi server melalui RPC publik `verify_surat_public`.
 * Bila migrasi RPC belum diterapkan ke database remote (PGRST202), otomatis mencoba
 * fallback aman menggunakan sesi terautentikasi server (hanya kolom metadata publik).
 */
export async function verifySuratByIdServer(id: string): Promise<ServerVerifySuratResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { status: "unconfigured", letter: null };
  }

  try {
    const { data, error } = await supabase.rpc("verify_surat_public", {
      p_id: id,
    });

    if (!error) {
      const payload =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (payload && payload.valid === true) {
        return {
          status: "valid",
          letter: mapPayloadToLetter(payload, id),
        };
      }
      return { status: "not_found", letter: null };
    }

    if (!isMissingRpcError(error)) {
      console.warn("[Verify Surat RPC Warning]:", error.message);
      return { status: "error", letter: null };
    }

    // Fallback bila migrasi RPC 20261126000001_add_verify_surat_public_rpc.sql belum di-push
    console.warn(
      "[Verify Surat] RPC public.verify_surat_public belum tersedia di database remote. Jalankan migrasi `npm run db:push` untuk mengaktifkan verifikasi publik bagi tamu tanpa login."
    );

    const serverClient = await createSupabaseServerClient();
    if (!serverClient) {
      return { status: "error", letter: null, missingRpc: true };
    }

    const { data: row, error: selectErr } = await serverClient
      .from("surat")
      .select(
        "id, nomor, type, senderOrRecipient, subject, date, dateIndo, classification, status, senderTitle, senderLocation, created_at, tenant_id"
      )
      .eq("id", id)
      .ilike("type", "KELUAR")
      .maybeSingle();

    if (selectErr) {
      console.warn("[Verify Surat Fallback Notice]:", selectErr.message);
      return { status: "error", letter: null, missingRpc: true };
    }

    if (!row) {
      return { status: "not_found", letter: null, missingRpc: true };
    }

    let tenantName = "Pengurus Cabang PMII Grobogan";
    let tenantLevel = "KOMISARIAT";
    if (row.tenant_id) {
      const { data: tenantRow } = await serverClient
        .from("tenant")
        .select("name, level, type")
        .eq("id", row.tenant_id)
        .maybeSingle();
      if (tenantRow?.name) tenantName = tenantRow.name;
      if (tenantRow?.level || tenantRow?.type) {
        tenantLevel = String(tenantRow.level || tenantRow.type);
      }
    }

    return {
      status: "valid",
      missingRpc: true,
      letter: mapPayloadToLetter(
        {
          id: row.id,
          nomor: row.nomor,
          subject: row.subject,
          senderOrRecipient: row.senderOrRecipient,
          classification: row.classification,
          status: row.status,
          date: row.date,
          dateIndo: row.dateIndo || row.date,
          senderTitle: row.senderTitle || "-",
          senderLocation: row.senderLocation || "-",
          commissariat: tenantName,
          tenantLevel,
          createdAt: row.created_at,
        },
        id
      ),
    };
  } catch (err) {
    console.warn("[Verify Surat Server Notice]:", err);
    return { status: "error", letter: null };
  }
}
