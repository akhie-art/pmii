import { createClient } from "@supabase/supabase-js";

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseUrl = rawUrl.trim().replace(/\/+$/, "");
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();

export const isSupabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== "https://your-supabase-url.supabase.co" &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== "your-supabase-anon-key";

if (!isSupabaseConfigured) {
  console.warn(
    "⚠️ Supabase is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your env files. Falling back to LocalStorage."
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Ekstrak bucket dan path file dari URL publik atau relative path Supabase Storage
 */
export function extractStorageInfo(rawUrl: string): { bucket: string; path: string } | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  // Clean query strings / hashes
  const cleanUrl = rawUrl.split("?")[0].split("#")[0].trim();

  // Pattern 1: /storage/v1/object/public/:bucket/:path
  // or /storage/v1/object/sign/:bucket/:path
  const match = cleanUrl.match(/\/storage\/v1\/object\/(?:public|sign|authenticated)?\/?([^/]+)\/(.+)$/);
  if (match) {
    return {
      bucket: match[1],
      path: decodeURIComponent(match[2])
    };
  }

  // Pattern 2: :bucket/:path where bucket is known
  const knownBuckets = ["materials", "articles", "documents", "avatars"];
  for (const b of knownBuckets) {
    if (cleanUrl.startsWith(`${b}/`)) {
      return {
        bucket: b,
        path: decodeURIComponent(cleanUrl.slice(b.length + 1))
      };
    }
  }

  // Pattern 3: Relative paths that belong to bucket materials
  if (
    cleanUrl.startsWith("drive/") ||
    cleanUrl.startsWith("ktp/") ||
    cleanUrl.startsWith("ktm/") ||
    cleanUrl.startsWith("rktl/") ||
    cleanUrl.startsWith("avatars/") ||
    cleanUrl.startsWith("kaderisasi/") ||
    cleanUrl.startsWith("agenda-modul/") ||
    cleanUrl.startsWith("req-files/") ||
    cleanUrl.startsWith("registrations/")
  ) {
    return {
      bucket: "materials",
      path: decodeURIComponent(cleanUrl)
    };
  }

  return null;
}

/**
 * Hapus file dari Supabase Storage secara aman
 */
export async function deleteStorageFile(rawUrl: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase || !rawUrl) return false;
  const info = extractStorageInfo(rawUrl);
  if (!info) return false;

  try {
    const { error } = await supabase.storage.from(info.bucket).remove([info.path]);
    if (error) {
      console.warn(`Failed to delete storage file (${info.bucket}/${info.path}):`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Error deleting storage file (${info.bucket}/${info.path}):`, err);
    return false;
  }
}

