/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Default Grade 1 Khmer Lessons & 16 Fallback Questions (4 Options Each)
 * Used when Firestore `questions` collection is empty, and available for 1-click Admin seeding.
 */

import { FirestoreQuestionInput, FirestoreQuestionRecord } from './firebase';

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
  id: string;
  firestoreId?: string;
  lessonId: LessonId;
  category: string;
  categoryLabel: string;
  level: string;
  icon: string;
  clueWordKhmer: string;
  clueWordEnglish: string;
  phoneticHint: string;
  speechText: string;
  questionKhmer: string;
  questionEnglish: string;
  options: [QuizOption, QuizOption, QuizOption, QuizOption];
  correctIndex: number;
  correctLetter: string;
  explanation: string;
}

export const INITIAL_QUIZ_DATA: QuizQuestion[] = [
  // ---------------- LESSON 1: ព្យញ្ជនៈ ជួរ ក (lesson-1) ----------------
  {
    id: 'seed-101',
    lessonId: 'lesson-1',
    category: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឃ', label: 'ឃ (Kho)', speech: 'ឃ' },
    ],
    correctIndex: 0,
    correctLetter: 'ក',
    explanation: 'ត្រឹមត្រូវ! «ក» គឺ ក ក្តាម (Ka for Crab)!',
  },
  {
    id: 'seed-102',
    lessonId: 'lesson-1',
    category: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ក', label: 'ក (Ka)', speech: 'ក' },
    ],
    correctIndex: 1,
    correctLetter: 'ខ',
    explanation: 'ពូកែណាស់! «ខ» គឺ ខ ខ្លា (Kha for Tiger)!',
  },
  {
    id: 'seed-103',
    lessonId: 'lesson-1',
    category: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ង', label: 'ង (Ngo)', speech: 'ង' },
    ],
    correctIndex: 0,
    correctLetter: 'គ',
    explanation: 'អស្ចារ្យណាស់! «គ» គឺ គ គោ (Ko for Cow)!',
  },
  {
    id: 'seed-104',
    lessonId: 'lesson-1',
    category: 'lesson-1',
    categoryLabel: 'មេរៀនទី ១ · ព្យញ្ជនៈ ជួរ ក',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ខ', label: 'ខ (Kha)', speech: 'ខ' },
    ],
    correctIndex: 1,
    correctLetter: 'ឃ',
    explanation: 'ត្រឹមត្រូវ! «ឃ» គឺ ឃ ឃ្មុំ (Kho for Bee)!',
  },

  // ---------------- LESSON 2: ព្យញ្ជនៈ ជួរ ច និង ដ-ស (lesson-2) ----------------
  {
    id: 'seed-201',
    lessonId: 'lesson-2',
    category: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឈ', label: 'ឈ (Chho)', speech: 'ឈ' },
    ],
    correctIndex: 2,
    correctLetter: 'ច',
    explanation: 'ត្រឹមត្រូវហើយ! «ច» គឺ ច ចេក (Cha for Banana)!',
  },
  {
    id: 'seed-202',
    lessonId: 'lesson-2',
    category: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ជ', label: 'ជ (Cho)', speech: 'ជ' },
    ],
    correctIndex: 1,
    correctLetter: 'ឆ',
    explanation: 'ពូកែណាស់! «ឆ» គឺ ឆ ឆ្មា (Chha for Cat)!',
  },
  {
    id: 'seed-203',
    lessonId: 'lesson-2',
    category: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ណ', label: 'ណ (Na)', speech: 'ណ' },
    ],
    correctIndex: 0,
    correctLetter: 'ដ',
    explanation: 'ឆ្លាតណាស់! «ដ» គឺ ដ ដំរី (Da for Elephant)!',
  },
  {
    id: 'seed-204',
    lessonId: 'lesson-2',
    category: 'lesson-2',
    categoryLabel: 'មេរៀនទី ២ · ព្យញ្ជនៈ ជួរ ច-ស',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឡ', label: 'ឡ (La)', speech: 'ឡ' },
    ],
    correctIndex: 1,
    correctLetter: 'ស',
    explanation: 'ល្អណាស់! «ស» គឺ ស សេះ (Sa for Horse)!',
  },

  // ---------------- LESSON 3: ស្រៈនិស្ស័យ (lesson-3) ----------------
  {
    id: 'seed-301',
    lessonId: 'lesson-3',
    category: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'េ', label: 'េ (ស្រៈ អេ)', speech: 'ស្រៈ អេ' },
    ],
    correctIndex: 0,
    correctLetter: 'ា',
    explanation: 'ត្រឹមត្រូវ! «ា» អានថា ស្រៈ អា (Sra Aa)!',
  },
  {
    id: 'seed-302',
    lessonId: 'lesson-3',
    category: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឺ', label: 'ឺ (ស្រៈ អឺ)', speech: 'ស្រៈ អឺ' },
    ],
    correctIndex: 1,
    correctLetter: 'ី',
    explanation: 'ពូកែណាស់! «ី» អានថា ស្រៈ អី (Sra Ei)!',
  },
  {
    id: 'seed-303',
    lessonId: 'lesson-3',
    category: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ៃ', label: 'ៃ (ស្រៈ អៃ)', speech: 'ស្រៈ អៃ' },
    ],
    correctIndex: 2,
    correctLetter: 'ោ',
    explanation: 'អស្ចារ្យណាស់! «ោ» អានថា ស្រៈ អោ (Sra Ao)!',
  },
  {
    id: 'seed-304',
    lessonId: 'lesson-3',
    category: 'lesson-3',
    categoryLabel: 'មេរៀនទី ៣ · ស្រៈនិស្ស័យ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ុំ', label: 'ុំ (ស្រៈ អុំ)', speech: 'ស្រៈ អុំ' },
    ],
    correctIndex: 0,
    correctLetter: 'ៅ',
    explanation: 'ត្រឹមត្រូវហើយ! «ៅ» អានថា ស្រៈ អៅ (Sra Au)!',
  },

  // ---------------- LESSON 4: ស្រៈពេញតួ (lesson-4) ----------------
  {
    id: 'seed-401',
    lessonId: 'lesson-4',
    category: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឱ', label: 'ឱ (ស្រៈ ឱ)', speech: 'ឱ' },
    ],
    correctIndex: 0,
    correctLetter: 'ឥ',
    explanation: 'ត្រឹមត្រូវ! «ឥ» គឺស្រៈពេញតួក្នុងពាក្យ ឥសី!',
  },
  {
    id: 'seed-402',
    lessonId: 'lesson-4',
    category: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឪ', label: 'ឪ (ស្រៈ ឪ)', speech: 'ឪ' },
    ],
    correctIndex: 1,
    correctLetter: 'ឧ',
    explanation: 'ពូកែណាស់! «ឧ» គឺស្រៈពេញតួក្នុងពាក្យ ឧសភា!',
  },
  {
    id: 'seed-403',
    lessonId: 'lesson-4',
    category: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឧ', label: 'ឧ (ស្រៈ ឧ)', speech: 'ឧ' },
    ],
    correctIndex: 0,
    correctLetter: 'ឯ',
    explanation: 'អស្ចារ្យណាស់! «ឯ» គឺស្រៈពេញតួក្នុងពាក្យ ឯកសណ្ឋាន!',
  },
  {
    id: 'seed-404',
    lessonId: 'lesson-4',
    category: 'lesson-4',
    categoryLabel: 'មេរៀនទី ៤ · ស្រៈពេញតួ',
    level: 'ថ្នាក់ទី១',
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
      { letter: 'ឯ', label: 'ឯ (ស្រៈ ឯ)', speech: 'ឯ' },
    ],
    correctIndex: 1,
    correctLetter: 'ឪ',
    explanation: 'ត្រឹមត្រូវហើយ! «ឪ» គឺ ឪ ឪឡឹក (Watermelon)!',
  },
];

function parseOptionString(raw: string): QuizOption {
  const trimmed = raw.trim() || 'ក';
  // Extract primary Khmer glyph/token before space or parenthesis for large display & TTS
  const match = trimmed.match(/^([^\s(]+)/);
  const primaryGlyph = match ? match[1] : trimmed;
  const speech = primaryGlyph.length <= 2 && /[\u17b6-\u17c5]/.test(primaryGlyph)
    ? `ស្រៈ ${primaryGlyph}`
    : primaryGlyph;
  return {
    letter: primaryGlyph,
    label: trimmed,
    speech,
  };
}

export function resolveLessonIdFromCategory(category: string): LessonId {
  const norm = category.toLowerCase().trim();
  if (norm === 'lesson-1' || norm.includes('ជួរ ក') || norm.includes('group 1') || norm.includes('មេរៀនទី ១')) {
    return 'lesson-1';
  }
  if (norm === 'lesson-2' || norm.includes('ជួរ ច') || norm.includes('group 2') || norm.includes('មេរៀនទី ២')) {
    return 'lesson-2';
  }
  if (norm === 'lesson-3' || norm.includes('ស្រៈនិស្ស័យ') || norm.includes('dependent') || norm.includes('មេរៀនទី ៣')) {
    return 'lesson-3';
  }
  if (norm === 'lesson-4' || norm.includes('ស្រៈពេញតួ') || norm.includes('independent') || norm.includes('មេរៀនទី ៤')) {
    return 'lesson-4';
  }
  return 'lesson-1';
}

export function mapFirestoreDocToQuizQuestion(rec: FirestoreQuestionRecord): QuizQuestion {
  const lessonId = resolveLessonIdFromCategory(rec.category);
  const lessonMeta = QUIZ_LESSONS.find((l) => l.id === lessonId) || QUIZ_LESSONS[0];
  const parsedOptions: [QuizOption, QuizOption, QuizOption, QuizOption] = [
    parseOptionString(rec.options[0]),
    parseOptionString(rec.options[1]),
    parseOptionString(rec.options[2]),
    parseOptionString(rec.options[3]),
  ];
  const answerOpt = parsedOptions[rec.correctIndex] || parsedOptions[0];
  const clueKhmer = rec.clueWordKhmer?.trim() || answerOpt.letter;

  return {
    id: rec.id,
    firestoreId: rec.id,
    lessonId,
    category: rec.category,
    categoryLabel: `${lessonMeta.numberLabel} · ${rec.level}`,
    level: rec.level,
    icon: rec.icon?.trim() || lessonMeta.icon,
    clueWordKhmer: clueKhmer,
    clueWordEnglish: rec.clueWordEnglish?.trim() || `${rec.level} · ${rec.category}`,
    phoneticHint: `សំឡេងអាន៖ «${answerOpt.letter}» — ${clueKhmer}`,
    speechText: `${answerOpt.speech}... ${clueKhmer}`,
    questionKhmer: rec.question,
    questionEnglish: `${rec.category} · ${rec.level}`,
    options: parsedOptions,
    correctIndex: rec.correctIndex,
    correctLetter: answerOpt.letter,
    explanation:
      rec.explanation?.trim() ||
      `ត្រឹមត្រូវ! «${answerOpt.label}» គឺជាចម្លើយដ៏ត្រឹមត្រូវ!`,
  };
}

export function mapQuizQuestionToFirestoreInput(q: QuizQuestion): FirestoreQuestionInput {
  return {
    question: q.questionKhmer,
    options: [
      q.options[0].label,
      q.options[1].label,
      q.options[2].label,
      q.options[3].label,
    ],
    correctIndex: q.correctIndex,
    category: q.category || q.lessonId,
    level: q.level || 'ថ្នាក់ទី១',
    icon: q.icon,
    clueWordKhmer: q.clueWordKhmer,
    clueWordEnglish: q.clueWordEnglish,
    explanation: q.explanation,
  };
}
