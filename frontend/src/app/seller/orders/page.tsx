'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { Order, OrderStatus, formatOrderStatus } from '@/lib/types/order';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function SellerOrdersPage() {
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

    // 如果用戶不是賣家角色，重定向到買家訂單頁面
    if (user.role !== 'seller') {
      router.push('/user/orders');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const query = activeTab !== 'all' ? { status: activeTab } : {};
        const response = await ordersApi.getSellerOrders(query);
        
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
    router.push(`/seller/orders?${params.toString()}`);
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
          <div className="space-x-2">
            <button
              onClick={() => handleConfirmOrder(order.id)}
              className="text-green-600 hover:text-green-800"
            >
              確認訂單
            </button>
            <button
              onClick={() => handleRejectOrder(order.id)}
              className="text-red-600 hover:text-red-800"
            >
              拒絕訂單
            </button>
          </div>
        );
      case 'confirmed':
        return (
          <span className="text-orange-600">等待買家付款</span>
        );
      case 'payment_pending':
        return (
          <button
            onClick={() => handleConfirmPayment(order.id)}
            className="text-green-600 hover:text-green-800"
          >
            確認收款
          </button>
        );
      case 'payment_confirmed':
        return (
          <button
            onClick={() => handleCompleteOrder(order.id)}
            className="text-indigo-600 hover:text-indigo-800"
          >
            完成交易
          </button>
        );
      case 'completed':
        return (
          <Link
            href={`/seller/orders/${order.id}`}
            className="text-gray-600 hover:text-gray-800"
          >
            查看詳情
          </Link>
        );
      default:
        return (
          <Link
            href={`/seller/orders/${order.id}`}
            className="text-gray-600 hover:text-gray-800"
          >
            查看詳情
          </Link>
        );
    }
  };

  // 確認訂單
  const handleConfirmOrder = async (orderId: string) => {
    if (!confirm('確認接受此訂單？')) {
      return;
    }
    
    try {
      setLoading(true);
      await ordersApi.confirmOrder(orderId);
      
      // 重新獲取訂單列表
      const query = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await ordersApi.getSellerOrders(query);
      setOrders(response.orders || []);
      
      alert('訂單已確認');
    } catch (err) {
      console.error('確認訂單失敗', err);
      alert('確認訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 拒絕訂單
  const handleRejectOrder = async (orderId: string) => {
    const reason = prompt('請輸入拒絕原因');
    if (reason === null) {
      return;
    }
    
    try {
      setLoading(true);
      await ordersApi.rejectOrder(orderId, reason);
      
      // 重新獲取訂單列表
      const query = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await ordersApi.getSellerOrders(query);
      setOrders(response.orders || []);
      
      alert('訂單已拒絕');
    } catch (err) {
      console.error('拒絕訂單失敗', err);
      alert('拒絕訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 確認收款
  const handleConfirmPayment = async (orderId: string) => {
    if (!confirm('確認已收到買家付款？')) {
      return;
    }
    
    try {
      setLoading(true);
      await ordersApi.confirmPayment(orderId);
      
      // 重新獲取訂單列表
      const query = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await ordersApi.getSellerOrders(query);
      setOrders(response.orders || []);
      
      alert('付款已確認');
    } catch (err) {
      console.error('確認收款失敗', err);
      alert('確認收款失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 完成訂單
  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('確認完成此交易？請確保交易已完全完成。')) {
      return;
    }
    
    try {
      setLoading(true);
      await ordersApi.completeOrder(orderId);
      
      // 重新獲取訂單列表
      const query = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await ordersApi.getSellerOrders(query);
      setOrders(response.orders || []);
      
      alert('交易已完成');
    } catch (err) {
      console.error('完成訂單失敗', err);
      alert('完成訂單失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">訂單管理</h1>
      
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
                  買家
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
                      href={`/seller/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/products/${order.product?.id || order.productId}`}
                      className="text-gray-900 hover:text-indigo-600"
                    >
                      {order.product?.basicInfo?.title || '商品資訊載入中...'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatPrice(order.finalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.buyer?.profile?.name || '買家資訊載入中...'}
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