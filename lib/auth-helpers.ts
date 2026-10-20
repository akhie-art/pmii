/**
 * PMII Auth & Role Helpers
 * Standardized functions for role checking, staff prefixes, and menu access control.
 */

export function isUserSuperAdmin(role?: string, _email?: string): boolean {
  if (role) {
    const r = role.toLowerCase().trim();
    if (r === "superadmin" || r === "super_admin" || r === "super admin") return true;
  }
  return false;
}

export function isUserAdmin(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return (
    r === "admin" ||
    r === "superadmin" ||
    r === "super_admin" ||
    r === "super admin" ||
    r === "cabang" ||
    r === "pc" ||
    r === "pengurus cabang" ||
    r === "pengurus_cabang" ||
    r.includes("cabang")
  );
}

export function isUserPengurus(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  if (isUserAdmin(r)) return false;
  return (
    r === "pengurus" ||
    r === "komisariat" ||
    r === "pk" ||
    r === "pengurus komisariat" ||
    r === "pengurus_komisariat" ||
    r.includes("pengurus") ||
    r.includes("komisariat")
  );
}

export function isUserInstruktur(role?: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase().trim();
  return r === "instruktur" || r.includes("instruktur");
}

export function normalizeRole(role?: string): "admin" | "pengurus" | "instruktur" | "anggota" | "peserta" {
  if (!role) return "anggota";
  if (isUserAdmin(role)) return "admin";
  if (isUserInstruktur(role)) return "instruktur";
  if (isUserPengurus(role)) return "pengurus";
  const r = role.toLowerCase().trim();
  if (r === "peserta" || r === "calon") return "peserta";
  return "anggota";
}

export function getTargetStaffPrefix(role?: string): string {
  if (isUserAdmin(role)) return "/admin";
  if (isUserInstruktur(role)) return "/instruktur";
  return "/pengurus";
}

/**
 * Checks whether a given menu item / subpath is allowed for a user.
 * Admin users have access to all menus.
 * For non-admin users:
 * - If allowedMenus is provided (array), only menus present in allowedMenus (or default home/profile) are allowed.
 * - Root /dashboard / staffPrefix only matches the root dashboard, never serves as prefix for sub-routes.
 */
export function isMenuAllowed(
  itemHref: string,
  user: { role?: string; allowedMenus?: string[] } | null,
  staffPrefix: string
): boolean {
  if (!user) return false;

  const normalizedItem = itemHref.replace(/\/$/, "");

  // Selalu izinkan dashboard home dan profil
  if (
    normalizedItem === staffPrefix ||
    normalizedItem === `${staffPrefix}/profil` ||
    normalizedItem === "/dashboard" ||
    normalizedItem === "/dashboard/profil" ||
    normalizedItem === ""
  ) {
    return true;
  }

  // Jika allowedMenus telah ditentukan secara eksplisit (array), prioritaskan konfigurasi allowedMenus
  if (Array.isArray(user.allowedMenus)) {
    const toCanonical = (p: string) => {
      const clean = p.replace(/\/$/, "");
      return clean.replace(/^\/(dashboard|admin|pengurus|instruktur|kader|peserta)/, "");
    };

    const itemCanonical = toCanonical(normalizedItem);

    return user.allowedMenus.some((m: string) => {
      if (!m) return false;
      const normalizedM = m.replace(/\/$/, "");
      const menuCanonical = toCanonical(normalizedM);

      // Jika m adalah dashboard root ("", "/dashboard", dll.), hanya cocok jika item juga dashboard root
      if (menuCanonical === "" || normalizedM === "/dashboard" || normalizedM === staffPrefix) {
        return itemCanonical === "";
      }

      // Dukungan equivalensi tenant / komisariat
      const isTenantEquiv =
        (itemCanonical === "/tenant" || itemCanonical === "/komisariat") &&
        (menuCanonical === "/tenant" || menuCanonical === "/komisariat");

      return (
        itemCanonical === menuCanonical ||
        itemCanonical.startsWith(menuCanonical + "/") ||
        normalizedItem === normalizedM ||
        normalizedItem.startsWith(normalizedM + "/") ||
        isTenantEquiv
      );
    });
  }

  // Jika allowedMenus tidak disetel (undefined/null), gunakan izin default berdasarkan role
  if (isUserAdmin(user.role)) return true;

  return false;
}
