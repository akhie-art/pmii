import { UserAccount, UserRole } from "./types";
import { KEYS, DEFAULT_USERS } from "./defaults";
import { supabase, isSupabaseConfigured } from "../supabase";
import { normalizeKomisariat } from "./core";
import { getUserPassword, setUserPassword } from "./credentials";

export async function getUsers(defaultData: UserAccount[] = DEFAULT_USERS): Promise<UserAccount[]> {
  let authUsers: UserAccount[] = [];
  let supabaseSuccess = false;

  // 1. Ambil data asli langsung dari Users Authentication via RPC get_auth_users
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("get_auth_users");
      if (!error && Array.isArray(data)) {
        supabaseSuccess = true;
        authUsers = data.map((u: any) => ({
          ...u,
          id: u.id || u.user_id,
          user_id: u.id || u.user_id,
          name: u.name || "",
          email: u.email || "",
          password: getUserPassword(u) || undefined,
          role: (u.role as UserRole) || "anggota",
          role_id: u.role_id,
          role_name: u.role_name,
          tenant_id: u.tenant_id || u.komisariat_id,
          komisariat_id: u.komisariat_id || u.tenant_id,
          commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "",
          needsOnboarding: typeof u.needsOnboarding === "boolean" ? u.needsOnboarding : (!u.commissariat && (u.role as string) !== "superadmin"),
          status: (u.status === "NONAKTIF" ? "NONAKTIF" : "AKTIF") as "AKTIF" | "NONAKTIF",
          createdAt: u.createdAt || u.created_at || new Date().toISOString(),
          allowedMenus: Array.isArray(u.allowedMenus) ? u.allowedMenus : [],
          avatar: u.avatar || undefined
        }));
      } else if (error) {
        console.warn("Failed to get auth users via RPC, falling back to local:", error.message);
      }
    } catch (err) {
      console.warn("Exception fetching auth users:", err);
    }
  }

  // Jika Supabase berhasil mengambil data, jadikan data Supabase sebagai sumber kebenaran tunggal
  let finalUsers: UserAccount[] = [];

  if (supabaseSuccess) {
    finalUsers = authUsers;
  } else {
    // Fallback offline: Ambil dari localStorage cache jika koneksi Supabase gagal
    if (typeof window !== "undefined") {
      try {
        const localUsersStr = localStorage.getItem(KEYS.USERS);
        if (localUsersStr) {
          const parsed = JSON.parse(localUsersStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            finalUsers = parsed;
          }
        }
      } catch (e) {}
    }
    // Jika cache kosong juga, gunakan defaultData
    if (finalUsers.length === 0) {
      finalUsers = [...defaultData];
    }
  }

  // Sinkronkan avatar dari sesi aktif jika ada
  if (typeof window !== "undefined") {
    try {
      const loggedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (loggedUserStr) {
        const loggedUser = JSON.parse(loggedUserStr);
        if (loggedUser?.email && loggedUser?.avatar) {
          const idx = finalUsers.findIndex(u => u.email?.toLowerCase() === loggedUser.email.toLowerCase());
          if (idx !== -1 && !finalUsers[idx].avatar) {
            finalUsers[idx].avatar = loggedUser.avatar;
          }
        }
      }
    } catch (e) {}
  }

  // Perbarui cache offline localStorage
  if (typeof window !== "undefined" && finalUsers.length > 0) {
    try {
      localStorage.setItem(KEYS.USERS, JSON.stringify(finalUsers));
    } catch {}
  }

  return finalUsers.map(u => ({
    ...u,
    password: getUserPassword(u) || u.password,
    role: (u.role as any) === "CABANG" ? "ADMIN" : u.role,
    tenant_id: (u as any).tenant_id || (u as any).komisariat_id,
    komisariat_id: (u as any).komisariat_id || (u as any).tenant_id,
    commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "",
    needsOnboarding: typeof u.needsOnboarding === "boolean" ? u.needsOnboarding : (!u.commissariat && (u.role as string) !== "superadmin")
  }));
}

export async function saveUsers(usersList: UserAccount[]): Promise<boolean> {
  // Record passwords into credentials store
  usersList.forEach(u => {
    if (u.password) {
      setUserPassword([u.id, u.user_id, u.email, u.name], u.password);
    }
  });

  const sanitized = usersList.map(u => ({ ...u }));

  if (typeof window !== "undefined") {
    localStorage.setItem(KEYS.USERS, JSON.stringify(sanitized));
  }

  // Synchronize updates to Supabase auth.users via RPC update_auth_user
  if (isSupabaseConfigured && supabase) {
    for (const u of sanitized) {
      if (!u.id || u.id.startsWith("usr-")) continue;
      try {
        await supabase.rpc("update_auth_user", {
          p_user_id: u.id,
          p_email: u.email.toLowerCase().trim(),
          p_name: u.name || "",
          p_role: u.role || "pengurus",
          p_commissariat: u.commissariat || "Ki Ageng Getas Pendawa",
          p_status: u.status || "AKTIF",
          p_allowed_menus: u.allowedMenus || [],
          p_password: u.password && u.password.trim() ? u.password.trim() : null
        });
      } catch (e) {
        console.warn("Notice syncing user to auth:", e);
      }
    }
  }

  return true;
}
