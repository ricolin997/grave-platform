'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usersApi } from '@/lib/api/users';
import { UserListItem, UserRole } from '@/lib/types/user';
import PermissionGuard from '@/components/admin/PermissionGuard';
import { useRouter } from 'next/navigation';
import RoleAssignmentView from '@/components/admin/RoleAssignmentView';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const router = useRouter();
  const [activeView, setActiveView] = useState<'list' | 'roles'>('list');

  // 載入用戶列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const query = {
          role: roleFilter as UserRole | undefined,
          status: statusFilter as 'active' | 'suspended' | 'deleted' | undefined,
          search: searchQuery || undefined,
          page: currentPage,
          limit: 10,
          sortBy,
          sortOrder,
        };
        
        const response = await usersApi.getUsers(query);
        
        setUsers(response.users);
        setTotalPages(response.totalPages);
        setTotalUsers(response.total);
      } catch (err) {
        console.error('獲取用戶列表失敗', err);
        setError('無法獲取用戶列表，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, roleFilter, statusFilter, searchQuery, sortBy, sortOrder]);

  // 處理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // 重置頁碼
  };

  // 處理排序
  const handleSort = (field: string) => {
    if (sortBy === field) {
      // 如果已經按該字段排序，則切換排序順序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 否則，按新字段排序，默認降序
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // 重置頁碼
  };

  // 格式化時間
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // 停用用戶
  const handleSuspendUser = async (userId: string) => {
    try {
      const reason = prompt('請輸入停用用戶的原因：');
      if (reason === null) return; // 用戶取消
      
      if (!reason.trim()) {
        alert('請提供停用原因');
        return;
      }
      
      await usersApi.suspendUser(userId, reason);
      
      // 更新用戶列表
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: 'suspended' } 
            : user
        )
      );
      
      alert('用戶已停用');
    } catch (err) {
      console.error('停用用戶失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  // 啟用用戶
  const handleActivateUser = async (userId: string) => {
    try {
      if (!confirm('確定要啟用此用戶嗎？')) return;
      
      await usersApi.activateUser(userId);
      
      // 更新用戶列表
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: 'active' } 
            : user
        )
      );
      
      alert('用戶已啟用');
    } catch (err) {
      console.error('啟用用戶失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  // 刪除用戶
  const handleDeleteUser = async (userId: string) => {
    try {
      if (!confirm('確定要刪除此用戶嗎？此操作不可逆！')) return;
      
      await usersApi.deleteUser(userId);
      
      // 更新用戶列表
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      setTotalUsers(prev => prev - 1);
      
      alert('用戶已刪除');
    } catch (err) {
      console.error('刪除用戶失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  // 分配角色
  const handleAssignRole = (userId: string) => {
    router.push(`/admin/users/assign-role?id=${userId}`);
  };

  // 獲取用戶角色標籤樣式
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'buyer':
        return 'bg-blue-100 text-blue-800';
      case 'seller':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取用戶狀態標籤樣式
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'deleted':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 翻譯角色名稱
  const translateRole = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      buyer: '買家',
      seller: '賣家',
      admin: '管理員'
    };
    return roleMap[role] || role;
  };

  // 翻譯狀態名稱
  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '活躍',
      suspended: '已停用',
      deleted: '已刪除'
    };
    return statusMap[status] || status;
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
            <h1 className="text-2xl font-bold text-gray-900">用戶管理</h1>
            <p className="mt-1 text-sm text-gray-500">
              管理系統用戶，包括買家、賣家和管理員。
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-2">
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 font-medium text-sm rounded-md ${
                activeView === 'list'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              用戶列表
            </button>
            
            <button
              onClick={() => setActiveView('roles')}
              className={`px-4 py-2 font-medium text-sm rounded-md ${
                activeView === 'roles'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              角色分配
            </button>
            
            <Link
              href="/admin/users/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加管理員
            </Link>
          </div>
        </div>

        {activeView === 'list' ? (
          <>
            {/* 過濾和搜索 */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      角色
                    </label>
                    <select
                      id="role-filter"
                      value={roleFilter}
                      onChange={(e) => {
                        setRoleFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">所有角色</option>
                      <option value="buyer">買家</option>
                      <option value="seller">賣家</option>
                      <option value="admin">管理員</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                      狀態
                    </label>
                    <select
                      id="status-filter"
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">所有狀態</option>
                      <option value="active">活躍</option>
                      <option value="suspended">已停用</option>
                      <option value="deleted">已刪除</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      搜索
                    </label>
                    <form onSubmit={handleSearch} className="flex">
                      <input
                        type="text"
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索用戶名稱或郵箱"
                        className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
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

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">沒有找到用戶</h3>
                <p className="text-gray-500">嘗試使用不同的過濾條件或清除搜索。</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            <span>用戶名稱</span>
                            {sortBy === 'name' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center">
                            <span>電子郵箱</span>
                            {sortBy === 'email' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          角色
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          狀態
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            <span>註冊日期</span>
                            {sortBy === 'createdAt' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(-6)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeStyle(user.role)}`}>
                              {translateRole(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(user.status)}`}>
                              {translateStatus(user.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(user.createdAt.toString())}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Link
                                href={`/admin/users/${user.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                詳情
                              </Link>
                              
                              {user.status === 'active' ? (
                                <button
                                  onClick={() => handleSuspendUser(user.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  停用
                                </button>
                              ) : user.status === 'suspended' ? (
                                <button
                                  onClick={() => handleActivateUser(user.id)}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  啟用
                                </button>
                              ) : null}
                              
                              {user.role === 'admin' && (
                                <button
                                  onClick={() => handleAssignRole(user.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  分配角色
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                刪除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分頁 */}
                {totalPages > 1 && (
                  <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          顯示 <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> 到{' '}
                          <span className="font-medium">{Math.min(currentPage * 10, totalUsers)}</span> 項，共{' '}
                          <span className="font-medium">{totalUsers}</span> 項結果
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">上一頁</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>

                          {/* 頁碼按鈕 */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === pageNum
                                    ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                              currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <span className="sr-only">下一頁</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <RoleAssignmentView 
            onAssignComplete={() => {
              // 當角色分配完成後，刷新用戶列表
              setActiveView('list');
            }}
            showOnlyAdmins={false}
          />
        )}
      </div>
    </PermissionGuard>
  );
} 