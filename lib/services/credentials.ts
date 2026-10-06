import { supabase, isSupabaseConfigured } from "../supabase";
import { isValidUUID } from "../utils";
import { UserAccount } from "./types";

export function getUserCredentials(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("PMII_USER_CREDENTIALS");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setUserPassword(identifiers: (string | undefined | null)[], password: string): void {
  if (typeof window === "undefined" || !password) return;
  try {
    const creds = getUserCredentials();
    for (const id of identifiers) {
      if (!id || typeof id !== "string") continue;
      const trimmed = id.trim();
      if (!trimmed) continue;
      creds[trimmed.toLowerCase()] = password;
      creds[trimmed] = password;
    }
    localStorage.setItem("PMII_USER_CREDENTIALS", JSON.stringify(creds));
  } catch (e) {
    console.error("Error setting user password:", e);
  }
}

export function getUserPassword(userOrCadre?: any): string | undefined {
  if (!userOrCadre) return undefined;
  if (typeof userOrCadre === "string") {
    const creds = getUserCredentials();
    const clean = userOrCadre.trim().toLowerCase();
    return creds[clean] || creds[userOrCadre.trim()];
  }
  if (userOrCadre.password) return userOrCadre.password;
  if (typeof window === "undefined") return undefined;
  try {
    const creds = getUserCredentials();
    const candidates = [
      userOrCadre.id,
      userOrCadre.user_id,
      userOrCadre.email?.trim().toLowerCase(),
      userOrCadre.email?.trim(),
      userOrCadre.nik?.trim(),
      userOrCadre.name?.trim().toLowerCase(),
      userOrCadre.name?.trim()
    ];
    for (const cand of candidates) {
      if (cand && creds[cand]) {
        return creds[cand];
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function migrateUserEmail(oldEmail: string | undefined, newEmail: string | undefined): void {
  if (!oldEmail || !newEmail || oldEmail.toLowerCase() === newEmail.toLowerCase()) return;
  if (typeof window === "undefined") return;
  try {
    const creds = getUserCredentials();
    const oldClean = oldEmail.trim().toLowerCase();
    const newClean = newEmail.trim().toLowerCase();
    if (creds[oldClean]) {
      creds[newClean] = creds[oldClean];
      creds[newEmail.trim()] = creds[oldClean];
      localStorage.setItem("PMII_USER_CREDENTIALS", JSON.stringify(creds));
    }
  } catch (e) {
    console.error("Error migrating user email:", e);
  }
}

export async function deleteUserFromAuth(identifier: { id?: string; email?: string; user_id?: string } | string): Promise<boolean> {
  const targetEmail = typeof identifier === "string" 
    ? (identifier.includes("@") ? identifier.trim().toLowerCase() : undefined)
    : identifier.email?.trim().toLowerCase();
  
  const targetId = typeof identifier === "string"
    ? (!identifier.includes("@") && isValidUUID(identifier) ? identifier : undefined)
    : (identifier.user_id && isValidUUID(identifier.user_id) ? identifier.user_id : (isValidUUID(identifier.id) ? identifier.id : undefined));

  // Remove from local credentials store
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("PMII_USER_CREDENTIALS");
      if (raw) {
        const creds = JSON.parse(raw);
        if (targetEmail && creds[targetEmail]) delete creds[targetEmail];
        if (targetId && creds[targetId]) delete creds[targetId];
        if (typeof identifier !== "string" && identifier.id && creds[identifier.id]) delete creds[identifier.id];
        localStorage.setItem("PMII_USER_CREDENTIALS", JSON.stringify(creds));
      }
    } catch {}
  }

  // Delete from Supabase auth.users via RPC
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("delete_user_from_auth", {
        p_user_id: targetId || null,
        p_email: targetEmail || null
      });
      if (error) {
        console.warn("Notice delete_user_from_auth:", error.message);
      }
      return Boolean(data);
    } catch (e) {
      console.warn("Error calling delete_user_from_auth:", e);
    }
  }
  return true;
}

export async function deleteUsersFromAuth(users: ({ id?: string; email?: string; user_id?: string } | string)[]): Promise<number> {
  const userIds: string[] = [];
  const emails: string[] = [];

  for (const u of users) {
    if (typeof u === "string") {
      if (u.includes("@")) emails.push(u.trim().toLowerCase());
      else if (isValidUUID(u)) userIds.push(u);
    } else {
      if (u.email && u.email.includes("@")) emails.push(u.email.trim().toLowerCase());
      if (u.user_id && isValidUUID(u.user_id)) userIds.push(u.user_id);
      else if (u.id && isValidUUID(u.id)) userIds.push(u.id);
    }
  }

  // Remove from local credentials store
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("PMII_USER_CREDENTIALS");
      if (raw) {
        const creds = JSON.parse(raw);
        for (const em of emails) delete creds[em];
        for (const uid of userIds) delete creds[uid];
        localStorage.setItem("PMII_USER_CREDENTIALS", JSON.stringify(creds));
      }
    } catch {}
  }

  if (isSupabaseConfigured && supabase && (userIds.length > 0 || emails.length > 0)) {
    try {
      const { data, error } = await supabase.rpc("delete_users_from_auth", {
        p_user_ids: userIds,
        p_emails: emails
      });
      if (error) {
        console.warn("Notice delete_users_from_auth:", error.message);
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
  status?: string;
  allowedMenus?: string[];
}): Promise<UserAccount | null> {
  const cleanEmail = user.email.trim().toLowerCase();
  const pwd = user.password || "pmii1960";

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.rpc("create_auth_user", {
        p_email: cleanEmail,
        p_password: pwd,
        p_name: user.name?.trim() || "",
        p_role: user.role || "pengurus",
        p_commissariat: user.commissariat || "Ki Ageng Getas Pendawa",
        p_status: user.status || "AKTIF",
        p_allowed_menus: user.allowedMenus || []
      });

      if (error) {
        console.warn("Notice create_auth_user:", error.message);
      } else if (data) {
        if (pwd) {
          setUserPassword([data.id, data.user_id, cleanEmail, user.name], pwd);
        }
        return {
          id: data.id || data.user_id,
          user_id: data.user_id || data.id,
          name: data.name || user.name || "",
          email: cleanEmail,
          password: pwd,
          role: data.role || user.role || "pengurus",
          commissariat: data.commissariat || user.commissariat || "Ki Ageng Getas Pendawa",
          status: data.status || user.status || "AKTIF",
          createdAt: data.created_at || new Date().toISOString(),
          allowedMenus: data.allowed_menus || user.allowedMenus || []
        };
      }
    } catch (e) {
      console.warn("Exception in create_auth_user RPC:", e);
    }
  }

  // Local fallback
  if (pwd) {
    setUserPassword([cleanEmail, user.name], pwd);
  }
  return null;
}

export async function updateAuthUser(user: Partial<UserAccount> & { id: string }): Promise<boolean> {
  if (user.password) {
    setUserPassword([user.id, user.user_id, user.email, user.name], user.password);
  }
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.rpc("update_auth_user", {
        p_user_id: user.user_id || user.id,
        p_email: user.email ? user.email.toLowerCase().trim() : "",
        p_name: user.name || "",
        p_role: user.role || "pengurus",
        p_commissariat: user.commissariat || "Ki Ageng Getas Pendawa",
        p_status: user.status || "AKTIF",
        p_allowed_menus: user.allowedMenus || [],
        p_password: user.password && user.password.trim() ? user.password.trim() : null
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
