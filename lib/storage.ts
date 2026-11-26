import {
  supabase,
  isSupabaseConfigured,
  extractStorageInfo,
  getSignedStorageUrl,
} from "./supabase";

export type PrivateDocCategory = "pengajuan-sk" | "drive" | "ktm" | "surat" | "dokumen";

const PRIVATE_DOC_PREFIX = "private-docs/";
/** Batas ukuran unggahan bucket `private-docs` (harus sinkron dengan `storage.buckets.file_size_limit`). */
export const PRIVATE_DOC_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Fallback ke bucket publik `materials` dilarang secara default agar berkas sensitif
 * (surat, SK, KTM) yang ditolak karena ukuran/MIME/RLS tidak pernah bocor ke publik.
 * Hanya diizinkan bila pemanggil secara eksplisit memilih `allowPublicFallback: true`
 * DAN error benar-benar menunjukkan bucket `private-docs` belum tersedia.
 */
export function shouldFallbackToPublicBucket(
  errorMessage?: string | null,
  allowPublicFallback = false
): boolean {
  if (!allowPublicFallback || !errorMessage) return false;
  const msg = errorMessage.toLowerCase();
  return msg.includes("bucket not found") || msg.includes("resource was not found");
}

export function isPrivateStorageRef(urlOrPath: string | null | undefined): boolean {
  if (!urlOrPath || typeof urlOrPath !== "string") return false;
  const trimmed = urlOrPath.trim();
  if (trimmed.startsWith(PRIVATE_DOC_PREFIX)) return true;
  const info = extractStorageInfo(trimmed);
  return info?.bucket === "private-docs";
}

/**
 * Resolves a stored file reference or URL into a browser-viewable URL.
 * - For `private-docs/...` paths or private-docs URLs: generates a time-limited Signed URL.
 * - For legacy public URLs (`http://`, `https://`, `data:`, `blob:`): returns as-is.
 */
export async function resolveStorageUrl(
  rawUrlOrPath: string | null | undefined,
  expiresInSeconds = 3600
): Promise<string> {
  if (!rawUrlOrPath || typeof rawUrlOrPath !== "string") return "";
  const trimmed = rawUrlOrPath.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  if (isPrivateStorageRef(trimmed)) {
    const signed = await getSignedStorageUrl(trimmed, expiresInSeconds, "private-docs");
    if (signed) return signed;
  }

  return trimmed;
}

/**
 * Uploads a sensitive document to the private `private-docs` bucket using tenant-isolated paths:
 * `<tenantId>/<category>/<timestamp>-<safeName>`.
 * Returns a canonical storage reference (`private-docs/<path>`) so viewers always obtain fresh signed URLs.
 * Refuses silent fallback to the public `materials` bucket so private documents never leak publicly.
 */
export async function uploadPrivateDocument(
  file: File,
  options: {
    category: PrivateDocCategory;
    tenantId?: string | null;
    prefix?: string;
    allowPublicFallback?: boolean;
  }
): Promise<{ storageRef: string; signedUrl: string; bucket: string; path: string } | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  if (file.size > PRIVATE_DOC_MAX_BYTES) {
    console.warn(
      `[Storage] File "${file.name}" (${file.size} bytes) melebihi batas bucket private-docs (${PRIVATE_DOC_MAX_BYTES} bytes).`
    );
    return null;
  }

  const cleanExt = (file.name.split(".").pop() || "bin").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const safeBase = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 40) || "doc";
  const tenantSegment =
    options.tenantId && /^[0-9a-fA-F-]{36}$/.test(options.tenantId)
      ? options.tenantId
      : "general";
  const extraPrefix = options.prefix ? `${options.prefix.replace(/[^a-zA-Z0-9_-]/g, "_")}-` : "";
  const objectPath = `${tenantSegment}/${options.category}/${extraPrefix}${Date.now()}-${safeBase}.${cleanExt}`;

  const { error: privateErr } = await supabase.storage
    .from("private-docs")
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (!privateErr) {
    const storageRef = `${PRIVATE_DOC_PREFIX}${objectPath}`;
    const signedUrl = (await getSignedStorageUrl(storageRef, 3600, "private-docs")) || "";
    return {
      storageRef,
      signedUrl,
      bucket: "private-docs",
      path: objectPath,
    };
  }

  if (!shouldFallbackToPublicBucket(privateErr.message, options.allowPublicFallback)) {
    console.error(`[Storage] Private upload to private-docs failed (${privateErr.message})`);
    return null;
  }

  console.warn(`[Storage] Fallback upload to materials (${privateErr.message})`);
  const fallbackPath = `${options.category}/${extraPrefix}${Date.now()}-${safeBase}.${cleanExt}`;
  const { error: fallbackErr } = await supabase.storage
    .from("materials")
    .upload(fallbackPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (fallbackErr) {
    console.error("[Storage] Upload failed:", fallbackErr.message);
    return null;
  }

  const { data } = supabase.storage.from("materials").getPublicUrl(fallbackPath);
  return {
    storageRef: data.publicUrl,
    signedUrl: data.publicUrl,
    bucket: "materials",
    path: fallbackPath,
  };
}
