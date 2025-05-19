'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderStatus, formatOrderStatus } from '@/lib/types/order';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function UserOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  // 從查詢參數獲取當前狀態
  useEffect(() => {
    const status = searchParams.get('status') as OrderStatus;
    if (status) {
      setActiveTab(status);
    }
  }, [searchParams]);

  // 獲取訂單數據
  useEffect(() => {
    // 如果身份驗證還在載入中，等待完成
    if (authLoading) {
      return;
    }

    // 如果用戶未登入，重定向到登入頁面
    if (user === null) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const query = activeTab !== 'all' ? { status: activeTab } : {};
        const response = await ordersApi.getBuyerOrders(query);
        
        setOrders(response.orders || []);
      } catch (err) {
        console.error('獲取訂單失敗', err);
        setError('無法載入訂單資料，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, user, router, authLoading]);

  // 切換標籤
  const handleTabChange = (status: OrderStatus | 'all') => {
    setActiveTab(status);
    const params = new URLSearchParams();
    if (status !== 'all') {
      params.set('status', status);
    }
    router.push(`/user/orders?${params.toString()}`);
  };

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 獲取訂單狀態樣式
  const getStatusStyle = (status: OrderStatus) => {
    const styles: Record<OrderStatus, { bg: string; text: string }> = {
      pending: { bg: 'bg-blue-100', text: 'text-blue-800' },
      confirmed: { bg: 'bg-orange-100', text: 'text-orange-800' },
      payment_pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      payment_confirmed: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return styles[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // 獲取訂單操作按鈕
  const getOrderActions = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <button
            onClick={() => handleCancelOrder(order.id)}
            className="text-red-600 hover:text-red-800"
          >
            取消訂單
          </button>
        );
      case 'confirmed':
        return (
          <Link
            href={`/user/orders/${order.id}/payment`}
            className="text-green-600 hover:text-green-800"
          >
            付款
          </Link>
        );
      case 'payment_pending':
        return (
          <span className="text-yellow-600">等待確認收款</span>
        );
      case 'payment_confirmed':
        return (
          <span className="text-indigo-600">交易處理中</span>
        );
      case 'completed':
        return (
          <Link
            href={`/user/orders/${order.id}`}
            className="text-gray-600 hover:text-gray-800"
          >
            查看詳情
          </Link>
        );
      case 'cancelled':
      case 'rejected':
        return (
          <Link
            href={`/products/${order.productId}`}
            className="text-indigo-600 hover:text-indigo-800"
          >
            重新購買
          </Link>
        );
      default:
        return null;
    }
  };

  // 取消訂單
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('確定要取消此訂單嗎？這個操作無法撤銷。')) {
      return;
    }
    
    try {
      setLoading(true);
      await ordersApi.cancelOrder(orderId);
      
      // 重新獲取訂單列表
      const query = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await ordersApi.getBuyerOrders(query);
      setOrders(response.orders || []);
      
      alert('訂單已成功取消');
    } catch (err) {
      console.error('取消訂單失敗', err);
      alert('取消訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的訂單</h1>
      
      {/* 狀態標籤 */}
      <div className="flex overflow-x-auto mb-6 bg-white rounded-lg p-2 shadow">
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 mx-1 rounded-md ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          全部訂單
        </button>
        {
          ['pending', 'confirmed', 'payment_pending', 'payment_confirmed', 'completed', 'cancelled', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => handleTabChange(status as OrderStatus)}
              className={`px-4 py-2 mx-1 rounded-md whitespace-nowrap ${
                activeTab === status
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {formatOrderStatus(status as OrderStatus)}
            </button>
          ))
        }
      </div>

      {/* 錯誤信息 */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 訂單列表 */}
      {authLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="ml-3 text-indigo-600">驗證用戶身份中...</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">載入失敗</h3>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">無訂單記錄</h3>
          <p className="text-gray-600 mb-4">您目前沒有任何訂單記錄</p>
          <Link
            href="/products"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            開始購物
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單編號
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  商品
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  價格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  賣家
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  訂單狀態
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  創建時間
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/user/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/products/${order.productId}`}
                      className="text-gray-900 hover:text-indigo-600"
                    >
                      {order.product?.basicInfo?.title || '商品資訊載入中...'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPrice(order.finalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.seller?.profile?.name || '賣家資訊載入中...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusStyle(order.status).bg
                      } ${getStatusStyle(order.status).text}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getOrderActions(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 