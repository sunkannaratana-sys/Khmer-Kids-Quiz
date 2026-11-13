# Security Specification — Khmer Kids Quiz Firestore Rules

## 1. Data Invariants
1. **Default Deny**: Any path not explicitly matched (`/questions/{questionId}`, `/scores/{scoreId}`, `/admins/{adminId}`, `/test/{docId}`) is unconditionally denied for both reads and writes.
2. **Public Read Access (No PII)**: Both `/questions/{questionId}` and `/scores/{scoreId}` contain zero PII (no emails, phone numbers, or addresses) and are readable by everyone (`get` with `isValidId`, bounded `list`) so Grade 1 students can play quizzes and view the Top 10 Leaderboard without friction.
3. **Admin-Only Question Writes (Zero-Crash Token & UID Verification)**: Creating, updating, or deleting documents in `/questions/{questionId}` is strictly restricted to verified admins via `isAdmin()`, which checks safely (using `'key' in map` guards to prevent CEL undefined-property aborts across both standard Firebase Auth and Identity Platform multi-account-per-email JWTs):
   - Verified top-level email claim (`'email' in request.auth.token && 'email_verified' in request.auth.token && request.auth.token.email_verified == true && request.auth.token.email == 'sunkannaratana@gmail.com'`), OR
   - Verified Google federated identity (`request.auth.token.firebase.sign_in_provider == 'google.com'` with `'sunkannaratana@gmail.com' in request.auth.token.firebase.identities['email']` and email not marked unverified), OR
   - Verified Bootstrapped Admin UID (`request.auth.uid == '32WDkjf8r0UxR1kqzPNwQ1ktA7a2'` and email not marked unverified), OR
   - Trusted database document lookup (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))`).
4. **Question Schema Integrity**: Every write to `/questions/{questionId}` must pass `isValidId(questionId)` and `isValidQuestion(incoming())`, enforcing:
   - Required keys: `question`, `options`, `correctIndex`, `category`, `level`.
   - Allowed keys only (no shadow fields): `question`, `options`, `correctIndex`, `category`, `level`, `icon`, `clueWordKhmer`, `clueWordEnglish`, `explanation`.
   - `options` is a `list` of **strictly 4 strings**, each `1..200` characters.
   - `correctIndex` is a valid numeric index (`0`, `1`, `2`, or `3`).
   - String length bounds enforced on every required and optional string field.
5. **Create-Only Immutable Scores**: On `/scores/{scoreId}`, only `create` is allowed (`update` and `delete` are unconditionally denied). Every score creation must pass `isValidId(scoreId)` and `isValidScore(incoming())`, enforcing:
   - Exact keys `['playerName', 'score', 'total', 'category', 'createdAt']` (no shadow fields).
   - `score` is numeric `>= 0 && <= 1000`, `total` is numeric `>= 1 && <= 1000`, and `score <= total`.
   - `createdAt == request.time` (strict server timestamp enforcement).
6. **Privilege Escalation Prevention**: Clients cannot self-assign admin roles in `/admins/{adminId}` (only a verified bootstrapped admin may initialize their own `/admins/$(request.auth.uid)` record, and non-admins are completely blocked).

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Unauthenticated Question Create**: Anonymous user attempts `create` on `/questions/q1`.
2. **Unverified Admin Email Spoof**: Authenticated user with `email: 'sunkannaratana@gmail.com'` and `email_verified: false` attempts `create` on `/questions/q1`.
3. **Non-Admin Authenticated Question Update**: Verified user `intruder@example.com` attempts `update` on `/questions/q1`.
4. **Question Shadow Field Injection**: Verified Admin sends `{ question: '...', options: ['ក','ខ','គ','ឃ'], correctIndex: 0, category: 'lesson-1', level: 'Grade 1', isSuperSecret: true }`.
5. **Question Invalid Options Count (3 instead of 4)**: Verified Admin sends `options: ['ក', 'ខ', 'គ']`.
6. **Question Array Element Type Poisoning**: Verified Admin sends `options: ['ក', 'ខ', 'គ', 999]`.
7. **Question Out-of-Bounds `correctIndex`**: Verified Admin sends `correctIndex: 5`.
8. **Score Update Attempt (Post-Creation Tampering)**: User attempts `update` on `/scores/s1` to change `score` from `2` to `10`.
9. **Score Delete Attempt**: User or Admin attempts `delete` on `/scores/s1`.
10. **Score Impossible Math (`score > total`)**: User sends `{ playerName: 'Dara', score: 10, total: 4, category: 'lesson-1', createdAt: SERVER_TIMESTAMP }`.
11. **Score Forged Client Timestamp**: User sends `{ playerName: 'Dara', score: 4, total: 4, category: 'lesson-1', createdAt: Timestamp.fromMillis(9999999999999) }` instead of `request.time`.
12. **Self-Assigned Admin Escalation**: Authenticated non-admin user attempts `setDoc` on `/admins/{uid}` with `{ role: 'admin', createdAt: SERVER_TIMESTAMP }`.
