/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Firebase Initialization, Firestore Security Error Handling,
 * `questions` & `scores` CRUD / Real-Time Listeners, and Admin Google Auth.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocFromServer,
  addDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App, Firestore (with named database ID), and Auth
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const BOOTSTRAPPED_ADMIN_EMAIL = 'sunkannaratana@gmail.com';

// Validate connection to Firestore on startup
async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
void testConnection();

// ============================================================================
// STRUCTURED FIRESTORE ERROR HANDLER (Required for Security Diagnostics)
// ============================================================================

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ============================================================================
// SCHEMAS & DEFENSIVE SANITIZATION MATCHING `firebase-blueprint.json`
// ============================================================================

export const QUESTION_CONSTRAINTS = {
  QUESTION_MAX: 500,
  OPTION_MAX: 200,
  CATEGORY_MAX: 120,
  LEVEL_MAX: 60,
  ICON_MAX: 32,
  CLUE_MAX: 120,
  EXPLANATION_MAX: 300,
  ID_REGEX: /^[a-zA-Z0-9_-]+$/,
} as const;

export const SCORE_CONSTRAINTS = {
  PLAYER_NAME_MAX: 80,
  CATEGORY_MAX: 120,
  MAX_SCORE: 1000,
} as const;

export interface FirestoreQuestionInput {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  category: string;
  level: string;
  icon?: string;
  clueWordKhmer?: string;
  clueWordEnglish?: string;
  explanation?: string;
}

export interface FirestoreQuestionRecord extends FirestoreQuestionInput {
  id: string;
}

export interface FirestoreScoreRecord {
  id: string;
  playerName: string;
  score: number;
  total: number;
  category: string;
  createdAtMs: number;
}

function clampString(val: string, maxLength: number, fallback: string): string {
  const trimmed = (val || '').trim();
  if (!trimmed) return fallback.slice(0, maxLength);
  return trimmed.slice(0, maxLength);
}

export function sanitizeQuestionPayload(input: FirestoreQuestionInput): Record<string, unknown> {
  const safeOptions: [string, string, string, string] = [
    clampString(input.options[0], QUESTION_CONSTRAINTS.OPTION_MAX, 'ក'),
    clampString(input.options[1], QUESTION_CONSTRAINTS.OPTION_MAX, 'ខ'),
    clampString(input.options[2], QUESTION_CONSTRAINTS.OPTION_MAX, 'គ'),
    clampString(input.options[3], QUESTION_CONSTRAINTS.OPTION_MAX, 'ឃ'),
  ];

  const rawIndex = Math.trunc(Number(input.correctIndex));
  const safeCorrectIndex = rawIndex >= 0 && rawIndex <= 3 ? rawIndex : 0;

  const payload: Record<string, unknown> = {
    question: clampString(
      input.question,
      QUESTION_CONSTRAINTS.QUESTION_MAX,
      'តើមួយណាជាតួអក្សរត្រឹមត្រូវ?'
    ),
    options: safeOptions,
    correctIndex: safeCorrectIndex,
    category: clampString(input.category, QUESTION_CONSTRAINTS.CATEGORY_MAX, 'lesson-1'),
    level: clampString(input.level, QUESTION_CONSTRAINTS.LEVEL_MAX, 'ថ្នាក់ទី១'),
  };

  if (input.icon && input.icon.trim()) {
    payload.icon = input.icon.trim().slice(0, QUESTION_CONSTRAINTS.ICON_MAX);
  }
  if (input.clueWordKhmer && input.clueWordKhmer.trim()) {
    payload.clueWordKhmer = input.clueWordKhmer.trim().slice(0, QUESTION_CONSTRAINTS.CLUE_MAX);
  }
  if (input.clueWordEnglish && input.clueWordEnglish.trim()) {
    payload.clueWordEnglish = input.clueWordEnglish.trim().slice(0, QUESTION_CONSTRAINTS.CLUE_MAX);
  }
  if (input.explanation && input.explanation.trim()) {
    payload.explanation = input.explanation.trim().slice(0, QUESTION_CONSTRAINTS.EXPLANATION_MAX);
  }

  return payload;
}

// ============================================================================
// FIRESTORE `questions` COLLECTION OPERATIONS
// ============================================================================

export function subscribeToFirestoreQuestions(
  onQuestionsLoaded: (records: FirestoreQuestionRecord[]) => void,
  onListenerError?: (errMessage: string) => void
): Unsubscribe {
  const path = 'questions';
  const q = query(collection(db, path), limit(200));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: FirestoreQuestionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const rawOpts = Array.isArray(d.options) ? d.options.map((o) => String(o)) : [];
        const paddedOpts: [string, string, string, string] = [
          rawOpts[0] || 'ក',
          rawOpts[1] || 'ខ',
          rawOpts[2] || 'គ',
          rawOpts[3] || 'ឃ',
        ];
        const rawIdx = Number(d.correctIndex);
        const validIdx = Number.isInteger(rawIdx) && rawIdx >= 0 && rawIdx <= 3 ? rawIdx : 0;

        items.push({
          id: docSnap.id,
          question: typeof d.question === 'string' && d.question.trim() ? d.question : 'សំណួរអក្សរខ្មែរ',
          options: paddedOpts,
          correctIndex: validIdx,
          category: typeof d.category === 'string' && d.category.trim() ? d.category : 'lesson-1',
          level: typeof d.level === 'string' && d.level.trim() ? d.level : 'ថ្នាក់ទី១',
          icon: typeof d.icon === 'string' ? d.icon : undefined,
          clueWordKhmer: typeof d.clueWordKhmer === 'string' ? d.clueWordKhmer : undefined,
          clueWordEnglish: typeof d.clueWordEnglish === 'string' ? d.clueWordEnglish : undefined,
          explanation: typeof d.explanation === 'string' ? d.explanation : undefined,
        });
      });
      onQuestionsLoaded(items);
    },
    (error) => {
      if (onListenerError) {
        onListenerError(error.message);
      }
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError; allow app to keep fallback questions active
      }
    }
  );
}

export async function createFirestoreQuestion(input: FirestoreQuestionInput): Promise<string> {
  const path = 'questions';
  const cleanPayload = sanitizeQuestionPayload(input);
  try {
    const ref = await addDoc(collection(db, path), cleanPayload);
    return ref.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function setFirestoreQuestionById(
  docId: string,
  input: FirestoreQuestionInput
): Promise<void> {
  const safeId = docId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128) || `q-${Date.now()}`;
  const path = `questions/${safeId}`;
  const cleanPayload = sanitizeQuestionPayload(input);
  try {
    await setDoc(doc(db, 'questions', safeId), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateFirestoreQuestion(
  docId: string,
  input: FirestoreQuestionInput
): Promise<void> {
  const safeId = docId.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  const path = `questions/${safeId}`;
  const cleanPayload = sanitizeQuestionPayload(input);
  try {
    await setDoc(doc(db, 'questions', safeId), cleanPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteFirestoreQuestion(docId: string): Promise<void> {
  const path = `questions/${docId}`;
  try {
    await deleteDoc(doc(db, 'questions', docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// ============================================================================
// FIRESTORE `scores` COLLECTION OPERATIONS (Create-Only + Top 10 Leaderboard)
// ============================================================================

export async function saveScoreToFirestore(params: {
  playerName: string;
  score: number;
  total: number;
  category: string;
}): Promise<string> {
  const path = 'scores';
  const safeTotal = Math.max(1, Math.min(SCORE_CONSTRAINTS.MAX_SCORE, Math.trunc(params.total)));
  const safeScore = Math.max(0, Math.min(safeTotal, Math.trunc(params.score)));
  const safeName = clampString(
    params.playerName,
    SCORE_CONSTRAINTS.PLAYER_NAME_MAX,
    'កុមារា តារា (Student)'
  );
  const safeCategory = clampString(params.category, SCORE_CONSTRAINTS.CATEGORY_MAX, 'គ្រប់មេរៀន');

  try {
    const docRef = await addDoc(collection(db, path), {
      playerName: safeName,
      score: safeScore,
      total: safeTotal,
      category: safeCategory,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeToTopScores(
  onScoresLoaded: (scores: FirestoreScoreRecord[]) => void,
  onListenerError?: (errMessage: string) => void
): Unsubscribe {
  const path = 'scores';
  // Single-field orderBy('score', 'desc') works immediately without requiring manual composite indexes
  const topQuery = query(collection(db, path), orderBy('score', 'desc'), limit(25));

  return onSnapshot(
    topQuery,
    (snapshot) => {
      const rows: FirestoreScoreRecord[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        const ts = d.createdAt as Timestamp | null | undefined;
        const createdAtMs =
          ts && typeof ts.toMillis === 'function' ? ts.toMillis() : Date.now();

        rows.push({
          id: docSnap.id,
          playerName: typeof d.playerName === 'string' ? d.playerName : 'សិស្សថ្នាក់ទី១',
          score: typeof d.score === 'number' ? d.score : 0,
          total: typeof d.total === 'number' && d.total > 0 ? d.total : 1,
          category: typeof d.category === 'string' ? d.category : 'មេរៀនទី ១',
          createdAtMs,
        });
      });

      // Sort by score descending, then newest createdAt descending, and slice Top 10
      rows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.createdAtMs - a.createdAtMs;
      });

      onScoresLoaded(rows.slice(0, 10));
    },
    (error) => {
      if (onListenerError) {
        onListenerError(error.message);
      }
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  );
}

// ============================================================================
// FIREBASE AUTHENTICATION FOR ADMIN WRITE OPERATIONS
// ============================================================================

export function subscribeToFirebaseAuth(
  callback: (user: FirebaseUser | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function signInAdminWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutFirebaseUser(): Promise<void> {
  await signOut(auth);
}

export type { FirebaseUser };
