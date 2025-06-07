import axiosInstance from './axios';
import {
  User,
  UserQuery,
  UsersResponse,
  UpdateUserData,
} from '../types/user';

export const usersApi = {
  // 獲取用戶列表
  getUsers: async (query: UserQuery = {}): Promise<UsersResponse> => {
    const response = await axiosInstance.get<UsersResponse>('/admin/users', {
      params: query,
    });
    return response.data;
  },

  // 獲取單個用戶詳情
  getUser: async (id: string): Promise<User> => {
    const response = await axiosInstance.get<User>(`/admin/users/${id}`);
    return response.data;
  },

  // 更新用戶信息
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await axiosInstance.patch<User>(`/admin/users/${id}`, data);
    return response.data;
  },

  // 停用用戶帳號
  suspendUser: async (id: string, reason: string): Promise<User> => {
    const response = await axiosInstance.post<User>(`/admin/users/${id}/suspend`, { reason });
    return response.data;
  },

  // 啟用用戶帳號
  activateUser: async (id: string): Promise<User> => {
    const response = await axiosInstance.post<User>(`/admin/users/${id}/activate`, {});
    return response.data;
  },

  // 刪除用戶帳號
  deleteUser: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/admin/users/${id}`);
  },

  // 創建管理員帳號
  createAdmin: async (data: {
    email: string;
    password: string;
    name: string;
    permissions: {
      canReviewProducts: boolean;
      canManageUsers: boolean;
      canViewStatistics: boolean;
      canManageSettings: boolean;
    };
  }): Promise<User> => {
    const response = await axiosInstance.post<User>('/admin/users/create-admin', data);
    return response.data;
  },

  // 更新管理員權限
  updatePermissions: async (
    id: string,
    permissions: {
      canReviewProducts: boolean;
      canManageUsers: boolean;
      canViewStatistics: boolean;
      canManageSettings: boolean;
    }
  ): Promise<User> => {
    const response = await axiosInstance.patch<User>(`/admin/users/${id}/permissions`, { permissions });
    return response.data;
  },

  // 獲取用戶統計信息
  getUsersStatistics: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    buyerCount: number;
    sellerCount: number;
    adminCount: number;
    userGrowthData: { date: string; count: number }[];
  }> => {
    const response = await axiosInstance.get<{
      totalUsers: number;
      activeUsers: number;
      newUsersToday: number;
      buyerCount: number;
      sellerCount: number;
      adminCount: number;
      userGrowthData: { date: string; count: number }[];
    }>('/admin/users/statistics');
    return response.data;
  },
}; 