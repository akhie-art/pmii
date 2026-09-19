# Panduan Migrasi Database Supabase (Konsep ala Laravel)

Direktori `supabase/migrations/` ini menampung berkas-berkas migrasi SQL terstruktur per tabel dan fungsionalitas, mirip dengan konsep `database/migrations/` pada framework Laravel.

---

## 📂 Struktur Berkas Migrasi

| Urutan | Berkas Migrasi | Deskripsi |
|---|---|---|
| 01 | `20260919000001_create_komisariat_table.sql` | Tabel profil komisariat & binaan |
| 02 | `20260919000002_create_persyaratan_table.sql` | Tabel syarat penugasan RKTL / Follow Up |
| 03 | `20260919000003_create_pengurus_table.sql` | Tabel pengurus komisariat |
| 04 | `20260919000004_create_kegiatan_table.sql` | Tabel agenda & acara kaderisasi |
| 05 | `20260919000005_create_pendaftaran_table.sql` | Tabel pendaftaran calon anggota |
| 06 | `20260919000006_create_kader_table.sql` | Tabel utama database anggota & kader PMII |
| 07 | `20260919000007_create_pengguna_table.sql` | Tabel autentikasi & akun sistem pengguna |
| 08 | `20260919000008_create_kaderisasi_table.sql` | Tabel modul pelaksanaan kaderisasi |
| 09 | `20260919000009_create_kurikulum_table.sql` | Tabel kurikulum formal nasional (MAPABA, PKD, dll.) |
| 10 | `20260919000010_create_surat_table.sql` | Tabel persuratan digital masuk & keluar |
| 11 | `20260919000011_create_arsip_table.sql` | Tabel manajemen dokumen & arsip |
| 12 | `20260919000012_create_indexes_and_triggers.sql` | Indeks performa query & trigger auto-timestamp |
| 13 | `20260919000013_create_rls_and_permissions.sql` | Row Level Security (RLS) & Grants role |
| 14 | `20260919000014_create_storage_buckets.sql` | Bucket Supabase Storage 'materials' |
| 15 | `20260919000015_seed_initial_data.sql` | Data awal akun resmi & komisariat |

---

## 🛠️ Cara Menambah Migrasi Baru (Seperti Laravel)

Ketika Anda ingin menambahkan kolom baru, tabel baru, atau mengubah skema di masa depan:

1. Buat berkas baru di `supabase/migrations/` dengan awalan timestamp `YYYYMMDDHHMMSS_<nama_perubahan>.sql`.
   Contoh jika ingin menambah kolom `nomor_rekening` ke tabel `kader`:
   ```bash
   # Nama file: supabase/migrations/20260920000001_add_nomor_rekening_to_kader.sql
   ```
2. Isi file dengan perintah SQL `ALTER TABLE` atau `CREATE TABLE`:
   ```sql
   ALTER TABLE kader ADD COLUMN IF NOT EXISTS nomor_rekening TEXT;
   ```

---

## 🚀 Cara Menjalankan Migrasi

### Opsi 1: Menggunakan Supabase CLI (Rekomendasi)
Jika menggunakan Supabase CLI:
```bash
# Push semua migrasi baru ke database remote
npx supabase db push

# Atau reset database lokal sesuai urutan migrasi
npx supabase db reset
```

### Opsi 2: Menggunakan SQL Editor di Supabase Dashboard
Jika Anda tidak menggunakan Supabase CLI, Anda dapat membuka berkas migrasi yang diinginkan (atau berkas `combined_supabase_schema.sql` di root proyek) lalu menyalin dan menjalankannya (*Run*) langsung pada menu **SQL Editor** di Dashboard Supabase Anda.
