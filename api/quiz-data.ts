/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Vercel Serverless API Route (`/api/quiz-data`)
 * Connects to Vercel Postgres / Neon Serverless Postgres via HTTP SQL API
 * (`POSTGRES_URL` or `DATABASE_URL`) with automatic graceful fallback.
 */

interface SqlHttpResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

/**
 * Executes parameterized SQL over Neon / Vercel Postgres HTTP endpoint
 * without requiring native C++ bindings in serverless/edge environments.
 */
export async function executeVercelPostgresSql<T = Record<string, unknown>>(
  connectionString: string,
  query: string,
  params: unknown[] = []
): Promise<SqlHttpResult<T>> {
  const parsed = new URL(connectionString);
  const httpEndpoint = `https://${parsed.hostname}/sql`;

  const response = await fetch(httpEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Neon-Connection-String': connectionString,
    },
    body: JSON.stringify({ query, params }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Vercel Postgres HTTP SQL error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as { rows?: T[]; rowCount?: number };
  return {
    rows: data.rows ?? [],
    rowCount: data.rowCount ?? 0,
  };
}

export async function ensureVercelTables(connectionString: string): Promise<void> {
  await executeVercelPostgresSql(
    connectionString,
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      full_name TEXT NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student',
      status VARCHAR(20) NOT NULL DEFAULT 'Active',
      stars_earned INTEGER NOT NULL DEFAULT 0,
      quizzes_completed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );`
  );

  await executeVercelPostgresSql(
    connectionString,
    `CREATE TABLE IF NOT EXISTS quiz_questions (
      id BIGINT PRIMARY KEY,
      lesson_id VARCHAR(32) NOT NULL,
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
    );`
  );

  await executeVercelPostgresSql(
    connectionString,
    `CREATE TABLE IF NOT EXISTS student_lesson_scores (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      lesson_id VARCHAR(32) NOT NULL,
      best_score INTEGER NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    );`
  );
}

// Vercel Serverless Function Handler (Node.js Request/Response compatible)
export default async function handler(
  req: { method?: string; body?: Record<string, unknown> },
  res: {
    status: (code: number) => { json: (payload: unknown) => void };
  }
) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';

  if (!connectionString) {
    return res.status(200).json({
      connected: false,
      mode: 'local_fallback',
      provider: 'Local Storage / In-Memory Fallback (Set POSTGRES_URL in Vercel)',
      envDetected: false,
      tablesInitialized: false,
      messageKhmer:
        'មិនទាន់បានភ្ជាប់ POSTGRES_URL ទេ — កំពុងប្រើប្រាស់ទិន្នន័យបម្រុងក្នុងម៉ាស៊ីន (Local Fallback) ដោយស្វ័យប្រវត្តិ។',
      messageEnglish:
        'POSTGRES_URL is not configured yet — running smoothly in automatic Local Fallback mode.',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    if (req.method === 'POST') {
      const action = String(req.body?.action || 'init');

      if (action === 'init') {
        await ensureVercelTables(connectionString);
        return res.status(200).json({
          connected: true,
          mode: 'vercel_postgres',
          provider: 'Vercel Postgres / Neon Serverless',
          envDetected: true,
          tablesInitialized: true,
          messageKhmer: 'បានបង្កើតតារាង Database (users, quiz_questions, student_lesson_scores) ក្នុង Vercel ដោយជោគជ័យ!',
          messageEnglish: 'Successfully initialized PostgreSQL tables in Vercel Postgres!',
          timestamp: new Date().toISOString(),
        });
      }

      if (action === 'save_score') {
        const userId = String(req.body?.userId || 'usr-student-01');
        const lessonId = String(req.body?.lessonId || 'lesson-1');
        const score = Number(req.body?.score || 0);

        await ensureVercelTables(connectionString);
        await executeVercelPostgresSql(
          connectionString,
          `INSERT INTO student_lesson_scores (user_id, lesson_id, best_score, attempts, updated_at)
           VALUES ($1, $2, $3, 1, NOW())
           ON CONFLICT (user_id, lesson_id)
           DO UPDATE SET
             best_score = GREATEST(student_lesson_scores.best_score, EXCLUDED.best_score),
             attempts = student_lesson_scores.attempts + 1,
             updated_at = NOW();`,
          [userId, lessonId, score]
        );

        return res.status(200).json({
          ok: true,
          connected: true,
          messageKhmer: 'បានរក្សាទុកពិន្ទុសិស្សទៅក្នុង Vercel Postgres Database!',
        });
      }
    }

    // Default GET: verify connection & return row counts
    await ensureVercelTables(connectionString);
    const questionsResult = await executeVercelPostgresSql<{ count: string }>(
      connectionString,
      'SELECT COUNT(*)::text AS count FROM quiz_questions;'
    );

    return res.status(200).json({
      connected: true,
      mode: 'vercel_postgres',
      provider: 'Vercel Postgres / Neon Serverless',
      envDetected: true,
      tablesInitialized: true,
      questionCount: Number(questionsResult.rows[0]?.count ?? 0),
      messageKhmer: 'បានភ្ជាប់ទៅកាន់ Vercel Postgres Database ដោយជោគជ័យ!',
      messageEnglish: 'Connected to Vercel Postgres Database successfully!',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown database error';
    return res.status(200).json({
      connected: false,
      mode: 'local_fallback',
      provider: 'Vercel Postgres (Connection Error — Using Fallback)',
      envDetected: true,
      tablesInitialized: false,
      error: errMsg,
      messageKhmer: `មានបញ្ហាក្នុងការភ្ជាប់ Database (${errMsg}) — កំពុងប្រើប្រាស់ Local Fallback។`,
      messageEnglish: `Database connection fallback active: ${errMsg}`,
      timestamp: new Date().toISOString(),
    });
  }
}
