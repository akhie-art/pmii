-- Migration: Create indexes and triggers
-- Description: Optimasi indeks query dan fungsi trigger otomatis timestamp

-- 1. Index optimizations
CREATE INDEX IF NOT EXISTS idx_kader_commissariat_rayon ON kader(commissariat, rayon);
CREATE INDEX IF NOT EXISTS idx_kegiatan_commissariat ON kegiatan(commissariat);
CREATE INDEX IF NOT EXISTS idx_pengguna_email ON pengguna(email);
CREATE INDEX IF NOT EXISTS idx_pendaftaran_event ON pendaftaran("eventId");
CREATE INDEX IF NOT EXISTS idx_pengurus_commissariat ON pengurus(commissariat);
CREATE INDEX IF NOT EXISTS idx_persyaratan_level ON persyaratan(level);
CREATE INDEX IF NOT EXISTS idx_kurikulum_id ON kurikulum(id);
CREATE INDEX IF NOT EXISTS idx_surat_commissariat ON surat(commissariat);
CREATE INDEX IF NOT EXISTS idx_arsip_commissariat ON arsip(commissariat);

-- 2. Timestamp trigger functions
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

-- 3. Drop triggers if they exist
DROP TRIGGER IF EXISTS trg_komisariat_created_at ON komisariat;
DROP TRIGGER IF EXISTS trg_persyaratan_created_at ON persyaratan;
DROP TRIGGER IF EXISTS trg_pengurus_created_at ON pengurus;
DROP TRIGGER IF EXISTS trg_kegiatan_created_at ON kegiatan;
DROP TRIGGER IF EXISTS trg_pendaftaran_created_at ON pendaftaran;
DROP TRIGGER IF EXISTS trg_kader_created_at ON kader;
DROP TRIGGER IF EXISTS trg_surat_created_at ON surat;
DROP TRIGGER IF EXISTS trg_arsip_created_at ON arsip;
DROP TRIGGER IF EXISTS trg_kurikulum_created_at ON kurikulum;
DROP TRIGGER IF EXISTS trg_pengguna_created_at ON pengguna;
DROP TRIGGER IF EXISTS trg_kaderisasi_created_at ON kaderisasi;

-- 4. Bind triggers to created_at tables
CREATE TRIGGER trg_komisariat_created_at BEFORE INSERT ON komisariat FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_persyaratan_created_at BEFORE INSERT ON persyaratan FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_pengurus_created_at BEFORE INSERT ON pengurus FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kegiatan_created_at BEFORE INSERT ON kegiatan FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_pendaftaran_created_at BEFORE INSERT ON pendaftaran FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kader_created_at BEFORE INSERT ON kader FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_surat_created_at BEFORE INSERT ON surat FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_arsip_created_at BEFORE INSERT ON arsip FOR EACH ROW EXECUTE FUNCTION set_default_created_at();
CREATE TRIGGER trg_kurikulum_created_at BEFORE INSERT ON kurikulum FOR EACH ROW EXECUTE FUNCTION set_default_created_at();

-- 5. Bind triggers to createdAt tables
CREATE TRIGGER trg_pengguna_created_at BEFORE INSERT ON pengguna FOR EACH ROW EXECUTE FUNCTION set_default_created_at_camel();
CREATE TRIGGER trg_kaderisasi_created_at BEFORE INSERT ON kaderisasi FOR EACH ROW EXECUTE FUNCTION set_default_created_at_camel();
