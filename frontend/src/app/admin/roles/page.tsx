'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { rolesApi } from '@/lib/api/roles';
import { Role } from '@/lib/types/role';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission } from '@/lib/types/permission';
import PermissionGuard from '@/components/admin/PermissionGuard';

export default function RolesManagementPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  });
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // 載入角色列表
  useEffect(() => {
    const fetchRolesAndPermissions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [rolesData, permissionsData] = await Promise.all([
          rolesApi.getAllRoles(),
          permissionsApi.getAllPermissions()
        ]);
        
        setRoles(rolesData);
        setPermissions(permissionsData);
      } catch (err) {
        console.error('獲取角色列表失敗', err);
        setError('無法獲取角色列表，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchRolesAndPermissions();
  }, []);

  // 處理創建角色
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newRole.name.trim()) {
      setError('角色名稱不能為空');
      return;
    }
    
    try {
      const createdRole = await rolesApi.createRole({
        name: newRole.name,
        description: newRole.description
      });
      
      setRoles([...roles, createdRole]);
      setNewRole({ name: '', description: '' });
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      console.error('創建角色失敗', err);
      setError('創建角色失敗，請稍後再試');
    }
  };

  // 處理編輯角色
  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingRole || !editingRole.name.trim()) {
      setError('角色名稱不能為空');
      return;
    }
    
    try {
      const updatedRole = await rolesApi.updateRole(editingRole.id, {
        name: editingRole.name,
        description: editingRole.description
      });
      
      setRoles(roles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      ));
      setEditingRole(null);
      setError(null);
    } catch (err) {
      console.error('更新角色失敗', err);
      setError('更新角色失敗，請稍後再試');
    }
  };

  // 處理刪除角色
  const handleDeleteRole = async (roleId: string) => {
    if (deleteConfirmation !== roleId) {
      setDeleteConfirmation(roleId);
      return;
    }
    
    try {
      await rolesApi.deleteRole(roleId);
      
      setRoles(roles.filter(role => role.id !== roleId));
      setDeleteConfirmation(null);
      setError(null);
    } catch (err) {
      console.error('刪除角色失敗', err);
      setError('刪除角色失敗，請稍後再試');
    }
  };

  // 處理更改權限狀態
  const handleTogglePermission = async (roleId: string, permissionCode: string, hasPermission: boolean) => {
    try {
      let updatedRole: Role;
      
      if (hasPermission) {
        // 如果已有權限，則撤銷
        updatedRole = await rolesApi.revokePermission(roleId, permissionCode);
      } else {
        // 如果沒有權限，則指派
        updatedRole = await rolesApi.assignPermission(roleId, permissionCode);
      }
      
      setRoles(roles.map(role => 
        role.id === updatedRole.id ? updatedRole : role
      ));
    } catch (err) {
      console.error('更改權限失敗', err);
      setError('更改權限失敗，請稍後再試');
    }
  };

  // 獲取資源類型對應的權限列表
  const getPermissionsByResource = () => {
    const resourceMap: Record<string, Permission[]> = {};
    
    permissions.forEach(permission => {
      if (!resourceMap[permission.resource]) {
        resourceMap[permission.resource] = [];
      }
      resourceMap[permission.resource].push(permission);
    });
    
    return resourceMap;
  };

  const resourcePermissions = getPermissionsByResource();

  // 檢查角色是否有某個權限
  const hasPermission = (role: Role, permissionCode: string) => {
    return role.permissions.includes(permissionCode);
  };

  // 格式化時間
  const formatDate = (dateString?: Date) => {
    if (!dateString) return '無日期';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">角色管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理系統角色及其相應的權限。
            </p>
          </div>

          <div className="mt-4 sm:mt-0">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              創建角色
            </button>
          </div>
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

        {/* 創建角色表單 */}
        {showCreateForm && (
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">創建新角色</h2>
            <form onSubmit={handleCreateRole}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    角色名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={newRole.name}
                    onChange={e => setNewRole({...newRole, name: e.target.value})}
                    required
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    角色描述
                  </label>
                  <input
                    type="text"
                    name="description"
                    id="description"
                    value={newRole.description}
                    onChange={e => setNewRole({...newRole, description: e.target.value})}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  創建角色
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 編輯角色表單 */}
        {editingRole && (
          <div className="bg-white shadow rounded-lg mb-6 p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">編輯角色</h2>
            <form onSubmit={handleUpdateRole}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                    角色名稱 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="edit-name"
                    value={editingRole.name}
                    onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                    required
                    disabled={editingRole.isBuiltIn}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                  />
                  {editingRole.isBuiltIn && <p className="mt-1 text-xs text-gray-500">內建角色名稱不可更改</p>}
                </div>
                
                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                    角色描述
                  </label>
                  <input
                    type="text"
                    name="description"
                    id="edit-description"
                    value={editingRole.description}
                    onChange={e => setEditingRole({...editingRole, description: e.target.value})}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  保存更改
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 角色列表 */}
        {loading ? (
          <div className="text-center py-10">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-sm text-gray-500">載入中...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">目前還沒有角色。點擊「創建角色」按鈕來添加第一個角色。</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {roles.map((role) => (
              <div key={role.id} className="border-b border-gray-200 last:border-b-0">
                <div className="p-4 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                      <p className="text-sm text-gray-500">{role.description || '無描述'}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        ID: {role.id} | 創建時間: {formatDate(role.createdAt)}
                      </p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex space-x-2">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        編輯
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        disabled={role.isBuiltIn}
                        className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium ${role.isBuiltIn ? 'border-gray-200 text-gray-300 cursor-not-allowed' : deleteConfirmation === role.id ? 'border-red-600 text-white bg-red-600 hover:bg-red-700' : 'border-red-300 text-red-700 bg-white hover:bg-red-50'} focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deleteConfirmation === role.id ? '確認刪除' : '刪除'}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 權限列表 */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">權限設置</h4>
                  
                  {Object.entries(resourcePermissions).map(([resource, resourcePerms]) => (
                    <div key={resource} className="mb-4 last:mb-0">
                      <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">{resource}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {resourcePerms.map(permission => (
                          <div 
                            key={permission.code} 
                            className={`flex items-center p-2 rounded-md border ${hasPermission(role, permission.code) ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.description || '無描述'}</p>
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleTogglePermission(role.id, permission.code, hasPermission(role, permission.code))}
                                disabled={role.isBuiltIn && permission.code === 'admin.all'}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${hasPermission(role, permission.code) ? 'bg-indigo-600' : 'bg-gray-200'} ${role.isBuiltIn && permission.code === 'admin.all' ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${hasPermission(role, permission.code) ? 'translate-x-5' : 'translate-x-0'}`}
                                ></span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PermissionGuard>
  );
} 