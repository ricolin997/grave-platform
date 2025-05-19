'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ordersApi } from '@/lib/api/orders';
import { Order, formatOrderStatus, formatTransactionType } from '@/lib/types/order';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

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
        
        // 檢查權限（只有買家或賣家可以查看）
        if (orderData.buyerId !== user.id && orderData.sellerId !== user.id) {
          router.push('/user/orders');
          return;
        }
        
        setOrder(orderData);
      } catch (err) {
        console.error('獲取訂單失敗', err);
        setError('無法載入訂單資料，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, user, router]);

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 格式化日期
  const formatDate = (date: Date | string) => {
    if (!date) return '無';
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 訂單操作按鈕
  const renderOrderActions = () => {
    if (!order || !user) return null;
    
    // 買家操作
    if (order.buyerId === user.id) {
      switch (order.status) {
        case 'pending':
          return (
            <button
              onClick={handleCancelOrder}
              disabled={processing}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {processing ? '處理中...' : '取消訂單'}
            </button>
          );
        case 'confirmed':
          return (
            <Link 
              href={`/user/orders/${order.id}/payment`}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              前往付款
            </Link>
          );
        default:
          return null;
      }
    }
    
    // 賣家操作
    if (order.sellerId === user.id) {
      switch (order.status) {
        case 'pending':
          return (
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmOrder}
                disabled={processing}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {processing ? '處理中...' : '確認訂單'}
              </button>
              <button
                onClick={() => handleRejectOrder()}
                disabled={processing}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {processing ? '處理中...' : '拒絕訂單'}
              </button>
            </div>
          );
        case 'payment_pending':
          return (
            <button
              onClick={handleConfirmPayment}
              disabled={processing}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? '處理中...' : '確認收款'}
            </button>
          );
        case 'payment_confirmed':
          return (
            <button
              onClick={handleCompleteOrder}
              disabled={processing}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {processing ? '處理中...' : '完成交易'}
            </button>
          );
        default:
          return null;
      }
    }
    
    return null;
  };

  // 處理取消訂單
  const handleCancelOrder = async () => {
    if (!order || !window.confirm('確定要取消此訂單嗎？')) return;
    
    try {
      setProcessing(true);
      const reason = prompt('請輸入取消原因（可選）');
      
      // 更新訂單狀態為取消，並添加取消原因
      await ordersApi.updateOrder(order.id, {
        status: 'cancelled',
        cancellationReason: reason || undefined
      });
      
      alert('訂單已取消');
      // 重新加載訂單數據
      const updatedOrder = await ordersApi.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('取消訂單失敗', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setProcessing(false);
    }
  };

  // 處理確認訂單
  const handleConfirmOrder = async () => {
    if (!order || !window.confirm('確定要確認此訂單嗎？')) return;
    
    try {
      setProcessing(true);
      
      // 詢問賣家轉帳說明
      const transferInstructions = prompt('請輸入轉帳說明（例如：銀行帳號、轉帳方式等）');
      
      // 更新訂單狀態為已確認，並添加轉帳說明
      await ordersApi.updateOrder(order.id, {
        status: 'confirmed',
        transferInstructions: transferInstructions || undefined
      });
      
      alert('訂單已確認');
      // 重新加載訂單數據
      const updatedOrder = await ordersApi.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('確認訂單失敗', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setProcessing(false);
    }
  };

  // 處理拒絕訂單
  const handleRejectOrder = async () => {
    if (!order || !window.confirm('確定要拒絕此訂單嗎？')) return;
    
    try {
      setProcessing(true);
      const reason = prompt('請輸入拒絕原因');
      
      if (!reason) {
        alert('請輸入拒絕原因');
        setProcessing(false);
        return;
      }
      
      await ordersApi.rejectOrder(order.id, reason);
      alert('訂單已拒絕');
      // 重新加載訂單數據
      const updatedOrder = await ordersApi.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('拒絕訂單失敗', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setProcessing(false);
    }
  };

  // 處理確認收款
  const handleConfirmPayment = async () => {
    if (!order || !window.confirm('確定要確認收款嗎？')) return;
    
    try {
      setProcessing(true);
      await ordersApi.confirmPayment(order.id);
      alert('已確認收款');
      // 重新加載訂單數據
      const updatedOrder = await ordersApi.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('確認收款失敗', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setProcessing(false);
    }
  };

  // 處理完成訂單
  const handleCompleteOrder = async () => {
    if (!order || !window.confirm('確定要完成此訂單嗎？交易完成後將無法更改。')) return;
    
    try {
      setProcessing(true);
      await ordersApi.completeOrder(order.id);
      alert('訂單已完成');
      // 重新加載訂單數據
      const updatedOrder = await ordersApi.getOrder(order.id);
      setOrder(updatedOrder);
    } catch (err) {
      console.error('完成訂單失敗', err);
      alert('操作失敗，請稍後再試');
    } finally {
      setProcessing(false);
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
        <Link 
          href={order.buyerId === user?.id ? "/user/orders" : "/seller/orders"} 
          className="text-indigo-600 hover:text-indigo-800"
        >
          &larr; 返回訂單列表
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold mb-6">訂單詳情</h1>
      
      {/* 訂單狀態 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-gray-700 mr-2">訂單狀態：</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              order.status === 'completed' ? 'bg-green-100 text-green-800' :
              order.status === 'cancelled' || order.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {formatOrderStatus(order.status)}
            </span>
          </div>
          {renderOrderActions()}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="mb-2">
              <span className="font-medium text-gray-700">訂單編號：</span>
              {order.orderNumber}
            </p>
            <p className="mb-2">
              <span className="font-medium text-gray-700">成交價格：</span>
              <span className="text-xl font-bold text-indigo-600 ml-1">
                {formatPrice(order.finalPrice)}
              </span>
            </p>
            <p className="mb-2">
              <span className="font-medium text-gray-700">交易方式：</span>
              {formatTransactionType(order.transactionType)}
            </p>
            <p className="mb-2">
              <span className="font-medium text-gray-700">訂單創建：</span>
              {formatDate(order.createdAt)}
            </p>
            {order.completedAt && (
              <p className="mb-2">
                <span className="font-medium text-gray-700">完成時間：</span>
                {formatDate(order.completedAt)}
              </p>
            )}
          </div>
          
          <div>
            {order.status === 'cancelled' && order.cancellationReason && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                <p className="font-medium">取消原因：</p>
                <p>{order.cancellationReason}</p>
              </div>
            )}
            
            {order.status === 'rejected' && order.rejectionReason && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700">
                <p className="font-medium">拒絕原因：</p>
                <p>{order.rejectionReason}</p>
              </div>
            )}
            
            {order.notes && (
              <div className="mb-4">
                <p className="font-medium text-gray-700">訂單備註：</p>
                <p className="whitespace-pre-line text-gray-600">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 商品信息 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">商品信息</h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            {order.product.basicInfo.images && order.product.basicInfo.images.length > 0 && (
              <div className="relative h-64 w-full rounded-lg overflow-hidden">
                <Image
                  src={order.product.basicInfo.images[0]}
                  alt={order.product.basicInfo.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
          
          <div className="md:w-2/3">
            <h3 className="text-lg font-medium mb-2">
              <Link href={`/products/${order.productId}`} className="text-indigo-600 hover:text-indigo-800">
                {order.product.basicInfo.title}
              </Link>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">所在區域：</span>
                  {order.product.location.city} {order.product.location.district}
                </p>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">宗教類型：</span>
                  {order.product.features.religion}
                </p>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">墓型：</span>
                  {order.product.features.type}
                </p>
              </div>
              
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">原價：</span>
                  {formatPrice(order.product.basicInfo.price)}
                </p>
                
                {order.product.features.feng_shui && order.product.features.feng_shui.features && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">特色：</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {order.product.features.feng_shui.features.map((feature: string, index: number) => (
                        <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 買賣雙方信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">買家信息</h2>
          <p className="mb-2">
            <span className="font-medium text-gray-700">姓名：</span>
            {order.buyer.profile.name}
          </p>
          <p className="mb-2">
            <span className="font-medium text-gray-700">電子郵箱：</span>
            {order.buyer.email}
          </p>
          {order.buyer.profile.phone && (
            <p className="mb-2">
              <span className="font-medium text-gray-700">電話：</span>
              {order.buyer.profile.phone}
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">賣家信息</h2>
          <p className="mb-2">
            <span className="font-medium text-gray-700">姓名：</span>
            {order.seller.profile.name}
          </p>
          <p className="mb-2">
            <span className="font-medium text-gray-700">電子郵箱：</span>
            {order.seller.email}
          </p>
          {order.seller.profile.phone && (
            <p className="mb-2">
              <span className="font-medium text-gray-700">電話：</span>
              {order.seller.profile.phone}
            </p>
          )}
        </div>
      </div>
      
      {/* 付款信息 */}
      {(order.status === 'payment_pending' || order.status === 'payment_confirmed' || order.status === 'completed') && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">付款信息</h2>
          
          {order.transferInstructions && (
            <div className="mb-6 p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="font-medium">賣家轉帳說明：</p>
              <p className="whitespace-pre-line">{order.transferInstructions}</p>
            </div>
          )}
          
          {order.transferInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">銀行名稱：</span>
                  {order.transferInfo.bankName}
                </p>
                {order.transferInfo.branchName && (
                  <p className="mb-2">
                    <span className="font-medium text-gray-700">分行名稱：</span>
                    {order.transferInfo.branchName}
                  </p>
                )}
                <p className="mb-2">
                  <span className="font-medium text-gray-700">戶名：</span>
                  {order.transferInfo.accountName}
                </p>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">帳號：</span>
                  {order.transferInfo.accountNumber}
                </p>
              </div>
              
              <div>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">轉帳日期：</span>
                  {order.transferInfo.transferDate ? formatDate(order.transferInfo.transferDate) : '無'}
                </p>
                <p className="mb-2">
                  <span className="font-medium text-gray-700">轉帳金額：</span>
                  {formatPrice(order.transferInfo.transferAmount)}
                </p>
                {order.transferInfo.transferNote && (
                  <p className="mb-2">
                    <span className="font-medium text-gray-700">轉帳備註：</span>
                    {order.transferInfo.transferNote}
                  </p>
                )}
              </div>
            </div>
          )}
          
          {order.transferInfo?.receiptImage && (
            <div className="mt-6">
              <p className="font-medium text-gray-700 mb-2">轉帳收據：</p>
              <div className="relative w-full md:w-1/2 h-64 border border-gray-300 rounded-lg overflow-hidden">
                <Image
                  src={order.transferInfo.receiptImage}
                  alt="轉帳收據"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 預約看墓位信息 */}
      {order.visitAppointment && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">預約看墓位</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="mb-2">
                <span className="font-medium text-gray-700">預約日期：</span>
                {formatDate(order.visitAppointment.date)}
              </p>
              <p className="mb-2">
                <span className="font-medium text-gray-700">預約時段：</span>
                {order.visitAppointment.timeSlot}
              </p>
              <p className="mb-2">
                <span className="font-medium text-gray-700">聯繫人：</span>
                {order.visitAppointment.contactName}
              </p>
              <p className="mb-2">
                <span className="font-medium text-gray-700">聯繫電話：</span>
                {order.visitAppointment.contactPhone}
              </p>
            </div>
            
            <div>
              <p className="mb-2">
                <span className="font-medium text-gray-700">預約狀態：</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.visitAppointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  order.visitAppointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  order.visitAppointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.visitAppointment.status === 'pending' ? '待確認' :
                   order.visitAppointment.status === 'confirmed' ? '已確認' :
                   order.visitAppointment.status === 'completed' ? '已完成' :
                   order.visitAppointment.status === 'cancelled' ? '已取消' : 
                   order.visitAppointment.status}
                </span>
              </p>
              
              {order.visitAppointment.additionalInfo && (
                <div className="mt-4">
                  <p className="font-medium text-gray-700">其他信息：</p>
                  <p className="whitespace-pre-line text-gray-600">{order.visitAppointment.additionalInfo}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 