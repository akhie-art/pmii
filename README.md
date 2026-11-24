# SIAKAD Kaderisasi PMII (Multi-Tenant Platform)

Sistem Informasi Kaderisasi & Administrasi multi-komisariat untuk **Pergerakan Mahasiswa Islam Indonesia (PMII)** berbasis **Next.js 16 (App Router + Turbopack)**, **React 19**, **Tailwind CSS v4**, dan **Supabase (Auth, PostgreSQL + RLS, Storage)**.

## Fitur Utama

- **Publik:** Landing page organisasi, portal berita/opini (`/artikel`), profil tiap komisariat (`/komisariat/[slug]`), twibbon kegiatan (`/twibbon`), pendaftaran kegiatan kaderisasi (`/register`), serta verifikasi keanggotaan publik (`/api/verify-anggota`).
- **Portal Anggota (`/anggota`, `/kader`, `/peserta`):** Tahapan kaderisasi (MAPABA, PKD, PKL), materi & kuis pre/post-test, penilaian minat/bakat, unggah RTL/laporan, profil lengkap, KTA digital, dan generator CV (DOCX & ATS).
- **Dashboard Staf (`/admin`, `/pengurus`, `/instruktur`):** Manajemen anggota & impor/ekspor Excel, struktur kepengurusan, agenda & verifikasi pendaftaran kegiatan, penilaian & rekap nilai, persuratan dinamis berbasis template `.docx`, pengajuan SK berjenjang, arsip drive, artikel, galeri, serta manajemen pengguna & tenant.

## Arsitektur Keamanan

1. **Autentikasi & Otorisasi Server-Side:**
   - Sesi dikelola menggunakan `@supabase/ssr` berbasis cookie HTTP dan diverifikasi di server oleh [`proxy.ts`](./proxy.ts) (`supabase.auth.getUser()`).
   - Peran (`role`) dan `tenant_id` otoritatif disimpan di `auth.users.raw_app_meta_data` (tidak dapat dimodifikasi pengguna dari sisi klien) dan diverifikasi ulang oleh RPC `public.get_my_profile()`.
   - Tidak ada bypass kata sandi di sisi klien dan tidak ada penyimpanan kata sandi plaintext di `localStorage`.
2. **Row Level Security (RLS) & Tenant Isolation:**
   - Seluruh 17 tabel `public.*` mengaktifkan RLS dengan prinsip *least-privilege*.
   - Tabel PII/internal (`anggota`, `pendaftaran`, `evaluations`, `surat`, `surat_templates`, `arsip`, `pengajuan_sk`) diblokir total dari role `anon`.
   - Trigger `trg_protect_anggota_privileged_columns` mencegah eskalasi peran atau manipulasi status kelulusan oleh pengguna non-staf.
   - Seluruh RPC manajemen akun (`get_auth_users`, `create_auth_user`, `update_auth_user`, `delete_user_from_auth`) dicabut dari `anon` dan menegakkan hirarki peran serta isolasi tenant di database.
3. **Proteksi XSS & Dependensi:**
   - Seluruh konten HTML dinamis (artikel, surat, template, pratinjau spreadsheet) disanitasi menggunakan `isomorphic-dompurify` ([`lib/sanitize.ts`](./lib/sanitize.ts)).
   - Ekspor/impor Excel menggunakan `exceljs` ([`lib/excel.ts`](./lib/excel.ts)) menggantikan paket `xlsx` yang rentan.

## Setup Lokal

1. Salin file environment:
   ```bash
   cp .env.example .env.local
   ```
   Isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_APP_URL`.

2. Install dependensi:
   ```bash
   npm install
   ```

3. Terapkan migrasi database ke Supabase:
   ```bash
   npm run db:push
   ```

4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

## Skrip Tersedia

| Perintah | Deskripsi |
|---|---|
| `npm run dev` | Menjalankan Next.js dev server |
| `npm run build` | Build produksi (Turbopack + TypeScript check) |
| `npm run lint` | Menjalankan ESLint pada seluruh kode |
| `npm test` | Menjalankan unit test suite (Vitest) |
| `npm run db:push` | Mendorong migrasi SQL ke Supabase remote |
