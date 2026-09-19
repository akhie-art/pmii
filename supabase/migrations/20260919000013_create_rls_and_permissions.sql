-- Migration: Create RLS policies and permissions
-- Description: Row Level Security dan API Grants untuk anon dan authenticated

-- 1. Enable RLS
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

-- 2. Drop existing policies
DROP POLICY IF EXISTS "allow_select" ON komisariat;
DROP POLICY IF EXISTS "allow_insert" ON komisariat;
DROP POLICY IF EXISTS "allow_update" ON komisariat;
DROP POLICY IF EXISTS "allow_delete" ON komisariat;

DROP POLICY IF EXISTS "allow_select" ON persyaratan;
DROP POLICY IF EXISTS "allow_insert" ON persyaratan;
DROP POLICY IF EXISTS "allow_update" ON persyaratan;
DROP POLICY IF EXISTS "allow_delete" ON persyaratan;

DROP POLICY IF EXISTS "allow_select" ON pengurus;
DROP POLICY IF EXISTS "allow_insert" ON pengurus;
DROP POLICY IF EXISTS "allow_update" ON pengurus;
DROP POLICY IF EXISTS "allow_delete" ON pengurus;

DROP POLICY IF EXISTS "allow_select" ON kegiatan;
DROP POLICY IF EXISTS "allow_insert" ON kegiatan;
DROP POLICY IF EXISTS "allow_update" ON kegiatan;
DROP POLICY IF EXISTS "allow_delete" ON kegiatan;

DROP POLICY IF EXISTS "allow_select" ON pendaftaran;
DROP POLICY IF EXISTS "allow_insert" ON pendaftaran;
DROP POLICY IF EXISTS "allow_update" ON pendaftaran;
DROP POLICY IF EXISTS "allow_delete" ON pendaftaran;

DROP POLICY IF EXISTS "allow_select" ON kader;
DROP POLICY IF EXISTS "allow_insert" ON kader;
DROP POLICY IF EXISTS "allow_update" ON kader;
DROP POLICY IF EXISTS "allow_delete" ON kader;

DROP POLICY IF EXISTS "allow_select" ON pengguna;
DROP POLICY IF EXISTS "allow_insert" ON pengguna;
DROP POLICY IF EXISTS "allow_update" ON pengguna;
DROP POLICY IF EXISTS "allow_delete" ON pengguna;

DROP POLICY IF EXISTS "allow_select" ON kaderisasi;
DROP POLICY IF EXISTS "allow_insert" ON kaderisasi;
DROP POLICY IF EXISTS "allow_update" ON kaderisasi;
DROP POLICY IF EXISTS "allow_delete" ON kaderisasi;

DROP POLICY IF EXISTS "allow_select" ON kurikulum;
DROP POLICY IF EXISTS "allow_insert" ON kurikulum;
DROP POLICY IF EXISTS "allow_update" ON kurikulum;
DROP POLICY IF EXISTS "allow_delete" ON kurikulum;

DROP POLICY IF EXISTS "allow_select" ON surat;
DROP POLICY IF EXISTS "allow_insert" ON surat;
DROP POLICY IF EXISTS "allow_update" ON surat;
DROP POLICY IF EXISTS "allow_delete" ON surat;

DROP POLICY IF EXISTS "allow_select" ON arsip;
DROP POLICY IF EXISTS "allow_insert" ON arsip;
DROP POLICY IF EXISTS "allow_update" ON arsip;
DROP POLICY IF EXISTS "allow_delete" ON arsip;

-- 3. Apply CRUD Policies
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

-- 4. Grants to roles
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
