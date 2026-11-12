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
  Plus,
  Trash2,
  WifiOff,
  Share,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  UserCheck,
  Lock,
  Mail,
  User,
  FileEdit,
  Users,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import { STANDALONE_HTML_CODE } from './standaloneHtmlTemplate';
import {
  useOnlineStatus,
  CAPACITOR_ANDROID_BUILD_SCRIPT,
  CAPACITOR_IOS_BUILD_SCRIPT,
  generateIOSMobileConfig
} from './usePWAInstall';
import {
  UserRole,
  RoutePath,
  UserAccount,
  LessonPost,
  AuditLogEntry,
  ROLE_DEFAULT_ROUTE,
  ROUTE_PERMISSIONS,
  INITIAL_USERS_DB,
  INITIAL_LESSONS_DB,
  INITIAL_AUDIT_LOGS
} from './rbacTypes';

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

const STORAGE_KEYS = {
  USERS: 'khmer_rbac_users_v1',
  SESSION: 'khmer_rbac_session_v1',
  LESSONS: 'khmer_rbac_lessons_v1',
  AUDIT_LOGS: 'khmer_rbac_audit_v1',
};

function toKhmerNumeral(num: number): string {
  const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
  return String(num)
    .split('')
    .map((d) => khmerDigits[Number(d)] ?? d)
    .join('');
}

// ============================================================================
// WEB AUDIO & SPEECH SYNTHESIS ENGINE (GUARANTEED SOUND ON EVERY CLICK)
// ============================================================================

let sharedAudioCtx: AudioContext | null = null;
// Retain utterance reference at module scope so Chrome GC never drops active speech
let activeSpeechUtterance: SpeechSynthesisUtterance | null = null;
let speechTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Phonetic pronunciation dictionary for devices/browsers that do not have a
 * native `km-KH` voice installed in the OS (where raw Khmer Unicode would
 * otherwise be skipped silently by default system TTS voices).
 */
const KHMER_PHONETIC_MAP: Record<string, string> = {
  // Full question speech phrases
  'ក... ក ក្តាម': 'Kah... Kah, Kdaam',
  'ខ... ខ ខ្លា': 'Khah... Khah, Khlaa',
  'គ... គ គោ': 'Koh... Koh, Ko',
  'ឃ... ឃ ឃ្មុំ': 'Khoh... Khoh, Khmum',
  'ច... ច ចេក': 'Chah... Chah, Chek',
  'ឆ... ឆ ឆ្មា': 'Chhah... Chhah, Chhmaa',
  'ដ... ដ ដំរី': 'Dah... Dah, Dam-rei',
  'ស... ស សេះ': 'Sah... Sah, Seh',
  'ស្រៈ អា... ក អា កា': 'Srah Aah... Kah Aah, Kaa',
  'ស្រៈ អី... ត្រី': 'Srah Ei... Trei',
  'ស្រៈ អោ... គ អោ គោ': 'Srah Ao... Koh Ao, Ko',
  'ស្រៈ អៅ... ប អៅ បៅ': 'Srah Au... Bah Au, Bau',
  'ឥ... ឥ ឥសី': 'Srah E... Ey-sei',
  'ឧ... ឧ ឧសភា': 'Srah Oh... U-sa-phea',
  'ឯ... ឯ ឯកសណ្ឋាន': 'Srah Ae... Ae-ka-san-than',
  'ឪ... ឪ ឪឡឹក': 'Srah Au... Ouv-loek',

  // Individual consonants & vowels
  'ក': 'Kah',
  'ខ': 'Khah',
  'គ': 'Koh',
  'ឃ': 'Khoh',
  'ង': 'Ngoh',
  'ច': 'Chah',
  'ឆ': 'Chhah',
  'ជ': 'Choh',
  'ឈ': 'Chhoh',
  'ញ': 'Nhoh',
  'ដ': 'Dah',
  'ឋ': 'Thah',
  'ឌ': 'Doh',
  'ឍ': 'Thoh',
  'ណ': 'Nah',
  'ត': 'Tah',
  'ថ': 'Thah',
  'ទ': 'Toh',
  'ធ': 'Thoh',
  'ន': 'Noh',
  'ប': 'Bah',
  'ផ': 'Phah',
  'ព': 'Poh',
  'ភ': 'Phoh',
  'ម': 'Moh',
  'យ': 'Yoh',
  'រ': 'Roh',
  'ល': 'Loh',
  'វ': 'Voh',
  'ស': 'Sah',
  'ហ': 'Hah',
  'ឡ': 'Lah',
  'អ': 'Ah',
  'ស្រៈ អា': 'Srah Aah',
  'ា': 'Srah Aah',
  'ស្រៈ អិ': 'Srah Eh',
  'ិ': 'Srah Eh',
  'ស្រៈ អី': 'Srah Ei',
  'ី': 'Srah Ei',
  'ស្រៈ អឹ': 'Srah Oe',
  'ឹ': 'Srah Oe',
  'ស្រៈ អឺ': 'Srah Oeu',
  'ឺ': 'Srah Oeu',
  'ស្រៈ អុ': 'Srah Oh',
  'ុ': 'Srah Oh',
  'ស្រៈ អូ': 'Srah Ou',
  'ូ': 'Srah Ou',
  'ស្រៈ អេ': 'Srah Ey',
  'េ': 'Srah Ey',
  'ស្រៈ អែ': 'Srah Ae',
  'ែ': 'Srah Ae',
  'ស្រៈ អោ': 'Srah Ao',
  'ោ': 'Srah Ao',
  'ស្រៈ អៅ': 'Srah Au',
  'ៅ': 'Srah Au',
  'ស្រៈ អាំ': 'Srah Am',
  'ាំ': 'Srah Am',
  'ឥ': 'Srah E',
  'ឧ': 'Srah Oh',
  'ឯ': 'Srah Ae',
  'ឪ': 'Srah Au',
  'ឱ': 'Srah Ao',
};

function toKhmerPhoneticSpeech(text: string): string {
  const trimmed = text.trim();
  if (KHMER_PHONETIC_MAP[trimmed]) {
    return KHMER_PHONETIC_MAP[trimmed];
  }
  // Character-by-character transliteration fallback for custom teacher questions
  let result = trimmed;
  Object.keys(KHMER_PHONETIC_MAP)
    .sort((a, b) => b.length - a.length)
    .forEach((khmerKey) => {
      if (result.includes(khmerKey)) {
        result = result.split(khmerKey).join(` ${KHMER_PHONETIC_MAP[khmerKey]} `);
      }
    });
  return result.replace(/\s+/g, ' ').trim() || 'Kah';
}

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        sharedAudioCtx = new AudioContextClass();
      }
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

function withUnlockedAudioCtx(callback: (ctx: AudioContext) => void) {
  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    // Play a 1-sample silent buffer synchronously to unlock iOS/Safari/Chrome audio on click
    const silentBuffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = silentBuffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore
  }

  if (ctx.state === 'suspended') {
    ctx
      .resume()
      .then(() => callback(ctx))
      .catch(() => {});
  } else {
    callback(ctx);
  }
}

// Unlock AudioContext on first user interaction anywhere in the document
if (typeof window !== 'undefined') {
  const unlockOnGesture = () => {
    withUnlockedAudioCtx(() => {});
  };
  window.addEventListener('pointerdown', unlockOnGesture, { once: true, passive: true });
  window.addEventListener('keydown', unlockOnGesture, { once: true, passive: true });
}

function playSoundEffect(type: 'correct' | 'tryAgain' | 'tap' | 'speak' | 'victory') {
  withUnlockedAudioCtx((ctx) => {
    const now = ctx.currentTime + 0.01;

    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      wave: OscillatorType = 'triangle',
      peakGain = 0.32
    ) => {
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = wave;
      osc.frequency.setValueAtTime(freq, startTime);

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq * 2, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, startTime + duration);

      osc.connect(gain);
      subOsc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      subOsc.start(startTime);
      osc.stop(startTime + duration + 0.02);
      subOsc.stop(startTime + duration + 0.02);
    };

    if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        playTone(freq, now + idx * 0.08, 0.28, 'triangle', 0.35);
      });
    } else if (type === 'tryAgain') {
      const notes = [392.0, 329.63];
      notes.forEach((freq, idx) => {
        playTone(freq, now + idx * 0.12, 0.25, 'sine', 0.28);
      });
    } else if (type === 'speak') {
      // Pleasant 2-note marimba chime accompanying voice pronunciation
      playTone(587.33, now, 0.14, 'triangle', 0.26);
      playTone(880.0, now + 0.07, 0.18, 'sine', 0.24);
    } else if (type === 'tap') {
      playTone(659.25, now, 0.12, 'triangle', 0.28);
    } else if (type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        playTone(freq, now + idx * 0.1, 0.34, 'triangle', 0.36);
      });
    }
  });
}

function speakKhmerText(text: string) {
  // Always play immediate musical chime so click is 100% audible even before speech starts
  playSoundEffect('speak');

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const startSpeech = () => {
    try {
      const synth = window.speechSynthesis;
      if (synth.paused) {
        synth.resume();
      }

      const voices = synth.getVoices ? synth.getVoices() : [];
      const khmerVoice = voices.find(
        (v) =>
          (v.lang && v.lang.toLowerCase().includes('km')) ||
          (v.name && v.name.toLowerCase().includes('khmer')) ||
          (v.name && v.name.toLowerCase().includes('cambodia'))
      );

      // CRITICAL FIX: If the browser/OS does NOT have a native Khmer (`km-KH`) voice installed,
      // passing Khmer Unicode script (`ក... ក ក្តាម`) to a default English/system voice produces
      // 100% silence because non-Latin script is stripped. In that case, we speak the phonetic
      // Khmer pronunciation (`Kah... Kah, Kdaam`) so the learner always hears clear voice audio!
      const spokenString = khmerVoice ? text : toKhmerPhoneticSpeech(text);
      const utterance = new SpeechSynthesisUtterance(spokenString);
      activeSpeechUtterance = utterance;

      if (khmerVoice) {
        utterance.voice = khmerVoice;
        utterance.lang = khmerVoice.lang || 'km-KH';
        utterance.rate = 0.85;
        utterance.pitch = 1.08;
      } else {
        const preferredFallbackVoice =
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en') && v.default) ||
          voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en')) ||
          voices[0];
        if (preferredFallbackVoice) {
          utterance.voice = preferredFallbackVoice;
          utterance.lang = preferredFallbackVoice.lang || 'en-US';
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = 0.82;
        utterance.pitch = 1.05;
      }

      utterance.volume = 1.0;
      utterance.onend = () => {
        if (activeSpeechUtterance === utterance) {
          activeSpeechUtterance = null;
        }
      };
      utterance.onerror = () => {
        if (activeSpeechUtterance === utterance) {
          activeSpeechUtterance = null;
        }
      };

      synth.speak(utterance);
    } catch {
      // Fallback gracefully
    }
  };

  try {
    if (speechTimeoutId) {
      clearTimeout(speechTimeoutId);
      speechTimeoutId = null;
    }
    const synth = window.speechSynthesis;
    // Avoid Chromium bug where synchronous cancel() + speak() cancels the new utterance
    if (synth.speaking || synth.pending) {
      synth.cancel();
      speechTimeoutId = setTimeout(startSpeech, 35);
    } else {
      startSpeech();
    }
  } catch {
    // Fallback gracefully
  }
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

type MobileOS = 'IOS' | 'ANDROID';
type StudentSubTab = 'QUIZ' | 'LEARN' | 'PROFILE';

export default function App() {
  // 1. RBAC Mock Database & Session State
  const [usersDb, setUsersDb] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS_DB;
    } catch {
      return INITIAL_USERS_DB;
    }
  });

  // Default to the demo Student account if no session is saved yet so the Lesson Selection screen is immediately ready
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SESSION);
      return saved ? JSON.parse(saved) : INITIAL_USERS_DB[2];
    } catch {
      return INITIAL_USERS_DB[2];
    }
  });

  const [lessonsDb, setLessonsDb] = useState<LessonPost[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LESSONS);
      return saved ? JSON.parse(saved) : INITIAL_LESSONS_DB;
    } catch {
      return INITIAL_LESSONS_DB;
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const VALID_ROUTES: RoutePath[] = [
    '/student',
    '/teacher',
    '/admin',
    '/login',
    '/mobile-install',
    '/code',
  ];

  const [currentRoute, setCurrentRoute] = useState<RoutePath>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname as RoutePath;
      if (VALID_ROUTES.includes(path)) {
        return path;
      }
    }
    return '/student';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname !== currentRoute) {
      try {
        window.history.pushState({}, '', currentRoute);
      } catch {
        // Ignore in sandboxed contexts
      }
    }
  }, [currentRoute]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePopState = () => {
      const path = window.location.pathname as RoutePath;
      if (VALID_ROUTES.includes(path)) {
        setCurrentRoute(path);
      } else {
        setCurrentRoute('/student');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync DB changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersDb));
    } catch {
      // Ignore
    }
  }, [usersDb]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch {
      // Ignore
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(lessonsDb));
    } catch {
      // Ignore
    }
  }, [lessonsDb]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch {
      // Ignore
    }
  }, [auditLogs]);

  const logSecurityEvent = useCallback(
    (actorEmail: string, actorRole: UserRole, action: string, targetPath: string, outcome: 'ALLOWED' | 'DENIED') => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: timeStr,
        actorEmail,
        actorRole,
        action,
        targetPath,
        outcome,
      };
      setAuditLogs((prev) => [entry, ...prev.slice(0, 29)]);
    },
    []
  );

  // 2. Login & Registration Form State
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [identifierInput, setIdentifierInput] = useState('admin@school.edu.kh');
  const [passwordInput, setPasswordInput] = useState('Password123!');
  const [fullNameInput, setFullNameInput] = useState('');
  const [registerRoleInput, setRegisterRoleInput] = useState<UserRole>(UserRole.STUDENT);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // 3. Admin User Creation State
  const [newAdminUserEmail, setNewAdminUserEmail] = useState('');
  const [newAdminUserName, setNewAdminUserName] = useState('');
  const [newAdminUserRole, setNewAdminUserRole] = useState<UserRole>(UserRole.STUDENT);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // 4. Teacher Lesson Editor State
  const [lessonTitleInput, setLessonTitleInput] = useState('');
  const [lessonCategoryInput, setLessonCategoryInput] = useState<LessonPost['category']>('Consonants (ព្យញ្ជនៈ)');
  const [lessonSummaryInput, setLessonSummaryInput] = useState('');
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // 5. Student Portal & Lesson-Based Quiz Selection State
  const [studentSubTab, setStudentSubTab] = useState<StudentSubTab>('QUIZ');
  // `selectedLessonId === null` means the user is on the Lesson Selection Screen (ការជ្រើសរើសកម្រងសំណួរតាមមេរៀន)
  const [selectedLessonId, setSelectedLessonId] = useState<LessonId | 'ALL' | null>(null);
  const [profileNameEdit, setProfileNameEdit] = useState('');
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [selectedOS, setSelectedOS] = useState<MobileOS>('IOS');
  const [questions, setQuestions] = useState<QuizQuestion[]>(INITIAL_QUIZ_DATA);

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
  const [lessonBestScores, setLessonBestScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('khmer_quiz_lesson_best_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Code & URL Copy States
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Teacher New Question Form State (Tagged by `lessonId`)
  const [newQIcon, setNewQIcon] = useState('🐢');
  const [newQLessonId, setNewQLessonId] = useState<LessonId>('lesson-2');
  const [newQWordKhmer, setNewQWordKhmer] = useState('អណ្តើក');
  const [newQWordEng, setNewQWordEng] = useState('Turtle (Andaek)');
  const [newQCorrect, setNewQCorrect] = useState('អ');
  const [newQWrong1, setNewQWrong1] = useState('ក');
  const [newQWrong2, setNewQWrong2] = useState('ស');

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

  useEffect(() => {
    if (currentUser) {
      setProfileNameEdit(currentUser.fullName);
    }
  }, [currentUser]);

  const triggerSpeechWithBanner = useCallback((text: string, displayLabel?: string) => {
    speakKhmerText(text);
    setLastSpokenToast(displayLabel || text);
  }, []);

  // ==========================================================================
  // AUTHENTICATION & ROUTE MIDDLEWARE HANDLERS
  // ==========================================================================

  const navigateToRoute = (targetRoute: RoutePath) => {
    if (targetRoute === '/login') {
      setCurrentRoute('/login');
      return;
    }

    if (!currentUser) {
      setCurrentRoute('/login');
      return;
    }

    const allowedRoles = ROUTE_PERMISSIONS[targetRoute];
    const isAuthorized = allowedRoles.includes(currentUser.role);

    logSecurityEvent(
      currentUser.email,
      currentUser.role,
      isAuthorized
        ? `Navigated to authorized route ${targetRoute}`
        : `Blocked unauthorized attempt to access ${targetRoute}`,
      targetRoute,
      isAuthorized ? 'ALLOWED' : 'DENIED'
    );

    setCurrentRoute(targetRoute);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    const trimmedId = identifierInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedId) {
      setAuthError('សូមបញ្ចូលអ៊ីមែល ឬឈ្មោះគណនី (Email or Username is required).');
      return;
    }
    if (!trimmedPass) {
      setAuthError('សូមបញ្ចូលពាក្យសម្ងាត់ (Password is required).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if ((authMode === 'REGISTER' || trimmedId.includes('@')) && !emailRegex.test(trimmedId)) {
      setAuthError('ទម្រង់អ៊ីមែលមិនត្រឹមត្រូវទេ — សូមបញ្ចូលអ៊ីមែលដូចជា name@school.edu.kh (Invalid email format).');
      return;
    }

    if (trimmedPass.length < 6) {
      setAuthError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួអក្សរ (Password must be at least 6 characters).');
      return;
    }

    if (authMode === 'LOGIN') {
      const matchedUser = usersDb.find(
        (u) =>
          (u.email.toLowerCase() === trimmedId.toLowerCase() ||
            u.username.toLowerCase() === trimmedId.toLowerCase()) &&
          u.password === trimmedPass
      );

      if (!matchedUser) {
        setAuthError('អ៊ីមែល/ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ (Invalid credentials. Try the 1-Click Demo Role buttons!).');
        playSoundEffect('tryAgain');
        return;
      }

      if (matchedUser.status === 'Suspended') {
        setAuthError('គណនីនេះត្រូវបានផ្អាកជាបណ្តោះអាសន្នដោយ Admin (This account is currently suspended).');
        playSoundEffect('tryAgain');
        return;
      }

      setCurrentUser(matchedUser);
      const targetRoute = ROLE_DEFAULT_ROUTE[matchedUser.role];
      setCurrentRoute(targetRoute);
      logSecurityEvent(
        matchedUser.email,
        matchedUser.role,
        `Signed in & redirected to ${targetRoute}`,
        targetRoute,
        'ALLOWED'
      );
      playSoundEffect('correct');
    } else {
      if (!fullNameInput.trim()) {
        setAuthError('សូមបញ្ចូលឈ្មោះពេញរបស់អ្នក (Full Name is required for registration).');
        return;
      }

      const exists = usersDb.some(
        (u) => u.email.toLowerCase() === trimmedId.toLowerCase() || u.username.toLowerCase() === trimmedId.toLowerCase()
      );
      if (exists) {
        setAuthError('អ៊ីមែលនេះមានក្នុងប្រព័ន្ធរួចហើយ (An account with this email already exists).');
        return;
      }

      const newUser: UserAccount = {
        id: `usr-${Date.now()}`,
        username: trimmedId.split('@')[0].toLowerCase(),
        email: trimmedId.toLowerCase(),
        password: trimmedPass,
        fullName: fullNameInput.trim(),
        role: registerRoleInput,
        status: 'Active',
        starsEarned: 0,
        quizzesCompleted: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setUsersDb((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      const targetRoute = ROLE_DEFAULT_ROUTE[newUser.role];
      setCurrentRoute(targetRoute);
      logSecurityEvent(
        newUser.email,
        newUser.role,
        `Registered new ${newUser.role} account & redirected to ${targetRoute}`,
        targetRoute,
        'ALLOWED'
      );
      playSoundEffect('correct');
    }
  };

  const handleQuickDemoLogin = (role: UserRole) => {
    setAuthError('');
    const demoUser =
      usersDb.find((u) => u.role === role && u.status === 'Active') ||
      INITIAL_USERS_DB.find((u) => u.role === role)!;
    setIdentifierInput(demoUser.email);
    setPasswordInput(demoUser.password);
    setCurrentUser(demoUser);
    const targetRoute = ROLE_DEFAULT_ROUTE[demoUser.role];
    setCurrentRoute(targetRoute);
    logSecurityEvent(
      demoUser.email,
      demoUser.role,
      `Quick role switch login (${demoUser.role}) -> ${targetRoute}`,
      targetRoute,
      'ALLOWED'
    );
    playSoundEffect('tap');
  };

  const handleLogout = () => {
    if (currentUser) {
      logSecurityEvent(
        currentUser.email,
        currentUser.role,
        'User logged out & cleared session',
        '/login',
        'ALLOWED'
      );
    }
    setCurrentUser(null);
    setCurrentRoute('/login');
    setAuthError('');
    setAuthSuccessMsg('អ្នកបានចាកចេញពីគណនីដោយជោគជ័យ (Session cleared & logged out).');
    playSoundEffect('tap');
  };

  // ==========================================================================
  // ADMIN & TEACHER HANDLERS
  // ==========================================================================

  const handleChangeUserRole = (userId: string, newRole: UserRole) => {
    setUsersDb((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role: newRole } : null));
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsersDb((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' } : u
      )
    );
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser && currentUser.id === userId) return;
    setUsersDb((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleCreateUserByAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUserEmail.trim() || !newAdminUserName.trim()) return;
    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newAdminUserEmail.trim().split('@')[0].toLowerCase(),
      email: newAdminUserEmail.trim().toLowerCase(),
      password: 'Password123!',
      fullName: newAdminUserName.trim(),
      role: newAdminUserRole,
      status: 'Active',
      starsEarned: 0,
      quizzesCompleted: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsersDb((prev) => [created, ...prev]);
    setNewAdminUserEmail('');
    setNewAdminUserName('');
  };

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonTitleInput.trim() || !lessonSummaryInput.trim()) return;

    if (editingLessonId) {
      setLessonsDb((prev) =>
        prev.map((item) =>
          item.id === editingLessonId
            ? {
                ...item,
                title: lessonTitleInput.trim(),
                category: lessonCategoryInput,
                summary: lessonSummaryInput.trim(),
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : item
        )
      );
      setEditingLessonId(null);
    } else {
      const newLesson: LessonPost = {
        id: `les-${Date.now()}`,
        title: lessonTitleInput.trim(),
        category: lessonCategoryInput,
        summary: lessonSummaryInput.trim(),
        authorName: currentUser?.fullName || 'Teacher',
        updatedAt: new Date().toISOString().split('T')[0],
        status: 'Published',
      };
      setLessonsDb((prev) => [newLesson, ...prev]);
    }

    setLessonTitleInput('');
    setLessonSummaryInput('');
  };

  const handleEditLessonClick = (lesson: LessonPost) => {
    setEditingLessonId(lesson.id);
    setLessonTitleInput(lesson.title);
    setLessonCategoryInput(lesson.category);
    setLessonSummaryInput(lesson.summary);
  };

  const handleToggleLessonStatus = (lessonId: string) => {
    setLessonsDb((prev) =>
      prev.map((l) =>
        l.id === lessonId
          ? { ...l, status: l.status === 'Published' ? 'Draft' : 'Published' }
          : l
      )
    );
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessonsDb((prev) => prev.filter((l) => l.id !== lessonId));
  };

  // ==========================================================================
  // LESSON SELECTION & QUIZ FLOW HANDLERS
  // ==========================================================================

  // Start a specific lesson quiz (`lesson-1`, `lesson-2`, `lesson-3`, `lesson-4`, or `ALL`)
  const handleStartLessonQuiz = (lessonId: LessonId | 'ALL') => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }
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
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }
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
        const updatedStars = currentUser.starsEarned + score;
        const updatedQuizzes = currentUser.quizzesCompleted + 1;
        const updatedUser: UserAccount = {
          ...currentUser,
          starsEarned: updatedStars,
          quizzesCompleted: updatedQuizzes,
        };
        setCurrentUser(updatedUser);
        setUsersDb((prev) =>
          prev.map((u) => (u.id === currentUser.id ? updatedUser : u))
        );
      }
    }
  };

  const handleRestartCurrentLesson = () => {
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // Ignore
    }
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
    const updated: UserAccount = {
      ...currentUser,
      fullName: profileNameEdit.trim(),
    };
    setCurrentUser(updated);
    setUsersDb((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
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
  // PROTECTED ROUTE AUTHORIZATION GUARD RENDERER
  // ==========================================================================

  const renderProtectedRoute = (
    route: Exclude<RoutePath, '/login'>,
    content: React.ReactNode
  ) => {
    if (!currentUser) {
      return (
        <div className="max-w-lg mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-sm">
          <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            តម្រូវឱ្យចូលគណនីជាមុនសិន (Authentication Required)
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            You must be logged in to access <code className="font-mono font-bold">{route}</code>.
          </p>
          <button
            type="button"
            onClick={() => setCurrentRoute('/login')}
            className="px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer"
          >
            ទៅកាន់ទំព័រចូលគណនី (Go to Login)
          </button>
        </div>
      );
    }

    const allowedRoles = ROUTE_PERMISSIONS[route];
    const hasPermission = allowedRoles.includes(currentUser.role);

    if (!hasPermission) {
      return (
        <section className="max-w-2xl mx-auto my-8 bg-white rounded-3xl border-2 border-rose-300 p-8 sm:p-10 text-center shadow-sm animate-pop">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <p className="text-xs font-mono font-bold text-rose-600 mb-1">
            HTTP 403 FORBIDDEN · RBAC MIDDLEWARE INTERCEPTED
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            មិនអនុញ្ញាតឱ្យចូលប្រើប្រាស់ (Access Denied)
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-6">
            Your current account (<strong>{currentUser.fullName}</strong>) has the role{' '}
            <strong className="text-slate-900 font-mono">{currentUser.role}</strong>, which is not authorized to access the protected route{' '}
            <code className="font-mono font-bold text-rose-700">{route}</code>.
          </p>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 max-w-md mx-auto mb-6 text-left text-xs font-mono space-y-1.5 text-slate-700">
            <div>Attempted Path: {route}</div>
            <div>Current User Role: {currentUser.role}</div>
            <div>Required Role(s): {allowedRoles.join(' or ')}</div>
            <div>Security Action: Logged DENIED event to Admin Audit Log</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentRoute(ROLE_DEFAULT_ROUTE[currentUser.role])}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer"
            >
              ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រងរបស់អ្នក ({ROLE_DEFAULT_ROUTE[currentUser.role]})
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(allowedRoles[0])}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm cursor-pointer"
            >
              ប្តូរទៅគណនី {allowedRoles[0]} ដើម្បីសាកល្បង (Switch Role)
            </button>
          </div>
        </section>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFDF7] text-slate-900 font-khmer selection:bg-amber-200">
      {/* =====================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract)
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

          {/* Zone 2: 5 Concise Single-Line Route Links */}
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
              onClick={() => navigateToRoute('/teacher')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentRoute === '/teacher'
                  ? 'border-amber-500 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              គ្រូបង្រៀន (/teacher)
            </button>
            <button
              type="button"
              onClick={() => navigateToRoute('/admin')}
              className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                currentRoute === '/admin'
                  ? 'border-amber-500 text-slate-900'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              អ្នកគ្រប់គ្រង (/admin)
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

          {/* Zone 3: 1 Primary Action Button (Logout or Sign In) */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>ចាកចេញ (Logout)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentRoute('/login')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                <span>ចូលគណនី (Sign In)</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Active Session & Quick Role Switcher Bar */}
      <div className="w-full bg-amber-50/90 border-b border-amber-200/70 px-4 sm:px-8 py-2.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-2 flex-wrap">
            {currentUser ? (
              <>
                <span className="font-bold text-slate-900">
                  គណនីកំពុងប្រើ៖ {currentUser.fullName}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono font-bold text-emerald-800">
                  Role: {currentUser.role}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-500">
                  Route: {currentRoute}
                </span>
              </>
            ) : (
              <span className="font-semibold text-slate-600">
                មិនទាន់ចូលគណនី (Unauthenticated Guest) · សូមជ្រើសរើសតួនាទីខាងស្តាំដើម្បីសាកល្បង RBAC
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-semibold">ប្តូរតួនាទី (Switch Role):</span>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(UserRole.STUDENT)}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                currentUser?.role === UserRole.STUDENT
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(UserRole.TEACHER)}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                currentUser?.role === UserRole.TEACHER
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoLogin(UserRole.ADMIN)}
              className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                currentUser?.role === UserRole.ADMIN
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Admin
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MAIN WORKSPACE VIEWPORT
          ===================================================================== */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        {/* ===================================================================
            ROUTE 1: STUDENT DASHBOARD & LESSON-BASED QUIZ SELECTION (/student)
            =================================================================== */}
        {currentRoute === '/student' &&
          renderProtectedRoute(
            '/student',
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
          )}

        {/* ===================================================================
            ROUTE 2: LOGIN & REGISTRATION PAGE (/login)
            =================================================================== */}
        {currentRoute === '/login' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setAuthError('');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      authMode === 'LOGIN'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ចូលគណនី (Sign In)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('REGISTER');
                      setIdentifierInput('');
                      setPasswordInput('');
                      setAuthError('');
                    }}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                      authMode === 'REGISTER'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ចុះឈ្មោះគណនីថ្មី (Register)
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                  {authMode === 'LOGIN'
                    ? 'ចូលប្រើប្រាស់ប្រព័ន្ធ (Sign In to Portal)'
                    : 'បង្កើតគណនីថ្មី (Create RBAC Account)'}
                </h1>
                <p className="text-sm text-slate-600 mb-6">
                  {authMode === 'LOGIN'
                    ? 'Enter your email or username and password. You will be automatically redirected to your role-specific dashboard.'
                    : 'Register a new user and assign a role (Admin, Teacher/Editor, or Student) to test role-based permissions.'}
                </p>

                {authError && (
                  <div className="mb-5 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-800 flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccessMsg && (
                  <div className="mb-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs sm:text-sm font-semibold text-emerald-800 flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{authSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
                  {authMode === 'REGISTER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ឈ្មោះពេញ (Full Name)
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="e.g. Vanna Sok"
                          className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      អ៊ីមែល ឬ ឈ្មោះគណនី (Email or Username)
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={identifierInput}
                        onChange={(e) => setIdentifierInput(e.target.value)}
                        placeholder="admin@school.edu.kh or admin"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      ពាក្យសម្ងាត់ (Password)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password (min 6 chars)"
                        className="w-full rounded-xl border border-slate-300 pl-10 pr-11 py-2.5 text-sm focus:border-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {authMode === 'REGISTER' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        ជ្រើសរើសតួនាទី (Select RBAC Role)
                      </label>
                      <select
                        value={registerRoleInput}
                        onChange={(e) => setRegisterRoleInput(e.target.value as UserRole)}
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold bg-white"
                      >
                        <option value={UserRole.STUDENT}>STUDENT — Student Dashboard &amp; Quiz Only</option>
                        <option value={UserRole.TEACHER}>TEACHER — Content &amp; Lesson Management</option>
                        <option value={UserRole.ADMIN}>ADMIN — Full System &amp; User Management</option>
                      </select>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                  >
                    {authMode === 'LOGIN'
                      ? 'ចូលគណនី និងបញ្ជូនទៅផ្ទាំងគ្រប់គ្រង (Sign In)'
                      : 'បង្កើតគណនី និងចូលប្រើប្រាស់ (Create Account)'}
                  </button>
                </form>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-200 text-xs text-slate-500">
                ប្រព័ន្ធផ្ទៀងផ្ទាត់សិទ្ធិប្រើប្រាស់ · Session persisted in <code className="font-mono">localStorage</code>.
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Interactive Role Testing &amp; Access Matrix</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  គណនីគំរូទាំង ៣ តួនាទី (1-Click Demo Role Login)
                </h2>
                <p className="text-sm text-slate-600 mb-6">
                  Click any card below to automatically fill credentials, sign in, and redirect to that role&apos;s default dashboard:
                </p>

                <div className="space-y-3.5 mb-8">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        01. Admin Role (<span className="font-mono text-xs">ADMIN</span>)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        Email: admin@school.edu.kh · Pass: Password123!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(UserRole.ADMIN)}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Login as Admin &rarr;
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        02. Editor / Teacher Role (<span className="font-mono text-xs">TEACHER</span>)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        Email: teacher@school.edu.kh · Pass: Password123!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(UserRole.TEACHER)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Login as Teacher &rarr;
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">
                        03. Student / Regular User (<span className="font-mono text-xs">STUDENT</span>)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 font-mono">
                        Email: student@school.edu.kh · Pass: Password123!
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickDemoLogin(UserRole.STUDENT)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Login as Student &rarr;
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-slate-700 leading-relaxed">
                <strong>របៀបសាកល្បង Route Protection:</strong> ចុច <strong>Login as Student</strong> រួចសាកល្បងចុចលើម៉ឺនុយ <strong>អ្នកគ្រប់គ្រង (/admin)</strong> នោះប្រព័ន្ធនឹងបង្ហាញផ្ទាំងការពារ <strong>403 Access Denied</strong> ភ្លាម!
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            ROUTE 3: ADMIN DASHBOARD (/admin — ADMIN ONLY)
            =================================================================== */}
        {currentRoute === '/admin' &&
          renderProtectedRoute(
            '/admin',
            <div className="space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-mono font-bold text-emerald-700">
                      PROTECTED ROUTE: /admin · REQUIRED ROLE: ADMIN
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ (Admin Console &amp; User Management)
                    </h1>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => navigateToRoute('/teacher')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      មើលផ្ទាំងគ្រូបង្រៀន (/teacher)
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateToRoute('/student')}
                      className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      មើលមេរៀនសិស្ស (/student)
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
                    <p className="text-xs font-bold text-slate-500">ការព្យាយាមចូលខុសសិទ្ធិ (Blocked 403s)</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-rose-600 mt-1">
                      {auditLogs.filter((l) => l.outcome === 'DENIED').length}
                    </p>
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
                                    handleChangeUserRole(u.id, e.target.value as UserRole)
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
                                  onClick={() => handleToggleUserStatus(u.id)}
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
                                {currentUser?.id !== u.id ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 inline" />
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400">You</span>
                                )}
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
                      កំណត់ហេតុសុវត្ថិភាព (RBAC Security Audit Log)
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
            ROUTE 4: TEACHER / EDITOR STUDIO (/teacher — TEACHER & ADMIN)
            =================================================================== */}
        {currentRoute === '/teacher' &&
          renderProtectedRoute(
            '/teacher',
            <div className="space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                  <div>
                    <p className="text-xs font-mono font-bold text-amber-700">
                      PROTECTED ROUTE: /teacher · ALLOWED ROLES: TEACHER, ADMIN
                    </p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                      ផ្ទាំងគ្រប់គ្រងមេរៀន និងសំណួរ (Teacher / Editor Content Studio)
                    </h1>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLessonId(null);
                      navigateToRoute('/student');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold whitespace-nowrap cursor-pointer self-start"
                  >
                    សាកល្បងជ្រើសរើសមេរៀនសិស្ស (/student) &rarr;
                  </button>
                </div>

                {/* Add Quiz Question Tagged by `lessonId` */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
                  <div className="lg:col-span-5">
                    <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <FileEdit className="w-5 h-5 text-amber-600" />
                      <span>បន្ថែមសំណួរថ្មីតាមមេរៀន (Add Question to Lesson)</span>
                    </h2>
                    <p className="text-xs text-slate-500 mb-4">
                      Select which Lesson (`lessonId`) the question belongs to.
                    </p>
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
            ROUTE 5: MOBILE INSTALLATION HUB (/mobile-install)
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
          <span>RBAC Protected Routes (/student, /teacher, /admin) · iOS &amp; Android Ready</span>
        </div>
      </footer>
    </div>
  );
}
