'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';

interface DashboardStat {
  title: string;
  value: number | string;
  change: number;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

export default function AdminDashboardPage() {
  const [pendingReviews, setPendingReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 模擬統計數據
  const dashboardStats: DashboardStat[] = [
    {
      title: '總商品數',
      value: 1278,
      change: 12.5,
      trend: 'up',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      title: '本月交易額',
      value: 'NT$ 4,382,420',
      change: 8.2,
      trend: 'up',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: '活躍用戶',
      value: 876,
      change: -2.4,
      trend: 'down',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      title: '待審核商品',
      value: pendingReviews,
      change: 5.1,
      trend: 'up',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  // 模擬最近活動
  const recentActivities = [
    {
      id: 1,
      action: '審核通過',
      subject: '單人塔位 - 台北市福德第一靈骨塔',
      timestamp: '1小時前',
      user: '陳管理員',
    },
    {
      id: 2,
      action: '用戶註冊',
      subject: '林先生 (賣家)',
      timestamp: '3小時前',
      user: '系統',
    },
    {
      id: 3,
      action: '更新狀態',
      subject: '雙人塔位 - 高雄市杉林區第三靈骨塔',
      timestamp: '昨天',
      user: '王管理員',
    },
    {
      id: 4,
      action: '審核拒絕',
      subject: '家族塔位 - 南投草屯',
      timestamp: '2天前',
      user: '李管理員',
    },
    {
      id: 5,
      action: '媒合完成',
      subject: '單人塔位 - 台中市第二靈骨塔',
      timestamp: '3天前',
      user: '系統',
    },
  ];

  // 獲取待審核商品數量
  useEffect(() => {
    const fetchPendingReviews = async () => {
      try {
        setIsLoading(true);
        const response = await productsApi.getPendingProducts();
        setPendingReviews(response.total);
      } catch (error) {
        console.error('獲取待審核商品失敗', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingReviews();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">歡迎回來，管理員</h1>
        <p className="mt-1 text-sm text-gray-600">這是您的管理後台儀表板，查看平台概況和待處理事項。</p>
      </div>

      {/* 統計數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-md bg-indigo-100 text-indigo-600">
                {stat.icon}
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500 truncate">{stat.title}</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">{isLoading && stat.title === '待審核商品' ? '...' : stat.value}</p>
              </div>
            </div>
            <div className="mt-4">
              <span
                className={`inline-flex items-center text-sm ${
                  stat.trend === 'up'
                    ? 'text-green-600'
                    : stat.trend === 'down'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {stat.trend === 'up' ? (
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : stat.trend === 'down' ? (
                  <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : null}
                {stat.change}% 較上月
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 待處理任務 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">待處理任務</h2>
            <p className="mt-1 text-sm text-gray-500">需要您處理的事項</p>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              <li>
                <Link href="/admin/products/review" className="flex items-center justify-between p-3 bg-yellow-50 rounded-md text-yellow-700 hover:bg-yellow-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>審核待處理商品</span>
                  </div>
                  <span className="bg-yellow-200 text-yellow-800 py-1 px-2 rounded-full text-xs font-medium">
                    {isLoading ? '...' : pendingReviews}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/admin/messages" className="flex items-center justify-between p-3 bg-blue-50 rounded-md text-blue-700 hover:bg-blue-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>未處理用戶反饋</span>
                  </div>
                  <span className="bg-blue-200 text-blue-800 py-1 px-2 rounded-full text-xs font-medium">
                    5
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/admin/users/verification" className="flex items-center justify-between p-3 bg-green-50 rounded-md text-green-700 hover:bg-green-100">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>用戶身份驗證請求</span>
                  </div>
                  <span className="bg-green-200 text-green-800 py-1 px-2 rounded-full text-xs font-medium">
                    3
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 最近活動 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">最近活動</h2>
            <p className="mt-1 text-sm text-gray-500">系統最近的操作記錄</p>
          </div>
          <div className="p-6">
            <ul className="space-y-4">
              {recentActivities.map((activity) => (
                <li key={activity.id} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}: {activity.subject}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {activity.timestamp} · {activity.user}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 