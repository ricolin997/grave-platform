'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { messagesApi } from '@/lib/api/messages';
import { Product } from '@/lib/types/product';
import { AxiosError } from 'axios';

interface ContactButtonProps {
  product: Product;
}

export default function ContactButton({ product }: ContactButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPreference, setContactPreference] = useState<string>('in_person');
  const [inquiryMessage, setInquiryMessage] = useState('');

  // 聯繫按鈕點擊處理
  const handleContactClick = () => {
    if (!user) {
      // 用戶未登入，跳轉到登入頁
      router.push('/auth/login?redirect=' + encodeURIComponent(`/products/${product.id}`));
      return;
    }

    // 確認用戶角色
    if (user.role !== 'buyer') {
      alert('只有買家身份可以聯繫賣家');
      return;
    }
    
    // 確認商品狀態
    if (product.status !== 'published') {
      alert('此塔位目前無法聯繫賣家');
      return;
    }
    
    // 避免用戶聯繫自己
    if (product.sellerId === user.id) {
      alert('您不能聯繫自己的商品');
      return;
    }
    
    // 顯示聯繫方式選擇對話框
    setShowContactModal(true);
  };

  // 提交詢問
  const submitInquiry = async () => {
    if (isSubmitting || !inquiryMessage.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // 創建詢問消息
      await messagesApi.send({
        productId: product.id,
        receiverId: product.sellerId,
        content: `${inquiryMessage}\n\n聯繫偏好: ${
          contactPreference === 'in_person' ? '實地拜訪' : 
          contactPreference === 'phone' ? '電話聯繫' : '線上聯繫'
        }`
      });
      
      // 關閉對話框並提示成功
      setShowContactModal(false);
      alert('詢問已發送，賣家會盡快與您聯繫');
      
    } catch (err: unknown) {
      console.error('發送詢問失敗', err);
      
      // 提取並顯示更具體的錯誤信息
      let errorMessage = '發送詢問失敗，請稍後再試';
      
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
        onClick={handleContactClick}
        disabled={product.status !== 'published'}
        className={`w-full py-3 rounded-md font-medium flex items-center justify-center ${
          product.status === 'published'
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {product.status === 'published' ? '聯繫賣家' : '已售出'}
      </button>
      
      {/* 聯繫方式選擇對話框 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">聯繫賣家</h3>
                <button 
                  onClick={() => setShowContactModal(false)}
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

              {/* 聯繫偏好選擇 */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  請選擇您的聯繫偏好方式
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setContactPreference('in_person')}
                    className={`p-3 rounded-md flex flex-col items-center ${
                      contactPreference === 'in_person'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">實地拜訪</span>
                  </button>
                  <button
                    onClick={() => setContactPreference('phone')}
                    className={`p-3 rounded-md flex flex-col items-center ${
                      contactPreference === 'phone'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm">電話聯繫</span>
                  </button>
                  <button
                    onClick={() => setContactPreference('online')}
                    className={`p-3 rounded-md flex flex-col items-center ${
                      contactPreference === 'online'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-sm">線上聯繫</span>
                  </button>
                </div>
                
                {/* 聯繫方式說明 */}
                <div className="mt-3 text-xs text-gray-500 p-2 bg-gray-50 rounded-md">
                  {contactPreference === 'in_person' && (
                    <p>實地拜訪：安排時間實際看墓地/塔位，親自了解環境與位置。</p>
                  )}
                  {contactPreference === 'phone' && (
                    <p>電話聯繫：賣家將通過電話與您討論詳情，回答您的疑問。</p>
                  )}
                  {contactPreference === 'online' && (
                    <p>線上聯繫：透過平台消息功能進行討論，可能包含視訊通話。</p>
                  )}
                </div>
              </div>

              {/* 詢問信息 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  詢問內容
                </label>
                <textarea
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  rows={4}
                  placeholder="請輸入您對此塔位的疑問或想了解的詳情..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">您的訊息和偏好聯繫方式將發送給賣家，賣家會根據您的偏好方式與您聯繫。</p>
              </div>
              
              {/* 提交按鈕 */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  取消
                </button>
                <button
                  onClick={submitInquiry}
                  disabled={isSubmitting || !inquiryMessage.trim()}
                  className={`px-4 py-2 rounded-md ${
                    isSubmitting || !inquiryMessage.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isSubmitting ? 
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      發送中...
                    </span> 
                    : '發送詢問'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 