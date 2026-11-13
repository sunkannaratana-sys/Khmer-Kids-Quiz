/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Admin Page (`/admin`) for Firebase Firestore `questions` Collection CRUD
 * Supports:
 * - Google Sign-In for Admin verification (`isAdmin()` in `firestore.rules`)
 * - Add new question (`question`, 4 `options`, `correctIndex`, `category`, `level`)
 * - Edit existing question (`updateDoc` / `setDoc`)
 * - Delete question (`deleteDoc`)
 * - 1-Click Seed of default 16 Khmer Grade 1 questions when Firestore starts empty
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  FileEdit,
  LogIn,
  LogOut,
  Database,
  CheckCircle2,
  AlertCircle,
  X,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import {
  FirebaseUser,
  BOOTSTRAPPED_ADMIN_EMAIL,
  signInAdminWithGoogle,
  signOutFirebaseUser,
  createFirestoreQuestion,
  updateFirestoreQuestion,
  setFirestoreQuestionById,
  deleteFirestoreQuestion,
} from '../firebase';
import {
  QUIZ_LESSONS,
  QuizQuestion,
  INITIAL_QUIZ_DATA,
  mapQuizQuestionToFirestoreInput,
} from '../defaultQuizData';
import { RoutePath } from '../rbacTypes';

interface AdminQuestionsPageProps {
  firebaseUser: FirebaseUser | null;
  questions: QuizQuestion[];
  isUsingFallback: boolean;
  onNavigate: (route: RoutePath) => void;
}

export const AdminQuestionsPage: React.FC<AdminQuestionsPageProps> = ({
  firebaseUser,
  questions,
  isUsingFallback,
  onNavigate,
}) => {
  // Form State (Add or Edit)
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState(
    'តើពាក្យ «អណ្តើក» ផ្តើមដោយព្យញ្ជនៈមួយណា?'
  );
  const [option0, setOption0] = useState('អ (Qa)');
  const [option1, setOption1] = useState('ក (Ka)');
  const [option2, setOption2] = useState('ស (Sa)');
  const [option3, setOption3] = useState('ហ (Ha)');
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [category, setCategory] = useState<string>('lesson-2');
  const [level, setLevel] = useState<string>('ថ្នាក់ទី១');
  const [icon, setIcon] = useState<string>('🐢');
  const [clueWordKhmer, setClueWordKhmer] = useState<string>('អណ្តើក');
  const [clueWordEnglish, setClueWordEnglish] = useState<string>('Turtle (Andaek)');
  const [explanation, setExplanation] = useState<string>(
    'ត្រឹមត្រូវ! «អ» គឺ អ អណ្តើក (Qa for Turtle)!'
  );

  // Filter & Feedback State
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const isVerifiedAdmin = Boolean(
    firebaseUser &&
      firebaseUser.emailVerified &&
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  );

  const resetForm = () => {
    setEditingDocId(null);
    setQuestionText('');
    setOption0('');
    setOption1('');
    setOption2('');
    setOption3('');
    setCorrectIndex(0);
    setCategory('lesson-1');
    setLevel('ថ្នាក់ទី១');
    setIcon('⭐');
    setClueWordKhmer('');
    setClueWordEnglish('');
    setExplanation('');
  };

  const handleStartEdit = (q: QuizQuestion) => {
    setEditingDocId(q.firestoreId || q.id);
    setQuestionText(q.questionKhmer);
    setOption0(q.options[0]?.label || '');
    setOption1(q.options[1]?.label || '');
    setOption2(q.options[2]?.label || '');
    setOption3(q.options[3]?.label || '');
    setCorrectIndex(q.correctIndex);
    setCategory(q.category || q.lessonId);
    setLevel(q.level || 'ថ្នាក់ទី១');
    setIcon(q.icon || '⭐');
    setClueWordKhmer(q.clueWordKhmer || '');
    setClueWordEnglish(q.clueWordEnglish || '');
    setExplanation(q.explanation || '');
    setStatusBanner(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoogleSignIn = async () => {
    setStatusBanner(null);
    try {
      const user = await signInAdminWithGoogle();
      setStatusBanner({
        type: 'success',
        message: `បានចូលគណនីជោគជ័យ៖ ${user.email}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusBanner({
        type: 'error',
        message: `បរាជ័យក្នុងការចូលគណនី Google៖ ${msg}`,
      });
    }
  };

  const handleSignOut = async () => {
    await signOutFirebaseUser();
    setStatusBanner({
      type: 'success',
      message: 'បានចាកចេញពីគណនី Firebase Admin។',
    });
  };

  const handleSeedDefaultQuestions = async () => {
    if (!firebaseUser) {
      setStatusBanner({
        type: 'error',
        message: 'សូមចុច «ចូលគណនី Admin តាម Google» ជាមុនសិន មុននឹងបញ្ចូលទិន្នន័យទៅក្នុង Firestore។',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusBanner(null);
    try {
      for (const item of INITIAL_QUIZ_DATA) {
        await setFirestoreQuestionById(item.id, mapQuizQuestionToFirestoreInput(item));
      }
      setStatusBanner({
        type: 'success',
        message: 'បានបញ្ចូលសំណួរអក្សរខ្មែរគំរូទាំង ១៦ ចូលទៅក្នុង Firestore collection `questions` ដោយជោគជ័យ!',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusBanner({
        type: 'error',
        message: `មិនអាចបញ្ចូលសំណួរបានទេ (សូមប្រាកដថាអ្នកចូលគណនី Admin)៖ ${msg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      setStatusBanner({
        type: 'error',
        message: 'សូមចុច «ចូលគណនី Admin តាម Google» ជាមុនសិន ដើម្បីមានសិទ្ធិបន្ថែម ឬកែប្រែសំណួរ។',
      });
      return;
    }

    if (
      !questionText.trim() ||
      !option0.trim() ||
      !option1.trim() ||
      !option2.trim() ||
      !option3.trim()
    ) {
      setStatusBanner({
        type: 'error',
        message: 'សូមបំពេញសំណួរ និងជម្រើសទាំង ៤ ឱ្យបានគ្រប់គ្រាន់។',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusBanner(null);

    const payload = {
      question: questionText.trim(),
      options: [option0.trim(), option1.trim(), option2.trim(), option3.trim()] as [
        string,
        string,
        string,
        string,
      ],
      correctIndex,
      category: category.trim() || 'lesson-1',
      level: level.trim() || 'ថ្នាក់ទី១',
      icon: icon.trim() || undefined,
      clueWordKhmer: clueWordKhmer.trim() || undefined,
      clueWordEnglish: clueWordEnglish.trim() || undefined,
      explanation: explanation.trim() || undefined,
    };

    try {
      if (editingDocId) {
        if (isUsingFallback) {
          // Seed defaults first so all fallback questions persist alongside this edited item
          for (const item of INITIAL_QUIZ_DATA) {
            if (item.id === editingDocId) {
              await setFirestoreQuestionById(editingDocId, payload);
            } else {
              await setFirestoreQuestionById(item.id, mapQuizQuestionToFirestoreInput(item));
            }
          }
        } else {
          await updateFirestoreQuestion(editingDocId, payload);
        }
        setStatusBanner({
          type: 'success',
          message: '✓ បានកែប្រែសំណួរក្នុង Firestore collection `questions` ដោយជោគជ័យ!',
        });
        resetForm();
      } else {
        await createFirestoreQuestion(payload);
        setStatusBanner({
          type: 'success',
          message: '✓ បានបន្ថែមសំណួរថ្មីទៅក្នុង Firestore collection `questions` ដោយជោគជ័យ!',
        });
        resetForm();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusBanner({
        type: 'error',
        message: `បរាជ័យក្នុងការរក្សាទុកសំណួរ៖ ${msg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (q: QuizQuestion) => {
    if (!firebaseUser) {
      setStatusBanner({
        type: 'error',
        message: 'សូមចូលគណនី Admin តាម Google ជាមុនសិន ដើម្បីលុបសំណួរ។',
      });
      return;
    }

    setIsSubmitting(true);
    setStatusBanner(null);
    try {
      if (isUsingFallback) {
        // Seed all OTHER fallback questions to Firestore so deleting 1 removes only that 1
        for (const item of INITIAL_QUIZ_DATA) {
          if (item.id !== q.id) {
            await setFirestoreQuestionById(item.id, mapQuizQuestionToFirestoreInput(item));
          }
        }
      } else if (q.firestoreId) {
        await deleteFirestoreQuestion(q.firestoreId);
      }
      if (editingDocId === (q.firestoreId || q.id)) {
        resetForm();
      }
      setStatusBanner({
        type: 'success',
        message: `✓ បានលុបសំណួរ «${q.questionKhmer}» ចេញពី Firestore រួចរាល់!`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusBanner({
        type: 'error',
        message: `បរាជ័យក្នុងការលុបសំណួរ៖ ${msg}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleQuestions = questions.filter((q) =>
    filterCategory === 'ALL' ? true : q.lessonId === filterCategory || q.category === filterCategory
  );

  return (
    <div className="space-y-6 animate-pop">
      {/* Top Admin Header & Auth Bar */}
      <div className="bg-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-amber-200/80">
          <div>
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>ផ្ទាំងគ្រប់គ្រងសំណួរ Firebase Firestore (`questions` Collection)</span>
            </p>
            <h1 className="font-khmer-title text-xl sm:text-3xl text-slate-900 mt-1 leading-relaxed">
              គ្រប់គ្រងសំណួរ៖ បន្ថែម កែប្រែ និងលុប (Admin CRUD)
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => onNavigate('/leaderboard')}
              className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>តារាងពិន្ទុ (Leaderboard)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/student')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 shadow-[0_3px_0_#b45309] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ត្រឡប់ទៅមេរៀនសិស្ស (/student)</span>
            </button>
          </div>
        </div>

        {/* Admin Google Auth Status Row */}
        <div className="rounded-2xl border border-slate-200 bg-[#FFFDF7] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            {firebaseUser ? (
              <>
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>គណនីកំពុងប្រើប្រាស់៖</span>
                  <span className="font-mono text-emerald-700">{firebaseUser.email}</span>
                  {isVerifiedAdmin ? (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-xs font-bold">
                      ✓ Admin សិទ្ធិពេញលេញ
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold">
                      គណនីមិនមែន Admin គោល ({BOOTSTRAPPED_ADMIN_EMAIL})
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-600">
                  ស្ថានភាពទិន្នន័យបច្ចុប្បន្ន៖{' '}
                  {isUsingFallback ? (
                    <strong className="text-amber-700">
                      Firestore ទទេ — កំពុងបង្ហាញសំណួរគំរូទាំង ១៦ (ចុចប៊ូតុងខាងស្តាំដើម្បីបញ្ចូលទៅ Firestore)
                    </strong>
                  ) : (
                    <strong className="text-emerald-700">
                      កំពុងផ្ទុកផ្ទាល់ពី Firestore ({questions.length} សំណួរ)
                    </strong>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-900">
                  🔒 សូមចូលគណនី Google Admin ដើម្បីបន្ថែម កែប្រែ ឬលុបសំណួរក្នុង Firestore
                </p>
                <p className="text-xs text-slate-600">
                  តាមច្បាប់សុវត្ថិភាព Firestore Security Rules អ្នកគ្រប់គ្នាអាចអានសំណួរបាន ប៉ុន្តែមានតែ Admin ប៉ុណ្ណោះដែលអាចសរសេរទៅកាន់ `questions`។
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {isUsingFallback && firebaseUser && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSeedDefaultQuestions}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>បញ្ចូលសំណួរគំរូទាំង ១៦ ចូល Firestore</span>
              </button>
            )}

            {firebaseUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>ចាកចេញ (Sign Out)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>ចូលគណនី Admin តាម Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Toast Banner */}
        {statusBanner && (
          <div
            className={`rounded-2xl border p-4 text-xs sm:text-sm font-bold flex items-start justify-between gap-3 ${
              statusBanner.type === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                : 'border-rose-300 bg-rose-50 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5 leading-relaxed">
              {statusBanner.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Two-Column CRUD Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: ADD / EDIT FORM */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-7 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-amber-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              {editingDocId ? (
                <>
                  <FileEdit className="w-5 h-5 text-amber-600" />
                  <span>កែប្រែសំណួរ (Edit Question)</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 text-emerald-600" />
                  <span>បន្ថែមសំណួរថ្មី (Add Question)</span>
                </>
              )}
            </h2>
            {editingDocId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                បោះបង់ (Cancel Edit)
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitQuestion} className="space-y-4">
            {/* 1. question (string) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ១. សំណួរភាសាខ្មែរ (`question` — string) *
              </label>
              <input
                type="text"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                maxLength={500}
                placeholder="ឧទាហរណ៍៖ តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold leading-relaxed"
                required
              />
            </div>

            {/* 2. options (array of 4 strings) & 3. correctIndex (0..3) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ២. ជម្រើសទាំង ៤ (`options` — 4 strings) និងជ្រើសរើសចម្លើយត្រូវ (`correctIndex`) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { idx: 0, val: option0, setVal: setOption0, placeholder: 'ជម្រើសទី ១ (Index 0)' },
                  { idx: 1, val: option1, setVal: setOption1, placeholder: 'ជម្រើសទី ២ (Index 1)' },
                  { idx: 2, val: option2, setVal: setOption2, placeholder: 'ជម្រើសទី ៣ (Index 2)' },
                  { idx: 3, val: option3, setVal: setOption3, placeholder: 'ជម្រើសទី ៤ (Index 3)' },
                ].map((optField) => {
                  const isCorrect = correctIndex === optField.idx;
                  return (
                    <div
                      key={optField.idx}
                      className={`rounded-xl border-2 p-2.5 transition-colors ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50/50'
                          : 'border-slate-200 bg-slate-50/40'
                      }`}
                    >
                      <label className="flex items-center gap-2 text-xs font-bold text-slate-700 mb-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="correctIndex"
                          checked={isCorrect}
                          onChange={() => setCorrectIndex(optField.idx)}
                          className="accent-emerald-600"
                        />
                        <span>
                          {isCorrect
                            ? `✓ ចម្លើយត្រូវ (Index ${optField.idx})`
                            : `ជម្រើស Index ${optField.idx}`}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={optField.val}
                        onChange={(e) => optField.setVal(e.target.value)}
                        maxLength={200}
                        placeholder={optField.placeholder}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold leading-relaxed"
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. category & 5. level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ៣. មេរៀន / ប្រភេទ (`category`) *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs sm:text-sm font-bold"
                >
                  {QUIZ_LESSONS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.numberLabel} ({l.titleKhmer})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ៤. កម្រិតថ្នាក់ (`level`) *
                </label>
                <input
                  type="text"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  maxLength={60}
                  placeholder="ថ្នាក់ទី១"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                  required
                />
              </div>
            </div>

            {/* Optional Visual Clues for Kid-Friendly Display */}
            <div className="pt-2 border-t border-slate-200/80 space-y-3">
              <p className="text-xs font-bold text-slate-500">
                ព័ត៌មានរូបភាព និងសំឡេងបន្ថែមសម្រាប់កុមារ (Optional Clues)
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">រូប Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    maxLength={32}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-center"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">ពាក្យគំរូខ្មែរ</label>
                  <input
                    type="text"
                    value={clueWordKhmer}
                    onChange={(e) => setClueWordKhmer(e.target.value)}
                    maxLength={120}
                    placeholder="ឧ. អណ្តើក"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold leading-relaxed"
                  />
                </div>
              </div>
              <input
                type="text"
                value={clueWordEnglish}
                onChange={(e) => setClueWordEnglish(e.target.value)}
                maxLength={120}
                placeholder="ពាក្យបកប្រែអង់គ្លេស (ឧ. Turtle - Andaek)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm"
              />
              <input
                type="text"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                maxLength={300}
                placeholder="ការពន្យល់ពេលឆ្លើយត្រូវ (ឧ. ត្រឹមត្រូវ! «អ» គឺ អ អណ្តើក!)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-sm shadow-[0_4px_0_#065f46] flex items-center justify-center gap-2 cursor-pointer"
            >
              {editingDocId ? (
                <>
                  <FileEdit className="w-4 h-4" />
                  <span>{isSubmitting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកការកែប្រែ (Update Question)'}</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>{isSubmitting ? 'កំពុងបន្ថែម...' : 'បន្ថែមសំណួរទៅ Firestore (Add Question)'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: EXISTING QUESTIONS LIST WITH EDIT & DELETE */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                បញ្ជីសំណួរទាំងអស់ ({visibleQuestions.length} សំណួរ)
              </h2>
              <p className="text-xs text-slate-500">
                ចុចប៊ូតុង «កែប្រែ» ឬ «លុប» ដើម្បីគ្រប់គ្រងទិន្នន័យក្នុង Firestore
              </p>
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold self-start sm:self-center"
            >
              <option value="ALL">គ្រប់មេរៀនទាំងអស់ (All Categories)</option>
              {QUIZ_LESSONS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.numberLabel}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {visibleQuestions.map((q, index) => (
              <div
                key={q.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  editingDocId === (q.firestoreId || q.id)
                    ? 'border-amber-400 bg-amber-50/70'
                    : 'border-slate-200 bg-[#FFFDF7]/60 hover:bg-amber-50/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-2xl shrink-0">
                      {q.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-800">
                        #{index + 1} · {q.category} · {q.level}
                      </p>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5 leading-relaxed">
                        {q.questionKhmer}
                      </h3>

                      {/* 4 Options Preview */}
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {q.options.map((opt, optIdx) => (
                          <span
                            key={optIdx}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border leading-relaxed ${
                              optIdx === q.correctIndex
                                ? 'border-emerald-400 bg-emerald-100 text-emerald-900'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {optIdx === q.correctIndex ? '✓ ' : ''}
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(q)}
                      className="px-3 py-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                      <span>កែប្រែ</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleDelete(q)}
                      className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>លុប</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
