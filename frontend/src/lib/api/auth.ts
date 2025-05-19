import axiosInstance from './axios';
import { RegisterData, LoginData, AuthResponse, CurrentUser } from '../types/user';

export const authApi = {
  register: async (data: RegisterData) => {
    const response = await axiosInstance.post<AuthResponse>('/users', data);
    return response.data;
  },
  
  login: async (data: LoginData) => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', data);
    
    // 保存令牌和用戶信息
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // 觸發自定義事件通知其他組件用戶已登入
      window.dispatchEvent(new Event('auth-change'));
    }
    
    return response.data;
  },
  
  logout: () => {
    // 清除本地存儲的身份驗證數據
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      // 觸發自定義事件通知其他組件用戶已登出
      window.dispatchEvent(new Event('auth-change'));
    }
  },
  
  getCurrentUser: (): CurrentUser | null => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem('user');
      if (userString) {
        return JSON.parse(userString);
      }
    }
    return null;
  },
  
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  }
}; 