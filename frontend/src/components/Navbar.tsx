'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { messagesApi } from '@/lib/api/messages';
import WebSocketService from '@/lib/services/WebSocketService';

// 定義導航項目類型
interface NavItem {
  label: string;
  path: string;
  showBadge?: boolean;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  // 檢查路徑是否匹配當前頁面
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  // 定義通用導航項目
  const commonNavItems: NavItem[] = [
    { label: '首頁', path: '/' },
  ];

  // 定義買家導航項目
  const buyerNavItems: NavItem[] = [
    { label: '商品瀏覽', path: '/products' },
    { label: '我的收藏', path: '/user/favorites' },
  ];

  // 定義賣家導航項目
  const sellerNavItems: NavItem[] = [
    { label: '商品管理', path: '/seller/products' },
    { label: '銷售統計', path: '/seller/statistics' },
  ];

  // 未登入用戶導航項目
  const guestNavItems: NavItem[] = [
    { label: '商品瀏覽', path: '/products' }, // 未登入時也顯示瀏覽功能
  ];

  // 根據用戶角色選擇導航項目
  const navItems: NavItem[] = [
    ...commonNavItems,
    ...(user ? [
      ...(user.role === 'buyer' ? buyerNavItems : []),
      ...(user.role === 'seller' ? sellerNavItems : []),
      { label: '消息', path: user.role === 'seller' ? '/seller/messages' : '/user/messages', showBadge: true },
    ] : guestNavItems),
  ];

  // 獲取未讀消息數量
  useEffect(() => {
    if (user) {
      // 從API獲取未讀消息數量
      const fetchUnreadCount = async () => {
        try {
          const response = await messagesApi.getUnreadCount();
          setUnreadCount(response.count);
        } catch (error) {
          console.error('獲取未讀消息數量失敗', error);
          setUnreadCount(0);
        }
      };
      
      // 首次加載時獲取未讀消息數
      fetchUnreadCount();
      
      // 添加頁面可見性變更監聽器，當用戶回到頁面時更新未讀消息數
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchUnreadCount();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // 設置WebSocket監聽器以獲取實時更新
      const ws = WebSocketService.getInstance();
      
      const handleMessageReceived = () => {
        fetchUnreadCount();
      };
      
      const handleMessagesRead = () => {
        fetchUnreadCount();
      };
      
      // 監聽自定義事件以更新未讀消息計數
      const handleCustomMessagesRead = () => {
        fetchUnreadCount();
      };
      
      window.addEventListener('messagesRead', handleCustomMessagesRead);
      
      // 設置定時器，每30秒輪詢一次未讀消息數
      const intervalId = setInterval(fetchUnreadCount, 30000);
      
      ws.onNewMessage(handleMessageReceived);
      ws.onMessagesRead(handleMessagesRead);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('messagesRead', handleCustomMessagesRead);
        ws.removeListeners();
        clearInterval(intervalId);
      };
    }
  }, [user]);
  
  // 使用pathname來觸發未讀消息數更新
  useEffect(() => {
    if (user) {
      const fetchUnreadCount = async () => {
        try {
          const response = await messagesApi.getUnreadCount();
          setUnreadCount(response.count);
        } catch (error) {
          console.error('路由變更時獲取未讀消息數量失敗', error);
        }
      };
      
      fetchUnreadCount();
    }
  }, [pathname, user]);

  // 處理登出
  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo和網站名稱 */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-bold text-indigo-600">沐木</span>
            {user?.role === 'seller' && (
              <span className="ml-2 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-md">賣家模式</span>
            )}
          </Link>

          {/* 桌面導航 */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`relative px-3 py-2 font-medium ${
                  isActive(item.path) 
                    ? 'text-indigo-600 border-b-2 border-indigo-600' 
                    : 'text-gray-600 hover:text-indigo-500'
                }`}
              >
                {item.label}
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* 用戶選項（只顯示用戶資料或登入/註冊按鈕） */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/user/profile"
                  className="text-gray-600 hover:text-indigo-500"
                >
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span>{user.name || '我的帳戶'}</span>
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  登出
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50"
                >
                  登入
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  註冊
                </Link>
              </>
            )}
          </div>

          {/* 移動設備菜單按鈕 */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 focus:outline-none"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* 移動設備導航菜單 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-3 py-2 font-medium ${
                    isActive(item.path) 
                      ? 'text-indigo-600'
                      : 'text-gray-600 hover:text-indigo-500'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="flex items-center">
                    {item.label}
                    {item.showBadge && unreadCount > 0 && (
                      <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    href="/user/profile"
                    className="px-3 py-2 text-gray-600 hover:text-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>{user.name || '我的帳戶'}</span>
                    </span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="px-3 py-2 text-red-500 hover:text-red-600"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-3 py-2 text-indigo-600 hover:text-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    登入
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3 py-2 text-indigo-600 hover:text-indigo-500"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    註冊
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 