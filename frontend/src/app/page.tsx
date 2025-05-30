'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-24">
        <div className="w-full max-w-5xl text-center">
          <p>載入中...</p>
        </div>
      </main>
    );
  }

  // 未登入用戶的首頁內容
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-24">
        <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
          <h1 className="text-6xl font-bold text-center mb-6">
            塔位中介平台
          </h1>
          <p className="text-2xl text-center mb-8">
            安全可靠的塔位交易環境
          </p>
          
          <div className="flex justify-center gap-6 mt-12">
            <Link 
              href="/auth/login" 
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              登入
            </Link>
            <Link 
              href="/auth/register" 
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              註冊
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 買家首頁內容
  if (user.role === 'buyer') {
    return (
      <main className="flex min-h-screen flex-col items-center p-8">
        <div className="w-full max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">歡迎回來，{user.name || '買家'}!</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">快速瀏覽</h2>
              <p className="text-gray-600 mb-4">查看最新上架的塔位和熱門商品。</p>
              <Link
                href="/products"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                瀏覽塔位
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">我的收藏</h2>
              <p className="text-gray-600 mb-4">查看您收藏的塔位商品。</p>
              <Link
                href="/user/favorites"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                查看收藏
              </Link>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">消息通知</h2>
            <p className="text-gray-600 mb-4">查看您的最新消息和通知。</p>
            <Link
              href="/user/messages"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              查看消息
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 賣家首頁內容
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-3xl font-bold mb-6">歡迎回來，{user.name || '賣家'}!</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">商品管理</h2>
            <p className="text-gray-600 mb-4">管理您的塔位商品和生前契約，查看銷售狀態。</p>
            <Link
              href="/seller/products"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              管理商品
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">銷售統計</h2>
            <p className="text-gray-600 mb-4">查看您的銷售數據和統計信息。</p>
            <Link
              href="/seller/statistics"
              className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              查看統計
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">新增商品</h2>
          <p className="text-gray-600 mb-4">快速新增塔位商品或生前契約，立即開始銷售。</p>
          <Link
            href="/seller/products/new"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            新增商品
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">消息通知</h2>
          <p className="text-gray-600 mb-4">查看您的最新消息和通知。</p>
          <Link
            href="/user/messages"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            查看消息
          </Link>
        </div>
      </div>
    </main>
  );
}
