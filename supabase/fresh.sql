-- ============================================================================
-- SUPABASE MIGRATE: FRESH (DROP ALL + RECREATE + RLS + STORAGE + SEED)
-- Project: PK PMII Ki Ageng Getas Pendawa
-- ============================================================================

-- -------------------------------------------------------------
-- 0. FRESH RESET (DROP & RECREATE PUBLIC SCHEMA)
-- -------------------------------------------------------------
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------
-- 1. CREATE ALL TABLES (WITH UUID PRIMARY KEYS)
-- -------------------------------------------------------------

-- Table: komisariat
CREATE TABLE komisariat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  "establishedDate" DATE,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  "logoInitial" TEXT,
  "contactEmail" TEXT,
  accreditation TEXT NOT NULL DEFAULT 'A',
  structure JSONB DEFAULT '{}'::jsonb,
  rayons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: persyaratan
CREATE TABLE persyaratan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'FILE',
  category TEXT,
  "minSubmissions" INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: pengurus
CREATE TABLE pengurus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT DEFAULT 'pengurus',
  position TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT DEFAULT '',
  period TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  department TEXT,
  gender TEXT,
  status TEXT DEFAULT 'AKTIF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: kegiatan
CREATE TABLE kegiatan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  sessions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: pendaftaran
CREATE TABLE pendaftaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL,
  "cadreName" TEXT NOT NULL,
  "cadreRayon" TEXT DEFAULT '',
  "cadreEmail" TEXT NOT NULL,
  "dateApplied" DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  "verificationStatus" JSONB NOT NULL DEFAULT '{}'::jsonb,
  attendance JSONB NOT NULL DEFAULT '[]'::jsonb,
  "isGraduated" BOOLEAN DEFAULT false,
  "registrationNumber" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: kader
CREATE TABLE kader (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  level TEXT DEFAULT 'MAPABA',
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT DEFAULT '',
  "startDate" DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  submissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  phone TEXT,
  email TEXT,
  password TEXT,
  role TEXT DEFAULT 'anggota',
  address TEXT,
  instagram TEXT,
  "isGraduated" BOOLEAN DEFAULT false,
  nta TEXT,
  nipa TEXT,
  "registrationNumber" TEXT,
  angkatan TEXT,
  "memberStatus" TEXT DEFAULT 'Aktif',
  jabatan TEXT,
  gender TEXT,
  history JSONB DEFAULT '[]'::jsonb,
  provinsi TEXT,
  kabupaten TEXT,
  kecamatan TEXT,
  nik TEXT,
  "ktpName" TEXT,
  "tempatLahir" TEXT,
  "tanggalLahir" TEXT,
  "alamatRumah" TEXT,
  "alamatDomisili" TEXT,
  "pendidikanSD" TEXT,
  "pendidikanSMP" TEXT,
  "pendidikanSMA" TEXT,
  "perguruanTinggi" TEXT,
  fakultas TEXT,
  jurusan TEXT,
  "ktmName" TEXT,
  twitter TEXT,
  facebook TEXT,
  "pasFotoName" TEXT,
  avatar TEXT,
  "riwayatPenyakit" TEXT,
  "golonganDarah" TEXT,
  "organisasiSD" TEXT,
  "organisasiSMP" TEXT,
  "organisasiSMA" TEXT,
  "organisasiPT" TEXT,
  "orientasiProfetik" TEXT,
  "minatPassion" TEXT,
  "motivasiMapaba" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: pengguna
CREATE TABLE pengguna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'peserta',
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'AKTIF',
  "allowedMenus" TEXT[] DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: kaderisasi
CREATE TABLE kaderisasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  tipe TEXT NOT NULL,
  "formFields" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "materi" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: kurikulum
CREATE TABLE kurikulum (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  syllabus JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  quiz JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_kurikulum_name UNIQUE (name)
);

-- Table: surat
CREATE TABLE surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomor TEXT NOT NULL,
  type TEXT NOT NULL,
  "senderOrRecipient" TEXT NOT NULL,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  classification TEXT NOT NULL,
  status TEXT NOT NULL,
  content TEXT NOT NULL,
  "senderTitle" TEXT,
  "senderLocation" TEXT,
  "dateIndo" TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: arsip
CREATE TABLE arsip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  year TEXT NOT NULL,
  size TEXT NOT NULL,
  access TEXT NOT NULL,
  "uploadedDate" TEXT NOT NULL,
  uploader TEXT NOT NULL,
  downloads INTEGER DEFAULT 0 NOT NULL,
  description TEXT,
  "isStarred" BOOLEAN DEFAULT false NOT NULL,
  url TEXT,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  rayon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: articles
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Kaderisasi',
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  "authorName" TEXT NOT NULL,
  "authorRole" TEXT DEFAULT 'Pengurus',
  "authorInitials" TEXT DEFAULT 'PM',
  image TEXT NOT NULL DEFAULT '/image/kaderisasi.jpg',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DITAMPILKAN',
  views INTEGER DEFAULT 0 NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  commissariat TEXT DEFAULT 'Ki Ageng Getas Pendawa',
  slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_articles_slug ON articles(slug);

-- -------------------------------------------------------------
-- 2. INDEXES & PERFORMANCE OPTIMIZATIONS
-- -------------------------------------------------------------
CREATE INDEX idx_kader_commissariat_rayon ON kader(commissariat, rayon);
CREATE INDEX idx_kegiatan_commissariat ON kegiatan(commissariat);
CREATE INDEX idx_pengguna_email ON pengguna(email);
CREATE INDEX idx_pendaftaran_event ON pendaftaran("eventId");
CREATE INDEX idx_pengurus_commissariat ON pengurus(commissariat);
CREATE INDEX idx_persyaratan_level ON persyaratan(level);
CREATE INDEX idx_kurikulum_id ON kurikulum(id);
CREATE INDEX idx_surat_commissariat ON surat(commissariat);
CREATE INDEX idx_arsip_commissariat ON arsip(commissariat);
CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- -------------------------------------------------------------
-- 3. AUTOMATIC TIMESTAMP TRIGGERS
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_default_created_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_default_created_at_camel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."createdAt" IS NULL THEN
    NEW."createdAt" := timezone('utc'::text, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_komisariat_created_at BEFORE INSERT ON komisariat FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_persyaratan_created_at BEFORE INSERT ON persyaratan FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_pengurus_created_at BEFORE INSERT ON pengurus FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kegiatan_created_at BEFORE INSERT ON kegiatan FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_pendaftaran_created_at BEFORE INSERT ON pendaftaran FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kader_created_at BEFORE INSERT ON kader FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_surat_created_at BEFORE INSERT ON surat FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_arsip_created_at BEFORE INSERT ON arsip FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kurikulum_created_at BEFORE INSERT ON kurikulum FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_articles_created_at BEFORE INSERT ON articles FOR EACH ROW EXECUTE FUNCTION set_default_created_at();

CREATE TRIGGER trg_pengguna_created_at BEFORE INSERT ON pengguna FOR EACH ROW EXECUTE FUNCTION set_default_created_at_camel();
CREATE TRIGGER trg_kaderisasi_created_at BEFORE INSERT ON kaderisasi FOR EACH ROW EXECUTE FUNCTION set_default_created_at_camel();

-- -------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES & GRANTS
-- -------------------------------------------------------------
ALTER TABLE komisariat ENABLE ROW LEVEL SECURITY;
ALTER TABLE persyaratan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengurus ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendaftaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE kader ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengguna ENABLE ROW LEVEL SECURITY;
ALTER TABLE kaderisasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurikulum ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE arsip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select" ON komisariat FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON komisariat FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON komisariat FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON komisariat FOR DELETE USING (true);

CREATE POLICY "allow_select" ON persyaratan FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON persyaratan FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON persyaratan FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON persyaratan FOR DELETE USING (true);

CREATE POLICY "allow_select" ON pengurus FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON pengurus FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON pengurus FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON pengurus FOR DELETE USING (true);

CREATE POLICY "allow_select" ON kegiatan FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON kegiatan FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON kegiatan FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON kegiatan FOR DELETE USING (true);

CREATE POLICY "allow_select" ON pendaftaran FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON pendaftaran FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON pendaftaran FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON pendaftaran FOR DELETE USING (true);

CREATE POLICY "allow_select" ON kader FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON kader FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON kader FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON kader FOR DELETE USING (true);

CREATE POLICY "allow_select" ON pengguna FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON pengguna FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON pengguna FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON pengguna FOR DELETE USING (true);

CREATE POLICY "allow_select" ON kaderisasi FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON kaderisasi FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON kaderisasi FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON kaderisasi FOR DELETE USING (true);

CREATE POLICY "allow_select" ON kurikulum FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON kurikulum FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON kurikulum FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON kurikulum FOR DELETE USING (true);

CREATE POLICY "allow_select" ON surat FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON surat FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON surat FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON surat FOR DELETE USING (true);

CREATE POLICY "allow_select" ON arsip FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON arsip FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON arsip FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON arsip FOR DELETE USING (true);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_select" ON articles FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON articles FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON articles FOR DELETE USING (true);

GRANT ALL ON TABLE komisariat TO anon, authenticated;
GRANT ALL ON TABLE persyaratan TO anon, authenticated;
GRANT ALL ON TABLE pengurus TO anon, authenticated;
GRANT ALL ON TABLE kegiatan TO anon, authenticated;
GRANT ALL ON TABLE pendaftaran TO anon, authenticated;
GRANT ALL ON TABLE kader TO anon, authenticated;
GRANT ALL ON TABLE pengguna TO anon, authenticated;
GRANT ALL ON TABLE kaderisasi TO anon, authenticated;
GRANT ALL ON TABLE kurikulum TO anon, authenticated;
GRANT ALL ON TABLE surat TO anon, authenticated;
GRANT ALL ON TABLE arsip TO anon, authenticated;
GRANT ALL ON TABLE articles TO anon, authenticated;

-- -------------------------------------------------------------
-- 5. STORAGE BUCKETS CONFIGURATION
-- -------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Select Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Materials" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete Materials" ON storage.objects;

CREATE POLICY "Public Select Materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Public Insert Materials" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Public Update Materials" ON storage.objects FOR UPDATE USING (bucket_id = 'materials') WITH CHECK (bucket_id = 'materials');
CREATE POLICY "Public Delete Materials" ON storage.objects FOR DELETE USING (bucket_id = 'materials');

-- -------------------------------------------------------------
-- 6. SEED DATA (OFFICIAL INITIAL DATA)
-- -------------------------------------------------------------

-- 6.1. AKUN SEED BERDASARKAN 4 ROLE RESMI
INSERT INTO pengguna (id, name, email, password, role, commissariat, rayon, status)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'Admin PK PMII Ki Ageng Getas Pendawa', 'admin@pmii.org', 'password', 'admin', 'Ki Ageng Getas Pendawa', 'Komisariat', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::uuid, 'Pengurus PK PMII Ki Ageng Getas Pendawa', 'pengurus@pmii.org', 'password', 'pengurus', 'Ki Ageng Getas Pendawa', 'Komisariat', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::uuid, 'Sahabat Anggota (Kader Resmi)', 'anggota@pmii.org', 'password', 'anggota', 'Ki Ageng Getas Pendawa', 'Tarbiyah', 'AKTIF'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::uuid, 'Calon Anggota (Peserta MAPABA)', 'peserta@pmii.org', 'password', 'peserta', 'Ki Ageng Getas Pendawa', 'Syari''ah', 'AKTIF')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  commissariat = EXCLUDED.commissariat,
  rayon = EXCLUDED.rayon,
  status = EXCLUDED.status;

-- 6.2. DATA RESMI KOMISARIAT
INSERT INTO komisariat (
  id, 
  name, 
  university, 
  "establishedDate", 
  status, 
  "logoInitial", 
  "contactEmail", 
  accreditation, 
  structure, 
  rayons
)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::uuid,
  'PK PMII Ki Ageng Getas Pendawa',
  'Komisariat Ki Ageng Getas Pendawa',
  '1970-04-17',
  'AKTIF',
  'KGP',
  '-',
  'A',
  '{"chairman": "-", "secretary": "-", "treasurer": "-", "period": "2026 - 2027"}'::jsonb,
  '[
    {"id": "ray-syariah", "name": "Rayon Syari''ah (Fakultas Syari''ah dan Hukum)", "memberCount": 0},
    {"id": "ray-tarbiyah", "name": "Rayon Tarbiyah (FITK)", "memberCount": 0},
    {"id": "ray-ushuluddin", "name": "Rayon Ushuluddin (FUHUM)", "memberCount": 0},
    {"id": "ray-dakwah", "name": "Rayon Dakwah (FDK)", "memberCount": 0},
    {"id": "ray-febi", "name": "Rayon FEBI (Ekonomi & Bisnis Islam)", "memberCount": 0},
    {"id": "ray-fst", "name": "Rayon FST (Sains & Teknologi)", "memberCount": 0},
    {"id": "ray-fpk", "name": "Rayon FPK (Psikologi & Kesehatan)", "memberCount": 0},
    {"id": "ray-fisip", "name": "Rayon FISIP (Ilmu Sosial & Ilmu Politik)", "memberCount": 0},
    {"id": "ray-pasca", "name": "Rayon Pascasarjana", "memberCount": 0}
  ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  university = EXCLUDED.university,
  "logoInitial" = COALESCE(komisariat."logoInitial", EXCLUDED."logoInitial"),
  "contactEmail" = COALESCE(komisariat."contactEmail", EXCLUDED."contactEmail"),
  structure = CASE 
    WHEN komisariat.structure IS NULL OR komisariat.structure = '{}'::jsonb 
    THEN EXCLUDED.structure 
    ELSE komisariat.structure 
  END,
  rayons = CASE 
    WHEN komisariat.rayons IS NULL OR komisariat.rayons = '[]'::jsonb 
    THEN EXCLUDED.rayons 
    ELSE komisariat.rayons 
  END;

-- 6.3. DATA SEED KURIKULUM FORMAL NASIONAL PMII
INSERT INTO kurikulum (
  id,
  name,
  syllabus,
  materials,
  quiz
)
VALUES
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::uuid, 'MAPABA', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::uuid, 'PKD', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::uuid, 'PKL', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::uuid, 'PKN', '[]'::jsonb, '[]'::jsonb, '[]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  syllabus = CASE 
    WHEN kurikulum.syllabus IS NULL OR kurikulum.syllabus = '[]'::jsonb 
    THEN EXCLUDED.syllabus 
    ELSE kurikulum.syllabus 
  END,
  materials = CASE 
    WHEN kurikulum.materials IS NULL OR kurikulum.materials = '[]'::jsonb 
    THEN EXCLUDED.materials 
    ELSE kurikulum.materials 
  END,
  quiz = CASE 
    WHEN kurikulum.quiz IS NULL OR kurikulum.quiz = '[]'::jsonb 
    THEN EXCLUDED.quiz 
    ELSE kurikulum.quiz 
  END;

-- 8. SEED DATA ARTIKEL
INSERT INTO articles (
  id,
  title,
  category,
  excerpt,
  content,
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
  'M. Zulkarnain',
  'Ketua Komisariat',
  'MZ',
  '/image/landing_page.png',
  '["Aswaja", "Ideologi", "Kebangsaan"]'::jsonb,
  'DITAMPILKAN',
  520,
  64,
  'Ki Ageng Getas Pendawa',
  '2026-09-12 09:30:00+00'
),
(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23'::uuid,
  'Modernisasi Persuratan Digital: Efisiensi Birokrasi Menuju Organisasi Adaptif',
  'Tata Kelola',
  'Transformasi pengelolaan arsip, nomor surat digital, dan verifikasi sertifikat mempercepat akselerasi kerja-kerja organisasi di tingkat komisariat dan rayon.',
  '["Era digital mengharuskan organisasi pergerakan untuk mereformasi tata kelola administrasinya. Ketertiban surat-menyurat dan keabsahan dokumen adalah cerminan profesionalisme sebuah organisasi kader yang maju.", "Dengan implementasi portal digital terpadu di PK PMII Ki Ageng Getas Pendawa, proses penerbitan nomor surat resmi, legalisir sertifikat pelatihan, dan pencatatan inventaris kini dapat diselesaikan secara terverifikasi dalam hitungan menit.", "Sistem ini tidak hanya menghemat penggunaan kertas dan ruang arsip fisik, namun juga menghadirkan keterbukaan data riwayat kader yang transparan dan akuntabel bagi seluruh pengurus."]'::jsonb,
  'Siti Rahmawati',
  'Sekretaris Komisariat',
  'SR',
  '/image/administrasi.jpg',
  '["Digitalisasi", "Administrasi", "Tata Kelola"]'::jsonb,
  'DITAMPILKAN',
  285,
  35,
  'Ki Ageng Getas Pendawa',
  '2026-09-08 14:15:00+00'
)
ON CONFLICT (id) DO NOTHING;

