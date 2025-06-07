'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: 'canReviewProducts' | 'canManageUsers' | 'canViewStatistics' | 'canManageSettings';
  fallback?: ReactNode;
}

/**
 * 權限守衛組件，用於基於管理員權限控制UI元素的顯示
 */
export default function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallback = null 
}: PermissionGuardProps) {
  const { user } = useAuth();

  // 檢查用戶是否為管理員且具有所需權限
  const hasPermission = 
    user?.role === 'admin' && 
    user?.permissions && 
    user.permissions[requiredPermission];

  // 如果用戶有權限，顯示子元素，否則顯示替代內容
  return hasPermission ? <>{children}</> : <>{fallback}</>;
} 