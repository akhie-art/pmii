import { Role } from "./types";
import { getTableData, upsertTableRow, deleteTableRow } from "./core";
import { supabase, isSupabaseConfigured } from "../supabase";

export const DEFAULT_ROLES: Role[] = [
  {
    id: "b0000000-0000-0000-0000-000000000001",
    code: "superadmin",
    allowed_menus: [
      "/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi",
      "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel",
      "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi",
      "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    code: "admin",
    allowed_menus: [
      "/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi",
      "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel",
      "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi",
      "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000003",
    code: "pengurus",
    allowed_menus: [
      "/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi",
      "/pengurus/pengurus", "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel",
      "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000004",
    code: "instruktur",
    allowed_menus: [
      "/instruktur", "/instruktur/penilaian", "/instruktur/rekap-nilai",
      "/instruktur/materi", "/instruktur/kegiatan", "/instruktur/anggota", "/instruktur/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000005",
    code: "anggota",
    allowed_menus: [
      "/kader", "/kader/kegiatan", "/kader/tugas", "/kader/sertifikat", "/kader/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000006",
    code: "peserta",
    allowed_menus: [
      "/peserta", "/peserta/status", "/peserta/berkas", "/peserta/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000011",
    code: "ketua_cabang",
    allowed_menus: [
      "/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi",
      "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel",
      "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi",
      "/admin/pengguna", "/admin/komisariat", "/admin/pengaturan", "/admin/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000012",
    code: "ketua_komisariat",
    allowed_menus: [
      "/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi",
      "/pengurus/pengurus", "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel",
      "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000013",
    code: "pengurus_cabang",
    allowed_menus: [
      "/admin", "/admin/kegiatan", "/admin/anggota", "/admin/kaderisasi",
      "/admin/pengurus", "/admin/surat", "/admin/arsip", "/admin/artikel",
      "/admin/penilaian", "/admin/rekap-nilai", "/admin/verifikasi",
      "/admin/komisariat", "/admin/profil"
    ]
  },
  {
    id: "b0000000-0000-0000-0000-000000000014",
    code: "pengurus_komisariat",
    allowed_menus: [
      "/pengurus", "/pengurus/kegiatan", "/pengurus/anggota", "/pengurus/kaderisasi",
      "/pengurus/surat", "/pengurus/arsip", "/pengurus/artikel",
      "/pengurus/penilaian", "/pengurus/rekap-nilai", "/pengurus/profil"
    ]
  }
];

export const ROLES_STORAGE_KEY = "PMII_ROLES_LIST";

/**
 * Mengambil seluruh daftar role dari database tabel public.roles
 */
export async function getRoles(): Promise<Role[]> {
  try {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        if (typeof window !== "undefined") {
          localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(data));
        }
        return data as Role[];
      }
    }
  } catch (err) {
    console.warn("[getRoles] Failed to fetch from Supabase:", err);
  }

  // Fallback ke LocalStorage atau DEFAULT_ROLES
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(ROLES_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }

  return DEFAULT_ROLES;
}

/**
 * Mencari role berdasarkan kode unik (misal: 'superadmin', 'admin', 'pengurus')
 */
export async function getRoleByCode(code: string): Promise<Role | null> {
  const roles = await getRoles();
  const c = code.toLowerCase().trim();
  return roles.find((r) => r.code.toLowerCase() === c) || null;
}

/**
 * Mencari role berdasarkan UUID role_id
 */
export async function getRoleById(id: string): Promise<Role | null> {
  const roles = await getRoles();
  return roles.find((r) => r.id === id) || null;
}

/**
 * Menyimpan / memperbarui role di database
 */
export async function upsertRole(role: Role): Promise<boolean> {
  return upsertTableRow<Role>("roles", ROLES_STORAGE_KEY, role);
}

/**
 * Menghapus role kustom (role sistem tidak boleh dihapus)
 */
export async function deleteRole(id: string): Promise<boolean> {
  return deleteTableRow("roles", ROLES_STORAGE_KEY, id);
}
