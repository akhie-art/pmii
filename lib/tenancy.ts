import { UserAccount } from "./services/types";

export interface TenantScoped {
  tenant_id?: string | null;
  komisariat_id?: string | null;
  commissariat?: string;
  komisariat?: string; // mapped representation in some parts of the app
  campus?: string;
  perguruanTinggi?: string;
}

export const CABANG_TENANT_ID = "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9";
export const LEGACY_CABANG_TENANT_ID = "c0000000-0000-0000-0000-000000000001";
export const TENANT_STORAGE_KEY = "PMII_ACTIVE_TENANT_COMMISSARIAT";
export const TENANT_CHANGED_EVENT = "pmii-tenant-changed";

export const DEFAULT_TENANT_MAP: Record<string, string> = {
  "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9": "Pengurus Cabang PMII Grobogan",
  "c0000000-0000-0000-0000-000000000001": "Pengurus Cabang PMII Grobogan",
  "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f": "Komisariat Ki Ageng Getas Pendawa",
  "22222222-2222-2222-2222-222222222222": "Komisariat Ki Ageng Tarub",
  "2342112a-7413-4151-9998-3a13e833902f": "Komisariat Ajisaka",
  "2eae53a7-28ff-40b5-95f1-69f85d179d8e": "Komisariat Joko Suro",
  "33333333-3333-3333-3333-333333333333": "Komisariat Ajisaka",
  "44444444-4444-4444-4444-444444444444": "Komisariat Joko Suro",
};

export const DEFAULT_KOMISARIAT_MAP = DEFAULT_TENANT_MAP;

export const DEFAULT_KOMISARIAT_LIST = [
  "Komisariat Ki Ageng Getas Pendawa",
  "Komisariat Ki Ageng Tarub",
  "Komisariat Ajisaka",
  "Komisariat Joko Suro",
];

/**
 * Mencari UUID Tenant / Komisariat berdasarkan nama atau kata kunci nama
 */
export function getTenantIdByName(name: string | undefined | null): string | null {
  if (!name) return null;
  const n = normalizeTenantName(name);
  if (!n) return null;
  if (n.includes("cabang") || n.includes("pcpmii") || n.includes("grobogan")) {
    return CABANG_TENANT_ID;
  }
  if (n.includes("getas") || n.includes("pendawa") || n.includes("annuur")) {
    return "13aea81b-ca8c-43c2-b44f-7d70cdc11f7f";
  }
  if (n.includes("tarub") || n.includes("walisembilan")) {
    return "22222222-2222-2222-2222-222222222222";
  }
  if (n.includes("ajisaka") || n.includes("staig")) {
    return "2342112a-7413-4151-9998-3a13e833902f";
  }
  if (n.includes("joko") || n.includes("suro")) {
    return "2eae53a7-28ff-40b5-95f1-69f85d179d8e";
  }
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("PMII_KOMISARIAT_LIST") || localStorage.getItem("PMII_TENANT_LIST");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const found = list.find(
            (k: any) =>
              normalizeTenantName(k.name) === n ||
              normalizeTenantName(k.university) === n ||
              normalizeTenantName(k.name).includes(n) ||
              n.includes(normalizeTenantName(k.name))
          );
          if (found?.id) return found.id;
        }
      }
    } catch {}
  }
  return null;
}

export const getKomisariatIdByName = getTenantIdByName;

/**
 * Mendapatkan nama resmi tenant / komisariat berdasarkan ID
 */
export function getTenantNameById(id: string | undefined | null): string | null {
  if (!id) return null;
  if (DEFAULT_TENANT_MAP[id]) return DEFAULT_TENANT_MAP[id];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("PMII_KOMISARIAT_LIST") || localStorage.getItem("PMII_TENANT_LIST");
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const found = list.find((k: any) => k.id === id);
          if (found?.name) return found.name;
        }
      }
    } catch {}
  }
  return null;
}

export const getKomisariatNameById = getTenantNameById;

/**
 * Memeriksa apakah user memiliki peran Pengurus Cabang (PC) atau Super Admin.
 */
export function isCabangOrAdmin(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase();
  const role = (user.role || "").toUpperCase();
  const comm = (user.commissariat || (user as any).komisariat || "").toUpperCase();
  const jabatan = ((user as any).jabatan || "").toUpperCase();

  // Jika akun secara eksplisit terikat ke komisariat kampus (bukan Cabang)
  const userTenantId = (user as any).tenant_id || (user as any).komisariat_id;
  const isCabangId =
    userTenantId === CABANG_TENANT_ID ||
    userTenantId === "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9";

  const isExplicitKomisariat =
    (Boolean(userTenantId) && !isCabangId) ||
    (Boolean(comm) && !comm.includes("CABANG") && !comm.includes("PC PMII") && !comm.includes("PENGURUS CABANG"));

  if (isExplicitKomisariat && !role.includes("ADMIN") && !role.includes("SUPERADMIN") && !role.includes("CABANG")) {
    return false;
  }

  if (
    email.includes("cabang") && !email.includes("komisariat")
  ) {
    return true;
  }

  // Role Cabang / PC / Pengurus Cabang
  if (
    role === "CABANG" ||
    role === "PC" ||
    role === "PENGURUS_CABANG" ||
    role.includes("CABANG") ||
    role.includes("KETUA CABANG") ||
    jabatan.includes("CABANG") ||
    jabatan.includes("PC")
  ) {
    return true;
  }

  // Jika komisariat akun bertuliskan Cabang atau PC Grobogan
  if (comm.includes("CABANG") || comm.includes("PC PMII") || comm.includes("PENGURUS CABANG")) {
    return true;
  }

  // Super Admin murni tanpa komisariat
  if (
    (role === "ADMIN" ||
      role === "SUPERADMIN" ||
      role === "SUPER_ADMIN" ||
      role === "SUPER ADMIN") &&
    !isExplicitKomisariat
  ) {
    return true;
  }

  return false;
}

/**
 * Standarisasi nama komisariat untuk pencocokan multi-tenant yang fleksibel & toleran typo/alias
 * (Contoh: "PK PMII Walisongo" vs "UIN Walisongo", "Ki Ageng Getas Pendawa").
 */
export function normalizeTenantName(name: string | undefined | null): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/komisariat|perguruan\s+tinggi|pk\s+pmii|pmii/gi, "")
    .replace(/&/g, "dan")
    .replace(/[\s\-_]/g, "")
    .trim();
}

/**
 * Mendapatkan tenant (komisariat) aktif saat ini.
 * - Jika user adalah Pengurus Komisariat / Instruktur / Kader: selalu mengembalikan komisariat akunnya.
 * - Jika user adalah Admin / Cabang: membaca pilihan dari switcher di localStorage ("ALL" atau nama komisariat spesifik).
 */
export function getActiveTenant(currentUser?: UserAccount | null): string | null {
  if (typeof window === "undefined") return null;

  let user = currentUser;
  if (!user) {
    try {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) user = JSON.parse(stored);
    } catch {}
  }

  // Jika bukan Cabang/Admin, paksa ke komisariat milik akunnya sendiri
  if (user && !isCabangOrAdmin(user)) {
    return user.commissariat || null;
  }

  // Untuk Admin / Cabang, baca dari pilihan aktif (bisa "ALL" atau spesifik)
  const saved = localStorage.getItem(TENANT_STORAGE_KEY);
  if (saved) return saved;

  // Default untuk Cabang/Admin jika belum memilih: "ALL" (melihat seluruh cabang)
  return "ALL";
}

/**
 * Mengubah tenant aktif (khusus Admin / Pengurus Cabang).
 * Menembakkan event agar seluruh komponen halaman merender ulang data sesuai tenant baru.
 */
export function setActiveTenant(commissariat: string | null): void {
  if (typeof window === "undefined") return;

  const target = commissariat || "ALL";
  localStorage.setItem(TENANT_STORAGE_KEY, target);
  localStorage.setItem("PMII_ACTIVE_COMMISSARIAT", target === "ALL" ? "" : target);

  // Trigger event agar semua listeners bereaksi
  window.dispatchEvent(
    new CustomEvent(TENANT_CHANGED_EVENT, {
      detail: { activeTenant: target }
    })
  );
}

/**
 * Memeriksa apakah data merupakan data resmi tingkat Pengurus Cabang (lintas komisariat)
 */
export function isCabangRecord(record: TenantScoped): boolean {
  const tId = record.tenant_id || record.komisariat_id;
  if (tId === CABANG_TENANT_ID || tId === "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9") return true;
  if (tId && tId !== CABANG_TENANT_ID && tId !== "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9") return false;
  const comm = (record.commissariat || record.komisariat || "").toLowerCase();
  if (comm.includes("cabang") || comm.includes("pc pmii") || comm.includes("pc grobogan")) {
    return true;
  }
  return false;
}

export interface TenantFilterOptions {
  allowCabang?: boolean;
}

/**
 * Memeriksa apakah suatu baris data berada dalam lingkup tenant pengguna saat ini.
 * Memprioritaskan pencocokan Foreign Key tenant_id / komisariat_id dengan fallback ke pencocokan nama.
 * Data tingkat Cabang hanya muncul di akun/filter Cabang,
 * dan TIDAK bocor ke dashboard Pengurus Komisariat agar tidak membingungkan.
 */
export function isRecordInTenant(
  user: UserAccount | null | undefined,
  record: TenantScoped,
  activeTenantOverride?: string | null,
  options?: TenantFilterOptions
): boolean {
  let effectiveUser = user;
  if (!effectiveUser && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("PMII_LOGGED_IN_USER");
      if (stored) effectiveUser = JSON.parse(stored);
    } catch {}
  }

  const isRecordCabang = isCabangRecord(record);
  const isAdminOrCabang = isCabangOrAdmin(effectiveUser);

  // Jika Pengurus Cabang atau Super Admin:
  if (isAdminOrCabang) {
    const activeTenant = activeTenantOverride !== undefined 
      ? activeTenantOverride 
      : getActiveTenant(effectiveUser);

    // Pengurus cabang berhak melihat SEMUA data jika tenant ALL atau "Semua Komisariat"
    if (
      !activeTenant || 
      activeTenant === "ALL" || 
      activeTenant === "Semua Komisariat" ||
      activeTenant.toUpperCase().includes("SEMUA")
    ) {
      return true;
    }

    // Jika filter aktif adalah tingkat Cabang, hanya tampilkan data Cabang
    if (
      activeTenant.toUpperCase().includes("CABANG") ||
      activeTenant.toUpperCase().includes("GROBOGAN") ||
      activeTenant === CABANG_TENANT_ID ||
      activeTenant === "f9fd547e-117e-4d39-b8cc-2ff9a818a8d9"
    ) {
      return isRecordCabang;
    }

    // Jika filter aktif adalah Komisariat spesifik, data Cabang tidak boleh bocor
    if (isRecordCabang) {
      return false;
    }

    // 1. Prioritaskan Foreign Key tenant_id / komisariat_id jika record memilikinya
    const rId = record.tenant_id || record.komisariat_id;
    if (rId) {
      if (rId === activeTenant) return true;
      const targetId = getTenantIdByName(activeTenant);
      if (targetId) {
        return rId === targetId;
      }
    }

    // 2. Fallback pencocokan nama komisariat/tenant
    const targetNorm = normalizeTenantName(activeTenant);
    const recordComm = record.commissariat || record.komisariat || record.campus || record.perguruanTinggi || getTenantNameById(rId);
    const recordNorm = normalizeTenantName(recordComm);
    if (!recordNorm) return true;
    return recordNorm.includes(targetNorm) || targetNorm.includes(recordNorm);
  }

  // Jika tidak ada user tapi override adalah ALL atau tidak ada target khusus, izinkan
  if (!effectiveUser) {
    if (!activeTenantOverride || activeTenantOverride === "ALL" || activeTenantOverride === "Semua Komisariat") {
      return true;
    }
    return false;
  }

  // Pengurus Komisariat / Instruktur / Anggota:
  // Data tingkat Cabang TIDAK ditampilkan di halaman dashboard operasional komisariat
  // agar tidak membingungkan pengurus komisariat, kecuali opsi allowCabang diaktifkan.
  if (isRecordCabang) {
    return options?.allowCabang === true;
  }

  // Target tenant lokal milik akun pengurus komisariat / instruktur / anggota
  const targetComm = effectiveUser.commissariat || "";
  const targetTenantId = effectiveUser.tenant_id || effectiveUser.komisariat_id || getTenantIdByName(targetComm);

  // 1. Evaluasi Foreign Key tenant_id / komisariat_id jika tersedia
  const recordTenantId = record.tenant_id || record.komisariat_id;
  if (recordTenantId && targetTenantId) {
    return recordTenantId === targetTenantId;
  }

  if (!targetComm && !targetTenantId) return true;

  // 2. Fallback pencocokan nama
  const targetNorm = normalizeTenantName(targetComm);
  const recordComm = record.commissariat || record.komisariat || record.campus || record.perguruanTinggi || getTenantNameById(recordTenantId);
  const recordNorm = normalizeTenantName(recordComm);

  if (!recordNorm) return false;
  return recordNorm.includes(targetNorm) || targetNorm.includes(recordNorm);
}

/**
 * Memastikan penulisan data baru (INSERT / UPDATE) secara otomatis diberi Foreign Key tenant_id
 * dan nama komisariat/cabang yang sesuai dengan tenant saat ini.
 */
export function enforceTenantWrite<T extends TenantScoped>(
  user: UserAccount | null | undefined,
  record: T,
  activeTenantOverride?: string | null
): T {
  if (!user) return record;

  const updated: any = { ...record };

  // Jika record secara eksplisit ditujukan untuk tingkat Cabang
  if (
    record.tenant_id === CABANG_TENANT_ID ||
    record.komisariat_id === CABANG_TENANT_ID ||
    record.tenant_id === LEGACY_CABANG_TENANT_ID ||
    record.komisariat_id === LEGACY_CABANG_TENANT_ID ||
    (record.commissariat && isCabangRecord(record))
  ) {
    updated.tenant_id = CABANG_TENANT_ID;
    updated.komisariat_id = CABANG_TENANT_ID;
    updated.commissariat = "Pengurus Cabang Grobogan";
    return updated as T;
  }

  const isAdminOrCabang = isCabangOrAdmin(user);

  let targetCommissariat = user.commissariat;
  let targetTenantId = user.tenant_id || user.komisariat_id || getTenantIdByName(user.commissariat);

  if (isAdminOrCabang) {
    const active = activeTenantOverride !== undefined ? activeTenantOverride : getActiveTenant(user);
    if (active && active !== "ALL" && active !== "Semua Komisariat") {
      targetCommissariat = active;
      targetTenantId = getTenantIdByName(active);
    } else {
      // Jika activeTenant bernilai "ALL", periksa apakah record sudah memiliki komisariat atau perguruan tinggi
      const recordComm = record.commissariat || record.komisariat || (record as any).perguruanTinggi || (record as any).campus;
      if (recordComm) {
        const resolved = getTenantIdByName(recordComm);
        if (resolved) {
          targetTenantId = resolved;
          targetCommissariat = recordComm;
        }
      }
      if (!targetTenantId) {
        targetTenantId = CABANG_TENANT_ID;
        targetCommissariat = "Pengurus Cabang Grobogan";
      }
    }
  }

  if (targetCommissariat) {
    if ("komisariat" in record || !("commissariat" in record)) {
      updated.komisariat = targetCommissariat;
    }
    if ("commissariat" in record || !("komisariat" in record)) {
      updated.commissariat = targetCommissariat;
    }
  }

  // Tautkan Foreign Key tenant_id & komisariat_id secara otomatis
  if (targetTenantId) {
    updated.tenant_id = updated.tenant_id ?? targetTenantId;
    updated.komisariat_id = updated.komisariat_id ?? targetTenantId;
  } else if (updated.commissariat) {
    const resolved = getTenantIdByName(updated.commissariat);
    if (resolved) {
      updated.tenant_id = updated.tenant_id ?? resolved;
      updated.komisariat_id = updated.komisariat_id ?? resolved;
    }
  }

  // Jaminan nilai tenant_id tidak pernah kosong
  if (!updated.tenant_id) {
    updated.tenant_id = CABANG_TENANT_ID;
  }
  if (!updated.komisariat_id) {
    updated.komisariat_id = updated.tenant_id;
  }

  return updated as T;
}

/**
 * Filter koleksi data langsung berdasarkan tenant aktif.
 */
export function filterByTenant<T extends TenantScoped>(
  items: T[],
  user: UserAccount | null | undefined,
  activeTenantOverride?: string | null,
  options?: TenantFilterOptions
): T[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => isRecordInTenant(user, item, activeTenantOverride, options));
}
