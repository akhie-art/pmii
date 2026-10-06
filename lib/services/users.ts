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
          id: u.id || u.user_id,
          user_id: u.id || u.user_id,
          name: u.name || "",
          email: u.email || "",
          password: getUserPassword(u) || undefined,
          role: (u.role as UserRole) || "anggota",
          commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "Ki Ageng Getas Pendawa",
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

  // 2. Pastikan DEFAULT_USERS (khususnya Master Admin admin@pmii.org) selalu tersedia
  const combined: UserAccount[] = [...authUsers];
  for (const def of defaultData) {
    const exists = combined.some(u => 
      (u.email && def.email && u.email.toLowerCase() === def.email.toLowerCase()) || 
      u.id === def.id
    );
    if (!exists) {
      combined.push({
        ...def,
        password: getUserPassword(def) || def.password
      });
    }
  }

  // Check if active session in localStorage has updated avatar
  if (typeof window !== "undefined") {
    try {
      const loggedUserStr = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (loggedUserStr) {
        const loggedUser = JSON.parse(loggedUserStr);
        if (loggedUser?.email && loggedUser?.avatar) {
          const adminIdx = combined.findIndex(u => u.email.toLowerCase() === loggedUser.email.toLowerCase());
          if (adminIdx !== -1) {
            combined[adminIdx].avatar = loggedUser.avatar;
          }
        }
      }
    } catch (e) {}
  }

  // Local storage fallback for offline / metadata enrich
  if (typeof window !== "undefined") {
    try {
      const localUsersStr = localStorage.getItem(KEYS.USERS);
      if (localUsersStr) {
        const localList: UserAccount[] = JSON.parse(localUsersStr);
        for (const lu of localList) {
          const idx = combined.findIndex(u => (u.email && lu.email && u.email.toLowerCase() === lu.email.toLowerCase()) || u.id === lu.id);
          if (idx === -1) {
            if (!supabaseSuccess) {
              combined.push(lu);
            }
          } else {
            if (lu.avatar && !combined[idx].avatar) combined[idx].avatar = lu.avatar;
            if (lu.allowedMenus && (!combined[idx].allowedMenus || combined[idx].allowedMenus.length === 0)) {
              combined[idx].allowedMenus = lu.allowedMenus;
            }
          }
        }
      }
    } catch (e) {}
  }

  // Simpan cache terbaru ke localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEYS.USERS, JSON.stringify(combined));
    } catch {}
  }

  return combined.map(u => ({
    ...u,
    password: getUserPassword(u) || u.password,
    role: (u.role as any) === "CABANG" ? "ADMIN" : u.role,
    commissariat: u.commissariat ? normalizeKomisariat(u.commissariat) : "Ki Ageng Getas Pendawa"
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
