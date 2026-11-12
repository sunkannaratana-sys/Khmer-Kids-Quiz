/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ProtectedRoute Guard
 */

import React, { ReactNode } from 'react';
import { AnyRole, RoutePath } from '../rbacTypes';

export interface ProtectedRouteProps {
  routePath: Exclude<RoutePath, '/login'>;
  allowedRoles: AnyRole[];
  onNavigate: (path: RoutePath) => void;
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};
