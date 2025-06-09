import axiosInstance from './axios';
import { Role, CreateRoleData, UpdateRoleData } from '../types/role';

export const rolesApi = {
  // 獲取所有角色
  getAllRoles: async (): Promise<Role[]> => {
    const response = await axiosInstance.get<Role[]>('/roles');
    return response.data;
  },

  // 獲取單個角色
  getRole: async (id: string): Promise<Role> => {
    const response = await axiosInstance.get<Role>(`/roles/${id}`);
    return response.data;
  },

  // 創建角色
  createRole: async (data: CreateRoleData): Promise<Role> => {
    const response = await axiosInstance.post<Role>('/roles', data);
    return response.data;
  },

  // 更新角色
  updateRole: async (id: string, data: UpdateRoleData): Promise<Role> => {
    const response = await axiosInstance.put<Role>(`/roles/${id}`, data);
    return response.data;
  },

  // 刪除角色
  deleteRole: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/roles/${id}`);
  },

  // 指派權限到角色
  assignPermission: async (roleId: string, permissionCode: string): Promise<Role> => {
    const response = await axiosInstance.post<Role>(`/roles/${roleId}/permissions/${permissionCode}`, {});
    return response.data;
  },

  // 從角色撤銷權限
  revokePermission: async (roleId: string, permissionCode: string): Promise<Role> => {
    const response = await axiosInstance.delete<Role>(`/roles/${roleId}/permissions/${permissionCode}`);
    return response.data;
  },
}; 