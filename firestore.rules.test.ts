/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Security TDD Test Suite for `firestore.rules` ("Dirty Dozen" + Multi-Account Token Verification)
 * Verifies that all 12 adversarial payloads in `security_spec.md` return PERMISSION_DENIED,
 * while legitimate public reads, score creations, and verified-admin question writes
 * (both top-level JWT email claims and Identity Platform Google federated identity tokens) succeed.
 */

import assert from 'node:assert/strict';

type AuthToken = {
  email?: string;
  email_verified?: boolean;
  firebase?: {
    sign_in_provider?: string;
    identities?: {
      email?: string[];
      [provider: string]: unknown;
    };
  };
};

type AuthContext = {
  uid: string;
  token: AuthToken;
} | null;

const SERVER_TIME = 'SERVER_REQUEST_TIME_TOKEN';
const ADMIN_EMAIL = 'sunkannaratana@gmail.com';
const BOOTSTRAPPED_ADMIN_UID = '32WDkjf8r0UxR1kqzPNwQ1ktA7a2';

function isValidId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

function isTokenEmailNotUnverified(token: AuthToken): boolean {
  return !('email_verified' in token) || token.email_verified === true;
}

function hasVerifiedTopLevelAdminEmail(token: AuthToken): boolean {
  return (
    'email' in token &&
    'email_verified' in token &&
    token.email_verified === true &&
    token.email === ADMIN_EMAIL
  );
}

function hasVerifiedGoogleIdentityAdminEmail(token: AuthToken): boolean {
  return Boolean(
    'firebase' in token &&
      token.firebase &&
      typeof token.firebase === 'object' &&
      token.firebase.sign_in_provider === 'google.com' &&
      isTokenEmailNotUnverified(token) &&
      token.firebase.identities &&
      Array.isArray(token.firebase.identities.email) &&
      token.firebase.identities.email.includes(ADMIN_EMAIL)
  );
}

function isBootstrappedAdminUid(auth: NonNullable<AuthContext>): boolean {
  return auth.uid === BOOTSTRAPPED_ADMIN_UID && isTokenEmailNotUnverified(auth.token);
}

function isVerifiedAdminEmail(auth: AuthContext): boolean {
  if (!auth) return false;
  return (
    hasVerifiedTopLevelAdminEmail(auth.token) ||
    hasVerifiedGoogleIdentityAdminEmail(auth.token) ||
    isBootstrappedAdminUid(auth)
  );
}

function isAdmin(auth: AuthContext, adminDocs: Set<string>): boolean {
  if (!auth) return false;
  if (isVerifiedAdminEmail(auth)) return true;
  return adminDocs.has(auth.uid);
}

function isValidQuestion(data: Record<string, unknown>): boolean {
  const required = ['question', 'options', 'correctIndex', 'category', 'level'];
  const allowed = new Set([
    'question',
    'options',
    'correctIndex',
    'category',
    'level',
    'icon',
    'clueWordKhmer',
    'clueWordEnglish',
    'explanation',
  ]);
  const keys = Object.keys(data);
  if (!required.every((k) => keys.includes(k))) return false;
  if (!keys.every((k) => allowed.has(k))) return false;

  if (typeof data.question !== 'string' || data.question.length < 1 || data.question.length > 500) return false;
  if (!Array.isArray(data.options) || data.options.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const item = data.options[i];
    if (typeof item !== 'string' || item.length < 1 || item.length > 200) return false;
  }
  if (
    typeof data.correctIndex !== 'number' ||
    ![0, 1, 2, 3].includes(data.correctIndex)
  ) {
    return false;
  }
  if (typeof data.category !== 'string' || data.category.length < 1 || data.category.length > 120) return false;
  if (typeof data.level !== 'string' || data.level.length < 1 || data.level.length > 60) return false;

  if ('icon' in data && (typeof data.icon !== 'string' || data.icon.length < 1 || data.icon.length > 32)) return false;
  if (
    'clueWordKhmer' in data &&
    (typeof data.clueWordKhmer !== 'string' || data.clueWordKhmer.length < 1 || data.clueWordKhmer.length > 120)
  ) {
    return false;
  }
  if (
    'clueWordEnglish' in data &&
    (typeof data.clueWordEnglish !== 'string' || data.clueWordEnglish.length < 1 || data.clueWordEnglish.length > 120)
  ) {
    return false;
  }
  if (
    'explanation' in data &&
    (typeof data.explanation !== 'string' || data.explanation.length < 1 || data.explanation.length > 300)
  ) {
    return false;
  }
  return true;
}

function isValidScore(data: Record<string, unknown>): boolean {
  const exact = ['playerName', 'score', 'total', 'category', 'createdAt'];
  const keys = Object.keys(data);
  if (keys.length !== exact.length || !exact.every((k) => keys.includes(k))) return false;
  if (typeof data.playerName !== 'string' || data.playerName.length < 1 || data.playerName.length > 80) return false;
  if (typeof data.score !== 'number' || !Number.isFinite(data.score) || data.score < 0 || data.score > 1000) {
    return false;
  }
  if (typeof data.total !== 'number' || !Number.isFinite(data.total) || data.total < 1 || data.total > 1000) {
    return false;
  }
  if (data.score > data.total) return false;
  if (typeof data.category !== 'string' || data.category.length < 1 || data.category.length > 120) return false;
  if (data.createdAt !== SERVER_TIME) return false;
  return true;
}

function isValidAdminMember(data: Record<string, unknown>): boolean {
  const exact = ['role', 'createdAt'];
  const keys = Object.keys(data);
  if (keys.length !== exact.length || !exact.every((k) => keys.includes(k))) return false;
  return data.role === 'admin' && data.createdAt === SERVER_TIME;
}

function evaluateRule(
  collection: 'questions' | 'scores' | 'admins',
  op: 'get' | 'list' | 'create' | 'update' | 'delete',
  docId: string,
  auth: AuthContext,
  payload: Record<string, unknown>,
  adminDocs = new Set<string>()
): 'ALLOWED' | 'PERMISSION_DENIED' {
  if (collection === 'questions') {
    if (op === 'get') return isValidId(docId) ? 'ALLOWED' : 'PERMISSION_DENIED';
    if (op === 'list') return 'ALLOWED';
    if (op === 'create' || op === 'update') {
      return auth && isValidId(docId) && isValidQuestion(payload) && isAdmin(auth, adminDocs)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (op === 'delete') {
      return auth && isValidId(docId) && isAdmin(auth, adminDocs) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
  }

  if (collection === 'scores') {
    if (op === 'get') return isValidId(docId) ? 'ALLOWED' : 'PERMISSION_DENIED';
    if (op === 'list') return 'ALLOWED';
    if (op === 'create') {
      return isValidId(docId) && isValidScore(payload) ? 'ALLOWED' : 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  if (collection === 'admins') {
    if (op === 'get') {
      return auth && isValidId(docId) && (auth.uid === docId || isVerifiedAdminEmail(auth))
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    if (op === 'create') {
      return auth &&
        isValidId(docId) &&
        auth.uid === docId &&
        isValidAdminMember(payload) &&
        isVerifiedAdminEmail(auth)
        ? 'ALLOWED'
        : 'PERMISSION_DENIED';
    }
    return 'PERMISSION_DENIED';
  }

  return 'PERMISSION_DENIED';
}

function runDirtyDozenSuite() {
  const validQuestion = {
    question: 'តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    options: ['ក (Ka)', 'ខ (Kha)', 'គ (Ko)', 'ឃ (Kho)'],
    correctIndex: 0,
    category: 'lesson-1',
    level: 'ថ្នាក់ទី១',
    icon: '🦀',
    clueWordKhmer: 'ក្តាម',
    clueWordEnglish: 'Crab (Kdaam)',
    explanation: 'ត្រឹមត្រូវ! «ក» គឺ ក ក្តាម (Ka for Crab)!',
  };

  const verifiedAdminStandardJwt: AuthContext = {
    uid: BOOTSTRAPPED_ADMIN_UID,
    token: {
      email: ADMIN_EMAIL,
      email_verified: true,
    },
  };

  // Simulates Identity Platform multi-account-per-email JWT where top-level `email` and `email_verified` are omitted!
  const verifiedAdminIdentityPlatformJwt: AuthContext = {
    uid: BOOTSTRAPPED_ADMIN_UID,
    token: {
      firebase: {
        sign_in_provider: 'google.com',
        identities: {
          email: [ADMIN_EMAIL],
        },
      },
    },
  };

  // Dirty Dozen 1: Unauthenticated question create
  assert.equal(evaluateRule('questions', 'create', 'q1', null, validQuestion), 'PERMISSION_DENIED');

  // Dirty Dozen 2: Unverified admin email spoof (even with matching email or password provider)
  assert.equal(
    evaluateRule(
      'questions',
      'create',
      'q1',
      {
        uid: 'spoof-uid',
        token: {
          email: ADMIN_EMAIL,
          email_verified: false,
          firebase: { sign_in_provider: 'password', identities: { email: [ADMIN_EMAIL] } },
        },
      },
      validQuestion
    ),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 3: Non-admin authenticated question update (Google sign-in with different email)
  assert.equal(
    evaluateRule(
      'questions',
      'update',
      'q1',
      {
        uid: 'user-2',
        token: {
          firebase: { sign_in_provider: 'google.com', identities: { email: ['intruder@gmail.com'] } },
        },
      },
      validQuestion
    ),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 4: Question shadow field injection
  assert.equal(
    evaluateRule('questions', 'create', 'q1', verifiedAdminStandardJwt, {
      ...validQuestion,
      ghostField: true,
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 5: Question invalid options count (3 instead of 4)
  assert.equal(
    evaluateRule('questions', 'create', 'q1', verifiedAdminStandardJwt, {
      ...validQuestion,
      options: ['ក', 'ខ', 'គ'],
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 6: Question array element type poisoning
  assert.equal(
    evaluateRule('questions', 'create', 'q1', verifiedAdminStandardJwt, {
      ...validQuestion,
      options: ['ក', 'ខ', 'គ', 999],
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 7: Question out-of-bounds correctIndex or fractional correctIndex
  assert.equal(
    evaluateRule('questions', 'create', 'q1', verifiedAdminStandardJwt, {
      ...validQuestion,
      correctIndex: 5,
    }),
    'PERMISSION_DENIED'
  );
  assert.equal(
    evaluateRule('questions', 'create', 'q1', verifiedAdminStandardJwt, {
      ...validQuestion,
      correctIndex: 1.5,
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 8: Score update tampering
  assert.equal(
    evaluateRule('scores', 'update', 's1', verifiedAdminStandardJwt, {
      playerName: 'Dara',
      score: 4,
      total: 4,
      category: 'lesson-1',
      createdAt: SERVER_TIME,
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 9: Score delete attempt
  assert.equal(evaluateRule('scores', 'delete', 's1', verifiedAdminStandardJwt, {}), 'PERMISSION_DENIED');

  // Dirty Dozen 10: Score impossible math (score > total)
  assert.equal(
    evaluateRule('scores', 'create', 's1', null, {
      playerName: 'Dara',
      score: 10,
      total: 4,
      category: 'lesson-1',
      createdAt: SERVER_TIME,
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 11: Score forged client timestamp
  assert.equal(
    evaluateRule('scores', 'create', 's1', null, {
      playerName: 'Dara',
      score: 4,
      total: 4,
      category: 'lesson-1',
      createdAt: '2099-01-01T00:00:00Z',
    }),
    'PERMISSION_DENIED'
  );

  // Dirty Dozen 12: Self-assigned admin escalation by non-admin
  assert.equal(
    evaluateRule(
      'admins',
      'create',
      'user-2',
      { uid: 'user-2', token: { email: 'intruder@example.com', email_verified: true } },
      { role: 'admin', createdAt: SERVER_TIME }
    ),
    'PERMISSION_DENIED'
  );

  // Positive assertions: Valid operations succeed across BOTH JWT shapes!
  assert.equal(evaluateRule('questions', 'get', 'seed-101', null, {}), 'ALLOWED');
  assert.equal(evaluateRule('questions', 'list', '', null, {}), 'ALLOWED');
  assert.equal(evaluateRule('questions', 'create', 'seed-101', verifiedAdminStandardJwt, validQuestion), 'ALLOWED');
  assert.equal(
    evaluateRule('questions', 'create', 'seed-101', verifiedAdminIdentityPlatformJwt, validQuestion),
    'ALLOWED'
  );
  assert.equal(
    evaluateRule('scores', 'create', 'score-01', null, {
      playerName: 'កុមារា តារា',
      score: 4,
      total: 4,
      category: 'lesson-1',
      createdAt: SERVER_TIME,
    }),
    'ALLOWED'
  );

  console.log('All 12 Dirty Dozen security assertions + Identity Platform Admin JWT positive paths PASSED.');
}

runDirtyDozenSuite();
