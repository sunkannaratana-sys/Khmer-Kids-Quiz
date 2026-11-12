/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication & Role Management Context
 * - Default open-access 'student' session for kids on /student
 * - Supports direct URL access to /admin and /teacher for administrators
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
  ROLE_DEFAULT_ROUTE,
  ROLE_CAPABILITIES,
  INITIAL_USERS_DB,
  INITIAL_AUDIT_LOGS,
  normalizeRole,
  toRoleSlug,
} from '../rbacTypes';
import { safeLoadFromStorage, playSoundEffect } from '../audioEngine';

const STORAGE_KEYS = {
  USERS: 'khmer_rbac_users_v1',
  STUDENT_PROFILE: 'khmer_student_open_profile_v1',
  AUDIT_LOGS: 'khmer_rbac_audit_v1',
};

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
  currentUser: UserAccount;
  currentRoleSlug: RoleSlug;
  isAuthenticated: boolean;
  usersDb: UserAccount[];
  auditLogs: AuditLogEntry[];
  strictNavFiltering: boolean;
  setStrictNavFiltering: React.Dispatch<React.SetStateAction<boolean>>;

  login: (identifier: string, password: string) => AuthActionResult;
  register: (
    fullName: string,
    email: string,
    password: string,
    role: AnyRole
  ) => AuthActionResult;
  quickSwitchRole: (role: AnyRole) => RoutePath;
  logout: () => void;

  hasRole: (allowedRoles: AnyRole[]) => boolean;
  hasPermission: (capability: PermissionCapability) => boolean;

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
  const [usersDb, setUsersDb] = useState<UserAccount[]>(() =>
    safeLoadFromStorage<UserAccount[]>(
      STORAGE_KEYS.USERS,
      INITIAL_USERS_DB,
      (val): val is UserAccount[] =>
        Array.isArray(val) &&
        val.length > 0 &&
        val.every(
          (item) =>
            typeof item === 'object' &&
            item !== null &&
            'id' in item &&
            'email' in item &&
            'role' in item
        )
    )
  );

  // Default to Student open-access account on /student, or Admin account if visiting /admin directly
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => {
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '/student';
    if (path === '/admin' || path === '/admin-dashboard') {
      return INITIAL_USERS_DB[0]; // Admin account
    }
    if (path === '/teacher' || path === '/teacher-dashboard') {
      return INITIAL_USERS_DB[1]; // Teacher account
    }
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
    return {
      ...loaded,
      role: UserRole.STUDENT,
      status: 'Active',
    };
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    safeLoadFromStorage<AuditLogEntry[]>(
      STORAGE_KEYS.AUDIT_LOGS,
      INITIAL_AUDIT_LOGS,
      (val): val is AuditLogEntry[] =>
        Array.isArray(val) &&
        val.every((item) => typeof item === 'object' && item !== null && 'id' in item)
    )
  );

  const [strictNavFiltering, setStrictNavFiltering] = useState<boolean>(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersDb));
    } catch {
      // Ignore
    }
  }, [usersDb]);

  useEffect(() => {
    if (currentUser.role === UserRole.STUDENT) {
      try {
        window.localStorage.setItem(
          STORAGE_KEYS.STUDENT_PROFILE,
          JSON.stringify(currentUser)
        );
      } catch {
        // Ignore
      }
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    } catch {
      // Ignore
    }
  }, [auditLogs]);

  const logSecurityEvent = useCallback(
    (
      actorEmail: string,
      actorRole: UserRole,
      action: string,
      targetPath: string,
      outcome: 'ALLOWED' | 'DENIED'
    ) => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const entry: AuditLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: timeStr,
        actorEmail,
        actorRole,
        action,
        targetPath,
        outcome,
      };
      setAuditLogs((prev) => [entry, ...prev.slice(0, 34)]);
    },
    []
  );

  const quickSwitchRole = useCallback(
    (role: AnyRole): RoutePath => {
      const canonicalRole = normalizeRole(role);
      const demoUser =
        usersDb.find((u) => u.role === canonicalRole && u.status === 'Active') ||
        INITIAL_USERS_DB.find((u) => u.role === canonicalRole)!;
      setCurrentUser(demoUser);
      playSoundEffect('tap');
      return ROLE_DEFAULT_ROUTE[demoUser.role];
    },
    [usersDb]
  );

  const login = useCallback(
    (identifier: string, password: string): AuthActionResult => {
      const matched = usersDb.find(
        (u) =>
          (u.email.toLowerCase() === identifier.trim().toLowerCase() ||
            u.username.toLowerCase() === identifier.trim().toLowerCase()) &&
          u.password === password.trim()
      );
      if (!matched) {
        return { success: false, error: 'គណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ (Invalid credentials).' };
      }
      setCurrentUser(matched);
      return { success: true, redirectTo: ROLE_DEFAULT_ROUTE[matched.role] };
    },
    [usersDb]
  );

  const register = useCallback((): AuthActionResult => {
    return { success: true, redirectTo: '/student' };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(DEFAULT_STUDENT_ACCOUNT);
  }, []);

  const hasRole = useCallback(
    (allowedRoles: AnyRole[]): boolean => {
      const normalizedAllowed = allowedRoles.map(normalizeRole);
      return normalizedAllowed.includes(currentUser.role);
    },
    [currentUser.role]
  );

  const hasPermission = useCallback(
    (capability: PermissionCapability): boolean => {
      const capabilities = ROLE_CAPABILITIES[currentUser.role] || [];
      return capabilities.includes(capability);
    },
    [currentUser.role]
  );

  const updateCurrentUserProfile = useCallback(
    (
      updates: Partial<
        Pick<UserAccount, 'fullName' | 'starsEarned' | 'quizzesCompleted'>
      >
    ) => {
      setCurrentUser((prev) => {
        const updated = { ...prev, ...updates };
        setUsersDb((db) => db.map((u) => (u.id === updated.id ? updated : u)));
        return updated;
      });
    },
    []
  );

  const changeUserRole = useCallback((userId: string, newRole: AnyRole) => {
    const canonicalRole = normalizeRole(newRole);
    setUsersDb((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: canonicalRole } : u))
    );
  }, []);

  const toggleUserStatus = useCallback((userId: string) => {
    setUsersDb((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'Active' ? 'Suspended' : 'Active' }
          : u
      )
    );
  }, []);

  const deleteUser = useCallback((userId: string) => {
    setUsersDb((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const createUserByAdmin = useCallback(
    (fullName: string, email: string, role: AnyRole) => {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      if (!trimmedEmail || !trimmedName) return;
      const canonicalRole = normalizeRole(role);
      const created: UserAccount = {
        id: `usr-${Date.now()}`,
        username: trimmedEmail.split('@')[0].toLowerCase(),
        email: trimmedEmail,
        password: 'Password123!',
        fullName: trimmedName,
        role: canonicalRole,
        status: 'Active',
        starsEarned: 0,
        quizzesCompleted: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsersDb((prev) => [created, ...prev]);
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      currentRoleSlug: toRoleSlug(currentUser.role),
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
      changeUserRole,
      toggleUserStatus,
      deleteUser,
      createUserByAdmin,
      logSecurityEvent,
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
      changeUserRole,
      toggleUserStatus,
      deleteUser,
      createUserByAdmin,
      logSecurityEvent,
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
