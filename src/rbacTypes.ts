/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Role-Based Access Control (RBAC) Types, Mock Database & Route Middleware Definitions
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export type RoutePath = '/login' | '/admin' | '/teacher' | '/student' | '/mobile-install' | '/code';

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  password: string; // Stored in mock DB for demo simulation
  fullName: string;
  role: UserRole;
  status: 'Active' | 'Suspended';
  starsEarned: number;
  quizzesCompleted: number;
  createdAt: string;
}

export interface LessonPost {
  id: string;
  title: string;
  category: 'Consonants (ព្យញ្ជនៈ)' | 'Vowels (ស្រៈនិស្ស័យ)' | 'Reading Guide';
  summary: string;
  authorName: string;
  updatedAt: string;
  status: 'Published' | 'Draft';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetPath: string;
  outcome: 'ALLOWED' | 'DENIED';
}

/**
 * Default Route Mapping for Automatic Post-Login Redirection
 */
export const ROLE_DEFAULT_ROUTE: Record<UserRole, RoutePath> = {
  [UserRole.ADMIN]: '/admin',
  [UserRole.TEACHER]: '/teacher',
  [UserRole.STUDENT]: '/student',
};

/**
 * Route Access Control Matrix (Middleware Policy)
 * Defines which roles are permitted to access each protected route.
 */
export const ROUTE_PERMISSIONS: Record<Exclude<RoutePath, '/login'>, UserRole[]> = {
  '/admin': [UserRole.ADMIN],
  '/teacher': [UserRole.ADMIN, UserRole.TEACHER],
  '/student': [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
  '/mobile-install': [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
  '/code': [UserRole.ADMIN, UserRole.TEACHER, UserRole.STUDENT],
};

/**
 * Seed Users for Testing All 3 RBAC Roles
 */
export const INITIAL_USERS_DB: UserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    email: 'admin@school.edu.kh',
    password: 'Password123!',
    fullName: 'Sokha Chan (System Admin)',
    role: UserRole.ADMIN,
    status: 'Active',
    starsEarned: 10,
    quizzesCompleted: 5,
    createdAt: '2026-09-01',
  },
  {
    id: 'usr-teacher-01',
    username: 'teacher',
    email: 'teacher@school.edu.kh',
    password: 'Password123!',
    fullName: 'SOPHEA Kru (Grade 1 Teacher)',
    role: UserRole.TEACHER,
    status: 'Active',
    starsEarned: 10,
    quizzesCompleted: 4,
    createdAt: '2026-09-10',
  },
  {
    id: 'usr-student-01',
    username: 'student',
    email: 'student@school.edu.kh',
    password: 'Password123!',
    fullName: 'Dara Pich (Grade 1 Student)',
    role: UserRole.STUDENT,
    status: 'Active',
    starsEarned: 8,
    quizzesCompleted: 3,
    createdAt: '2026-10-02',
  },
  {
    id: 'usr-student-02',
    username: 'bopha',
    email: 'bopha@school.edu.kh',
    password: 'Password123!',
    fullName: 'Bopha Meas (Grade 1 Student)',
    role: UserRole.STUDENT,
    status: 'Active',
    starsEarned: 10,
    quizzesCompleted: 6,
    createdAt: '2026-10-14',
  },
];

export const INITIAL_LESSONS_DB: LessonPost[] = [
  {
    id: 'les-101',
    title: 'មេរៀនទី១៖ ព្យញ្ជនៈក្រុមទី១ (ក ខ គ ឃ ង)',
    category: 'Consonants (ព្យញ្ជនៈ)',
    summary: 'ការហាត់អាន និងផ្គូផ្គងព្យញ្ជនៈ ក ក្តាម, ខ ខ្លា, គ គោ សម្រាប់សិស្សថ្នាក់ទី១។',
    authorName: 'SOPHEA Kru',
    updatedAt: '2026-11-01',
    status: 'Published',
  },
  {
    id: 'les-102',
    title: 'មេរៀនទី២៖ ស្រៈនិស្ស័យ (ា ិ ី ឹ ឺ ុ ូ)',
    category: 'Vowels (ស្រៈនិស្ស័យ)',
    summary: 'របៀបប្រកបព្យញ្ជនៈជាមួយស្រៈនិស្ស័យ និងការស្តាប់សំឡេងអាន។',
    authorName: 'SOPHEA Kru',
    updatedAt: '2026-11-04',
    status: 'Published',
  },
  {
    id: 'les-103',
    title: 'មេរៀនទី៣៖ ការអានពាក្យផ្សំ (ត្រី, គោ, មេអំបៅ)',
    category: 'Reading Guide',
    summary: 'លំហាត់អនុវត្តន៍ការអានពាក្យងាយៗ និងការប្រមូលផ្កាយរង្វាន់។',
    authorName: 'Sokha Chan',
    updatedAt: '2026-11-05',
    status: 'Draft',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '08:42:10',
    actorEmail: 'admin@school.edu.kh',
    actorRole: UserRole.ADMIN,
    action: 'Authenticated & accessed Admin Console',
    targetPath: '/admin',
    outcome: 'ALLOWED',
  },
  {
    id: 'log-2',
    timestamp: '08:50:19',
    actorEmail: 'teacher@school.edu.kh',
    actorRole: UserRole.TEACHER,
    action: 'Updated Lesson les-102 in Teacher Studio',
    targetPath: '/teacher',
    outcome: 'ALLOWED',
  },
  {
    id: 'log-3',
    timestamp: '09:04:55',
    actorEmail: 'student@school.edu.kh',
    actorRole: UserRole.STUDENT,
    action: 'Blocked unauthorized attempt to open /admin',
    targetPath: '/admin',
    outcome: 'DENIED',
  },
];
