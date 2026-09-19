-- Migration: Create articles table
-- Description: Manajemen Artikel, Warta, dan Opini Pergerakan PK PMII Ki Ageng Getas Pendawa

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create Table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Kaderisasi',
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  date TEXT NOT NULL,
  "readTime" TEXT DEFAULT '5 mnt baca',
  "authorName" TEXT NOT NULL,
  "authorRole" TEXT DEFAULT 'Pengurus',
  "authorInitials" TEXT DEFAULT 'PM',
  image TEXT NOT NULL DEFAULT '/image/kaderisasi.jpg',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DITAMPILKAN',
  views INTEGER DEFAULT 0 NOT NULL,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles (status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles (category);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_commissariat ON articles (commissariat);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 4. Policies (allow full access for anon & authenticated)
DROP POLICY IF EXISTS "allow_select" ON articles;
DROP POLICY IF EXISTS "allow_insert" ON articles;
DROP POLICY IF EXISTS "allow_update" ON articles;
DROP POLICY IF EXISTS "allow_delete" ON articles;

CREATE POLICY "allow_select" ON articles FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON articles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON articles FOR DELETE USING (true);

-- 5. API Role Grants
GRANT ALL ON TABLE articles TO anon, authenticated, service_role;

-- 6. Seed Initial Data
INSERT INTO articles (
  id,
  title,
  category,
  excerpt,
  content,
  date,
  "readTime",
  "authorName",
  "authorRole",
  "authorInitials",
  image,
  tags,
  status,
  views,
  commissariat,
  created_at
) VALUES 
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21'::uuid,
  'Refleksi Mapaba: Menumbuhkan Daya Kritis & Komitmen Nilai Kader Ulul Albab',
  'Kaderisasi',
  'Masa Penerimaan Anggota Baru (Mapaba) bukan sekadar gerbang masuk, melainkan ruang pembongkaran stagnasi berpikir mahasiswa.',
  '["Masa Penerimaan Anggota Baru (Mapaba) merupakan fase inisiasi paling sakral dalam perjalanan seorang kader PMII. Di sini, nilai-nilai dasar pergerakan (NDP) diperkenalkan bukan hanya sebagai doktrin teks kaku, melainkan sebagai kacamata analitis dalam membedah realitas sosial-kemasyarakatan.", "Tantangan generasi muda di era serbuan informasi menuntut kader PMII untuk memiliki daya saring intelektual yang kokoh. Paradigma kritis transformatif mendorong setiap anggota untuk tidak pasif menerima narasi dominan, melainkan senantiasa bertanya dan menghadirkan solusi konkret.", "Melalui kaderisasi yang terstruktur dan pendampingan pasca-Mapaba, PK PMII Ki Ageng Getas Pendawa berkomitmen melahirkan pribadi Ulul Albab yang memadukan kedalaman spiritual, keluasan ilmu pengetahuan, dan ketulusan pengabdian sosial."]'::jsonb,
  '18 Sep 2026',
  '5 mnt baca',
  'Ahmad Farisi',
  'Biro Kaderisasi & Litbang',
  'AF',
  '/image/kaderisasi.jpg',
  '["Mapaba", "Kaderisasi", "Ulul Albab"]'::jsonb,
  'DITAMPILKAN',
  342,
  'Ki Ageng Getas Pendawa',
  '2026-09-18 08:00:00+00'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'::uuid,
  'Meneguhkan Aswaja An-Nahdliyah dalam Dinamika Kebangsaan Kontemporer',
  'Opini & Pergerakan',
  'Prinsip tawasuth, tawazun, tasamuh, dan i''tidal menjadi kompas moral kader pergerakan dalam mengawal keutuhan bangsa dan keadilan sosial.',
  '["Ahlussunnah wal Jama''ah (Aswaja) bukan sekadar madzhab pemikiran keagamaan, melainkan manhaj al-fikr (metodologi berpikir) yang lentur namun kokoh dalam merespons dinamika perubahan zaman.", "Kader PMII Ki Ageng Getas Pendawa senantiasa menginternalisasikan empat pilar Aswaja: Tawasuth (moderat), Tawazun (seimbang), Tasamuh (toleran), dan I''tidal (adil). Keempat nilai ini menjadi benteng penangkal ekstremisme sekaligus pendorong perjuangan membela kaum mustadh''afin.", "Di tengah polarisasi wacana dan tantangan kebangsaan, kehadiran kader PMII yang inklusif dan berakar pada tradisi keilmuan pesantren merupakan modal sosial penting bagi peradaban kemanusiaan."]'::jsonb,
  '12 Sep 2026',
  '6 mnt baca',
  'M. Zulkarnain',
  'Ketua Komisariat',
  'MZ',
  '/image/landing_page.png',
  '["Aswaja", "Ideologi", "Kebangsaan"]'::jsonb,
  'DITAMPILKAN',
  520,
  'Ki Ageng Getas Pendawa',
  '2026-09-12 09:30:00+00'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23'::uuid,
  'Modernisasi Persuratan Digital: Efisiensi Birokrasi Menuju Organisasi Adaptif',
  'Tata Kelola',
  'Transformasi pengelolaan arsip, nomor surat digital, dan verifikasi sertifikat mempercepat akselerasi kerja-kerja organisasi di tingkat komisariat dan rayon.',
  '["Era digital mengharuskan organisasi pergerakan untuk mereformasi tata kelola administrasinya. Ketertiban surat-menyurat dan keabsahan dokumen adalah cerminan profesionalisme sebuah organisasi kader yang maju.", "Dengan implementasi portal digital terpadu di PK PMII Ki Ageng Getas Pendawa, proses penerbitan nomor surat resmi, legalisir sertifikat pelatihan, dan pencatatan inventaris kini dapat diselesaikan secara terverifikasi dalam hitungan menit.", "Sistem ini tidak hanya menghemat penggunaan kertas dan ruang arsip fisik, namun juga menghadirkan keterbukaan data riwayat kader yang transparan dan akuntabel bagi seluruh pengurus."]'::jsonb,
  '08 Sep 2026',
  '4 mnt baca',
  'Siti Rahmawati',
  'Sekretaris Komisariat',
  'SR',
  '/image/administrasi.jpg',
  '["Digitalisasi", "Administrasi", "Tata Kelola"]'::jsonb,
  'DITAMPILKAN',
  285,
  'Ki Ageng Getas Pendawa',
  '2026-09-08 14:15:00+00'
)
ON CONFLICT (id) DO NOTHING;
