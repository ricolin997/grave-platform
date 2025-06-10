'use client';

import PermissionGuard from '@/components/admin/PermissionGuard';

export default function AdminSettingsPage() {
  return (
    <PermissionGuard requiredPermission="canManageSettings" fallback={
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
              <p>您沒有管理系統設置的權限。請聯繫系統管理員獲取適當的權限。</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">系統設置</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系統基本設置。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">系統資訊</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">系統版本</p>
                <p className="text-base text-gray-900">1.0.0</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">最後更新時間</p>
                <p className="text-base text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">系統狀態</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">狀態</p>
                <div className="flex items-center mt-1">
                  <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
                  <p className="text-base text-gray-900">正常運行中</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">伺服器時間</p>
                <p className="text-base text-gray-900">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
} 