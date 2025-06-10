'use client';

import { useState, useEffect } from 'react';
import { rolesApi } from '@/lib/api/roles';
import { Role } from '@/lib/types/role';
import { permissionsApi } from '@/lib/api/permissions';
import { Permission } from '@/lib/types/permission';

export default function RoleDebugComponent() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // 請求角色列表
        try {
          const rolesData = await rolesApi.getAllRoles();
          setRoles(rolesData);
          setApiResponse(prev => prev + `\n角色API成功: 接收到 ${rolesData.length} 個角色`);
        } catch (err) {
          console.error('獲取角色列表失敗', err);
          setError('角色API錯誤: ' + (err instanceof Error ? err.message : String(err)));
          setApiResponse(prev => prev + '\n角色API錯誤: ' + (err instanceof Error ? err.message : String(err)));
        }
        
        // 請求權限列表
        try {
          const permissionsData = await permissionsApi.getAllPermissions();
          setPermissions(permissionsData);
          setApiResponse(prev => prev + `\n權限API成功: 接收到 ${permissionsData.length} 個權限`);
        } catch (err) {
          console.error('獲取權限列表失敗', err);
          setApiResponse(prev => prev + '\n權限API錯誤: ' + (err instanceof Error ? err.message : String(err)));
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleTestCreate = async () => {
    try {
      const response = await rolesApi.createRole({
        name: '測試角色-' + new Date().getTime(),
        description: '這是一個測試創建的角色'
      });
      setApiResponse(prev => prev + `\n創建角色成功: ${JSON.stringify(response)}`);
      
      // 重新載入角色列表
      const rolesData = await rolesApi.getAllRoles();
      setRoles(rolesData);
    } catch (err) {
      setApiResponse(prev => prev + '\n創建角色錯誤: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">角色系統診斷工具</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">角色列表 ({roles.length})</h2>
          {loading ? (
            <p>載入中...</p>
          ) : roles.length > 0 ? (
            <div className="space-y-2">
              {roles.map(role => (
                <div key={role.id} className="border p-3 rounded">
                  <div className="font-medium">{role.name}</div>
                  <div className="text-sm text-gray-500">{role.description || '無描述'}</div>
                  <div className="text-xs mt-1">
                    權限: {role.permissions.length > 0 ? role.permissions.join(', ') : '無權限'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">沒有找到角色</p>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">權限列表 ({permissions.length})</h2>
          {loading ? (
            <p>載入中...</p>
          ) : permissions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {permissions.map(permission => (
                <div key={permission.id} className="border p-2 rounded">
                  <div className="font-medium">{permission.name}</div>
                  <div className="text-xs text-gray-500">Code: {permission.code}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600">沒有找到權限</p>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={handleTestCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          測試創建角色
        </button>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold mb-2">API 響應日誌</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto max-h-60 overflow-y-auto whitespace-pre-wrap">
          {apiResponse || '沒有日誌'}
        </pre>
      </div>
    </div>
  );
} 