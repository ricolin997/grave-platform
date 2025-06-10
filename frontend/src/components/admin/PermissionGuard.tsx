'use client';

import { ReactNode, useMemo } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import Link from 'next/link';

// 定義權限類型
export type PermissionKey = 'canReviewProducts' | 'canManageUsers' | 'canViewStatistics' | 'canManageSettings';

// 定義權限顯示名稱和說明
const PERMISSION_DETAILS: Record<PermissionKey, { name: string, description: string }> = {
  canReviewProducts: { 
    name: '審核商品', 
    description: '允許審核賣家提交的商品，批准或拒絕商品上架'
  },
  canManageUsers: { 
    name: '管理用戶', 
    description: '允許管理系統用戶，包括創建管理員和分配角色權限'
  },
  canViewStatistics: { 
    name: '查看統計', 
    description: '允許查看系統統計數據和報表'
  },
  canManageSettings: { 
    name: '管理設置', 
    description: '允許修改系統設置和配置'
  }
};

interface PermissionGuardProps {
  children: ReactNode;
  requiredPermission: PermissionKey | PermissionKey[];
  fallback?: ReactNode;
}

/**
 * 權限守衛組件，用於基於管理員權限控制UI元素的顯示
 * 支持單一權限或多權限檢查（多權限時需全部滿足）
 */
export default function PermissionGuard({ 
  children, 
  requiredPermission, 
  fallback = null 
}: PermissionGuardProps) {
  const { user } = useAuth();

  // 檢查是否有訪問權限
  const permissionCheck = useMemo(() => {
    // 創辦人帳號特例
    if (user?.email === 'paul@mumu.com') {
      return { hasPermission: true, missingPermissions: [] as PermissionKey[] };
    }
    
    // 檢查用戶是否為管理員
    if (user?.role !== 'admin' || !user?.permissions) {
      return { 
        hasPermission: false, 
        missingPermissions: Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission]
      };
    }
    
    // 多權限檢查（陣列形式）
    if (Array.isArray(requiredPermission)) {
      const missing = requiredPermission.filter(perm => !user.permissions?.[perm]);
      return { 
        hasPermission: missing.length === 0,
        missingPermissions: missing
      };
    }
    
    // 單一權限檢查
    const hasPermission = !!user.permissions[requiredPermission];
    return { 
      hasPermission,
      missingPermissions: hasPermission ? [] : [requiredPermission]
    };
  }, [user, requiredPermission]);

  // 如果用戶有權限，顯示子元素
  if (permissionCheck.hasPermission) {
    return <>{children}</>;
  }

  // 如果提供了自定義的 fallback，就使用它
  if (fallback) {
    return <>{fallback}</>;
  }

  // 默認的權限不足顯示
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">權限不足</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>您缺少進行此操作所需的權限：</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {permissionCheck.missingPermissions.map(perm => (
                <li key={perm}>
                  <strong>{PERMISSION_DETAILS[perm].name}</strong> - {PERMISSION_DETAILS[perm].description}
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <p>請聯繫系統管理員獲取適當的權限，或返回 <Link href="/admin" className="font-medium underline">管理面板首頁</Link>。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 