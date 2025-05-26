'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SellerNav() {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  const navItems = [
    { label: '儀表板', path: '/seller' },
    { label: '商品管理', path: '/seller/products' },
    { label: '銷售統計', path: '/seller/statistics' },
    { label: '消息', path: '/seller/messages' },
    { label: '訂單', path: '/seller/orders' },
    { label: '設置', path: '/seller/settings' }
  ];

  return (
    <div className="bg-white shadow-md mb-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <h1 className="text-xl font-semibold text-indigo-600">賣家中心</h1>
          
          <Link
            href="/seller/products/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 text-sm"
          >
            新增商品
          </Link>
        </div>
        
        <nav className="flex overflow-x-auto pb-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              href={item.path}
              className={`whitespace-nowrap px-5 py-2 text-sm font-medium border-b-2 mr-2 ${
                isActive(item.path)
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-indigo-500 hover:border-indigo-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
} 