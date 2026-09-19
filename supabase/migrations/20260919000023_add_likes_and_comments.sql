-- Migration: Add likes to articles and create article_comments table
-- Description: Fitur apresiasi (Like) dan komentar untuk artikel publik PMII

-- 1. Add likes column to articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0 NOT NULL;

-- 2. Create article_comments table
CREATE TABLE IF NOT EXISTS article_comments (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT DEFAULT 'Sahabat / Kader',
  user_avatar TEXT DEFAULT 'PM',
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments (article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_created_at ON article_comments (created_at DESC);

-- 4. Enable RLS
ALTER TABLE article_comments ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "allow_select" ON article_comments;
DROP POLICY IF EXISTS "allow_insert" ON article_comments;
DROP POLICY IF EXISTS "allow_update" ON article_comments;
DROP POLICY IF EXISTS "allow_delete" ON article_comments;

CREATE POLICY "allow_select" ON article_comments FOR SELECT USING (true);
CREATE POLICY "allow_insert" ON article_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_update" ON article_comments FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "allow_delete" ON article_comments FOR DELETE USING (true);

-- 6. Grant Permissions
GRANT ALL ON TABLE article_comments TO anon, authenticated, service_role;

-- 7. Seed Initial Comments
INSERT INTO article_comments (id, article_id, user_name, user_role, user_avatar, content, likes, created_at)
VALUES
(
  'comm-1',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
  'Sahabat Budi Santoso',
  'Kader Mapaba 2026',
  'BS',
  'Tulisan yang sangat membuka wawasan sahabat! Refleksi Mapaba ini benar-benar mengingatkan kita bahwa kaderisasi adalah proses merawat komitmen nilai dan integritas kader.',
  12,
  '2026-09-18 10:30:00+00'
),
(
  'comm-2',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21',
  'Sahabati Dewi Lestari',
  'Pengurus Rayon Tarbiyah',
  'DL',
  'Sepakat sahabat Farisi. Daya kritis transformatif harus terus diasah melalui forum diskusi dan pendampingan pasca-Mapaba yang konsisten.',
  8,
  '2026-09-18 14:15:00+00'
),
(
  'comm-3',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'Sahabat Rizky Maulana',
  'Kader PKD',
  'RM',
  'Materi Aswaja An-Nahdliyah yang sangat solutif di tengah polarisasi saat ini. Tangan terkepal dan maju ke muka!',
  15,
  '2026-09-13 08:20:00+00'
),
(
  'comm-4',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23',
  'Sahabat Hendra Wijaya',
  'Ketua Rayon Syariah',
  'HW',
  'Langkah konkret yang sangat ditunggu oleh seluruh pengurus rayon. Digitalisasi surat menyurat membuat birokrasi jauh lebih rapi dan transparan.',
  7,
  '2026-09-09 11:45:00+00'
)
ON CONFLICT (id) DO NOTHING;
