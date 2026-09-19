-- Migration: Add slug to articles table
-- Description: Menambahkan kolom slug untuk URL artikel yang ramah SEO

ALTER TABLE articles ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing articles with initial slugs
UPDATE articles 
SET slug = 'refleksi-mapaba-menumbuhkan-daya-kritis'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21' AND slug IS NULL;

UPDATE articles 
SET slug = 'meneguhkan-aswaja-an-nahdliyah'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' AND slug IS NULL;

UPDATE articles 
SET slug = 'modernisasi-persuratan-digital'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23' AND slug IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
