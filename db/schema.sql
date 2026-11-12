-- ============================================================================
-- KHMER KIDS QUIZ (រៀនអក្សរខ្មែរថ្នាក់ទី១)
-- PostgreSQL Schema & Initial Seed Data for Vercel Postgres (Neon / Supabase)
-- ============================================================================

-- 1. USERS TABLE (Students, Teachers, Admins)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'TEACHER', 'STUDENT')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  stars_earned INTEGER NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 2. QUIZ QUESTIONS TABLE (Grouped by lesson_id)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGINT PRIMARY KEY,
  lesson_id VARCHAR(32) NOT NULL CHECK (lesson_id IN ('lesson-1', 'lesson-2', 'lesson-3', 'lesson-4')),
  category_label VARCHAR(255) NOT NULL,
  icon VARCHAR(32) NOT NULL,
  clue_word_khmer VARCHAR(255) NOT NULL,
  clue_word_english VARCHAR(255) NOT NULL,
  phonetic_hint TEXT NOT NULL,
  speech_text VARCHAR(255) NOT NULL,
  question_khmer TEXT NOT NULL,
  question_english TEXT NOT NULL,
  options_json JSONB NOT NULL,
  correct_letter VARCHAR(32) NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDENT LESSON BEST SCORES TABLE
CREATE TABLE IF NOT EXISTS student_lesson_scores (
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(32) NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

-- 4. SECURITY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp_label VARCHAR(32) NOT NULL,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  target_path VARCHAR(100) NOT NULL,
  outcome VARCHAR(16) NOT NULL CHECK (outcome IN ('ALLOWED', 'DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEFAULT ACCOUNTS
-- ============================================================================
INSERT INTO users (id, username, email, password_hash, full_name, role, status, stars_earned, quizzes_completed, created_at)
VALUES
  ('usr-admin-01', 'admin', 'admin@school.edu.kh', 'Password123!', 'Sokha Chan (System Admin)', 'ADMIN', 'Active', 10, 5, '2026-09-01'),
  ('usr-teacher-01', 'teacher', 'teacher@school.edu.kh', 'Password123!', 'SOPHEA Kru (Grade 1 Teacher)', 'TEACHER', 'Active', 10, 4, '2026-09-10'),
  ('usr-student-01', 'student', 'student@school.edu.kh', 'Password123!', 'Dara Pich (Grade 1 Student)', 'STUDENT', 'Active', 8, 3, '2026-10-02'),
  ('usr-student-02', 'bopha', 'bopha@school.edu.kh', 'Password123!', 'Bopha Meas (Grade 1 Student)', 'STUDENT', 'Active', 10, 6, '2026-10-14')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED GRADE 1 KHMER QUIZ QUESTIONS (Lesson 1 to Lesson 4)
-- ============================================================================
INSERT INTO quiz_questions (
  id, lesson_id, category_label, icon, clue_word_khmer, clue_word_english,
  phonetic_hint, speech_text, question_khmer, question_english, options_json, correct_letter, explanation
)
VALUES
  (
    101, 'lesson-1', 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក', '🦀', 'ក្តាម', 'Crab (Kdaam)',
    'សំឡេងអាន៖ «ក» (Ka) — ក ក្តាម', 'ក... ក ក្តាម',
    'តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    'Which Khmer consonant starts the word for Crab (ក្តាម)?',
    '[{"letter":"ក","label":"ក (Ka)","speech":"ក"},{"letter":"ខ","label":"ខ (Kha)","speech":"ខ"},{"letter":"គ","label":"គ (Ko)","speech":"គ"}]'::jsonb,
    'ក', 'ត្រឹមត្រូវ! «ក» គឺ ក ក្តាម (Ka for Crab)!'
  ),
  (
    102, 'lesson-1', 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក', '🐯', 'ខ្លា', 'Tiger (Khlaa)',
    'សំឡេងអាន៖ «ខ» (Kha) — ខ ខ្លា', 'ខ... ខ ខ្លា',
    'តើពាក្យ «ខ្លា» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    'Which Khmer consonant starts the word for Tiger (ខ្លា)?',
    '[{"letter":"ង","label":"ង (Ngo)","speech":"ង"},{"letter":"ខ","label":"ខ (Kha)","speech":"ខ"},{"letter":"គ","label":"គ (Ko)","speech":"គ"}]'::jsonb,
    'ខ', 'ពូកែណាស់! «ខ» គឺ ខ ខ្លា (Kha for Tiger)!'
  ),
  (
    201, 'lesson-2', 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស', '🍌', 'ចេក', 'Banana (Chek)',
    'សំឡេងអាន៖ «ច» (Cha) — ច ចេក', 'ច... ច ចេក',
    'តើពាក្យ «ចេក» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    'Which Khmer consonant starts the word for Banana (ចេក)?',
    '[{"letter":"ឆ","label":"ឆ (Chha)","speech":"ឆ"},{"letter":"ជ","label":"ជ (Cho)","speech":"ជ"},{"letter":"ច","label":"ច (Cha)","speech":"ច"}]'::jsonb,
    'ច', 'ត្រឹមត្រូវហើយ! «ច» គឺ ច ចេក (Cha for Banana)!'
  ),
  (
    301, 'lesson-3', 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ', '📖', 'ក + ា = កា', 'Vowel Sra Aa (ា)',
    'សំឡេងអាន៖ «ស្រៈ អា» (Sra Aa)', 'ស្រៈ អា... ក អា កា',
    'តើមួយណាជា «ស្រៈ អា» (ា) ក្នុងពាក្យ «កា»?',
    'Which vowel is "Sra Aa" (ា) as in កា?',
    '[{"letter":"ា","label":"ា (ស្រៈ អា)","speech":"ស្រៈ អា"},{"letter":"ិ","label":"ិ (ស្រៈ អិ)","speech":"ស្រៈ អិ"},{"letter":"ុ","label":"ុ (ស្រៈ អុ)","speech":"ស្រៈ អុ"}]'::jsonb,
    'ា', 'ត្រឹមត្រូវ! «ា» អានថា ស្រៈ អា (Sra Aa)!'
  ),
  (
    401, 'lesson-4', 'មេរៀនទី ៤ · ស្រៈពេញតួ', '🧙‍♂️', 'ឥសី', 'Hermit / Sage (Eysei)',
    'សំឡេងអាន៖ «ឥ» (Sra E) — ឥ ឥសី', 'ឥ... ឥ ឥសី',
    'តើពាក្យ «ឥសី» ផ្តើមដោយស្រៈពេញតួមួយណា?',
    'Which independent vowel starts the word ឥសី (Hermit)?',
    '[{"letter":"ឥ","label":"ឥ (ស្រៈ ឥ)","speech":"ឥ"},{"letter":"ឧ","label":"ឧ (ស្រៈ ឧ)","speech":"ឧ"},{"letter":"ឯ","label":"ឯ (ស្រៈ ឯ)","speech":"ឯ"}]'::jsonb,
    'ឥ', 'ត្រឹមត្រូវ! «ឥ» គឺស្រៈពេញតួក្នុងពាក្យ ឥសី!'
  )
ON CONFLICT (id) DO NOTHING;
