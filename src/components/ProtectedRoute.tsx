/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Student-Only ProtectedRoute Guard
 * Automatically redirects any unauthorized or non-student route (/teacher, /admin, /login)
 * back to the main Student Quiz Dashboard (/student).
 */

import React, { useEffect, ReactNode } from 'react';
import { AnyRole, RoutePath, normalizeRole } from '../rbacTypes';
import { useAuth } from '../context/AuthContext';

export interface ProtectedRouteProps {
  /** Path being checked */
  routePath: Exclude<RoutePath, '/login'>;
  /** Roles allowed for this route */
  allowedRoles: AnyRole[];
  /** Navigation callback to redirect back to '/student' */
  onNavigate: (path: RoutePath) => void;
  /** Route content */
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  routePath,
  allowedRoles,
  onNavigate,
  children,
}) => {
  const { hasRole } = useAuth();
  const normalizedRoles = allowedRoles.map(normalizeRole);
  const isStudentAllowed =
    hasRole(normalizedRoles) &&
    routePath !== '/admin' &&
    routePath !== '/teacher';

  // Immediately redirect any attempt to access /teacher or /admin back to /student
  useEffect(() => {
    if (!isStudentAllowed) {
      try {
        window.history.replaceState({}, '', '/student');
      } catch {
        // Ignore in sandboxed iframe contexts
      }
      onNavigate('/student');
    }
  }, [isStudentAllowed, onNavigate]);

  if (!isStudentAllowed) {
    return null;
  }

  return <>{children}</>;
};
