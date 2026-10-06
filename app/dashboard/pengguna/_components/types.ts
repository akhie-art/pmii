import type { UserAccount } from "@/lib/db";

export interface MenuItemConfig {
  group: string;
  name: string;
  href: string;
  defaultRoles: string[];
}

export const AVAILABLE_MENUS: MenuItemConfig[] = [
  { group: "Utama", name: "Dashboard", href: "/dashboard", defaultRoles: ["admin", "pengurus", "instruktur", "ADMIN", "PENGURUS", "INSTRUKTUR", "KOMISARIAT"] },
  { group: "Keanggotaan & Struktur", name: "Database Anggota", href: "/dashboard/anggota", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS", "KOMISARIAT"] },
  { group: "Keanggotaan & Struktur", name: "Data Pengurus", href: "/dashboard/pengurus", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Sistem Kaderisasi", href: "/dashboard/kaderisasi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Penilaian Peserta", href: "/dashboard/penilaian", defaultRoles: ["admin", "pengurus", "instruktur", "ADMIN", "PENGURUS", "INSTRUKTUR"] },
  { group: "Kaderisasi & Pembinaan", name: "Rekap & Yudisium", href: "/dashboard/rekap-nilai", defaultRoles: ["admin", "pengurus", "instruktur", "ADMIN", "PENGURUS", "INSTRUKTUR"] },
  { group: "Kaderisasi & Pembinaan", name: "Materi & Kurikulum", href: "/dashboard/materi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Kegiatan & Acara", href: "/dashboard/kegiatan", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Kaderisasi & Pembinaan", name: "Verifikasi RKTL", href: "/dashboard/verifikasi", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Administrasi & Dokumen", name: "Surat Menyurat", href: "/dashboard/surat", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Administrasi & Dokumen", name: "Arsip Dokumen", href: "/dashboard/arsip", defaultRoles: ["admin", "pengurus", "ADMIN", "PENGURUS"] },
  { group: "Konfigurasi & Pengaturan", name: "Manajemen Pengguna", href: "/dashboard/pengguna", defaultRoles: ["admin", "ADMIN"] },
  { group: "Konfigurasi & Pengaturan", name: "Pengaturan Sistem", href: "/dashboard/pengaturan", defaultRoles: ["admin", "ADMIN"] },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  pengurus: "Pengurus",
  komisariat: "Pengurus",
  instruktur: "Instruktur",
  anggota: "Anggota",
  peserta: "Peserta",
};

export const ROLE_BADGE: Record<string, string> = {
  admin: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60",
  pengurus: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60",
  komisariat: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/60",
  instruktur: "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/60",
  anggota: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60",
  peserta: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60",
};

export const isMasterAdmin = (u: UserAccount | null) => {
  if (!u) return false;
  return u.email === "akhienajhan@gmail.com" || (u.role.toLowerCase() === "admin" && u.name.toLowerCase().includes("akhie"));
};
