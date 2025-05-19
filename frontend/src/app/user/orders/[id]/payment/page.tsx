'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ordersApi } from '@/lib/api/orders';
import { Order, TransferInfo, formatOrderStatus } from '@/lib/types/order';

export default function OrderPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string>('');
  
  // 轉帳信息表單數據
  const [transferInfo, setTransferInfo] = useState<TransferInfo>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    branchName: '',
    transferDate: '',
    transferAmount: 0,
    transferNote: '',
    receiptImage: '',
  });

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
        
        // 檢查訂單狀態
        if (orderData.status !== 'confirmed') {
          setError('此訂單無法進行付款操作');
          return;
        }
        
        setOrder(orderData);
        
        // 如果賣家提供了轉帳金額，預設填入
        if (orderData.finalPrice) {
          setTransferInfo(prev => ({
            ...prev,
            transferAmount: orderData.finalPrice,
          }));
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTransferInfo(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 處理收據圖片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setReceiptImage(result);
      setTransferInfo(prev => ({
        ...prev,
        receiptImage: result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // 提交轉帳信息
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) return;
    
    // 表單驗證
    if (!transferInfo.bankName || !transferInfo.accountName || !transferInfo.accountNumber || !transferInfo.transferAmount) {
      alert('請填寫所有必填欄位');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 提交轉帳信息
      await ordersApi.submitPayment(order.id, transferInfo);
      
      alert('轉帳信息已提交，等待賣家確認');
      router.push('/user/orders');
    } catch (err) {
      console.error('提交轉帳信息失敗', err);
      alert('提交失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
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
        <Link href="/user/orders" className="text-indigo-600 hover:text-indigo-800">
          &larr; 返回訂單列表
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">訂單付款</h1>
      
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
            <p className="mb-2">
              <span className="font-medium text-gray-700">訂單日期：</span>
              {new Date(order.createdAt).toLocaleDateString('zh-TW')}
            </p>
            <p className="mb-4">
              <span className="font-medium text-gray-700">付款金額：</span>
              <span className="text-xl font-bold text-indigo-600 ml-1">
                {formatPrice(order.finalPrice)}
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
              <span className="font-medium text-gray-700">賣家：</span>
              {order.seller.profile.name}
            </p>
            {order.transferInstructions && (
              <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                <p className="font-medium">賣家轉帳說明：</p>
                <p className="whitespace-pre-line">{order.transferInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 轉帳信息表單 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">提交轉帳信息</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-4">
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  銀行名稱 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={transferInfo.bankName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                  分行名稱
                </label>
                <input
                  type="text"
                  id="branchName"
                  name="branchName"
                  value={transferInfo.branchName || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  戶名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={transferInfo.accountName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  帳號 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={transferInfo.accountNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <div className="mb-4">
                <label htmlFor="transferDate" className="block text-sm font-medium text-gray-700 mb-1">
                  轉帳日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="transferDate"
                  name="transferDate"
                  value={typeof transferInfo.transferDate === 'string' ? transferInfo.transferDate : ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="transferAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  轉帳金額 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="transferAmount"
                  name="transferAmount"
                  value={transferInfo.transferAmount || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="transferNote" className="block text-sm font-medium text-gray-700 mb-1">
                  轉帳備註
                </label>
                <textarea
                  id="transferNote"
                  name="transferNote"
                  value={transferInfo.transferNote || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              轉帳收據圖片
            </label>
            <div className="mt-1 flex items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                id="receipt-upload"
              />
              <label
                htmlFor="receipt-upload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                上傳收據
              </label>
              <span className="ml-2 text-sm text-gray-500">
                JPG、PNG 或 GIF
              </span>
            </div>
            
            {receiptImage && (
              <div className="mt-4">
                <div className="relative w-64 h-64 border border-gray-300 rounded-md overflow-hidden">
                  <Image
                    src={receiptImage}
                    alt="轉帳收據"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Link
              href="/user/orders"
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
              ) : '提交轉帳信息'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 