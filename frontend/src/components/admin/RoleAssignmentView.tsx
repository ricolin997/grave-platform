'use client';

import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api/users';
import { rolesApi } from '@/lib/api/roles';
import { Role } from '@/lib/types/role';
import { UserListItem } from '@/lib/types/user';
import { useAuth } from '@/lib/contexts/AuthContext';

interface RoleAssignmentViewProps {
  onAssignComplete?: () => void;
  showOnlyAdmins?: boolean;
}

export default function RoleAssignmentView({ 
  onAssignComplete, 
  showOnlyAdmins = true 
}: RoleAssignmentViewProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userRoleMap, setUserRoleMap] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>({});

  // 載入用戶和角色
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 獲取角色列表
        const rolesData = await rolesApi.getAllRoles();
        setRoles(rolesData);

        // 獲取用戶列表（根據設置過濾）
        const usersData = showOnlyAdmins 
          ? await usersApi.getAdmins({ limit: 50 })
          : await usersApi.getUsers({ limit: 50 });
        
        setUsers(usersData.users);

        // 建立用戶-角色映射
        const userRoles: Record<string, string> = {};
        for (const user of usersData.users) {
          const userDetail = await usersApi.getUser(user.id);
          if (userDetail.roleId) {
            userRoles[user.id] = userDetail.roleId;
          }
        }
        setUserRoleMap(userRoles);
      } catch (err) {
        console.error('載入數據失敗', err);
        setError('無法載入用戶和角色數據');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [showOnlyAdmins]);

  // 處理角色變更
  const handleRoleChange = (userId: string, roleId: string) => {
    setPendingChanges((prev) => ({
      ...prev,
      [userId]: roleId
    }));
  };

  // 保存角色變更
  const saveChanges = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const promises = Object.entries(pendingChanges).map(([userId, roleId]) => {
        return usersApi.assignRole(userId, roleId);
      });

      await Promise.all(promises);

      // 更新本地狀態
      setUserRoleMap((prev) => ({
        ...prev,
        ...pendingChanges
      }));
      setPendingChanges({});
      setSuccess(`成功更新 ${Object.keys(pendingChanges).length} 個用戶的角色`);
      
      // 清除成功消息
      setTimeout(() => {
        setSuccess(null);
        if (onAssignComplete) {
          onAssignComplete();
        }
      }, 3000);
    } catch (err) {
      console.error('保存角色變更失敗', err);
      setError('無法保存角色變更');
    } finally {
      setLoading(false);
    }
  };

  // 檢查用戶是否有變更待保存
  const hasUserChanges = (userId: string) => {
    return pendingChanges[userId] !== undefined;
  };

  // 取消單個用戶的變更
  const cancelUserChange = (userId: string) => {
    setPendingChanges((prev) => {
      const newChanges = { ...prev };
      delete newChanges[userId];
      return newChanges;
    });
  };

  // 獲取角色名稱
  const getRoleName = (roleId: string | undefined) => {
    if (!roleId) return '無角色';
    const role = roles.find((r) => r.id === roleId);
    return role?.name || '未知角色';
  };

  // 獲取用戶類型標籤樣式
  const getUserRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 檢查當前用戶是否可以修改目標用戶的角色
  const canModifyUserRole = (targetUser: UserListItem) => {
    // 創辦人可以修改任何人
    if (currentUser?.email === 'paul@mumu.com') return true;
    
    // 不能修改自己
    if (targetUser.id === currentUser?.id) return false;
    
    // 必須有管理用戶權限
    if (!currentUser?.permissions?.canManageUsers) return false;
    
    return true;
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">用戶角色分配</h2>
        <p className="mt-1 text-sm text-gray-500">
          為系統用戶分配角色來控制其權限範圍。
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6 rounded-md">
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

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 m-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-sm text-gray-500">載入中...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶類型</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">當前角色</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">新角色</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={hasUserChanges(user.id) ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUserRoleBadgeStyle(user.role)}`}>
                        {user.role === 'admin' ? '管理員' : user.role === 'seller' ? '賣家' : '買家'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRoleName(userRoleMap[user.id])}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${!canModifyUserRole(user) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        value={hasUserChanges(user.id) ? pendingChanges[user.id] : userRoleMap[user.id] || ''}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={!canModifyUserRole(user)}
                      >
                        <option value="">-- 無角色 --</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name} - {role.description}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasUserChanges(user.id) && (
                        <button
                          type="button"
                          onClick={() => cancelUserChange(user.id)}
                          className="text-red-600 hover:text-red-900 mr-4"
                        >
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(pendingChanges).length > 0 && (
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-700">
                有 <span className="font-medium">{Object.keys(pendingChanges).length}</span> 個變更待保存
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setPendingChanges({})}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  取消所有
                </button>
                <button
                  type="button"
                  onClick={saveChanges}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  保存變更
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 