/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Grade 1 Khmer EdTech Platform with:
 * 1. Lesson-Based Quiz Selection (ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន)
 * 2. Dynamic Question Filtering by `lessonId`
 * 3. Role-Based Access Control (RBAC: Admin, Teacher/Editor, Student)
 * 4. iOS & Android PWA / APK Installation Hub
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Volume2,
  Star,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  Download,
  Copy,
  Check,
  Code2,
  WifiOff,
  Share,
  User,
  BookOpen,
  LayoutGrid,
  Users,
  Trash2,
  Plus,
  FileEdit,
  ShieldCheck,
  Database,
  Server
} from 'lucide-react';
import { STANDALONE_HTML_CODE } from './standaloneHtmlTemplate';
import {
  VERCEL_POSTGRES_SCHEMA_SQL,
  VERCEL_JSON_CONFIG,
  DbStatusResponse
} from './vercelDbTemplate';
import {
  useOnlineStatus,
  CAPACITOR_ANDROID_BUILD_SCRIPT,
  CAPACITOR_IOS_BUILD_SCRIPT,
  generateIOSMobileConfig
} from './usePWAInstall';
import { RoutePath, UserRole } from './rbacTypes';
import {
  playSoundEffect,
  speakKhmerText,
  cancelActiveSpeech,
  safeLoadFromStorage
} from './audioEngine';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// ============================================================================
// 1. LESSON DEFINITIONS & QUESTION DATASET TAGGED BY `lessonId`
// ============================================================================

export type LessonId = 'lesson-1' | 'lesson-2' | 'lesson-3' | 'lesson-4';

export interface QuizLessonMeta {
  id: LessonId;
  numberLabel: string;
  titleKhmer: string;
  titleEnglish: string;
  sampleLetters: string;
  icon: string;
  description: string;
}

export const QUIZ_LESSONS: QuizLessonMeta[] = [
  {
    id: 'lesson-1',
    numberLabel: 'មេរៀនទី ១ · Lesson 1',
    titleKhmer: 'ព្យញ្ជនៈ ជួរ ក (វគ្គទី១)',
    titleEnglish: 'Khmer Consonants — Group 1 (ក ខ គ ឃ ង)',
    sampleLetters: 'ក · ខ · គ · ឃ · ង',
    icon: '🦀',
    description: 'ហាត់ស្គាល់ និងអានព្យញ្ជនៈជួរ ក (ក ក្តាម, ខ ខ្លា, គ គោ, ឃ ឃ្មុំ)',
  },
  {
    id: 'lesson-2',
    numberLabel: 'មេរៀនទី ២ · Lesson 2',
    titleKhmer: 'ព្យញ្ជនៈ ជួរ ច និង ដ-ស',
    titleEnglish: 'Khmer Consonants — Group 2 (ច ឆ ដ ស)',
    sampleLetters: 'ច · ឆ · ដ · ស',
    icon: '🐘',
    description: 'ហាត់ស្គាល់ព្យញ្ជនៈ ច ចេក, ឆ ឆ្មា, ដ ដំរី និង ស សេះ',
  },
  {
    id: 'lesson-3',
    numberLabel: 'មេរៀនទី ៣ · Lesson 3',
    titleKhmer: 'ស្រៈនិស្ស័យ (Dependent Vowels)',
    titleEnglish: 'Khmer Dependent Vowels (ា ិ ី ុ ូ េ ោ ៅ)',
    sampleLetters: 'ា · ី · ោ · ៅ',
    icon: '🐟',
    description: 'ហាត់ប្រកប និងស្គាល់ស្រៈនិស្ស័យ (ស្រៈ អា, ស្រៈ អី, ស្រៈ អោ, ស្រៈ អៅ)',
  },
  {
    id: 'lesson-4',
    numberLabel: 'មេរៀនទី ៤ · Lesson 4',
    titleKhmer: 'ស្រៈពេញតួ (Independent Vowels)',
    titleEnglish: 'Khmer Independent Vowels (ឥ ឧ ឪ ឯ ឱ)',
    sampleLetters: 'ឥ · ឧ · ឯ · ឪ',
    icon: '🪷',
    description: 'ហាត់ស្គាល់ស្រៈពេញតួក្នុងភាសាខ្មែរ (ឥ ឥសី, ឧ ឧសភា, ឯ ឯកសណ្ឋាន, ឪ ឪឡឹក)',
  },
];

export interface QuizOption {
  letter: string;
  label: string;
  speech: string;
}

export interface QuizQuestion {
  id: number;
  lessonId: LessonId;
  categoryLabel: string;
  icon: string;
  clueWordKhmer: string;
  clueWordEnglish: string;
  phoneticHint: string;
  speechText: string;
  questionKhmer: string;
  questionEnglish: string;
  options: [QuizOption, QuizOption, QuizOption];
  correctLetter: string;
  explanation: string;
}

/**
 * Sample Dataset of 16 Interactive Questions (4 Questions per Lesson)
 * Tagged by `lessonId` for dynamic lesson filtering.
 */
export const INITIAL_QUIZ_DATA: QuizQuestion[] = [
  // ---------------- LESSON 1: ព្យញ្ជនៈ ជួរ ក (lesson-1) ----------------
  {
    id: 101,
    lessonId: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    icon: '🦀',
    clueWordKhmer: 'ក្តាម',
    clueWordEnglish: 'Crab (Kdaam)',
    phoneticHint: 'សំឡេងអាន៖ «ក» (Ka) — ក ក្តាម',
    speechText: 'ក... ក ក្តាម',
    questionKhmer: 'តើពាក្យ «ក្តាម» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Crab (ក្តាម)?',
    options: [
      { letter: 'ក', label: 'ក (Ka)', speech: 'ក' },
      { letter: 'ខ', label: 'ខ (Kha)', speech: 'ខ' },
      { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
    ],
    correctLetter: 'ក',
    explanation: 'ត្រឹមត្រូវ! «ក» គឺ ក ក្តាម (Ka for Crab)!',
  },
  {
    id: 102,
    lessonId: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    icon: '🐯',
    clueWordKhmer: 'ខ្លា',
    clueWordEnglish: 'Tiger (Khlaa)',
    phoneticHint: 'សំឡេងអាន៖ «ខ» (Kha) — ខ ខ្លា',
    speechText: 'ខ... ខ ខ្លា',
    questionKhmer: 'តើពាក្យ «ខ្លា» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Tiger (ខ្លា)?',
    options: [
      { letter: 'ង', label: 'ង (Ngo)', speech: 'ង' },
      { letter: 'ខ', label: 'ខ (Kha)', speech: 'ខ' },
      { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
    ],
    correctLetter: 'ខ',
    explanation: 'ពូកែណាស់! «ខ» គឺ ខ ខ្លា (Kha for Tiger)!',
  },
  {
    id: 103,
    lessonId: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    icon: '🐄',
    clueWordKhmer: 'គោ',
    clueWordEnglish: 'Cow (Kou)',
    phoneticHint: 'សំឡេងអាន៖ «គ» (Ko) — គ គោ',
    speechText: 'គ... គ គោ',
    questionKhmer: 'តើពាក្យ «គោ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Cow (គោ)?',
    options: [
      { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
      { letter: 'ក', label: 'ក (Ka)', speech: 'ក' },
      { letter: 'ឃ', label: 'ឃ (Kho)', speech: 'ឃ' },
    ],
    correctLetter: 'គ',
    explanation: 'អស្ចារ្យណាស់! «គ» គឺ គ គោ (Ko for Cow)!',
  },
  {
    id: 104,
    lessonId: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    icon: '🐝',
    clueWordKhmer: 'ឃ្មុំ',
    clueWordEnglish: 'Bee (Khmum)',
    phoneticHint: 'សំឡេងអាន៖ «ឃ» (Kho) — ឃ ឃ្មុំ',
    speechText: 'ឃ... ឃ ឃ្មុំ',
    questionKhmer: 'តើពាក្យ «ឃ្មុំ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Bee (ឃ្មុំ)?',
    options: [
      { letter: 'គ', label: 'គ (Ko)', speech: 'គ' },
      { letter: 'ឃ', label: 'ឃ (Kho)', speech: 'ឃ' },
      { letter: 'ង', label: 'ង (Ngo)', speech: 'ង' },
    ],
    correctLetter: 'ឃ',
    explanation: 'ត្រឹមត្រូវ! «ឃ» គឺ ឃ ឃ្មុំ (Kho for Bee)!',
  },

  // ---------------- LESSON 2: ព្យញ្ជនៈ ជួរ ច និង ដ-ស (lesson-2) ----------------
  {
    id: 201,
    lessonId: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    icon: '🍌',
    clueWordKhmer: 'ចេក',
    clueWordEnglish: 'Banana (Chek)',
    phoneticHint: 'សំឡេងអាន៖ «ច» (Cha) — ច ចេក',
    speechText: 'ច... ច ចេក',
    questionKhmer: 'តើពាក្យ «ចេក» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Banana (ចេក)?',
    options: [
      { letter: 'ឆ', label: 'ឆ (Chha)', speech: 'ឆ' },
      { letter: 'ជ', label: 'ជ (Cho)', speech: 'ជ' },
      { letter: 'ច', label: 'ច (Cha)', speech: 'ច' },
    ],
    correctLetter: 'ច',
    explanation: 'ត្រឹមត្រូវហើយ! «ច» គឺ ច ចេក (Cha for Banana)!',
  },
  {
    id: 202,
    lessonId: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    icon: '🐱',
    clueWordKhmer: 'ឆ្មា',
    clueWordEnglish: 'Cat (Chhmaa)',
    phoneticHint: 'សំឡេងអាន៖ «ឆ» (Chha) — ឆ ឆ្មា',
    speechText: 'ឆ... ឆ ឆ្មា',
    questionKhmer: 'តើពាក្យ «ឆ្មា» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Cat (ឆ្មា)?',
    options: [
      { letter: 'ច', label: 'ច (Cha)', speech: 'ច' },
      { letter: 'ឆ', label: 'ឆ (Chha)', speech: 'ឆ' },
      { letter: 'ញ', label: 'ញ (Nho)', speech: 'ញ' },
    ],
    correctLetter: 'ឆ',
    explanation: 'ពូកែណាស់! «ឆ» គឺ ឆ ឆ្មា (Chha for Cat)!',
  },
  {
    id: 203,
    lessonId: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    icon: '🐘',
    clueWordKhmer: 'ដំរី',
    clueWordEnglish: 'Elephant (Damrei)',
    phoneticHint: 'សំឡេងអាន៖ «ដ» (Da) — ដ ដំរី',
    speechText: 'ដ... ដ ដំរី',
    questionKhmer: 'តើពាក្យ «ដំរី» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Elephant (ដំរី)?',
    options: [
      { letter: 'ដ', label: 'ដ (Da)', speech: 'ដ' },
      { letter: 'ថ', label: 'ថ (Tha)', speech: 'ថ' },
      { letter: 'ត', label: 'ត (Ta)', speech: 'ត' },
    ],
    correctLetter: 'ដ',
    explanation: 'ឆ្លាតណាស់! «ដ» គឺ ដ ដំរី (Da for Elephant)!',
  },
  {
    id: 204,
    lessonId: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    icon: '🐴',
    clueWordKhmer: 'សេះ',
    clueWordEnglish: 'Horse (Seh)',
    phoneticHint: 'សំឡេងអាន៖ «ស» (Sa) — ស សេះ',
    speechText: 'ស... ស សេះ',
    questionKhmer: 'តើពាក្យ «សេះ» ផ្តើមដោយព្យញ្ជនៈមួយណា?',
    questionEnglish: 'Which Khmer consonant starts the word for Horse (សេះ)?',
    options: [
      { letter: 'ហ', label: 'ហ (Ha)', speech: 'ហ' },
      { letter: 'ស', label: 'ស (Sa)', speech: 'ស' },
      { letter: 'អ', label: 'អ (Qa)', speech: 'អ' },
    ],
    correctLetter: 'ស',
    explanation: 'ល្អណាស់! «ស» គឺ ស សេះ (Sa for Horse)!',
  },

  // ---------------- LESSON 3: ស្រៈនិស្ស័យ (lesson-3) ----------------
  {
    id: 301,
    lessonId: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    icon: '📖',
    clueWordKhmer: 'ក + ា = កា',
    clueWordEnglish: 'Vowel Sra Aa (ា)',
    phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អា» (Sra Aa)',
    speechText: 'ស្រៈ អា... ក អា កា',
    questionKhmer: 'តើមួយណាជា «ស្រៈ អា» (ា) ក្នុងពាក្យ «កា»?',
    questionEnglish: 'Which vowel is "Sra Aa" (ា) as in កា?',
    options: [
      { letter: 'ា', label: 'ា (ស្រៈ អា)', speech: 'ស្រៈ អា' },
      { letter: 'ិ', label: 'ិ (ស្រៈ អិ)', speech: 'ស្រៈ អិ' },
      { letter: 'ុ', label: 'ុ (ស្រៈ អុ)', speech: 'ស្រៈ អុ' },
    ],
    correctLetter: 'ា',
    explanation: 'ត្រឹមត្រូវ! «ា» អានថា ស្រៈ អា (Sra Aa)!',
  },
  {
    id: 302,
    lessonId: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    icon: '🐟',
    clueWordKhmer: 'ត្រី',
    clueWordEnglish: 'Fish (Trei — uses ី)',
    phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អី» (Sra Ei)',
    speechText: 'ស្រៈ អី... ត្រី',
    questionKhmer: 'តើពាក្យ «ត្រី» ប្រើស្រៈមួយណានៅខាងលើ?',
    questionEnglish: 'Which top vowel is used in the word ត្រី (Fish)?',
    options: [
      { letter: 'ិ', label: 'ិ (ស្រៈ អិ)', speech: 'ស្រៈ អិ' },
      { letter: 'ី', label: 'ី (ស្រៈ អី)', speech: 'ស្រៈ អី' },
      { letter: 'ឹ', label: 'ឹ (ស្រៈ អឹ)', speech: 'ស្រៈ អឹ' },
    ],
    correctLetter: 'ី',
    explanation: 'ពូកែណាស់! «ី» អានថា ស្រៈ អី (Sra Ei)!',
  },
  {
    id: 303,
    lessonId: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    icon: '🐄',
    clueWordKhmer: 'គ + ោ = គោ',
    clueWordEnglish: 'Vowel Sra Ao (ោ)',
    phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អោ» (Sra Ao)',
    speechText: 'ស្រៈ អោ... គ អោ គោ',
    questionKhmer: 'តើពាក្យ «គោ» (Cow) ផ្សំជាមួយស្រៈមួយណា?',
    questionEnglish: 'Which vowel combines with គ to spell គោ (Cow)?',
    options: [
      { letter: 'េ', label: 'េ (ស្រៈ អេ)', speech: 'ស្រៈ អេ' },
      { letter: 'ែ', label: 'ែ (ស្រៈ អែ)', speech: 'ស្រៈ អែ' },
      { letter: 'ោ', label: 'ោ (ស្រៈ អោ)', speech: 'ស្រៈ អោ' },
    ],
    correctLetter: 'ោ',
    explanation: 'អស្ចារ្យណាស់! «ោ» អានថា ស្រៈ អោ (Sra Ao)!',
  },
  {
    id: 304,
    lessonId: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    icon: '🦋',
    clueWordKhmer: 'មេអំបៅ',
    clueWordEnglish: 'Butterfly (Me-Am-Bau)',
    phoneticHint: 'សំឡេងអាន៖ «ស្រៈ អៅ» (Sra Au)',
    speechText: 'ស្រៈ អៅ... ប អៅ បៅ',
    questionKhmer: 'តើមួយណាជា «ស្រៈ អៅ» (ៅ) ក្នុងពាក្យ «មេអំបៅ»?',
    questionEnglish: 'Which vowel is "Sra Au" (ៅ) in មេអំបៅ (Butterfly)?',
    options: [
      { letter: 'ៅ', label: 'ៅ (ស្រៈ អៅ)', speech: 'ស្រៈ អៅ' },
      { letter: 'ោ', label: 'ោ (ស្រៈ អោ)', speech: 'ស្រៈ អោ' },
      { letter: 'ាំ', label: 'ាំ (ស្រៈ អាំ)', speech: 'ស្រៈ អាំ' },
    ],
    correctLetter: 'ៅ',
    explanation: 'ត្រឹមត្រូវហើយ! «ៅ» អានថា ស្រៈ អៅ (Sra Au)!',
  },

  // ---------------- LESSON 4: ស្រៈពេញតួ (lesson-4) ----------------
  {
    id: 401,
    lessonId: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    icon: '🧙‍♂️',
    clueWordKhmer: 'ឥសី',
    clueWordEnglish: 'Hermit / Sage (Eysei)',
    phoneticHint: 'សំឡេងអាន៖ «ឥ» (Sra E) — ឥ ឥសី',
    speechText: 'ឥ... ឥ ឥសី',
    questionKhmer: 'តើពាក្យ «ឥសី» ផ្តើមដោយស្រៈពេញតួមួយណា?',
    questionEnglish: 'Which independent vowel starts the word ឥសី (Hermit)?',
    options: [
      { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
      { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
      { letter: 'ឯ', label: 'ឯ (ស្រៈ ឯ)', speech: 'ឯ' },
    ],
    correctLetter: 'ឥ',
    explanation: 'ត្រឹមត្រូវ! «ឥ» គឺស្រៈពេញតួក្នុងពាក្យ ឥសី!',
  },
  {
    id: 402,
    lessonId: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    icon: '📅',
    clueWordKhmer: 'ឧសភា',
    clueWordEnglish: 'May (Usaphea)',
    phoneticHint: 'សំឡេងអាន៖ «ឧ» (Sra O) — ឧ ឧសភា',
    speechText: 'ឧ... ឧ ឧសភា',
    questionKhmer: 'តើពាក្យ «ឧសភា» ផ្តើមដោយស្រៈពេញតួមួយណា?',
    questionEnglish: 'Which independent vowel starts the word ឧសភា (May)?',
    options: [
      { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
      { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
      { letter: 'ឱ', label: 'ឱ (ស្រៈ ឱ)', speech: 'ឱ' },
    ],
    correctLetter: 'ឧ',
    explanation: 'ពូកែណាស់! «ឧ» គឺស្រៈពេញតួក្នុងពាក្យ ឧសភា!',
  },
  {
    id: 403,
    lessonId: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    icon: '👕',
    clueWordKhmer: 'ឯកសណ្ឋាន',
    clueWordEnglish: 'Uniform (Aekasanthan)',
    phoneticHint: 'សំឡេងអាន៖ «ឯ» (Sra Ae) — ឯ ឯកសណ្ឋាន',
    speechText: 'ឯ... ឯ ឯកសណ្ឋាន',
    questionKhmer: 'តើមួយណាជាស្រៈពេញតួ «ឯ» ក្នុងពាក្យ «ឯកសណ្ឋាន»?',
    questionEnglish: 'Which independent vowel is "ឯ" (Sra Ae)?',
    options: [
      { letter: 'ឯ', label: 'ឯ (ស្រៈ ឯ)', speech: 'ឯ' },
      { letter: 'ឥ', label: 'ឥ (ស្រៈ ឥ)', speech: 'ឥ' },
      { letter: 'ឪ', label: 'ឪ (ស្រៈ ឪ)', speech: 'ឪ' },
    ],
    correctLetter: 'ឯ',
    explanation: 'អស្ចារ្យណាស់! «ឯ» គឺស្រៈពេញតួក្នុងពាក្យ ឯកសណ្ឋាន!',
  },
  {
    id: 404,
    lessonId: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    icon: '🍉',
    clueWordKhmer: 'ឪឡឹក',
    clueWordEnglish: 'Watermelon (Ouvloek)',
    phoneticHint: 'សំឡេងអាន៖ «ឪ» (Sra Au) — ឪ ឪឡឹក',
    speechText: 'ឪ... ឪ ឪឡឹក',
    questionKhmer: 'តើពាក្យ «ឪឡឹក» (Watermelon) ផ្តើមដោយស្រៈពេញតួមួយណា?',
    questionEnglish: 'Which independent vowel starts the word ឪឡឹក (Watermelon)?',
    options: [
      { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
      { letter: 'ឪ', label: 'ឪ (ស្រៈ ឪ)', speech: 'ឪ' },
      { letter: 'ឱ', label: 'ឱ (ស្រៈ ឱ)', speech: 'ឱ' },
    ],
    correctLetter: 'ឪ',
    explanation: 'ត្រឹមត្រូវហើយ! «ឪ» គឺ ឪ ឪឡឹក (Watermelon)!',
  },
];

const PUBLIC_APP_URL = 'https://ais-pre-g6u6jad633q3ec5vfzslex-763946904784.asia-east1.run.app';

function toKhmerNumeral(num: number): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num)
    .split('')
    .map((d) => khmerDigits[Number(d)] ?? d)
    .join('');
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

type MobileOS = 'IOS' | 'ANDROID';
type StudentSubTab = 'QUIZ' | 'LEARN' | 'PROFILE';

const VALID_DIRECT_ROUTES: RoutePath[] = [
  '/student',
  '/admin',
  '/teacher',
  '/mobile-install',
  '/code',
];

/**
 * Resolves URL paths:
 * - Default `/` or `/login` goes straight to `/student` (open-access Student mode)
 * - Direct secret URLs `/admin` (or `/admin-dashboard`) and `/teacher` (or `/teacher-dashboard`)
 *   open the Admin Console or Teacher Studio for administrators.
 */
function resolveRoute(rawPath: string): RoutePath {
  const normalized = rawPath.toLowerCase().trim();
  if (normalized === '/admin' || normalized === '/admin-dashboard') {
    return '/admin';
  }
  if (normalized === '/teacher' || normalized === '/teacher-dashboard') {
    return '/teacher';
  }
  if (VALID_DIRECT_ROUTES.includes(normalized as RoutePath)) {
    return normalized as RoutePath;
  }
  return '/student';
}

export default function App() {
  // 1. Consume Context
  const {
    currentUser,
    usersDb,
    auditLogs,
    updateCurrentUserProfile,
    changeUserRole,
    toggleUserStatus,
    deleteUser,
    createUserByAdmin,
  } = useAuth();

  const [currentRoute, setCurrentRoute] = useState<RoutePath>(() => {
    if (typeof window !== 'undefined') {
      return resolveRoute(window.location.pathname);
    }
    return '/student';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const safeRoute = resolveRoute(currentRoute);
    if (safeRoute !== currentRoute) {
      setCurrentRoute(safeRoute);
      return;
    }
    if (window.location.pathname !== safeRoute) {
      try {
        window.history.replaceState({}, '', safeRoute);
      } catch {
        // Ignore in sandboxed contexts
      }
    }
  }, [currentRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const safeRoute = resolveRoute(window.location.pathname);
      setCurrentRoute(safeRoute);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 2. Student Portal & Lesson-Based Quiz Selection State
  const [studentSubTab, setStudentSubTab] = useState<StudentSubTab>('QUIZ');
  const [selectedLessonId, setSelectedLessonId] = useState<LessonId | 'ALL' | null>(null);
  const [profileNameEdit, setProfileNameEdit] = useState('');
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [selectedOS, setSelectedOS] = useState<MobileOS>('IOS');
  const [questions, setQuestions] = useState<QuizQuestion[]>(INITIAL_QUIZ_DATA);

  // Admin & Teacher Portal States (Only used when visiting /admin or /teacher directly)
  const [newAdminUserEmail, setNewAdminUserEmail] = useState('');
  const [newAdminUserName, setNewAdminUserName] = useState('');
  const [newAdminUserRole, setNewAdminUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const [newQIcon, setNewQIcon] = useState('🐢');
  const [newQLessonId, setNewQLessonId] = useState<LessonId>('lesson-2');
  const [newQWordKhmer, setNewQWordKhmer] = useState('អណ្តើក');
  const [newQWordEng, setNewQWordEng] = useState('Turtle (Andaek)');
  const [newQCorrect, setNewQCorrect] = useState('អ');
  const [newQWrong1, setNewQWrong1] = useState('ក');
  const [newQWrong2, setNewQWrong2] = useState('ស');

  const isOnline = useOnlineStatus();

  // Quiz Gameplay State
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const [isQuestionSolved, setIsQuestionSolved] = useState<boolean>(false);
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [lastSpokenToast, setLastSpokenToast] = useState<string>('');
  const [lessonBestScores, setLessonBestScores] = useState<Record<string, number>>(() =>
    safeLoadFromStorage<Record<string, number>>(
      'khmer_quiz_lesson_best_v1',
      {},
      (val): val is Record<string, number> =>
        typeof val === 'object' && val !== null && !Array.isArray(val)
    )
  );

  // Code, SQL & URL Copy States
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [copiedVercelJson, setCopiedVercelJson] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<DbStatusResponse | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(false);

  /**
   * DYNAMIC QUESTION FILTERING BY `lessonId`
   * Loads only questions belonging to the currently selected lesson.
   */
  const filteredQuestions = questions.filter((q) => {
    if (!selectedLessonId || selectedLessonId === 'ALL') return true;
    return q.lessonId === selectedLessonId;
  });

  const activeLessonMeta = QUIZ_LESSONS.find((l) => l.id === selectedLessonId) || null;
  const currentQuestion = filteredQuestions[currentIndex] || filteredQuestions[0];

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const checkVercelDatabaseStatus = useCallback(async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/quiz-data');
      if (res.ok) {
        const data = (await res.json()) as DbStatusResponse;
        setDbStatus(data);
      }
    } catch {
      // Ignore network error in offline mode
    } finally {
      setIsCheckingDb(false);
    }
  }, []);

  const handleInitVercelDatabase = async () => {
    setIsCheckingDb(true);
    try {
      const res = await fetch('/api/quiz-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init' }),
      });
      if (res.ok) {
        const data = (await res.json()) as DbStatusResponse;
        setDbStatus(data);
      }
    } catch {
      // Ignore network error in offline mode
    } finally {
      setIsCheckingDb(false);
    }
  };

  useEffect(() => {
    checkVercelDatabaseStatus();
  }, [checkVercelDatabaseStatus]);

  useEffect(() => {
    if (currentUser) {
      setProfileNameEdit(currentUser.fullName);
    }
  }, [currentUser]);

  const triggerSpeechWithBanner = useCallback((text: string, displayLabel?: string) => {
    speakKhmerText(text);
    setLastSpokenToast(displayLabel || text);
  }, []);

  const navigateToRoute = useCallback((targetRoute: RoutePath) => {
    const safeDestination = resolveRoute(targetRoute);
    setCurrentRoute(safeDestination);
  }, []);

  const handleCreateUserByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUserEmail.trim() || !newAdminUserName.trim()) return;
    createUserByAdmin(newAdminUserName, newAdminUserEmail, newAdminUserRole);
    setNewAdminUserEmail('');
    setNewAdminUserName('');
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQWordKhmer.trim() || !newQCorrect.trim()) return;
    const targetLesson = QUIZ_LESSONS.find((l) => l.id === newQLessonId) || QUIZ_LESSONS[0];
    const newQuestion: QuizQuestion = {
      id: Date.now(),
      lessonId: newQLessonId,
      categoryLabel: `${targetLesson.numberLabel} · ${targetLesson.titleKhmer}`,
      icon: newQIcon || '⭐',
      clueWordKhmer: newQWordKhmer.trim(),
      clueWordEnglish: newQWordEng.trim() || newQWordKhmer.trim(),
      phoneticHint: `សំឡេងអាន៖ «${newQCorrect.trim()}» — ${newQWordKhmer.trim()}`,
      speechText: `${newQCorrect.trim()}... ${newQWordKhmer.trim()}`,
      questionKhmer: `តើពាក្យ «${newQWordKhmer.trim()}» ប្រើតួអក្សរមួយណា?`,
      questionEnglish: `Which Khmer letter belongs to "${newQWordEng.trim()}"?`,
      options: [
        { letter: newQCorrect.trim(), label: `${newQCorrect.trim()}`, speech: newQCorrect.trim() },
        { letter: newQWrong1.trim() || 'ខ', label: `${newQWrong1.trim() || 'ខ'}`, speech: newQWrong1.trim() || 'ខ' },
        { letter: newQWrong2.trim() || 'គ', label: `${newQWrong2.trim() || 'គ'}`, speech: newQWrong2.trim() || 'គ' },
      ],
      correctLetter: newQCorrect.trim(),
      explanation: `ត្រឹមត្រូវ! «${newQCorrect.trim()}» គឺសម្រាប់ពាក្យ ${newQWordKhmer.trim()}!`,
    };
    setQuestions((prev) => [...prev, newQuestion]);
    setNewQWordKhmer('');
    setNewQWordEng('');
  };

  // ==========================================================================
  // LESSON SELECTION & QUIZ FLOW HANDLERS
  // ==========================================================================

  // Start a specific lesson quiz (`lesson-1`, `lesson-2`, `lesson-3`, `lesson-4`, or `ALL`)
  const handleStartLessonQuiz = (lessonId: LessonId | 'ALL') => {
    cancelActiveSpeech();
    setSelectedLessonId(lessonId);
    setCurrentIndex(0);
    setScore(0);
    setSelectedLetter(null);
    setWrongAttempts([]);
    setIsQuestionSolved(false);
    setIsQuizFinished(false);
    setIsTransitioning(false);
    setLastSpokenToast('');
    playSoundEffect('tap');
  };

  // Return to the Lesson Selection Screen ("ត្រឡប់ក្រោយ / Back to Lessons")
  const handleBackToLessonSelection = () => {
    cancelActiveSpeech();
    setSelectedLessonId(null);
    setCurrentIndex(0);
    setScore(0);
    setSelectedLetter(null);
    setWrongAttempts([]);
    setIsQuestionSolved(false);
    setIsQuizFinished(false);
    setIsTransitioning(false);
    setLastSpokenToast('');
    playSoundEffect('tap');
  };

  const handleSelectOption = (option: QuizOption) => {
    if (isTransitioning || !currentQuestion) return;

    triggerSpeechWithBanner(option.speech, `🔊 កំពុងអាន៖ «${option.label}»`);

    if (isQuestionSolved) return;

    setSelectedLetter(option.letter);

    if (option.letter === currentQuestion.correctLetter) {
      setIsQuestionSolved(true);
      setScore((prev) => prev + 1);
      playSoundEffect('correct');
    } else {
      playSoundEffect('tryAgain');
      if (!wrongAttempts.includes(option.letter)) {
        setWrongAttempts((prev) => [...prev, option.letter]);
      }
    }
  };

  const handleNextQuestion = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    if (currentIndex + 1 < filteredQuestions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedLetter(null);
      setWrongAttempts([]);
      setIsQuestionSolved(false);
      setIsTransitioning(false);
    } else {
      setIsQuizFinished(true);
      setIsTransitioning(false);
      playSoundEffect('victory');

      if (selectedLessonId) {
        setLessonBestScores((prev) => {
          const prevBest = prev[selectedLessonId] || 0;
          const updated = { ...prev, [selectedLessonId]: Math.max(prevBest, score) };
          try {
            localStorage.setItem('khmer_quiz_lesson_best_v1', JSON.stringify(updated));
          } catch {
            // Ignore
          }
          return updated;
        });
      }

      if (currentUser) {
        updateCurrentUserProfile({
          starsEarned: currentUser.starsEarned + score,
          quizzesCompleted: currentUser.quizzesCompleted + 1,
        });

        // Non-blocking sync to Vercel Postgres (/api/quiz-data) when online
        fetch('/api/quiz-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'save_score',
            userId: currentUser.id,
            lessonId: selectedLessonId || 'ALL',
            score,
          }),
        }).catch(() => {
          // Graceful offline/local fallback
        });
      }
    }
  };

  const handleRestartCurrentLesson = () => {
    cancelActiveSpeech();
    setCurrentIndex(0);
    setScore(0);
    setSelectedLetter(null);
    setWrongAttempts([]);
    setIsQuestionSolved(false);
    setIsQuizFinished(false);
    setIsTransitioning(false);
    setLastSpokenToast('');
    playSoundEffect('tap');
  };

  const handleUpdateStudentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !profileNameEdit.trim()) return;
    updateCurrentUserProfile({
      fullName: profileNameEdit.trim(),
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2500);
  };

  // Code & Mobile Export Helpers
  const handleCopyStandaloneHtml = async () => {
    try {
      await navigator.clipboard.writeText(STANDALONE_HTML_CODE);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(PUBLIC_APP_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyVercelSql = async () => {
    try {
      await navigator.clipboard.writeText(VERCEL_POSTGRES_SCHEMA_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyVercelJson = async () => {
    try {
      await navigator.clipboard.writeText(VERCEL_JSON_CONFIG);
      setCopiedVercelJson(true);
      setTimeout(() => setCopiedVercelJson(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadSqlFile = () => {
    const blob = new Blob([VERCEL_POSTGRES_SCHEMA_SQL], { type: 'application/sql;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadStandaloneHtml = () => {
    const blob = new Blob([STANDALONE_HTML_CODE], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadIOSProfile = () => {
    const xmlContent = generateIOSMobileConfig(PUBLIC_APP_URL);
    const blob = new Blob([xmlContent], { type: 'application/x-apple-aspen-config;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'KhmerQuiz-iOS.mobileconfig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBuildScript = (os: MobileOS) => {
    const content = os === 'IOS' ? CAPACITOR_IOS_BUILD_SCRIPT : CAPACITOR_ANDROID_BUILD_SCRIPT;
    const filename = os === 'IOS' ? 'build-khmer-ios.sh' : 'build-khmer-apk.sh';
    const blob = new Blob([content], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFDF7] text-slate-900 font-khmer selection:bg-amber-200">
      {/* =====================================================================
          STUDENT-ONLY TOP NAVIGATION BAR (Teacher & Admin Menus Hidden)
          ===================================================================== */}
      <header className="w-full bg-white/95 border-b border-amber-200/80 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              setSelectedLessonId(null);
              navigateToRoute('/student');
            }}
            className="font-khmer-title text-lg sm:text-xl text-slate-900 whitespace-nowrap shrink-0 hover:text-amber-700 transition-colors"
          >
            🐘 រៀនអក្សរខ្មែរថ្នាក់ទី១
          </a>

          {/* Zone 2: Student-Only Navigation Links (No /teacher or /admin links) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setSelectedLessonId(null);
                navigateToRoute('/student');
              }}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentRoute === '/student'
                  ? 'border-amber-500 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              មេរៀនសិស្ស (/student)
            </button>

            <button
              type="button"
              onClick={() => navigateToRoute('/mobile-install')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentRoute === '/mobile-install'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-emerald-700 hover:text-emerald-900'
              }`}
            >
              ដំឡើង iOS &amp; Android
            </button>

            <button
              type="button"
              onClick={() => navigateToRoute('/code')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentRoute === '/code'
                  ? 'border-amber-500 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              កូដ (Code)
            </button>
          </nav>

          {/* Zone 3: Student Star Reward Badge (Open-Access Mode, No Login Required) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => {
                setSelectedLessonId(null);
                setStudentSubTab('QUIZ');
                navigateToRoute('/student');
              }}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer shadow-[0_3px_0_#b45309]"
            >
              <Star className="w-4 h-4 fill-slate-950 text-slate-950 shrink-0" />
              <span>ផ្កាយរបស់កូន៖ {toKhmerNumeral(currentUser?.starsEarned ?? 0)}</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN WORKSPACE VIEWPORT (Exclusively Student-Facing)
          ===================================================================== */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* ===================================================================
            ROUTE 1: STUDENT DASHBOARD & LESSON-BASED QUIZ SELECTION (/student)
            =================================================================== */}
        {currentRoute === '/student' && (
          <ProtectedRoute
            routePath="/student"
            allowedRoles={['student']}
            onNavigate={navigateToRoute}
          >
            <div className="space-y-6">
              {/* Student Sub-Navigation & Personal Progress Strip */}
              <div className="bg-white rounded-3xl border border-amber-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-emerald-700">
                    សួស្តី {currentUser?.fullName}! · ផ្កាយសរុបរបស់កូន៖ ⭐ {currentUser?.starsEarned ?? 0}
                  </p>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន (Lesson-Based Quiz Selection)
                  </h1>
                </div>

                {/* Student Mode Tabs: Lessons/Quiz vs Flashcards vs Profile */}
                <div className="inline-flex items-center gap-1.5 p-1.5 bg-amber-50 rounded-2xl border border-amber-200/80 self-start">
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSubTab('QUIZ');
                      setSelectedLessonId(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      studentSubTab === 'QUIZ'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>ជ្រើសរើសមេរៀន (Lessons)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSubTab('LEARN')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      studentSubTab === 'LEARN'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>បណ្ណរៀនអក្សរ (Cards)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSubTab('PROFILE')}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                      studentSubTab === 'PROFILE'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>គណនីសិស្ស (Profile)</span>
                  </button>
                </div>
              </div>

              {/* =============================================================
                  SUB-TAB 1: LESSON SELECTION OR ACTIVE LESSON QUIZ
                  ============================================================= */}
              {studentSubTab === 'QUIZ' && (
                <div>
                  {selectedLessonId === null ? (
                    /* ---------------------------------------------------------
                       STAGE A: LESSON SELECTION DASHBOARD (ជ្រើសរើសមេរៀន)
                       --------------------------------------------------------- */
                    <section className="space-y-6 animate-pop">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                            📚 សូមជ្រើសរើសមេរៀនដើម្បីចាប់ផ្តើមឆ្លើយសំណួរ (Choose a Lesson)
                          </h2>
                          <p className="text-sm text-slate-600">
                            ចុចលើមេរៀនណាមួយខាងក្រោម ដើម្បីផ្ទុកសំណួរសម្រាប់តែមេរៀននោះ! (Click any lesson card to filter and load its questions.)
                          </p>
                        </div>

                        {/* Test Sound & Mixed Challenge Buttons */}
                        <div className="flex items-center gap-3 self-start shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              triggerSpeechWithBanner(
                                'ក... ក ក្តាម',
                                '🔊 សំឡេងដំណើរការល្អ! «ក... ក ក្តាម»'
                              )
                            }
                            className="px-4 py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 active:translate-y-0.5 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_3px_0_#0369a1]"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span>សាកល្បងសំឡេង (Test Sound)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartLessonQuiz('ALL')}
                            className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            🎯 លេងគ្រប់មេរៀនទាំងអស់ ({toKhmerNumeral(questions.length)} សំណួរ)
                          </button>
                        </div>
                      </div>

                      {/* 4 Kid-Friendly Lesson Selection Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {QUIZ_LESSONS.map((lesson) => {
                          const lessonQuestionCount = questions.filter(
                            (q) => q.lessonId === lesson.id
                          ).length;
                          const bestScore = lessonBestScores[lesson.id] || 0;

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => handleStartLessonQuiz(lesson.id)}
                              className="group text-left bg-white hover:bg-amber-50/70 rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-[0_5px_0_#fcd34d] active:translate-y-1 transition-all flex flex-col justify-between cursor-pointer"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-4 mb-5">
                                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-100/90 border border-amber-200 flex items-center justify-center text-4xl sm:text-5xl group-hover:scale-105 transition-transform">
                                    <span role="img" aria-label={lesson.titleEnglish}>
                                      {lesson.icon}
                                    </span>
                                  </div>
                                  <div className="text-right tabular-nums">
                                    <span className="text-xs sm:text-sm font-bold text-slate-600 block">
                                      ចំនួនសំណួរ៖ {toKhmerNumeral(lessonQuestionCount)} សំណួរ
                                    </span>
                                    <span className="block text-xs font-bold text-amber-600 mt-1">
                                      ⭐ ពិន្ទុខ្ពស់បំផុត៖ {toKhmerNumeral(bestScore)} / {toKhmerNumeral(lessonQuestionCount)}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-xs sm:text-sm font-bold text-amber-700 mb-1">
                                  {lesson.numberLabel}
                                </p>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                                  {lesson.titleKhmer}
                                </h3>
                                <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-3">
                                  {lesson.titleEnglish}
                                </p>
                                <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                                  {lesson.description}
                                </p>
                              </div>

                              <div className="pt-4 border-t border-amber-200/80 flex items-center justify-between gap-3">
                                <span className="text-base sm:text-lg font-bold text-slate-800">
                                  តួអក្សរ៖ {lesson.sampleLetters}
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-emerald-700 group-hover:translate-x-1 transition-transform whitespace-nowrap">
                                  <span>ចាប់ផ្តើមមេរៀន</span>
                                  <ArrowRight className="w-4 h-4" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ) : filteredQuestions.length === 0 ? (
                    /* ---------------------------------------------------------
                       SAFEGUARD: EMPTY LESSON STATE
                       --------------------------------------------------------- */
                    <section className="bg-white rounded-3xl border-2 border-amber-300 p-8 sm:p-12 text-center animate-pop max-w-2xl mx-auto">
                      <div className="text-6xl mb-3" aria-hidden="true">
                        📭
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                        មិនទាន់មានសំណួរក្នុងមេរៀននេះទេ (No Questions Found)
                      </h2>
                      <p className="text-sm text-slate-600 mb-6">
                        សូមត្រឡប់ទៅជ្រើសរើសមេរៀនផ្សេង ឬបន្ថែមសំណួរថ្មីក្នុងផ្ទាំងគ្រូបង្រៀន។
                      </p>
                      <button
                        type="button"
                        onClick={handleBackToLessonSelection}
                        className="px-6 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>ត្រឡប់ទៅជ្រើសរើសមេរៀន (Back to Lessons)</span>
                      </button>
                    </section>
                  ) : !isQuizFinished && currentQuestion ? (
                    /* ---------------------------------------------------------
                       STAGE B: ACTIVE LESSON QUIZ SCREEN (WITH BACK TO LESSONS)
                       --------------------------------------------------------- */
                    <div className="animate-pop">
                      {/* Quiz Header Bar with "ត្រឡប់ក្រោយ (Back to Lessons)" Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-amber-200/70">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleBackToLessonSelection}
                            className="px-4 py-2.5 rounded-xl bg-white border-2 border-amber-300 hover:bg-amber-50 active:translate-y-0.5 text-slate-900 font-bold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>ត្រឡប់ក្រោយ (Back to Lessons)</span>
                          </button>

                          <div>
                            <p className="text-xs font-bold text-amber-800">
                              {activeLessonMeta
                                ? `${activeLessonMeta.numberLabel} · ${activeLessonMeta.titleKhmer}`
                                : 'គ្រប់មេរៀនទាំងអស់ (All Lessons Mixed)'}
                            </p>
                            <p className="text-xs text-slate-500 tabular-nums">
                              សំណួរទី {toKhmerNumeral(currentIndex + 1)} នៃ{' '}
                              {toKhmerNumeral(filteredQuestions.length)} · Question {currentIndex + 1} of{' '}
                              {filteredQuestions.length}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm sm:text-base font-bold text-slate-700 tabular-nums">
                          {lastSpokenToast && (
                            <>
                              <span className="text-sky-700 text-xs sm:text-sm font-semibold">
                                {lastSpokenToast}
                              </span>
                              <span aria-hidden="true" className="text-slate-300">
                                ·
                              </span>
                            </>
                          )}
                          <span className="flex items-center gap-1.5 text-amber-600 text-base sm:text-lg">
                            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                            <span>
                              ពិន្ទុមេរៀន៖ {toKhmerNumeral(score)} / {toKhmerNumeral(filteredQuestions.length)}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-4 bg-amber-100 rounded-full overflow-hidden border border-amber-200/80 mb-6">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                          style={{
                            width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Quiz Stage Card */}
                      <section className="bg-white rounded-3xl border border-amber-200/90 shadow-sm p-6 sm:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                          <div className="lg:col-span-5 flex flex-col items-center justify-between bg-amber-50/70 rounded-3xl border border-amber-200/80 p-6 sm:p-8 text-center">
                            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                              <span>រូបភាពជំនួយ · Visual Clue</span>
                              <span>{currentQuestion.categoryLabel}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                triggerSpeechWithBanner(
                                  currentQuestion.speechText,
                                  `🔊 «${currentQuestion.speechText}»`
                                )
                              }
                              className="my-4 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white border-2 border-amber-200 shadow-sm flex items-center justify-center text-7xl sm:text-8xl animate-gentle-bounce cursor-pointer hover:scale-105 transition-transform"
                            >
                              <span role="img" aria-label={currentQuestion.clueWordEnglish}>
                                {currentQuestion.icon}
                              </span>
                            </button>

                            <div className="my-2">
                              <div className="text-3xl sm:text-4xl font-bold text-slate-900 leading-relaxed py-1">
                                {currentQuestion.clueWordKhmer}
                              </div>
                              <p className="text-sm font-semibold text-slate-600">
                                {currentQuestion.clueWordEnglish}
                              </p>
                              <p className="text-xs sm:text-sm font-bold text-amber-800 mt-1">
                                {currentQuestion.phoneticHint}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                triggerSpeechWithBanner(
                                  currentQuestion.speechText,
                                  `🔊 «${currentQuestion.speechText}»`
                                )
                              }
                              className="mt-5 w-full py-4 px-5 rounded-2xl bg-sky-500 hover:bg-sky-600 active:translate-y-1 text-white font-bold text-base sm:text-lg shadow-[0_4px_0_#0369a1] transition-all flex items-center justify-center gap-3 cursor-pointer"
                            >
                              <Volume2 className="w-6 h-6 shrink-0" />
                              <span className="whitespace-nowrap">ចុចស្តាប់សំឡេង (Listen Aloud)</span>
                            </button>
                          </div>

                          <div className="lg:col-span-7 flex flex-col justify-between">
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-slate-500 mb-1">
                                {currentQuestion.questionEnglish}
                              </p>
                              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 leading-relaxed">
                                {currentQuestion.questionKhmer}
                              </h2>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
                                {currentQuestion.options.map((opt) => {
                                  const isCorrectChoice =
                                    isQuestionSolved && opt.letter === currentQuestion.correctLetter;
                                  const isWrongChoice = wrongAttempts.includes(opt.letter);

                                  let buttonStyle =
                                    'border-amber-300 bg-amber-50/50 hover:bg-amber-100/80 text-slate-900 shadow-[0_5px_0_#fcd34d]';
                                  if (isCorrectChoice) {
                                    buttonStyle =
                                      'border-emerald-600 bg-emerald-500 text-white shadow-[0_5px_0_#047857] animate-pop';
                                  } else if (isWrongChoice) {
                                    buttonStyle =
                                      'border-rose-300 bg-rose-50/80 text-slate-400 shadow-none animate-shake';
                                  }

                                  return (
                                    <button
                                      key={opt.letter}
                                      type="button"
                                      onClick={() => handleSelectOption(opt)}
                                      className={`group relative min-h-[140px] sm:min-h-[165px] p-5 rounded-3xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer active:translate-y-1 ${buttonStyle}`}
                                    >
                                      <span
                                        className={`absolute top-3 right-3 text-xs font-bold flex items-center gap-1 ${
                                          isCorrectChoice
                                            ? 'text-emerald-100'
                                            : 'text-slate-400 group-hover:text-sky-600'
                                        }`}
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </span>

                                      <span className="text-5xl sm:text-6xl font-bold mb-3 leading-normal select-none py-1">
                                        {opt.letter}
                                      </span>

                                      <span
                                        className={`text-sm sm:text-base font-bold whitespace-nowrap ${
                                          isCorrectChoice ? 'text-emerald-50' : 'text-slate-600'
                                        }`}
                                      >
                                        {opt.label}
                                      </span>

                                      {isCorrectChoice && (
                                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold text-white">
                                          <CheckCircle2 className="w-4 h-4" /> ត្រឹមត្រូវ!
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {selectedLetter ? (
                              <div
                                className={`rounded-2xl p-5 border-2 transition-all ${
                                  isQuestionSolved
                                    ? 'border-emerald-400 bg-emerald-50/90 animate-pop'
                                    : 'border-amber-300 bg-amber-50/90'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex items-start sm:items-center gap-3.5">
                                    {isQuestionSolved ? (
                                      <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                                        <CheckCircle2 className="w-7 h-7" />
                                      </div>
                                    ) : (
                                      <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 shadow-sm">
                                        <HeartHandshake className="w-7 h-7" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-bold text-base sm:text-lg text-slate-900">
                                        {isQuestionSolved
                                          ? '🌟 អស្ចារ្យណាស់! ចម្លើយត្រឹមត្រូវ! (Correct! +1 Star)'
                                          : '💪 សាកល្បងម្តងទៀតកូន! (Good try! Tap another letter!)'}
                                      </p>
                                      <p className="text-sm text-slate-700 mt-0.5">
                                        {isQuestionSolved
                                          ? currentQuestion.explanation
                                          : `កូនបានជ្រើសរើស «${selectedLetter}»។ ចុចស្តាប់សំឡេង ហើយជ្រើសរើសម្តងទៀតណា!`}
                                      </p>
                                    </div>
                                  </div>

                                  {isQuestionSolved && (
                                    <button
                                      type="button"
                                      onClick={handleNextQuestion}
                                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5 text-white font-bold text-base shadow-[0_4px_0_#065f46] flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                                    >
                                      <span>
                                        {currentIndex + 1 < filteredQuestions.length
                                          ? 'សំណួរបន្ទាប់ (Next)'
                                          : 'មើលលទ្ធផលមេរៀន (Finish)'}
                                      </span>
                                      <ArrowRight className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-2xl p-4 border border-dashed border-amber-300 bg-amber-50/40 text-center text-sm font-semibold text-slate-600">
                                👆 ចុចលើប៊ូតុងអក្សរណាមួយខាងលើ ដើម្បីឆ្លើយ និងស្តាប់សំឡេង!
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    </div>
                  ) : (
                    /* ---------------------------------------------------------
                       STAGE C: LESSON RESULTS SUMMARY & CELEBRATION SCREEN
                       ("លេងម្តងទៀត / Play Again" OR "ជ្រើសរើសមេរៀនផ្សេង / Choose Another Lesson")
                       --------------------------------------------------------- */
                    <section className="bg-white rounded-3xl border-2 border-amber-300 shadow-sm p-8 sm:p-12 text-center animate-pop max-w-3xl mx-auto">
                      <div className="text-7xl sm:text-8xl mb-3 select-none" aria-hidden="true">
                        🏆
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-amber-700 mb-1">
                        {activeLessonMeta
                          ? `${activeLessonMeta.numberLabel} · ${activeLessonMeta.titleKhmer}`
                          : 'គ្រប់មេរៀនទាំងអស់ (All Lessons)'}
                      </p>
                      <h2 className="font-khmer-title text-2xl sm:text-4xl text-slate-900 mb-2">
                        អបអរសាទរ! កូនបញ្ចប់មេរៀនហើយ!
                      </h2>
                      <p className="text-sm sm:text-base text-slate-600 font-semibold mb-6">
                        Congratulations! Your earned stars have been saved to your Student Profile!
                      </p>

                      {/* Earned Stars vs Total Stars Animation */}
                      <div
                        className="flex items-center justify-center gap-2 sm:gap-3 my-5 flex-wrap"
                        aria-label={`Earned ${score} of ${filteredQuestions.length} stars`}
                      >
                        {Array.from({ length: filteredQuestions.length }).map((_, idx) => (
                          <span
                            key={idx}
                            className="text-3xl sm:text-4xl animate-gentle-bounce"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                            {idx < score ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>

                      <div className="max-w-md mx-auto bg-amber-50/90 rounded-3xl border border-amber-200 p-6 mb-8">
                        <p className="text-xs sm:text-sm font-bold text-slate-500 mb-1">
                          ពិន្ទុក្នុងមេរៀននេះ · Lesson Score
                        </p>
                        <p className="text-3xl sm:text-5xl font-extrabold text-emerald-700 tabular-nums py-1">
                          {toKhmerNumeral(score)} / {toKhmerNumeral(filteredQuestions.length)} ⭐
                        </p>
                      </div>

                      {/* Two Required Post-Lesson Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={handleRestartCurrentLesson}
                          className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:translate-y-0.5 text-white font-bold text-base sm:text-lg shadow-[0_5px_0_#047857] inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
                        >
                          <RotateCcw className="w-5 h-5" />
                          <span>លេងម្តងទៀត (Play Again)</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleBackToLessonSelection}
                          className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:translate-y-0.5 text-slate-950 font-bold text-base sm:text-lg shadow-[0_5px_0_#b45309] inline-flex items-center justify-center gap-2.5 whitespace-nowrap cursor-pointer"
                        >
                          <LayoutGrid className="w-5 h-5" />
                          <span>ជ្រើសរើសមេរៀនផ្សេង (Choose Another Lesson)</span>
                        </button>
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* SUB-TAB 2: FLASHCARDS GROUPED BY LESSON */}
              {studentSubTab === 'LEARN' && (
                <div className="space-y-8">
                  {QUIZ_LESSONS.map((lesson) => {
                    const lessonCards = questions.filter((q) => q.lessonId === lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-amber-100">
                          <div>
                            <p className="text-xs font-bold text-amber-700">{lesson.numberLabel}</p>
                            <h3 className="text-xl font-bold text-slate-900">
                              {lesson.icon} {lesson.titleKhmer} ({lesson.titleEnglish})
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setStudentSubTab('QUIZ');
                              handleStartLessonQuiz(lesson.id);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer self-start"
                          >
                            លេងសំណួរមេរៀននេះ (Start Lesson Quiz) &rarr;
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {lessonCards.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                triggerSpeechWithBanner(item.speechText, `🔊 «${item.speechText}»`)
                              }
                              className="bg-amber-50/40 hover:bg-amber-50 rounded-2xl border border-amber-200/90 p-5 text-center transition-all flex flex-col items-center justify-between cursor-pointer active:translate-y-0.5 group"
                            >
                              <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                                <span>ចុចស្តាប់</span>
                                <Volume2 className="w-4 h-4 text-sky-500" />
                              </div>
                              <div className="text-5xl font-bold text-slate-900 my-2 py-1">
                                {item.correctLetter}
                              </div>
                              <div className="text-3xl my-1">{item.icon}</div>
                              <div className="text-base font-bold text-slate-800">
                                {item.clueWordKhmer}
                              </div>
                              <div className="text-xs font-semibold text-slate-500 mt-0.5">
                                {item.clueWordEnglish}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* SUB-TAB 3: STUDENT OWN PROFILE */}
              {studentSubTab === 'PROFILE' && currentUser && (
                <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900 mb-1">
                    ព័ត៌មានគណនីរបស់ខ្ញុំ (My Student Profile)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mb-6">
                    Regular users/students can view their personal stats and update their display name.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 tabular-nums">
                    <div>
                      <p className="text-xs font-bold text-slate-500">ផ្កាយសរុប (Total Stars Earned)</p>
                      <p className="text-2xl font-extrabold text-amber-600 mt-1">
                        ⭐ {currentUser.starsEarned}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">ចំនួនមេរៀនលេងចប់ (Lessons Completed)</p>
                      <p className="text-2xl font-extrabold text-emerald-700 mt-1">
                        {currentUser.quizzesCompleted} ដង
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateStudentProfile} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ឈ្មោះសិស្ស (Full Name)
                      </label>
                      <input
                        type="text"
                        value={profileNameEdit}
                        onChange={(e) => setProfileNameEdit(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">Email:</span>
                        <span className="font-mono font-bold text-slate-800">{currentUser.email}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-slate-500 block">Assigned RBAC Role:</span>
                        <span className="font-mono font-bold text-emerald-700">{currentUser.role}</span>
                      </div>
                    </div>

                    {profileSavedToast && (
                      <p className="text-xs font-bold text-emerald-700">
                        ✓ រក្សាទុកឈ្មោះថ្មីដោយជោគជ័យ (Profile updated!)
                      </p>
                    )}

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      រក្សាទុកព័ត៌មាន (Save Profile)
                    </button>
                  </form>
                </div>
              )}
            </div>
          </ProtectedRoute>
        )}

        {/* ===================================================================
            DIRECT SECRET ADMIN CONSOLE URL (/admin)
            (Hidden from Student Navbar; accessible via direct /admin URL)
            =================================================================== */}
        {currentRoute === '/admin' && (
          <div className="space-y-8 animate-pop">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>DIRECT ADMIN PORTAL · URL: /admin</span>
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ (Admin Console &amp; User Management)
                  </h1>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigateToRoute('/teacher')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    គ្រប់គ្រងសំណួរគ្រូបង្រៀន (/teacher)
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToRoute('/student')}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    ត្រឡប់ទៅទំព័រសិស្ស (/student)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-6 tabular-nums">
                <div>
                  <p className="text-xs font-bold text-slate-500">គណនីសរុប (Total Users)</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {usersDb.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">សំណួរតាមមេរៀន (Total Questions)</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                    {questions.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">ផ្កាយសិស្សសរុប (Total Stars)</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                    ⭐ {usersDb.reduce((acc, u) => acc + u.starsEarned, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500">កំណត់ហេតុសុវត្ថិភាព (Audit Logs)</p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                    {auditLogs.length}
                  </p>
                </div>
              </div>
            </div>

            {/* VERCEL POSTGRES DATABASE SETUP & LIVE STATUS PANEL */}
            <div className="bg-white rounded-3xl border border-indigo-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-indigo-700 mb-1">
                    <Database className="w-4 h-4" />
                    <span>VERCEL POSTGRES / NEON SERVERLESS DATABASE (`/api/quiz-data`)</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    ផ្ទាំងរៀបចំ Database សម្រាប់ប្រើក្នុង Vercel (Vercel Database Setup)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    គាំទ្រ Vercel Postgres, Neon Serverless និង Supabase តាមរយៈ Environment Variable <code className="font-mono font-bold text-indigo-700">POSTGRES_URL</code> ឬ <code className="font-mono font-bold text-indigo-700">DATABASE_URL</code>។
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={handleInitVercelDatabase}
                    disabled={isCheckingDb}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Server className="w-4 h-4" />
                    <span>
                      {isCheckingDb
                        ? 'កំពុងភ្ជាប់ Database...'
                        : 'តេស្ត និងបង្កើតតារាង (Test & Init Tables)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyVercelSql}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    {copiedSql ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSql ? 'បានចម្លង SQL!' : 'ចម្លង db/schema.sql'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSqlFile}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>ទាញយក schema.sql</span>
                  </button>
                </div>
              </div>

              {/* Live Connection Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  dbStatus?.connected
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-slate-900'
                }`}
              >
                <div className="space-y-0.5">
                  <p className="text-xs font-mono font-bold uppercase">
                    STATUS: {dbStatus?.connected ? '● CONNECTED TO VERCEL POSTGRES' : '● LOCAL FALLBACK READY (AWAITING POSTGRES_URL IN VERCEL)'}
                  </p>
                  <p className="text-sm font-bold">
                    {dbStatus?.messageKhmer || 'កំពុងត្រួតពិនិត្យស្ថានភាព Database...'}
                  </p>
                  <p className="text-xs text-slate-600">
                    Provider: <span className="font-mono font-semibold">{dbStatus?.provider || 'Local Fallback'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyVercelJson}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"
                >
                  {copiedVercelJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVercelJson ? 'Copied vercel.json!' : 'Copy vercel.json'}</span>
                </button>
              </div>

              {/* 3-Step Guide & SQL Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-3 text-xs sm:text-sm text-slate-700 bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <h3 className="font-bold text-slate-900 text-base">
                    របៀបភ្ជាប់ Database ក្នុង Vercel (៣ ជំហានងាយៗ)៖
                  </h3>
                  <ol className="list-decimal list-inside space-y-2.5 leading-relaxed">
                    <li>
                      ចូលទៅកាន់ <strong>Vercel Dashboard</strong> &rarr; ជ្រើសរើស Project របស់អ្នក &rarr; ចុចផ្ទាំង <strong>Storage</strong>។
                    </li>
                    <li>
                      ចុច <strong>Create Database</strong> &rarr; ជ្រើសរើស <strong>Postgres (Neon Serverless)</strong> រួចចុច <strong>Connect to Project</strong> (Vercel នឹងបង្កើត <code className="font-mono font-bold text-indigo-700">POSTGRES_URL</code> និង <code className="font-mono font-bold text-indigo-700">DATABASE_URL</code> ដោយស្វ័យប្រវត្តិ)។
                    </li>
                    <li>
                      ចម្លងកូដ <code className="font-mono font-bold">db/schema.sql</code> ខាងស្តាំដៃ យកទៅ Run ក្នុងផ្ទាំង <strong>SQL Editor</strong> របស់ Vercel ឬចុចប៊ូតុង <strong>Test &amp; Init Tables</strong> ខាងលើជាការស្រេច!
                    </li>
                  </ol>
                </div>

                <div className="lg:col-span-7">
                  <pre className="w-full max-h-[240px] overflow-auto rounded-2xl bg-slate-900 text-slate-100 p-4 text-xs font-mono leading-relaxed">
                    <code>{VERCEL_POSTGRES_SCHEMA_SQL}</code>
                  </pre>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-700" />
                    <span>គ្រប់គ្រងអ្នកប្រើប្រាស់ និងតួនាទី (User &amp; Role Management)</span>
                  </h2>
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="ស្វែងរកឈ្មោះ ឬ អ៊ីមែល..."
                    className="rounded-xl border border-slate-300 px-3.5 py-2 text-xs focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm tabular-nums">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-3 pr-4">User / Email</th>
                        <th className="py-3 px-3">RBAC Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Quiz Report</th>
                        <th className="py-3 pl-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/70">
                      {usersDb
                        .filter(
                          (u) =>
                            u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 pr-4">
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                            </td>
                            <td className="py-3.5 px-3">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  changeUserRole(u.id, e.target.value as UserRole)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900"
                              >
                                <option value={UserRole.ADMIN}>ADMIN</option>
                                <option value={UserRole.TEACHER}>TEACHER</option>
                                <option value={UserRole.STUDENT}>STUDENT</option>
                              </select>
                            </td>
                            <td className="py-3.5 px-3">
                              <button
                                type="button"
                                onClick={() => toggleUserStatus(u.id)}
                                className={`font-bold text-xs cursor-pointer underline underline-offset-4 ${
                                  u.status === 'Active' ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {u.status === 'Active' ? '● Active' : '▲ Suspended'}
                              </button>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-xs">
                              ⭐ {u.starsEarned} ({u.quizzesCompleted} runs)
                            </td>
                            <td className="py-3.5 pl-3 text-right">
                              <button
                                type="button"
                                onClick={() => deleteUser(u.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    បន្ថែមអ្នកប្រើប្រាស់ថ្មី (Create User)
                  </h3>
                  <form onSubmit={handleCreateUserByAdmin} className="space-y-3 mt-3">
                    <input
                      type="text"
                      value={newAdminUserName}
                      onChange={(e) => setNewAdminUserName(e.target.value)}
                      placeholder="Full Name (e.g. Nary Kim)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      required
                    />
                    <input
                      type="email"
                      value={newAdminUserEmail}
                      onChange={(e) => setNewAdminUserEmail(e.target.value)}
                      placeholder="Email (e.g. nary@school.edu.kh)"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      required
                    />
                    <select
                      value={newAdminUserRole}
                      onChange={(e) => setNewAdminUserRole(e.target.value as UserRole)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
                    >
                      <option value={UserRole.STUDENT}>Role: STUDENT</option>
                      <option value={UserRole.TEACHER}>Role: TEACHER</option>
                      <option value={UserRole.ADMIN}>Role: ADMIN</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                    >
                      + បង្កើតគណនី (Add User)
                    </button>
                  </form>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-3">
                    កំណត់ហេតុសុវត្ថិភាព (Security Audit Log)
                  </h3>
                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1 text-xs font-mono">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70"
                      >
                        <div className="flex items-center justify-between text-slate-500">
                          <span>{log.timestamp} · {log.actorRole}</span>
                          <span
                            className={
                              log.outcome === 'ALLOWED'
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-600 font-bold'
                            }
                          >
                            {log.outcome}
                          </span>
                        </div>
                        <div className="text-slate-800 font-sans font-semibold mt-0.5">
                          {log.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            DIRECT SECRET TEACHER STUDIO URL (/teacher)
            (Hidden from Student Navbar; accessible via direct /teacher URL)
            =================================================================== */}
        {currentRoute === '/teacher' && (
          <div className="space-y-8 animate-pop">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-mono font-bold text-amber-700">
                    DIRECT TEACHER STUDIO · URL: /teacher
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    ផ្ទាំងគ្រប់គ្រងមេរៀន និងសំណួរ (Teacher / Editor Content Studio)
                  </h1>
                </div>
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => navigateToRoute('/admin')}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    ផ្ទាំង Admin (/admin)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLessonId(null);
                      navigateToRoute('/student');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                  >
                    ត្រឡប់ទៅមេរៀនសិស្ស (/student) &rarr;
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                <div className="lg:col-span-5">
                  <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <FileEdit className="w-5 h-5 text-amber-600" />
                    <span>បន្ថែមសំណួរថ្មីតាមមេរៀន (Add Question to Lesson)</span>
                  </h2>
                  <form onSubmit={handleAddCustomQuestion} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ជ្រើសរើសមេរៀន (Target Lesson ID)
                      </label>
                      <select
                        value={newQLessonId}
                        onChange={(e) => setNewQLessonId(e.target.value as LessonId)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs sm:text-sm font-bold bg-white"
                      >
                        {QUIZ_LESSONS.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.numberLabel}: {l.titleKhmer}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          រូបតំណាង (Icon)
                        </label>
                        <input
                          type="text"
                          value={newQIcon}
                          onChange={(e) => setNewQIcon(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg text-center"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          ពាក្យគំរូភាសាខ្មែរ (Khmer Clue Word)
                        </label>
                        <input
                          type="text"
                          value={newQWordKhmer}
                          onChange={(e) => setNewQWordKhmer(e.target.value)}
                          placeholder="ឧទាហរណ៍៖ អណ្តើក"
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                          required
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      value={newQWordEng}
                      onChange={(e) => setNewQWordEng(e.target.value)}
                      placeholder="English Meaning (e.g. Turtle)"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                      required
                    />

                    <div className="grid grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={newQCorrect}
                        onChange={(e) => setNewQCorrect(e.target.value)}
                        placeholder="ចម្លើយត្រូវ"
                        className="w-full rounded-xl border-2 border-emerald-400 bg-emerald-50/40 px-3 py-2 text-lg font-bold text-center"
                        required
                      />
                      <input
                        type="text"
                        value={newQWrong1}
                        onChange={(e) => setNewQWrong1(e.target.value)}
                        placeholder="ខុស ១"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg font-bold text-center"
                        required
                      />
                      <input
                        type="text"
                        value={newQWrong2}
                        onChange={(e) => setNewQWrong2(e.target.value)}
                        placeholder="ខុស ២"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-lg font-bold text-center"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>បន្ថែមសំណួរទៅក្នុងមេរៀន (Add Question)</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      កម្រងសំណួរតាមមេរៀន ({questions.length} សំណួរ)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setQuestions(INITIAL_QUIZ_DATA)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                    >
                      កំណត់ឡើងវិញ (Restore Default 16)
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-2xl border border-slate-200 bg-slate-50/60"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{q.icon}</span>
                          <div>
                            <p className="text-xs font-bold text-amber-700">{q.categoryLabel}</p>
                            <p className="font-bold text-slate-900 text-sm">
                              {idx + 1}. «{q.correctLetter}» — {q.clueWordKhmer} ({q.clueWordEnglish})
                            </p>
                          </div>
                        </div>
                        {questions.length > 4 && (
                          <button
                            type="button"
                            onClick={() =>
                              setQuestions((prev) => prev.filter((item) => item.id !== q.id))
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ROUTE 2: MOBILE INSTALLATION HUB (/mobile-install)
            =================================================================== */}
        {currentRoute === '/mobile-install' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-10 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
                <div>
                  <p className="text-xs font-bold text-emerald-700 mb-1">
                    ប្រព័ន្ធដំឡើងលើទូរស័ព្ទដៃ និងថេប្លេត · iOS (iPhone / iPad) &amp; Android Installation
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {selectedOS === 'IOS'
                      ? '🍎 ដំឡើងកម្មវិធីលើប្រព័ន្ធ iOS (iPhone & iPad)'
                      : '🤖 ដំឡើងកម្មវិធីលើប្រព័ន្ធ Android (APK & WebAPK)'}
                  </h2>
                </div>

                <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 self-start">
                  <button
                    type="button"
                    onClick={() => setSelectedOS('IOS')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      selectedOS === 'IOS'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🍎 ប្រព័ន្ធ iOS (iPhone / iPad)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedOS('ANDROID')}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                      selectedOS === 'ANDROID'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🤖 ប្រព័ន្ធ Android (APK)
                  </button>
                </div>
              </div>

              {selectedOS === 'IOS' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="rounded-3xl border border-sky-200 bg-sky-50/50 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        01. ដំឡើងផ្ទាល់តាម Safari (Add to Home Screen)
                      </h3>
                      <ol className="text-xs sm:text-sm text-slate-700 space-y-2 list-decimal list-inside mb-5 font-medium">
                        <li>បើកតំណភ្ជាប់ខាងក្រោមក្នុងកម្មវិធី <strong>Safari</strong> លើ iPhone/iPad។</li>
                        <li>ចុចលើប៊ូតុង <strong>Share</strong> <Share className="inline w-4 h-4 text-sky-600" /> នៅរបារខាងក្រោម។</li>
                        <li>ចុច <strong>Add to Home Screen</strong> &rarr; <strong>Add</strong>។</li>
                      </ol>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedUrl ? 'បានចម្លងតំណភ្ជាប់!' : 'ចម្លងតំណភ្ជាប់សម្រាប់ Safari'}</span>
                    </button>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        02. ទាញយក iOS Profile (.mobileconfig)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                        ទាញយកឯកសារ Apple iOS Web Clip Profile រួចបើក <strong>Settings &rarr; Profile Downloaded &rarr; Install</strong> លើ iPhone/iPad។
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadIOSProfile}
                      className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>ទាញយក KhmerQuiz-iOS.mobileconfig</span>
                    </button>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        03. Build Native iOS App (.ipa) in Xcode
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-4">
                        ទាញយកស្គ្រីប Capacitor iOS ដើម្បីបង្កើតគម្រោង Xcode លើកុំព្យូទ័រ Mac។
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadBuildScript('IOS')}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>ទាញយក build-khmer-ios.sh</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        01. Direct Android Chrome Install (WebAPK)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 mb-4">
                        បើកតំណភ្ជាប់នេះក្នុង Chrome លើទូរស័ព្ទ Android រួចចុច <strong>Install App</strong>។
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy Phone URL</span>
                    </button>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        02. Download Signed .APK via PWABuilder
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 mb-4">
                        បិទភ្ជាប់ URL ទៅក្នុង <strong>pwabuilder.com</strong> ដើម្បីទាញយកឯកសារ <code className="font-mono font-bold">.apk</code>។
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyPublicUrl}
                      className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy URL for PWABuilder</span>
                    </button>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        03. Build Offline APK with Capacitor CLI
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-700 mb-4">
                        ទាញយកស្គ្រីប Capacitor Android ដើម្បីបង្កើត <code className="font-mono font-bold">app-debug.apk</code>។
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownloadBuildScript('ANDROID')}
                      className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download build-khmer-apk.sh</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================
            ROUTE 6: STANDALONE CODE EXPORT (/code)
            =================================================================== */}
        {currentRoute === '/code' && (
          <div className="bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 text-amber-700 text-xs font-bold mb-1">
                  <Code2 className="w-4 h-4" />
                  <span>Complete Single-File HTML + Lesson-Based Quiz Selection</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">
                  ទាញយកឯកសារកូដ (Download Standalone index.html)
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyStandaloneHtml}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy HTML'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadStandaloneHtml}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download index.html</span>
                </button>
              </div>
            </div>
            <pre className="w-full max-h-[460px] overflow-auto rounded-2xl bg-slate-900 text-slate-100 p-5 text-xs font-mono leading-relaxed mt-6">
              <code>{STANDALONE_HTML_CODE}</code>
            </pre>
          </div>
        )}
      </main>

      {/* Offline Mode Connectivity Toast */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode — កម្មវិធីដំណើរការដោយគ្មានអ៊ីនធឺណិត</span>
        </div>
      )}

      {/* =====================================================================
          CLEAN FOOTER
          ===================================================================== */}
      <footer className="w-full border-t border-amber-200/70 bg-white/70 py-4 px-4 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>កម្មវិធីសិក្សាភាសាខ្មែរថ្នាក់ទី១ · ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន (Lesson-Based Quiz Selection)</span>
          <span>សិស្សថ្នាក់ទី១ (Open-Access Student Mode) · iOS &amp; Android Ready</span>
        </div>
      </footer>
    </div>
  );
}
