'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ordersApi } from '@/lib/api/orders';
import { Product } from '@/lib/types/product';
import { CreateOrderData, TransactionType, VisitAppointment } from '@/lib/types/order';
import { AxiosError } from 'axios';

interface BuyButtonProps {
  product: Product;
}

export default function BuyButton({ product }: BuyButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('full_payment');
  const [visitAppointment, setVisitAppointment] = useState<VisitAppointment | undefined>();
  const [note, setNote] = useState('');

  // 購買按鈕點擊處理
  const handleBuyClick = () => {
    if (!user) {
      // 用戶未登入，跳轉到登入頁
      router.push('/auth/login?redirect=' + encodeURIComponent(`/products/${product.id}`));
      return;
    }

    // 確認用戶角色
    if (user.role !== 'buyer') {
      alert('只有買家身份可以購買商品');
      return;
    }
    
    // 確認商品狀態
    if (product.status !== 'published') {
      alert('此商品目前無法購買');
      return;
    }
    
    // 避免用戶購買自己的商品
    if (product.sellerId === user.id) {
      alert('您不能購買自己的商品');
      return;
    }
    
    // 顯示交易方式選擇對話框
    setShowTransactionModal(true);
  };

  // 提交訂單
  const submitOrder = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const orderData: CreateOrderData = {
        productId: product.id,
        finalPrice: product.basicInfo.price,
        transactionType: transactionType,
        visitAppointment: visitAppointment,
        notes: note || undefined
      };
      
      console.log('提交訂單數據:', orderData);
      
      // 創建訂單
      const createdOrder = await ordersApi.create(orderData);
      
      // 關閉對話框並跳轉到訂單詳情頁
      setShowTransactionModal(false);
      router.push(`/user/orders/${createdOrder.id}`);
      
    } catch (err: unknown) {
      console.error('創建訂單失敗', err);
      
      // 提取並顯示更具體的錯誤信息
      let errorMessage = '創建訂單失敗，請稍後再試';
      
      if (err instanceof AxiosError && err.response?.data) {
        const responseData = err.response.data as { message?: string; error?: string };
        if (typeof responseData.message === 'string') {
          errorMessage = responseData.message;
        } else if (responseData.error) {
          errorMessage = responseData.error;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={handleBuyClick}
        disabled={product.status !== 'published'}
        className={`w-full py-3 rounded-md font-medium ${
          product.status === 'published'
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {product.status === 'published' ? '立即購買' : '已售出'}
      </button>
      
      {/* 交易方式選擇對話框 */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">確認購買</h3>
                <button 
                  onClick={() => setShowTransactionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 商品信息 */}
              <div className="mb-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <img
                    src={product.basicInfo.images[0]}
                    alt={product.basicInfo.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.basicInfo.title}</h4>
                    <p className="text-sm text-indigo-600">
                      {new Intl.NumberFormat('zh-TW', {
                        style: 'currency',
                        currency: 'TWD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(product.basicInfo.price)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 交易方式選擇 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  交易方式
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTransactionType('full_payment')}
                    className={`py-2 px-3 rounded-md text-sm ${
                      transactionType === 'full_payment'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    全額付款
                  </button>
                  <button
                    onClick={() => setTransactionType('installment')}
                    className={`py-2 px-3 rounded-md text-sm ${
                      transactionType === 'installment'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    分期付款
                  </button>
                  <button
                    onClick={() => setTransactionType('deposit')}
                    className={`py-2 px-3 rounded-md text-sm ${
                      transactionType === 'deposit'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    訂金
                  </button>
                </div>
              </div>

              {/* 預約看墓位 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  預約看墓位
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={visitAppointment?.date ? (typeof visitAppointment.date === 'string' ? visitAppointment.date : visitAppointment.date.toISOString().split('T')[0]) : ''}
                    onChange={(e) => setVisitAppointment({
                      ...visitAppointment,
                      date: e.target.value,
                      timeSlot: visitAppointment?.timeSlot || '上午',
                      contactName: visitAppointment?.contactName || '',
                      contactPhone: visitAppointment?.contactPhone || '',
                      status: 'pending'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <select
                    value={visitAppointment?.timeSlot || '上午'}
                    onChange={(e) => setVisitAppointment({
                      ...visitAppointment,
                      timeSlot: e.target.value,
                      date: visitAppointment?.date || '',
                      contactName: visitAppointment?.contactName || '',
                      contactPhone: visitAppointment?.contactPhone || '',
                      status: 'pending'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="上午">上午 (9:00-12:00)</option>
                    <option value="下午">下午 (13:00-17:00)</option>
                    <option value="其他">其他時間 (請在備註說明)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="聯繫人姓名"
                    value={visitAppointment?.contactName || ''}
                    onChange={(e) => setVisitAppointment({
                      ...visitAppointment,
                      contactName: e.target.value,
                      date: visitAppointment?.date || '',
                      timeSlot: visitAppointment?.timeSlot || '上午',
                      contactPhone: visitAppointment?.contactPhone || '',
                      status: 'pending'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="聯繫電話"
                    value={visitAppointment?.contactPhone || ''}
                    onChange={(e) => setVisitAppointment({
                      ...visitAppointment,
                      contactPhone: e.target.value,
                      date: visitAppointment?.date || '',
                      timeSlot: visitAppointment?.timeSlot || '上午',
                      contactName: visitAppointment?.contactName || '',
                      status: 'pending'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* 備註 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備註
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="如有特殊需求請在此說明"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                />
              </div>

              {/* 提交按鈕 */}
              <button
                onClick={submitOrder}
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {isSubmitting ? '提交中...' : '確認購買'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 