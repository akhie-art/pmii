import { createBrowserClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    "Supabase belum dikonfigurasi. Atur NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di .env.local."
  );
}

/**
 * Membersihkan token sesi Supabase yang usang/invalid dari LocalStorage & Cookies
 * serta menghapus sisa penyimpanan kredensial plaintext lama (PMII_USER_CREDENTIALS).
 */
export function clearSupabaseStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        ((key.startsWith("sb-") && key.includes("-auth-token")) ||
          key === "PMII_USER_CREDENTIALS")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn("Notice clearing Supabase storage:", err);
  }
}

/**
 * Sign out aman yang membersihkan sesi Supabase (cookies + storage) dan state lokal.
 */
export async function safeSignOut(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("PMII_LOGGED_IN_USER");
    localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
    localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
    localStorage.removeItem("PMII_ACTIVE_ANGGOTA_ID");
    localStorage.removeItem("PMII_USER_CREDENTIALS");
    sessionStorage.removeItem("PMII_AUTH_REDIRECT");
  } catch {}

  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {}
  }

  clearSupabaseStorage();
}

// Gunakan createBrowserClient (@supabase/ssr) di browser agar sesi tersinkron ke cookies untuk proxy.ts & SSR.
// Di lingkungan server (seperti Route Handler legacy yang memanggil facade), gunakan createClient standar tanpa persistensi.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? typeof window !== "undefined"
    ? createBrowserClient(supabaseUrl, supabaseAnonKey)
    : createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      })
  : null;

if (typeof window !== "undefined") {
  // Hapus permanen sisa PMII_USER_CREDENTIALS (plaintext password legacy) dari browser pengguna
  try {
    localStorage.removeItem("PMII_USER_CREDENTIALS");
  } catch {}

  if (supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearSupabaseStorage();
      }
    });
  }
}

/**
 * Ekstrak bucket dan path file dari URL publik/signed atau relative path Supabase Storage.
 */
export function extractStorageInfo(rawUrl: string): { bucket: string; path: string } | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const cleanUrl = rawUrl.split("?")[0].split("#")[0].trim();

  const patterns = [
    /\/storage\/v1\/object\/(?:public|authenticated|sign)\/([^/]+)\/(.+)$/,
    /\/storage\/v1\/render\/image\/(?:public|authenticated|sign)\/([^/]+)\/(.+)$/,
  ];

  for (const regex of patterns) {
    const match = cleanUrl.match(regex);
    if (match && match[1] && match[2]) {
      return {
        bucket: decodeURIComponent(match[1]),
        path: decodeURIComponent(match[2]),
      };
    }
  }

  const knownBuckets = ["materials", "komisariat", "pas-foto", "galeri", "private-docs"];
  for (const bucket of knownBuckets) {
    if (cleanUrl.startsWith(`${bucket}/`)) {
      return {
        bucket,
        path: decodeURIComponent(cleanUrl.slice(bucket.length + 1)),
      };
    }
  }

  if (
    cleanUrl.startsWith("drive/") ||
    cleanUrl.startsWith("ktp/") ||
    cleanUrl.startsWith("ktm/") ||
    cleanUrl.startsWith("rktl/") ||
    cleanUrl.startsWith("pengajuan-sk/") ||
    cleanUrl.startsWith("avatars/") ||
    cleanUrl.startsWith("kaderisasi/") ||
    cleanUrl.startsWith("agenda-modul/") ||
    cleanUrl.startsWith("req-files/") ||
    cleanUrl.startsWith("registrations/") ||
    cleanUrl.startsWith("cert-templates/")
  ) {
    return {
      bucket: "materials",
      path: decodeURIComponent(cleanUrl),
    };
  }

  return null;
}

/**
 * Membuat Signed URL berbatas waktu untuk dokumen di bucket privat (`private-docs`).
 */
export async function getSignedStorageUrl(
  rawUrlOrPath: string,
  expiresInSeconds = 3600,
  defaultBucket = "private-docs"
): Promise<string | null> {
  if (!isSupabaseConfigured || !supabase || !rawUrlOrPath) return null;
  const info = extractStorageInfo(rawUrlOrPath) || { bucket: defaultBucket, path: rawUrlOrPath };

  try {
    const { data, error } = await supabase.storage
      .from(info.bucket)
      .createSignedUrl(info.path, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

/**
 * Hapus file dari Supabase Storage secara aman.
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
