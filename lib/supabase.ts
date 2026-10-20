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

/**
 * Membersihkan token sesi Supabase yang usang/invalid dari LocalStorage
 */
export function clearSupabaseStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("sb-") && (key.endsWith("-auth-token") || key.includes("-auth-token")))
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
 * Sign out aman yang membersihkan state Supabase dan LocalStorage tanpa melempar error
 */
export async function safeSignOut(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("PMII_LOGGED_IN_USER");
    localStorage.removeItem("PMII_ACTIVE_COMMISSARIAT");
    localStorage.removeItem("PMII_ACTIVE_CADRE_ID");
    sessionStorage.removeItem("PMII_AUTH_REDIRECT");
  } catch {}

  if (supabase) {
    try {
      // Gunakan scope local agar tidak melempar error network jika token sudah invalid di backend
      await supabase.auth.signOut({ scope: "local" });
    } catch {}
  }

  clearSupabaseStorage();
}

// Intersep console.error agar popup Turbopack overlay tidak terpicu saat mendeteksi Invalid Refresh Token
if (typeof window !== "undefined") {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const first = args[0];
    const msg =
      first instanceof Error
        ? first.message
        : typeof first === "string"
        ? first
        : typeof first?.message === "string"
        ? first.message
        : "";

    if (
      msg.includes("Invalid Refresh Token") ||
      msg.includes("Refresh Token Not Found") ||
      msg.includes("invalid_grant")
    ) {
      console.warn("[Supabase Auth] Sesi usang terdeteksi dan dibersihkan:", msg);
      clearSupabaseStorage();
      return;
    }

    originalConsoleError.apply(console, args);
  };
}

const customFetch: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);

  if (response.status === 400 || response.status === 401) {
    const urlStr =
      typeof input === "string"
        ? input
        : input instanceof Request
        ? input.url
        : "";

    try {
      const clone = response.clone();
      const data = await clone.json().catch(() => null);
      const errMsg = `${data?.msg || ""} ${data?.message || ""} ${data?.error_description || ""} ${data?.error || ""}`.toLowerCase();
      if (
        response.status === 401 ||
        errMsg.includes("refresh token") ||
        errMsg.includes("invalid_grant") ||
        errMsg.includes("jwt") ||
        errMsg.includes("token")
      ) {
        clearSupabaseStorage();
      }
    } catch {}
  }

  return response;
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: typeof window !== "undefined" ? customFetch : undefined,
      },
    })
  : null;

if (typeof window !== "undefined" && supabase) {
  // Jika user tidak sedang logged in di aplikasi, hapus token Supabase tertinggal
  try {
    const loggedIn = localStorage.getItem("PMII_LOGGED_IN_USER");
    if (!loggedIn) {
      clearSupabaseStorage();
    }
  } catch {}

  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      clearSupabaseStorage();
    }
  });
}

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
  const knownBuckets = ["materials", "articles", "documents", "avatars", "komisariat"];
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

