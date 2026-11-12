-- ============================================================================
-- KHMER KIDS QUIZ (រៀនអក្សរខ្មែរថ្នាក់ទី១) — VERCEL POSTGRES / NEON DATABASE SCHEMA
-- 100% Pure PostgreSQL Syntax (No curly braces "{}" — safe for all SQL Editors)
-- ============================================================================

-- 1. USERS & RBAC TABLE (គណនីអ្នកប្រើប្រាស់ និងតួនាទី)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended')),
  stars_earned INTEGER NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QUIZ QUESTIONS TABLE (កម្រងសំណួរតាមមេរៀនថ្នាក់ទី១)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id BIGINT PRIMARY KEY,
  lesson_id VARCHAR(32) NOT NULL CHECK (lesson_id IN ('lesson-1', 'lesson-2', 'lesson-3', 'lesson-4')),
  category_label TEXT NOT NULL,
  icon VARCHAR(32) NOT NULL DEFAULT '⭐',
  clue_word_khmer TEXT NOT NULL,
  clue_word_english TEXT NOT NULL,
  phonetic_hint TEXT NOT NULL,
  speech_text TEXT NOT NULL,
  question_khmer TEXT NOT NULL,
  question_english TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_letter VARCHAR(32) NOT NULL,
  explanation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. STUDENT LESSON SCORES TABLE (ពិន្ទុខ្ពស់បំផុតតាមមេរៀន)
CREATE TABLE IF NOT EXISTS student_lesson_scores (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id VARCHAR(32) NOT NULL,
  best_score INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- 4. SECURITY AUDIT LOGS TABLE (កំណត់ហេតុសុវត្ថិភាព RBAC)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  actor_email VARCHAR(255) NOT NULL,
  actor_role VARCHAR(20) NOT NULL,
  action TEXT NOT NULL,
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('ALLOWED', 'DENIED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SEED DEFAULT ACCOUNTS (Admin, Teacher, Open-Access Student)
-- ============================================================================
INSERT INTO users (id, full_name, email, role, status, stars_earned, quizzes_completed)
VALUES
  ('usr-admin-01', 'Sokha Chan (System Admin)', 'admin@khmerquiz.edu.kh', 'admin', 'Active', 48, 12),
  ('usr-teacher-01', 'អ្នកគ្រូ បុប្ផា (Teacher Bopha)', 'teacher@khmerquiz.edu.kh', 'teacher', 'Active', 35, 9),
  ('usr-student-01', 'កុមារា តារា (Student Dara)', 'student@khmerquiz.edu.kh', 'student', 'Active', 18, 5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SEED INITIAL GRADE 1 KHMER QUESTIONS (Using jsonb_build_array & jsonb_build_object)
-- ============================================================================
INSERT INTO quiz_questions (
  id, lesson_id, category_label, icon, clue_word_khmer, clue_word_english,
  phonetic_hint, speech_text, question_khmer, question_english,
  options, correct_letter, explanation
)
VALUES
  (
    101, 'lesson-1', 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក', '🦀', 'ក្តាម', 'Crab (Kdaam)',
    'សំឡេងអាន៖ «ក» (Ka) — ក ក្តាម', 'ក... ក ក្តាម',
    'តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?', 'Which Khmer consonant starts the word for Crab (ក្តាម)?',
    jsonb_build_array(
      jsonb_build_object('letter', 'ក', 'label', 'ក (Ka)', 'speech', 'ក'),
      jsonb_build_object('letter', 'ខ', 'label', 'ខ (Kha)', 'speech', 'ខ'),
      jsonb_build_object('letter', 'គ', 'label', 'គ (Ko)', 'speech', 'គ')
    ),
    'ក', 'ត្រឹមត្រូវ! «ក» គឺ ក ក្តាម (Ka for Crab)!'
  ),
  (
    201, 'lesson-2', 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស', '🍌', 'ចេក', 'Banana (Chek)',
    'សំឡេងអាន៖ «ច» (Cha) — ច ចេក', 'ច... ច ចេក',
    'តើពាក្យ «ចេក» ផ្តើមដោយព្យញ្ជនៈមួយណា?', 'Which Khmer consonant starts the word for Banana (ចេក)?',
    jsonb_build_array(
      jsonb_build_object('letter', 'ឆ', 'label', 'ឆ (Chha)', 'speech', 'ឆ'),
      jsonb_build_object('letter', 'ជ', 'label', 'ជ (Cho)', 'speech', 'ជ'),
      jsonb_build_object('letter', 'ច', 'label', 'ច (Cha)', 'speech', 'ច')
    ),
    'ច', 'ត្រឹមត្រូវហើយ! «ច» គឺ ច ចេក (Cha for Banana)!'
  ),
  (
    301, 'lesson-3', 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ', '📖', 'ក + ា = កា', 'Vowel Sra Aa (ា)',
    'សំឡេងអាន៖ «ស្រៈ អា» (Sra Aa)', 'ស្រៈ អា... ក អា កា',
    'តើមួយណាជា «ស្រៈ អា» (ា) ក្នុងពាក្យ «កា»?', 'Which vowel is "Sra Aa" (ា) as in កា?',
    jsonb_build_array(
      jsonb_build_object('letter', 'ា', 'label', 'ា (ស្រៈ អា)', 'speech', 'ស្រៈ អា'),
      jsonb_build_object('letter', 'ិ', 'label', 'ិ (ស្រៈ អិ)', 'speech', 'ស្រៈ អិ'),
      jsonb_build_object('letter', 'ុ', 'label', 'ុ (ស្រៈ អុ)', 'speech', 'ស្រៈ អុ')
    ),
    'ា', 'ត្រឹមត្រូវ! «ា» អានថា ស្រៈ អា (Sra Aa)!'
  ),
  (
    401, 'lesson-4', 'មេរៀនទី ៤ · ស្រៈពេញតួ', '🧙‍♂️', 'ឥសី', 'Hermit / Sage (Eysei)',
    'សំឡេងអាន៖ «ឥ» (Sra E) — ឥ ឥសី', 'ឥ... ឥ ឥសី',
    'តើពាក្យ «ឥសី» ផ្តើមដោយស្រៈពេញតួមួយណា?', 'Which independent vowel starts the word ឥសី (Hermit)?',
    jsonb_build_array(
      jsonb_build_object('letter', 'ឥ', 'label', 'ឥ (ស្រៈ ឥ)', 'speech', 'ឥ'),
      jsonb_build_object('letter', 'ឧ', 'label', 'ឧ (ស្រៈ ឧ)', 'speech', 'ឧ'),
      jsonb_build_object('letter', 'ឯ', 'label', 'ឯ (ស្រៈ ឯ)', 'speech', 'ឯ')
    ),
    'ឥ', 'ត្រឹមត្រូវ! «ឥ» គឺស្រៈពេញតួក្នុងពាក្យ ឥសី!'
  )
ON CONFLICT (id) DO NOTHING;
