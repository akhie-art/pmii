import type { UserAccount } from "@/lib/db";

export interface MenuItemConfig {
  group: string;
  name: string;
  href: string;
  defaultRoles: string[];
}

export const AVAILABLE_MENUS: MenuItemConfig[] = [
  { group: "Utama", name: "Dashboard", href: "/dashboard", defaultRoles: ["admin", "superadmin", "pengurus", "instruktur", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Keanggotaan & Struktur", name: "Data Komisariat", href: "/dashboard/komisariat", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Keanggotaan & Struktur", name: "Database Anggota", href: "/dashboard/anggota", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Keanggotaan & Struktur", name: "Data Pengurus", href: "/dashboard/pengurus", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Sistem Kaderisasi", href: "/dashboard/kaderisasi", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Penilaian Peserta", href: "/dashboard/penilaian", defaultRoles: ["admin", "superadmin", "pengurus", "instruktur", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Rekap & Yudisium", href: "/dashboard/rekap-nilai", defaultRoles: ["admin", "superadmin", "pengurus", "instruktur", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Materi & Kurikulum", href: "/dashboard/materi", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Kegiatan & Acara", href: "/dashboard/kegiatan", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Kaderisasi & Pembinaan", name: "Verifikasi RKTL", href: "/dashboard/verifikasi", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang"] },
  { group: "Administrasi & Dokumen", name: "Surat Menyurat", href: "/dashboard/surat", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Administrasi & Dokumen", name: "Arsip Dokumen", href: "/dashboard/arsip", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Publikasi & Media", name: "Artikel & Berita", href: "/dashboard/artikel", defaultRoles: ["admin", "superadmin", "pengurus", "ketua_cabang", "pengurus_cabang", "ketua_komisariat", "pengurus_komisariat"] },
  { group: "Konfigurasi & Pengaturan", name: "Manajemen Pengguna", href: "/dashboard/pengguna", defaultRoles: ["admin", "superadmin", "ketua_cabang"] },
  { group: "Konfigurasi & Pengaturan", name: "Pengaturan Sistem", href: "/dashboard/pengaturan", defaultRoles: ["admin", "superadmin", "ketua_cabang"] },
];

/**
 * Dynamic badge color styling based on role level hierarchy from the database
 */
export function formatRoleName(roleCode?: string): string {
  if (!roleCode) return "-";
  const r = roleCode.toLowerCase().trim();
  if (r === "ketua_cabang" || r === "ketua cabang") return "Ketua Cabang";
  if (r === "ketua_komisariat" || r === "ketua komisariat") return "Ketua Komisariat";
  if (r === "pengurus_cabang" || r === "pengurus cabang") return "Pengurus Cabang";
  if (r === "pengurus_komisariat" || r === "pengurus komisariat") return "Pengurus Komisariat";
  if (r === "superadmin" || r === "super_admin" || r === "super admin") return "Super Administrator";
  if (r === "admin" || r === "cabang" || r === "pc") return "Pengurus Cabang";
  if (r === "pengurus" || r === "komisariat" || r === "pk") return "Pengurus Komisariat";
  if (r === "instruktur") return "Instruktur Cabang";
  if (r === "anggota" || r === "kader") return "Anggota / Kader";
  if (r === "peserta" || r === "calon") return "Peserta (Calon Anggota)";
  return roleCode.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function getRoleBadgeClass(level?: number, roleCode?: string): string {
  const code = (roleCode || "").toLowerCase().trim();

  if (code.includes("super")) {
    return "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-900/60 font-semibold";
  }
  if (code === "ketua_cabang" || code === "ketua cabang") {
    return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/60 font-semibold";
  }
  if (code === "ketua_komisariat" || code === "ketua komisariat") {
    return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800 font-semibold";
  }
  if (code.includes("cabang") || code === "admin") {
    return "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60";
  }
  if (code.includes("pengurus") || code.includes("komisariat")) {
    return "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60";
  }
  if (code.includes("instruktur")) {
    return "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/60";
  }
  if (code.includes("anggota") || code.includes("kader")) {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60";
  }
  return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
}

export const isMasterAdmin = (u: UserAccount | null) => {
  if (!u) return false;
  const roleLower = (u.role || "").trim().toLowerCase();
  return (
    roleLower === "superadmin" ||
    roleLower === "super_admin"
  );
};
