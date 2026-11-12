/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Student-Locked Open-Access Context Provider for Khmer Kids Quiz
 * Automatically locks the user session to the 'student' role with no login required.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  UserRole,
  AnyRole,
  RoleSlug,
  PermissionCapability,
  RoutePath,
  UserAccount,
  AuditLogEntry,
  ROLE_CAPABILITIES,
  INITIAL_USERS_DB,
  INITIAL_AUDIT_LOGS,
  normalizeRole,
} from '../rbacTypes';
import { safeLoadFromStorage } from '../audioEngine';

const STORAGE_KEYS = {
  STUDENT_PROFILE: 'khmer_student_open_profile_v1',
};

// Default Open-Access Student Profile (No Login Required)
export const DEFAULT_STUDENT_ACCOUNT: UserAccount = {
  ...INITIAL_USERS_DB[2],
  role: UserRole.STUDENT,
  status: 'Active',
};

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: RoutePath;
}

export interface AuthContextValue {
  /** Always returns the active Student profile (Open-Access Mode) */
  currentUser: UserAccount;
  /** Locked to `'student'` */
  currentRoleSlug: RoleSlug;
  /** Always true in open-access student mode */
  isAuthenticated: boolean;
  usersDb: UserAccount[];
  auditLogs: AuditLogEntry[];
  strictNavFiltering: boolean;
  setStrictNavFiltering: React.Dispatch<React.SetStateAction<boolean>>;

  // Redirect/No-op Auth Actions (Locked to Student)
  login: (identifier: string, password: string) => AuthActionResult;
  register: (
    fullName: string,
    email: string,
    password: string,
    role: AnyRole
  ) => AuthActionResult;
  quickSwitchRole: (role: AnyRole) => RoutePath;
  logout: () => void;

  // Role Evaluators (Locked to Student)
  hasRole: (allowedRoles: AnyRole[]) => boolean;
  hasPermission: (capability: PermissionCapability) => boolean;

  // Student Star & Profile Updater
  updateCurrentUserProfile: (
    updates: Partial<Pick<UserAccount, 'fullName' | 'starsEarned' | 'quizzesCompleted'>>
  ) => void;
  changeUserRole: (userId: string, newRole: AnyRole) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  createUserByAdmin: (fullName: string, email: string, role: AnyRole) => void;
  logSecurityEvent: (
    actorEmail: string,
    actorRole: UserRole,
    action: string,
    targetPath: string,
    outcome: 'ALLOWED' | 'DENIED'
  ) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Hydrate Student Profile & Stars from localStorage, enforcing role === UserRole.STUDENT
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const loaded = safeLoadFromStorage<UserAccount>(
      STORAGE_KEYS.STUDENT_PROFILE,
      DEFAULT_STUDENT_ACCOUNT,
      (val): val is UserAccount =>
        typeof val === 'object' &&
        val !== null &&
        'id' in val &&
        'fullName' in val &&
        'starsEarned' in val
    );
    // Lock role strictly to STUDENT regardless of any legacy localStorage state
    return {
      ...loaded,
      role: UserRole.STUDENT,
      status: 'Active',
    };
  });

  const [usersDb] = useState<UserAccount[]>(() => [currentUser]);
  const [auditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [strictNavFiltering, setStrictNavFiltering] = useState<boolean>(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEYS.STUDENT_PROFILE,
        JSON.stringify({ ...currentUser, role: UserRole.STUDENT })
      );
    } catch {
      // Ignore storage errors
    }
  }, [currentUser]);

  const hasRole = useCallback((allowedRoles: AnyRole[]): boolean => {
    const normalizedAllowed = allowedRoles.map(normalizeRole);
    return normalizedAllowed.includes(UserRole.STUDENT);
  }, []);

  const hasPermission = useCallback((capability: PermissionCapability): boolean => {
    const capabilities = ROLE_CAPABILITIES[UserRole.STUDENT] || [];
    return capabilities.includes(capability);
  }, []);

  const updateCurrentUserProfile = useCallback(
    (
      updates: Partial<
        Pick<UserAccount, 'fullName' | 'starsEarned' | 'quizzesCompleted'>
      >
    ) => {
      setCurrentUser((prev) => ({
        ...prev,
        ...updates,
        role: UserRole.STUDENT,
      }));
    },
    []
  );

  // Legacy auth functions kept for interface compatibility; always redirect to '/student'
  const login = useCallback((): AuthActionResult => {
    return { success: true, redirectTo: '/student' };
  }, []);

  const register = useCallback((): AuthActionResult => {
    return { success: true, redirectTo: '/student' };
  }, []);

  const quickSwitchRole = useCallback((): RoutePath => {
    return '/student';
  }, []);

  const logout = useCallback(() => {
    // Open-access student mode does not log out to a login screen
  }, []);

  const noop = useCallback(() => {}, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      currentRoleSlug: 'student',
      isAuthenticated: true,
      usersDb,
      auditLogs,
      strictNavFiltering,
      setStrictNavFiltering,
      login,
      register,
      quickSwitchRole,
      logout,
      hasRole,
      hasPermission,
      updateCurrentUserProfile,
      changeUserRole: noop,
      toggleUserStatus: noop,
      deleteUser: noop,
      createUserByAdmin: noop,
      logSecurityEvent: noop,
    }),
    [
      currentUser,
      usersDb,
      auditLogs,
      strictNavFiltering,
      login,
      register,
      quickSwitchRole,
      logout,
      hasRole,
      hasPermission,
      updateCurrentUserProfile,
      noop,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

/**
 * Declarative Role-Based Conditional UI Rendering Component
 * Since the app is locked to `'student'`, any block restricted to `['teacher', 'admin']`
 * automatically evaluates to false and stays hidden.
 */
export const RoleGuard: React.FC<{
  allowedRoles: AnyRole[];
  fallback?: ReactNode;
  children: ReactNode;
}> = ({ allowedRoles, fallback = null, children }) => {
  const { hasRole } = useAuth();
  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};

export const PermissionGuard: React.FC<{
  capability: PermissionCapability;
  fallback?: ReactNode;
  children: ReactNode;
}> = ({ capability, fallback = null, children }) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(capability)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
