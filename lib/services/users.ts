import { UserAccount, UserRole } from "./types";
import { KEYS, DEFAULT_USERS } from "./defaults";
import { supabase, isSupabaseConfigured } from "../supabase";
import { normalizeKomisariat } from "./core";
import type { PaginatedResult } from "./anggota";

export interface UsersQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  tenantId?: string | null;
}

export async function getUsers(defaultData: UserAccount[] = DEFAULT_USERS): Promise<UserAccount[]> {
  let authUsers: UserAccount[] = [];
  let supabaseSuccess = false;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("get_auth_users");
      if (!error && Array.isArray(data)) {
        supabaseSuccess = true;
        authUsers = data.map((u: Record<string, unknown>) => ({
          ...(u as Partial<UserAccount>),
          id: String(u.id || u.user_id || ""),
          user_id: String(u.id || u.user_id || ""),
          name: String(u.name || ""),
          email: String(u.email || ""),
          role: ((u.role as UserRole) || "anggota"),
          role_id: u.role_id as string | undefined,
          role_name: u.role_name as string | undefined,
          tenant_id: (u.tenant_id || u.komisariat_id) as string | null | undefined,
          komisariat_id: (u.komisariat_id || u.tenant_id) as string | null | undefined,
          commissariat: u.commissariat ? normalizeKomisariat(String(u.commissariat)) : "",
          needsOnboarding:
            typeof u.needsOnboarding === "boolean"
              ? u.needsOnboarding
              : !u.commissariat && String(u.role) !== "superadmin",
          status: (u.status === "NONAKTIF" ? "NONAKTIF" : "AKTIF") as "AKTIF" | "NONAKTIF",
          createdAt: String(u.createdAt || u.created_at || new Date().toISOString()),
          allowedMenus: Array.isArray(u.allowedMenus) ? (u.allowedMenus as string[]) : [],
          avatar: u.avatar ? String(u.avatar) : undefined,
        }));
      } else if (error) {
        console.warn("Failed to get auth users via RPC:", error.message);
      }
    } catch (err) {
      console.warn("Exception fetching auth users:", err);
    }
  }

  let finalUsers: UserAccount[] = [];

  if (supabaseSuccess) {
    finalUsers = authUsers;
  } else {
    if (typeof window !== "undefined") {
      try {
        const localUsersStr = localStorage.getItem(KEYS.USERS);
        if (localUsersStr) {
          const parsed = JSON.parse(localUsersStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalUsers = parsed;
          }
        }
      } catch {}
    }
    if (finalUsers.length === 0) {
      finalUsers = [...defaultData];
    }
  }

  // Deduplikasi berdasarkan ID atau Email
  const seenUserKeys = new Set<string>();
  finalUsers = finalUsers.filter((u) => {
    const key = u.id || u.user_id || u.email;
    if (!key) return true;
    if (seenUserKeys.has(key)) return false;
    seenUserKeys.add(key);
    return true;
  });

  // Filter akun yang baru dihapus
  if (typeof window !== "undefined") {
    try {
      const deletedRaw = localStorage.getItem("PMII_DELETED_USER_IDS");
      if (deletedRaw) {
        const deletedList: string[] = JSON.parse(deletedRaw);
        if (Array.isArray(deletedList) && deletedList.length > 0) {
          const deletedSet = new Set(deletedList.map((s) => s.toLowerCase()));
          finalUsers = finalUsers.filter((u) => {
            if (u.id && deletedSet.has(u.id.toLowerCase())) return false;
            if (u.user_id && deletedSet.has(u.user_id.toLowerCase())) return false;
            if (u.email && deletedSet.has(u.email.toLowerCase())) return false;
            return true;
          });
        }
      }
    } catch {}
  }

  // Pastikan tidak pernah menyimpan field password di localStorage
  const sanitizedUsers = finalUsers.map((u) => {
    const clean = { ...u };
    delete clean.password;
    return {
      ...clean,
      role: ((clean.role as string) === "CABANG" ? "admin" : clean.role) as UserRole,
      tenant_id: clean.tenant_id || clean.komisariat_id,
      komisariat_id: clean.komisariat_id || clean.tenant_id,
      commissariat: clean.commissariat ? normalizeKomisariat(clean.commissariat) : "",
      needsOnboarding:
        typeof clean.needsOnboarding === "boolean"
          ? clean.needsOnboarding
          : !clean.commissariat && String(clean.role) !== "superadmin",
    };
  });

  if (typeof window !== "undefined" && sanitizedUsers.length > 0) {
    try {
      localStorage.setItem(KEYS.USERS, JSON.stringify(sanitizedUsers));
    } catch {}
  }

  return sanitizedUsers;
}

export async function getUsersPaginated(
  params: UsersQueryParams = {}
): Promise<PaginatedResult<UserAccount>> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 25));
  const all = await getUsers([]);

  const filtered = all.filter((u) => {
    if (params.tenantId && u.tenant_id !== params.tenantId && u.komisariat_id !== params.tenantId) {
      return false;
    }
    if (params.role && params.role !== "ALL" && String(u.role).toLowerCase() !== params.role.toLowerCase()) {
      return false;
    }
    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.commissariat || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const from = (page - 1) * pageSize;
  return {
    data: filtered.slice(from, from + pageSize),
    total: filtered.length,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}

export async function saveUsers(usersList: UserAccount[]): Promise<boolean> {
  // Jangan simpan password ke localStorage
  const cacheSafe = usersList.map((u) => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  });

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.USERS, JSON.stringify(cacheSafe));
  }

  if (isSupabaseConfigured && supabase) {
    for (const u of usersList) {
      if (!u.id || u.id.startsWith("usr-")) continue;
      try {
        await supabase.rpc("update_auth_user", {
          p_user_id: u.id,
          p_email: u.email.toLowerCase().trim(),
          p_name: u.name || "",
          p_role: u.role || "pengurus",
          p_commissariat: u.commissariat || "",
          p_status: u.status || "AKTIF",
          p_allowed_menus: u.allowedMenus || [],
          p_password: u.password && u.password.trim() ? u.password.trim() : null,
          p_komisariat_id: u.komisariat_id || u.tenant_id || null,
        });
      } catch (e) {
        console.warn("Notice syncing user to auth:", e);
      }
    }
  }

  return true;
}
