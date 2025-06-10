'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { Role } from '@/lib/types/role';
import PermissionGuard from '@/components/admin/PermissionGuard';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

export default function CreateAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    roleId: '',
  });
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roleApiError, setRoleApiError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    async function loadRoles() {
      try {
        setLoadingRoles(true);
        setRoleApiError(null);
        setDebugInfo('正在請求角色列表...');
        
        const rolesData = await rolesApi.getAllRoles();
        setRoles(rolesData);
        
        setDebugInfo(prev => `${prev}\n成功取得 ${rolesData.length} 個角色`);
        
        // 檢查是否有角色數據
        if (rolesData.length === 0) {
          setRoleApiError('沒有找到任何角色，請先創建角色');
          setDebugInfo(prev => `${prev}\n警告：角色列表為空`);
        }
      } catch (err) {
        console.error('獲取角色列表失敗', err);
        setRoleApiError(`角色API錯誤: ${err instanceof Error ? err.message : String(err)}`);
        setDebugInfo(prev => `${prev}\n錯誤：${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoadingRoles(false);
      }
    }

    loadRoles();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.email) return '請輸入電子郵件';
    if (!formData.email.includes('@')) return '請輸入有效的電子郵件地址';
    if (!formData.password) return '請輸入密碼';
    if (formData.password.length < 8) return '密碼長度必須至少為8個字符';
    if (formData.password !== formData.confirmPassword) return '兩次輸入的密碼不一致';
    if (!formData.name) return '請輸入姓名';
    if (!formData.roleId) return '請選擇角色';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await usersApi.createAdmin({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        roleId: formData.roleId,
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/users');
      }, 2000);
    } catch (err: unknown) {
      console.error('創建管理員帳號失敗', err);
      const apiError = err as ApiError;
      setError(apiError.response?.data?.message || apiError.message || '創建管理員帳號失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 手動重新加載角色列表
  const handleReloadRoles = async () => {
    try {
      setDebugInfo('手動重新請求角色列表...');
      setLoadingRoles(true);
      const rolesData = await rolesApi.getAllRoles();
      setRoles(rolesData);
      setDebugInfo(prev => `${prev}\n重新加載成功，取得 ${rolesData.length} 個角色`);
      if (rolesData.length > 0) {
        setRoleApiError(null);
      }
    } catch (err) {
      setDebugInfo(prev => `${prev}\n重新加載錯誤：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingRoles(false);
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
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">創建管理員帳號</h1>
          <p className="mt-1 text-sm text-gray-500">
            為系統添加新的管理員用戶。
          </p>
        </div>

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">管理員帳號創建成功！正在返回用戶列表...</p>
              </div>
            </div>
          </div>
        )}

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

        {roleApiError && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-yellow-800">{roleApiError}</p>
                <div className="mt-2">
                  <button 
                    onClick={handleReloadRoles}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    重新加載角色列表
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                電子郵件地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                autoComplete="email"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                autoComplete="new-password"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">密碼長度必須至少為8個字符。</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                確認密碼 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                autoComplete="new-password"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                autoComplete="name"
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                角色 <span className="text-red-500">*</span>
              </label>
              <select
                name="roleId"
                id="roleId"
                value={formData.roleId}
                onChange={handleInputChange}
                required
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={loadingRoles}
              >
                <option value="">請選擇角色</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name} {role.description ? `- ${role.description}` : ''}
                  </option>
                ))}
              </select>
              {loadingRoles && <p className="mt-1 text-xs text-gray-500">加載角色列表中...</p>}
              {!loadingRoles && roles.length === 0 && (
                <p className="mt-1 text-xs text-red-500">沒有可用的角色，請先創建角色</p>
              )}
            </div>
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
              disabled={loading || roles.length === 0}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '創建中...' : '創建管理員'}
            </button>
          </div>
        </form>

        <div className="mt-4">
          <details className="text-sm text-gray-500">
            <summary className="cursor-pointer">顯示調試信息</summary>
            <div className="mt-2 bg-gray-50 p-3 rounded text-xs">
              <div className="mb-2"><strong>角色數量:</strong> {roles.length}</div>
              <pre className="whitespace-pre-wrap">{debugInfo || '無調試信息'}</pre>
            </div>
          </details>
        </div>
      </div>
    </PermissionGuard>
  );
} 