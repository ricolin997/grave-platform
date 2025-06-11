'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { productsApi } from '@/lib/api/products';
import { Product, ProductStatus, VerificationStatus } from '@/lib/types/product';
import toast from 'react-hot-toast';

export default function SellerProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState<number | ''>('');
  const [publishLoading, setPublishLoading] = useState(false);

  // 獲取商品詳情
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('商品ID不存在');
        }
        
        const productData = await productsApi.getProduct(params.id as string);
        setProduct(productData);
      } catch (err) {
        console.error('獲取商品詳情失敗', err);
        setError('無法獲取商品詳情，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProductDetails();
    }
  }, [params.id]);

  // 格式化時間
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // 獲取驗證狀態標籤顏色
  const getVerificationColor = (status: VerificationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'needs_info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 獲取商品狀態文字
  const getStatusText = (status: ProductStatus) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'pending':
        return '待審核';
      case 'approved-pending':
        return '已批准-待上架';
      case 'published':
        return '已發佈';
      case 'reserved':
        return '已預訂';
      case 'negotiating':
        return '洽談中';
      case 'inspecting':
        return '實地查看中';
      case 'completed':
        return '已完成';
      case 'rejected':
        return '審核被拒';
      case 'sold':
        return '已售出';
      case 'deleted':
        return '已刪除';
      default:
        return status;
    }
  };

  // 獲取審核進度步驟
  const getReviewStep = () => {
    if (!product) return 0;
    
    if (product.status === 'published') return 3; // 已完成全部步驟
    if (product.status === 'approved-pending') return 2; // 已批准待上架
    if (product.verification.status === 'verified') return 2; // 已通過審核
    if (product.verification.status === 'rejected') return 1; // 已拒絕
    if (product.verification.status === 'needs_info') return 1; // 需要更多信息
    if (product.status === 'pending') return 1; // 正在審核中
    
    return 0; // 尚未提交審核
  };

  // 獲取審核狀態訊息
  const getReviewStatusMessage = () => {
    if (!product) return '';
    
    if (product.status === 'published') {
      return '您的商品已通過審核並成功發布，可在平台上被買家看到。';
    }

    if (product.status === 'approved-pending') {
      return '您的商品已通過審核，請點擊「立即上架」按鈕將商品發布到平台上。';
    }
    
    if (product.status === 'draft') {
      return '此商品目前為草稿狀態，尚未提交審核，不會顯示在平台上。';
    }
    
    if (product.status === 'pending') {
      return '您的商品正在審核中，請耐心等待。審核通過後即可發布。';
    }
    
    if (product.verification.status === 'rejected') {
      return `您的商品審核被拒。原因: ${product.verification.reviewNote || '審核員未提供具體原因'}`;
    }
    
    if (product.verification.status === 'needs_info') {
      return `您的商品需要補充更多資料。要求: ${product.verification.reviewNote || '請聯繫客服了解詳情'}`;
    }
    
    return '商品狀態未知';
  };

  // 獲取審核狀態圖標
  const getReviewStatusIcon = () => {
    if (!product) return null;
    
    if (product.status === 'published') {
      return <CheckCircle className="h-6 w-6 text-green-600" />;
    }
    
    if (product.status === 'approved-pending') {
      return <CheckCircle className="h-6 w-6 text-blue-600" />;
    }
    
    if (product.status === 'draft') {
      return <AlertCircle className="h-6 w-6 text-gray-400" />;
    }
    
    if (product.status === 'pending') {
      return <Clock className="h-6 w-6 text-yellow-600" />;
    }
    
    if (product.verification.status === 'rejected') {
      return <XCircle className="h-6 w-6 text-red-600" />;
    }
    
    if (product.verification.status === 'needs_info') {
      return <AlertCircle className="h-6 w-6 text-blue-600" />;
    }
    
    return <AlertCircle className="h-6 w-6 text-gray-600" />;
  };

  // 上架商品
  const handlePublish = async (withPrice: boolean = false) => {
    try {
      setPublishLoading(true);

      // 如果需要更新價格
      if (withPrice && newPrice !== '' && newPrice > 0) {
        await productsApi.publishProduct(params.id as string, newPrice as number);
      } else {
        await productsApi.publishProduct(params.id as string);
      }

      toast.success('商品已成功上架！');
      setShowPriceModal(false);

      // 重新取得商品資料
      const updatedProduct = await productsApi.getProduct(params.id as string);
      setProduct(updatedProduct);
    } catch (error) {
      console.error('上架商品失敗', error);
      toast.error('上架商品失敗，請稍後再試');
    } finally {
      setPublishLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || '找不到商品'}</p>
        </div>
        <button
          onClick={() => router.push('/seller/products')}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 返回按鈕和標題 */}
      <div className="flex items-center mb-6">
        <Link 
          href="/seller/products"
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span>返回列表</span>
        </Link>
        <h1 className="ml-4 text-2xl font-bold text-gray-900">商品詳情: {product.basicInfo.title}</h1>
      </div>

      {/* 審核進度指示器 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          {getReviewStatusIcon()}
          <span className="ml-2">審核狀態</span>
        </h2>
        
        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-gray-500">提交審核</div>
              <div className="text-sm font-medium text-gray-500">審核中</div>
              <div className="text-sm font-medium text-gray-500">審核完成</div>
            </div>
            
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div 
                className={`h-full rounded-full ${
                  product.verification.status === 'rejected' 
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }`} 
                style={{ width: `${getReviewStep() * 33.33}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getReviewStep() >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getReviewStep() >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                getReviewStep() >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>
        
        <div className={`p-4 rounded-md ${
          product.status === 'published' 
            ? 'bg-green-50 border border-green-200' 
            : product.status === 'approved-pending'
            ? 'bg-blue-50 border border-blue-200'
            : product.status === 'pending'
            ? 'bg-yellow-50 border border-yellow-200'
            : product.verification.status === 'rejected'
            ? 'bg-red-50 border border-red-200'
            : product.verification.status === 'needs_info'
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-gray-50 border border-gray-200'
        }`}>
          <p className={`${
            product.status === 'published' 
              ? 'text-green-700' 
              : product.status === 'approved-pending'
              ? 'text-blue-700'
              : product.status === 'pending'
              ? 'text-yellow-700'
              : product.verification.status === 'rejected'
              ? 'text-red-700'
              : product.verification.status === 'needs_info'
              ? 'text-blue-700'
              : 'text-gray-700'
          }`}>
            {getReviewStatusMessage()}
          </p>
          
          {/* 審核批准後的上架按鈕 */}
          {product.status === 'approved-pending' && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handlePublish(false)}
                disabled={publishLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {publishLoading ? '處理中...' : '立即上架'}
              </button>
              <button
                onClick={() => setShowPriceModal(true)}
                disabled={publishLoading}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                調整價格並上架
              </button>
            </div>
          )}
          
          {(product.verification.status === 'needs_info' || product.verification.status === 'rejected') && (
            <div className="mt-4">
              <Link 
                href={`/seller/products/edit/${product.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                編輯商品以符合要求
              </Link>
            </div>
          )}
          
          {product.status === 'draft' && (
            <div className="mt-4">
              <Link 
                href={`/seller/products/edit/${product.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                編輯並提交審核
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 商品基本資訊 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">基本資訊</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">商品標題</p>
              <p className="font-medium">{product.basicInfo.title}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">價格</p>
              <p className="font-medium">
                {formatPrice(product.basicInfo.price)}
                {product.basicInfo.negotiable && <span className="ml-2 text-sm text-yellow-600">可議價</span>}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">商品描述</p>
              <p className="whitespace-pre-line">{product.basicInfo.description || '無描述'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">商品類型</p>
              <p className="font-medium">{product.features.productType}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">商品狀態</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">目前狀態</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${
                  product.status === 'pending' ? 'yellow' : 
                  product.status === 'published' ? 'green' : 
                  product.status === 'approved-pending' ? 'blue' :
                  product.status === 'rejected' ? 'red' : 'gray'
                }-100 text-${
                  product.status === 'pending' ? 'yellow' : 
                  product.status === 'published' ? 'green' : 
                  product.status === 'approved-pending' ? 'blue' :
                  product.status === 'rejected' ? 'red' : 'gray'
                }-800`}>
                  {getStatusText(product.status)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">驗證狀態</p>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(product.verification.status)}`}>
                  {product.verification.status === 'pending' ? '待驗證' : 
                   product.verification.status === 'verified' ? '已驗證' : 
                   product.verification.status === 'rejected' ? '拒絕驗證' : 
                   product.verification.status === 'needs_info' ? '需更多資訊' : 
                   product.verification.status}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">創建時間</p>
              <p className="font-medium">{formatDate(product.metadata.createdAt)}</p>
            </div>
            {product.metadata.publishedAt && (
              <div>
                <p className="text-sm text-gray-500">發佈時間</p>
                <p className="font-medium">{formatDate(product.metadata.publishedAt)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex space-x-4">
        <Link 
          href={`/seller/products/edit/${product.id}`}
          className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 ${
            (product.status === 'sold' || (product.status === 'pending' && product.verification.status !== 'needs_info' && product.verification.status !== 'rejected')) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
          }`}
        >
          編輯商品
        </Link>
        
        <Link 
          href={`/products/${product.id}`}
          className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
        >
          預覽商品頁面
        </Link>
      </div>

      {/* 價格調整彈出視窗 */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md mx-2">
            <h3 className="text-lg font-medium mb-4">調整價格並上架商品</h3>
            <p className="text-sm text-gray-600 mb-4">
              請輸入新的商品價格。目前價格: NT$ {formatPrice(product.basicInfo.price)}
            </p>
            <div className="mb-4">
              <label htmlFor="new-price" className="block text-sm font-medium text-gray-700 mb-1">
                新價格 (NT$)
              </label>
              <input
                id="new-price"
                type="number"
                value={newPrice}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewPrice(value === '' ? '' : Number(value));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`${product.basicInfo.price}`}
                min="1"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => handlePublish(true)}
                disabled={publishLoading || (newPrice !== '' && (newPrice as number) <= 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {publishLoading ? '處理中...' : '確認上架'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 