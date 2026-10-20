# Dokumentasi Database & Migrasi Supabase

Struktur direktori `supabase/` dikonfigurasi mengikuti pola migrasi modular terstruktur (*Laravel-style migrations*) dan integrasi resmi dengan **Supabase CLI**.

---

## 📂 Struktur Direktori

```text
supabase/
├── config.toml           # Konfigurasi project Supabase CLI
├── README.md             # Dokumentasi arsitektur dan panduan migrasi
├── seed.sql              # Master seed runner (dieksekusi saat: supabase db reset)
├── seeder/
│   └── admin_seeder.sql  # Seeder akun resmi Admin Pengurus Cabang
└── migrations/           # 66 berkas migrasi SQL berurutan (timestamp)
```

---

## 🏛️ Arsitektur Multi-Tenancy (`public.tenant`)

Mulai dari migrasi `20261015000003_rename_komisariat_to_tenant_and_standardize_foreign_keys.sql`:
- **Tabel Master**: `public.tenant` (menggantikan nama lama `komisariat`).
- **Tingkatan Tenant (`level` / `type`)**:
  - `CABANG`: Pengurus Cabang PMII Grobogan (`c0000000-0000-0000-0000-000000000001`).
  - `KOMISARIAT`: 4 Komisariat Kampus binaan (Ki Ageng Getas Pendawa, Ki Ageng Tarub, Ajisaka, Joko Suro).
- **Foreign Key**: Seluruh tabel operasional (`kegiatan`, `pengurus`, `surat`, `arsip`, `articles`, `evaluations`, `surat_templates`, `anggota`, `pendaftaran`, `persyaratan`, `kaderisasi`) menggunakan:
  ```sql
  tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE
  ```
- **Backward Compatibility**: View `public.komisariat AS SELECT * FROM public.tenant` tersedia sehingga sistem lama tetap berjalan lancar.

---

## 🚀 Perintah Operasional Database

Proyek ini telah menyediakan pintasan di `package.json`:

```bash
# Push semua migrasi baru ke database remote Supabase
npm run db:push

# Reset database lokal dan jalankan seeder
npm run db:reset
```

Atau menggunakan Supabase CLI langsung:
```bash
npx supabase migration list    # Cek sinkronisasi migrasi lokal vs remote
npx supabase db push           # Menerapkan migrasi ke remote
```

---

## 🌾 Seeder Database

- File master seeder berada di `supabase/seed.sql` yang secara modular memanggil `supabase/seeder/admin_seeder.sql`.
- Menghapus seluruh data operasional, dummy, dan akun lama dari database.
- **Kredensial Seeder Bawaan**:
  - **Email**: `admin@pmii.org`
  - **Password**: `admin123`
  - **Role**: `superadmin`
  - **Nama**: `Super Administrator PMII`
  - **Lingkup**: Global Multi-Tenancy (Bisa mengelola seluruh tenant)
