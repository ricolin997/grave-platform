'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api/auth';
import type { CurrentUser } from '@/lib/types/user';

interface AuthContextType {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
  updateUser: (user: CurrentUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化時從localStorage檢查用戶
  useEffect(() => {
    const initializeAuth = () => {
      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    };

    initializeAuth();

    // 監聽localStorage的變化
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'user') {
        if (event.newValue) {
          setUser(JSON.parse(event.newValue));
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 創建自定義事件來處理同一頁面內的登入/登出事件
    window.addEventListener('auth-change', () => {
      const currentUser = authApi.getCurrentUser();
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', () => {});
    };
  }, []);

  // 登入函數
  const login = (userData: CurrentUser) => {
    setUser(userData);
    // 觸發自定義事件通知其他組件
    window.dispatchEvent(new Event('auth-change'));
  };

  // 登出函數
  const logout = () => {
    authApi.logout();
    setUser(null);
    // 觸發自定義事件通知其他組件
    window.dispatchEvent(new Event('auth-change'));
  };

  // 更新用戶函數
  const updateUser = (userData: CurrentUser) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      // 觸發自定義事件通知其他組件
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 