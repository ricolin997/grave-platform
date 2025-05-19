'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ordersApi } from '@/lib/api/orders';
import { Order, VisitAppointment, formatOrderStatus } from '@/lib/types/order';

export default function ScheduleVisitPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // 預約資料
  const [visitInfo, setVisitInfo] = useState<VisitAppointment>({
    date: '',
    timeSlot: '上午',
    contactName: '',
    contactPhone: '',
    additionalInfo: '',
    status: 'pending'
  });

  // 可選時間段
  const timeSlotOptions = [
    { value: '上午', label: '上午 (9:00-12:00)' },
    { value: '下午', label: '下午 (13:00-17:00)' },
    { value: '其他', label: '其他時間 (請在備註說明)' },
  ];

  // 獲取訂單數據
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const orderId = params.id as string;
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const orderData = await ordersApi.getOrder(orderId);
        
        // 檢查權限
        if (orderData.buyerId !== user.id) {
          router.push('/user/orders');
          return;
        }
        
        // 檢查是否已經有預約
        if (orderData.visitAppointment) {
          router.push(`/user/orders/${orderId}`);
          return;
        }
        
        setOrder(orderData);
        
        // 設置預設聯絡人資訊
        if (user) {
          setVisitInfo(prev => ({
            ...prev,
            contactName: user.name || ''
          }));
          
          // 如果有電話號碼，則直接設置到預約表單
          // 在實際應用中，可能需要從用戶的完整資料中獲取電話號碼
        }
      } catch (err) {
        console.error('獲取訂單失敗', err);
        setError('無法載入訂單資料，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, user, router]);

  // 處理表單輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVisitInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 提交預約資訊
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    // 表單驗證
    if (!visitInfo.date || !visitInfo.timeSlot || !visitInfo.contactName || !visitInfo.contactPhone) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 提交預約資訊
      await ordersApi.scheduleVisit(order.id, visitInfo);
      
      alert('預約資訊已提交，等待賣家確認');
      router.push(`/user/orders/${order.id}`);
    } catch (err) {
      console.error('提交預約資訊失敗', err);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || '訂單不存在'}</p>
        </div>
        <Link
          href="/user/orders"
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          返回訂單列表
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href={`/user/orders/${order.id}`} className="text-indigo-600 hover:text-indigo-800">
          &larr; 返回訂單詳情
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">預約看墓位</h1>
      
      {/* 訂單信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">訂單詳情</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="mb-2">
              <span className="font-medium text-gray-700">訂單編號：</span>
              {order.orderNumber}
            </p>
            <p className="mb-2">
              <span className="font-medium text-gray-700">訂單狀態：</span>
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm ml-1">
                {formatOrderStatus(order.status)}
              </span>
            </p>
          </div>
          
          <div>
            <p className="mb-2">
              <span className="font-medium text-gray-700">商品名稱：</span>
              <Link href={`/products/${order.productId}`} className="text-indigo-600 hover:text-indigo-800">
                {order.product.basicInfo.title}
              </Link>
            </p>
            <p className="mb-2">
              <span className="font-medium text-gray-700">所在位置：</span>
              {order.product.location.city} {order.product.location.district} - {order.product.location.cemetery}
            </p>
          </div>
        </div>
      </div>
      
      {/* 預約表單 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">填寫預約資訊</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  預約日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={typeof visitInfo.date === 'string' ? visitInfo.date : ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">請選擇至少明天以後的日期</p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-1">
                  預約時段 <span className="text-red-500">*</span>
                </label>
                <select
                  id="timeSlot"
                  name="timeSlot"
                  value={visitInfo.timeSlot}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {timeSlotOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡人姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contactName"
                  name="contactName"
                  value={visitInfo.contactName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  聯絡電話 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={visitInfo.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
              其他備註（選填）
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={visitInfo.additionalInfo || ''}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例如：希望賣家提供交通建議、特殊需求等"
            ></textarea>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="text-md font-medium text-gray-700 mb-2">注意事項：</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>請至少提前3天預約</li>
              <li>預約確認後，賣家將與您聯繫具體細節</li>
              <li>如需更改或取消預約，請至少提前24小時通知</li>
              <li>參觀當天請準時到達，若遇特殊情況請提前聯繫</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Link
              href={`/user/orders/${order.id}`}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-4 hover:bg-gray-300"
            >
              取消
            </Link>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>
                  提交中...
                </>
              ) : '提交預約'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 