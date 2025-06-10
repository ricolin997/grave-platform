'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { rolesApi } from '@/lib/api/roles';
import { Role } from '@/lib/types/role';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission } from '@/lib/types/permission';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useAuth } from '@/lib/contexts/AuthContext';

// 角色層級定義
const ROLE_LEVELS = {
  '超級管理員': 1,
  '商品審核員': 2,
  '用戶管理員': 2,
  '客服專員': 3,
  '內容編輯': 3,
  '數據分析師': 3
};

// 審計日誌條目類型
interface AuditLogEntry {
  id: string;
  action: string;
  roleId: string;
  roleName: string;
  performedBy: string;
  timestamp: Date;
}

export default function RolesManagementPage() {
  const { user } = useAuth();
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
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

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

  // 角色層級計算
  const getRoleLevel = (roleName: string): number => {
    return ROLE_LEVELS[roleName as keyof typeof ROLE_LEVELS] || 4; // 默認層級最低為4
  };

  // 檢查當前用戶是否可以管理特定角色
  const canManageRole = (role: Role): boolean => {
    // 創辦人可以管理所有角色
    if (user?.email === 'paul@mumu.com') return true;
    
    // 當前登入用戶不是管理員，則無權限管理任何角色
    if (user?.role !== 'admin') return false;
    
    // 超級管理員有所有權限
    if (user?.permissions?.canManageUsers) return true;
    
    return false;
  };

  // 添加審計日誌
  const addAuditLog = (action: string, role: Role) => {
    const newLog: AuditLogEntry = {
      id: Date.now().toString(),
      action,
      roleId: role.id,
      roleName: role.name,
      performedBy: user?.name || '未知用戶',
      timestamp: new Date()
    };
    
    setAuditLogs(prev => [newLog, ...prev]);
    
    // 實際應用中這裡應該調用API將審計日誌保存到後端
    // TODO: 保存審計日誌到後端
  };

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
      
      // 添加審計日誌
      addAuditLog('創建角色', createdRole);
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
      
      // 添加審計日誌
      addAuditLog('更新角色', updatedRole);
    } catch (err) {
      console.error('更新角色失敗', err);
      setError('更新角色失敗，請稍後再試');
    }
  };

  // 處理刪除角色
  const handleDeleteRole = async (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (!roleToDelete) return;
    
    // 檢查是否有刪除權限
    if (!canManageRole(roleToDelete)) {
      setError(`您沒有權限刪除 ${roleToDelete.name} 角色`);
      return;
    }
    
    if (deleteConfirmation !== roleId) {
      setDeleteConfirmation(roleId);
      return;
    }
    
    try {
      await rolesApi.deleteRole(roleId);
      
      // 添加審計日誌
      addAuditLog('刪除角色', roleToDelete);
      
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
    const targetRole = roles.find(r => r.id === roleId);
    if (!targetRole) return;
    
    // 檢查是否有修改權限
    if (!canManageRole(targetRole)) {
      setError(`您沒有權限修改 ${targetRole.name} 角色的權限`);
      return;
    }
    
    try {
      let updatedRole: Role;
      
      if (hasPermission) {
        // 如果已有權限，則撤銷
        updatedRole = await rolesApi.revokePermission(roleId, permissionCode);
        // 添加審計日誌
        addAuditLog(`撤銷權限 ${permissionCode}`, targetRole);
      } else {
        // 如果沒有權限，則指派
        updatedRole = await rolesApi.assignPermission(roleId, permissionCode);
        // 添加審計日誌
        addAuditLog(`指派權限 ${permissionCode}`, targetRole);
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

  // 顯示角色審計日誌
  const handleViewAuditLogs = (role: Role) => {
    setSelectedRole(role);
    setShowAuditLogs(true);
  };

  // 修改角色列表UI部分，添加審計日誌按鈕
  const renderRolesList = () => {
    return roles.map(role => (
      <div key={role.id} className="bg-white shadow rounded-lg mb-6 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              {role.name}
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                getRoleLevel(role.name) === 1 
                  ? 'bg-purple-100 text-purple-800' 
                  : getRoleLevel(role.name) === 2 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
              }`}>
                {getRoleLevel(role.name) === 1 ? '最高權限' : getRoleLevel(role.name) === 2 ? '中級權限' : '一般權限'}
              </span>
            </h3>
            <p className="mt-1 text-sm text-gray-500">{role.description}</p>
            <p className="mt-1 text-xs text-gray-400">創建時間: {formatDate(role.createdAt)}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleViewAuditLogs(role)}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              審計日誌
            </button>
            {canManageRole(role) && (
              <>
                <button
                  onClick={() => setEditingRole(role)}
                  className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  編輯
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className={`inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded ${
                    deleteConfirmation === role.id
                      ? 'text-white bg-red-600 hover:bg-red-700'
                      : 'text-red-700 bg-red-100 hover:bg-red-200'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleteConfirmation === role.id ? '確認刪除' : '刪除'}
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* 角色的權限列表在此展示 */}
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
    ));
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
          <div className="space-y-6">
            {renderRolesList()}
          </div>
        )}
      </div>

      {/* 顯示角色審計日誌的模態框 */}
      {showAuditLogs && selectedRole && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{selectedRole.name} - 審計日誌</h2>
              <button
                onClick={() => setShowAuditLogs(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {auditLogs.filter(log => log.roleId === selectedRole.id).length > 0 ? (
              <div className="overflow-y-auto max-h-96">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作者</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs
                      .filter(log => log.roleId === selectedRole.id)
                      .map(log => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.performedBy}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(log.timestamp)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">沒有審計日誌記錄</p>
            )}
          </div>
        </div>
      )}
    </PermissionGuard>
  );
} 