'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api/users';
import { UserListItem } from '@/lib/types/user';
import PermissionGuard from '@/components/admin/PermissionGuard';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<UserListItem[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    canReviewProducts: false,
    canManageUsers: false,
    canViewStatistics: false,
    canManageSettings: false,
  });
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 載入管理員列表
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await usersApi.getUsers({ role: 'admin' });
        setAdmins(response.users);
        
        if (response.users.length > 0 && !selectedAdmin) {
          setSelectedAdmin(response.users[0].id);
        }
      } catch (err) {
        console.error('獲取管理員列表失敗', err);
        setError('無法獲取管理員列表，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, [selectedAdmin]);

  // 載入選中管理員的權限
  useEffect(() => {
    const fetchAdminPermissions = async () => {
      if (!selectedAdmin) return;
      
      try {
        setLoading(true);
        const user = await usersApi.getUser(selectedAdmin);
        
        if (user.permissions) {
          setPermissions({
            canReviewProducts: user.permissions.canReviewProducts,
            canManageUsers: user.permissions.canManageUsers,
            canViewStatistics: user.permissions.canViewStatistics,
            canManageSettings: user.permissions.canManageSettings,
          });
        }
      } catch (err) {
        console.error('獲取管理員權限失敗', err);
        setError('無法獲取管理員權限，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminPermissions();
  }, [selectedAdmin]);

  // 處理權限變更
  const handlePermissionChange = (permission: keyof typeof permissions) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: !prev[permission]
    }));
  };

  // 保存權限設置
  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      
      await usersApi.updatePermissions(selectedAdmin, permissions);
      
      setSuccessMessage('權限設置已保存');
      
      // 5秒後清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('保存權限設置失敗', err);
      setError('無法保存權限設置，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 處理新增管理員表單變更
  const handleNewAdminFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAdminForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 驗證新增管理員表單
  const validateNewAdminForm = () => {
    if (!newAdminForm.email.trim()) {
      setFormError('請輸入電子郵箱');
      return false;
    }
    
    if (!newAdminForm.name.trim()) {
      setFormError('請輸入姓名');
      return false;
    }
    
    if (!newAdminForm.password.trim()) {
      setFormError('請輸入密碼');
      return false;
    }
    
    if (newAdminForm.password.length < 8) {
      setFormError('密碼長度必須至少為8個字符');
      return false;
    }
    
    if (newAdminForm.password !== newAdminForm.confirmPassword) {
      setFormError('兩次輸入的密碼不一致');
      return false;
    }
    
    return true;
  };

  // 創建新管理員
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormError(null);
    
    if (!validateNewAdminForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      const data = {
        email: newAdminForm.email,
        password: newAdminForm.password,
        name: newAdminForm.name,
        permissions: {
          canReviewProducts: true,
          canManageUsers: false,
          canViewStatistics: true,
          canManageSettings: false,
        },
      };
      
      await usersApi.createAdmin(data);
      
      // 重置表單
      setNewAdminForm({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
      });
      
      // 切換到用戶列表
      setIsAddingAdmin(false);
      
      // 重新載入管理員列表
      const response = await usersApi.getUsers({ role: 'admin' });
      setAdmins(response.users);
      
      setSuccessMessage('管理員創建成功');
      
      // 5秒後清除成功消息
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error('創建管理員失敗', err);
      setFormError('創建管理員失敗，可能是郵箱已被使用');
    } finally {
      setLoading(false);
    }
  };

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
            管理系統設置和管理員權限。
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isAddingAdmin ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">新增管理員</h2>
                <button
                  onClick={() => setIsAddingAdmin(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateAdmin}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      電子郵箱
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={newAdminForm.email}
                      onChange={handleNewAdminFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      姓名
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={newAdminForm.name}
                      onChange={handleNewAdminFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      密碼
                    </label>
                    <input
                      type="password"
                      name="password"
                      id="password"
                      value={newAdminForm.password}
                      onChange={handleNewAdminFormChange}
                      required
                      minLength={8}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      確認密碼
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      value={newAdminForm.confirmPassword}
                      onChange={handleNewAdminFormChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                
                {formError && (
                  <div className="mt-4 text-sm text-red-600">
                    {formError}
                  </div>
                )}
                
                <div className="mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? '創建中...' : '創建管理員'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">管理員列表</h2>
              
              {admins.length === 0 ? (
                <p className="text-gray-500">暫無管理員</p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {admins.map(admin => (
                    <button
                      key={admin.id}
                      onClick={() => setSelectedAdmin(admin.id)}
                      className={`text-left p-3 rounded-md ${
                        selectedAdmin === admin.id ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-indigo-200 flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {admin.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => setIsAddingAdmin(true)}
                className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                添加管理員
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">權限設置</h2>
            
            {!selectedAdmin ? (
              <p className="text-gray-500">請先選擇一個管理員</p>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="canReviewProducts"
                      type="checkbox"
                      checked={permissions.canReviewProducts}
                      onChange={() => handlePermissionChange('canReviewProducts')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canReviewProducts" className="ml-3 block text-sm font-medium text-gray-700">
                      審核商品
                      <p className="text-xs text-gray-500">允許審核、批准或拒絕賣家提交的商品</p>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="canManageUsers"
                      type="checkbox"
                      checked={permissions.canManageUsers}
                      onChange={() => handlePermissionChange('canManageUsers')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canManageUsers" className="ml-3 block text-sm font-medium text-gray-700">
                      管理用戶
                      <p className="text-xs text-gray-500">允許查看、編輯用戶信息，以及停用/啟用用戶帳號</p>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="canViewStatistics"
                      type="checkbox"
                      checked={permissions.canViewStatistics}
                      onChange={() => handlePermissionChange('canViewStatistics')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canViewStatistics" className="ml-3 block text-sm font-medium text-gray-700">
                      查看統計數據
                      <p className="text-xs text-gray-500">允許查看平台統計數據和報表</p>
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="canManageSettings"
                      type="checkbox"
                      checked={permissions.canManageSettings}
                      onChange={() => handlePermissionChange('canManageSettings')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="canManageSettings" className="ml-3 block text-sm font-medium text-gray-700">
                      管理設置
                      <p className="text-xs text-gray-500">允許管理系統設置和管理員權限</p>
                    </label>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={handleSavePermissions}
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {loading ? '儲存中...' : '儲存權限設置'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
} 