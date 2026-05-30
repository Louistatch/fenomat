-- ════════════════════════════════════════════════════════════════
-- DataMEAL Academy — Auth complète + profil étudiant (v3)
-- Validation email, mot de passe oublié, profil enrichi
-- À exécuter dans Supabase SQL Editor APRÈS school_management.sql
-- ════════════════════════════════════════════════════════════════

-- ── Enrichir le profil étudiant ──
ALTER TABLE students ADD COLUMN IF NOT EXISTS email_verified   BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS verify_token     TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS verify_expires   TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_token      TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS reset_expires    TIMESTAMPTZ;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bio              TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profession       TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city             TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender           TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_year       INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS linkedin         TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS interests        TEXT[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS course_emails    BOOLEAN DEFAULT true;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_login       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_students_verify ON students(verify_token);
CREATE INDEX IF NOT EXISTS idx_students_reset  ON students(reset_token);

-- ── Journal des emails académie (audit / éviter les doublons) ──
CREATE TABLE IF NOT EXISTS academy_emails (
  id          SERIAL PRIMARY KEY,
  student_id  INTEGER REFERENCES students(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,      -- verify | reset | welcome | new_course | course_completed
  email       TEXT NOT NULL,
  subject     TEXT,
  status      TEXT DEFAULT 'sent',
  sent_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_academy_emails_student ON academy_emails(student_id);

ALTER TABLE academy_emails DISABLE ROW LEVEL SECURITY;

-- Note : les étudiants déjà inscrits avant cette migration sont marqués vérifiés
-- pour ne pas les bloquer (optionnel — commente si tu veux les forcer à vérifier)
UPDATE students SET email_verified = true WHERE email_verified IS NULL OR email_verified = false;
