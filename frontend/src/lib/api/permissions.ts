import axiosInstance from './axios';
import { Permission, CreatePermissionData, UpdatePermissionData } from '../types/permission';

export const permissionsApi = {
  // 獲取所有權限
  getAllPermissions: async (): Promise<Permission[]> => {
    const response = await axiosInstance.get<Permission[]>('/permissions');
    return response.data;
  },

  // 獲取單個權限
  getPermission: async (id: string): Promise<Permission> => {
    const response = await axiosInstance.get<Permission>(`/permissions/${id}`);
    return response.data;
  },

  // 獲取指定代碼的權限
  getPermissionByCode: async (code: string): Promise<Permission> => {
    const response = await axiosInstance.get<Permission>(`/permissions/code/${code}`);
    return response.data;
  },

  // 創建權限
  createPermission: async (data: CreatePermissionData): Promise<Permission> => {
    const response = await axiosInstance.post<Permission>('/permissions', data);
    return response.data;
  },

  // 更新權限
  updatePermission: async (id: string, data: UpdatePermissionData): Promise<Permission> => {
    const response = await axiosInstance.put<Permission>(`/permissions/${id}`, data);
    return response.data;
  },

  // 刪除權限
  deletePermission: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/permissions/${id}`);
  },
}; 