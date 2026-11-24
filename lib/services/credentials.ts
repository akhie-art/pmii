import { supabase, isSupabaseConfigured } from "../supabase";
import { isValidUUID } from "../utils";
import { UserAccount } from "./types";

/**
 * Menghasilkan kata sandi acak sementara yang kuat ketika admin membuat akun tanpa mengisi sandi eksplisit.
 */
function generateSecureTempPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    return Array.from(arr, (n) => chars[n % chars.length]).join("");
  }
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/**
 * Legacy password localStorage store dihapus demi keamanan (anti pencurian kredensial plaintext via XSS).
 * Fungsi berikut dipertahankan sebagai no-op aman demi kompatibilitas tanda tangan API.
 */
export function getUserCredentials(): Record<string, string> {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("PMII_USER_CREDENTIALS");
    } catch {}
  }
  return {};
}

export function setUserPassword(_identifiers: (string | undefined | null)[], _password: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("PMII_USER_CREDENTIALS");
    } catch {}
  }
}

export function getUserPassword(_userOrCadre?: unknown): string | undefined {
  return undefined;
}

export function migrateUserEmail(_oldEmail: string | undefined, _newEmail: string | undefined): void {
  // Tidak menyimpan password di localStorage
}

export function recordDeletedUser(identifier: { id?: string; email?: string; user_id?: string } | string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("PMII_DELETED_USER_IDS");
    const list: string[] = raw ? JSON.parse(raw) : [];
    const set = new Set(list.map((s) => s.toLowerCase()));
    if (typeof identifier === "string") {
      if (identifier.trim()) set.add(identifier.trim().toLowerCase());
    } else {
      if (identifier.id) set.add(identifier.id.trim().toLowerCase());
      if (identifier.user_id) set.add(identifier.user_id.trim().toLowerCase());
      if (identifier.email) set.add(identifier.email.trim().toLowerCase());
    }
    localStorage.setItem("PMII_DELETED_USER_IDS", JSON.stringify(Array.from(set)));
  } catch {}
}

export function unrecordDeletedUser(identifier: { id?: string; email?: string } | string) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("PMII_DELETED_USER_IDS");
    if (!raw) return;
    const list: string[] = JSON.parse(raw);
    const toRemove = new Set<string>();
    if (typeof identifier === "string") {
      toRemove.add(identifier.trim().toLowerCase());
    } else {
      if (identifier.id) toRemove.add(identifier.id.trim().toLowerCase());
      if (identifier.email) toRemove.add(identifier.email.trim().toLowerCase());
    }
    const updated = list.filter((item) => !toRemove.has(item.toLowerCase()));
    localStorage.setItem("PMII_DELETED_USER_IDS", JSON.stringify(updated));
  } catch {}
}

export function isUserDeleted(id?: string, email?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem("PMII_DELETED_USER_IDS");
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    const set = new Set(list.map((s) => s.toLowerCase()));
    if (id && set.has(id.toLowerCase())) return true;
    if (email && set.has(email.toLowerCase())) return true;
  } catch {}
  return false;
}

export async function deleteUserFromAuth(
  identifier: { id?: string; email?: string; user_id?: string } | string
): Promise<boolean> {
  const targetEmail =
    typeof identifier === "string"
      ? identifier.includes("@")
        ? identifier.trim().toLowerCase()
        : undefined
      : identifier.email?.trim().toLowerCase();

  const targetId =
    typeof identifier === "string"
      ? !identifier.includes("@") && isValidUUID(identifier)
        ? identifier
        : undefined
      : identifier.user_id && isValidUUID(identifier.user_id)
      ? identifier.user_id
      : isValidUUID(identifier.id)
      ? identifier.id
      : undefined;

  recordDeletedUser(identifier);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("delete_user_from_auth", {
        p_user_id: targetId || null,
        p_email: targetEmail || null,
      });
      if (error) {
        console.warn("Notice delete_user_from_auth:", error.message);
        return false;
      }
      return Boolean(data);
    } catch (e) {
      console.warn("Error calling delete_user_from_auth:", e);
      return false;
    }
  }
  return true;
}

export async function deleteUsersFromAuth(
  users: ({ id?: string; email?: string; user_id?: string } | string)[]
): Promise<number> {
  const userIds: string[] = [];
  const emails: string[] = [];

  for (const u of users) {
    recordDeletedUser(u);
    if (typeof u === "string") {
      if (u.includes("@")) emails.push(u.trim().toLowerCase());
      else if (isValidUUID(u)) userIds.push(u);
    } else {
      if (u.email && u.email.includes("@")) emails.push(u.email.trim().toLowerCase());
      if (u.user_id && isValidUUID(u.user_id)) userIds.push(u.user_id);
      else if (u.id && isValidUUID(u.id)) userIds.push(u.id);
    }
  }

  if (isSupabaseConfigured && supabase && (userIds.length > 0 || emails.length > 0)) {
    try {
      const { data, error } = await supabase.rpc("delete_users_from_auth", {
        p_user_ids: userIds,
        p_emails: emails,
      });
      if (error) {
        console.warn("Notice delete_users_from_auth:", error.message);
        return 0;
      }
      return typeof data === "number" ? data : 0;
    } catch (e) {
      console.warn("Error calling delete_users_from_auth:", e);
    }
  }
  return 0;
}

export async function createAuthUser(user: {
  email: string;
  password?: string;
  name?: string;
  role?: string;
  commissariat?: string;
  komisariat_id?: string;
  status?: string;
  allowedMenus?: string[];
}): Promise<UserAccount | null> {
  const cleanEmail = user.email.trim().toLowerCase();
  const pwd = user.password && user.password.trim().length >= 6 ? user.password.trim() : generateSecureTempPassword();
  unrecordDeletedUser(cleanEmail);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.rpc("create_auth_user", {
      p_email: cleanEmail,
      p_password: pwd,
      p_name: user.name?.trim() || "",
      p_role: user.role || "pengurus",
      p_commissariat: user.commissariat || "",
      p_status: user.status || "AKTIF",
      p_allowed_menus: user.allowedMenus || [],
      p_komisariat_id: user.komisariat_id || null,
    });

    if (error) {
      console.warn("Notice create_auth_user:", error.message);
      throw new Error(error.message);
    }

    if (data) {
      return {
        id: data.id || data.user_id,
        user_id: data.user_id || data.id,
        name: data.name || user.name || "",
        email: cleanEmail,
        role: data.role || user.role || "pengurus",
        commissariat: data.commissariat || user.commissariat || "",
        komisariat_id: data.komisariat_id || data.tenant_id || user.komisariat_id,
        tenant_id: data.tenant_id || data.komisariat_id || user.komisariat_id,
        status: data.status || user.status || "AKTIF",
        createdAt: data.created_at || new Date().toISOString(),
        allowedMenus: data.allowed_menus || user.allowedMenus || [],
      };
    }
  }

  return null;
}

export async function updateAuthUser(user: Partial<UserAccount> & { id: string }): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.rpc("update_auth_user", {
        p_user_id: user.user_id || user.id,
        p_email: user.email ? user.email.toLowerCase().trim() : null,
        p_name: user.name || null,
        p_role: user.role || null,
        p_commissariat: user.commissariat || null,
        p_status: user.status || null,
        p_allowed_menus: user.allowedMenus ?? null,
        p_password: user.password && user.password.trim() ? user.password.trim() : null,
        p_komisariat_id: user.komisariat_id || user.tenant_id || null,
      });

      if (error) {
        console.warn("Notice updating auth user:", error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn("Exception in update_auth_user RPC:", e);
      return false;
    }
  }
  return true;
}

/**
 * Mengambil profil otoritatif pengguna yang sedang login dari database via RPC get_my_profile().
 */
export async function getMyProfile(): Promise<(UserAccount & { anggota_id?: string | null }) | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.rpc("get_my_profile");
    if (error || !data) return null;
    return data as UserAccount & { anggota_id?: string | null };
  } catch {
    return null;
  }
}
