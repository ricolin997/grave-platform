'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { User } from '@/lib/types/user';
import { Role } from '@/lib/types/role';
import PermissionGuard from '@/components/admin/PermissionGuard';
import Link from 'next/link';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export default function AssignRolePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadUserAndRoles() {
      if (!userId) {
        setError('用戶ID不能為空');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const [userData, rolesData] = await Promise.all([
          usersApi.getUser(userId),
          rolesApi.getAllRoles()
        ]);
        
        setUser(userData);
        setRoles(rolesData);
        
        // 如果用戶已有角色，預設選擇該角色
        if (userData.roleId) {
          setSelectedRoleId(userData.roleId);
        }
        
      } catch (err) {
        console.error('載入用戶和角色數據失敗', err);
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || apiError.message || '載入數據失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    }

    loadUserAndRoles();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId) {
      setError('用戶ID不能為空');
      return;
    }

    if (!selectedRoleId) {
      setError('請選擇角色');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await usersApi.assignRole(userId, selectedRoleId);
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);

    } catch (err) {
      console.error('分配角色失敗', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || '分配角色失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PermissionGuard requiredPermission="canManageUsers" fallback={
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
              <p>您沒有管理用戶的權限。請聯繫系統管理員獲取適當的權限。</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">分配用戶角色</h1>
            <p className="mt-1 text-sm text-gray-500">
              為用戶分配系統角色來控制其權限。
            </p>
          </div>
          <Link 
            href="/admin/users" 
            className="text-indigo-600 hover:text-indigo-800"
          >
            返回用戶列表
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">角色分配成功！正在返回用戶列表...</p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">載入中...</p>
          </div>
        ) : !user ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-red-500">找不到用戶或載入失敗</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              返回用戶列表
            </button>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* 用戶信息 */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 mb-4">用戶信息</h2>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">電子郵件</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">姓名</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.profile.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">用戶類型</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : user.role === 'seller' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? '管理員' : user.role === 'seller' ? '賣家' : '買家'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">狀態</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.metadata.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : user.metadata.status === 'suspended' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.metadata.status === 'active' ? '活躍' : user.metadata.status === 'suspended' ? '已停用' : '已刪除'}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">當前角色</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.roleId && roles.find(r => r.id === user.roleId) 
                      ? roles.find(r => r.id === user.roleId)?.name 
                      : '無角色'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 角色分配表單 */}
            <form onSubmit={handleSubmit} className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">選擇角色</h2>
              
              <div>
                <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                  角色 <span className="text-red-500">*</span>
                </label>
                <select
                  id="roleId"
                  name="roleId"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  required
                >
                  <option value="">請選擇角色</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>

                {selectedRoleId && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">所選角色權限：</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {roles.find(r => r.id === selectedRoleId)?.permissions.map(perm => (
                        <li key={perm} className="text-sm text-gray-600">{perm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/users')}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRoleId}
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '分配角色'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
} 