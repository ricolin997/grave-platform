'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 如果用戶信息已加載完成但沒有用戶登錄，或者用戶不是管理員
    if (!isLoading && (!user || user.role !== 'admin')) {
      // 重定向到登錄頁面
      router.push('/auth/login?redirect=/admin');
    }
  }, [user, isLoading, router]);

  // 如果還在加載或者沒有用戶，顯示加載中狀態
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-gray-500">正在驗證身份...</p>
        </div>
      </div>
    );
  }

  // 如果用戶不是管理員
  if (user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">訪問被拒絕</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>您沒有權限訪問管理後台。請聯繫系統管理員。</p>
                <button
                  onClick={() => router.push('/')}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  返回首頁
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果用戶是管理員，顯示子組件
  return <>{children}</>;
} 