'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Check, X, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

import { productsApi } from '@/lib/api/products';
import { Product, ProductStatus, VerificationStatus } from '@/lib/types/product';

// 修正ReviewHistory類型，匹配後端返回的資料結構
interface ReviewHistory {
  id?: string;
  productId: string;
  adminId: string;
  adminName?: string;
  action: 'approve' | 'reject' | 'needs_info';
  note: string;
  createdAt: Date;
  timestamp?: Date; // 兼容前端可能使用的欄位
}

// 前端API可能返回的歷史記錄類型
interface ApiReviewHistory {
  id?: string;
  productId: string;
  adminId: string;
  adminName?: string;
  action?: 'approve' | 'reject' | 'needs_info';
  note?: string;
  comment?: string;
  fromStatus?: ProductStatus;
  toStatus?: ProductStatus;
  timestamp?: Date | string;
  createdAt?: Date | string;
}

export default function ProductDetailReviewPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistory[]>([]);
  const [reviewNote, setReviewNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showInfoRequestForm, setShowInfoRequestForm] = useState(false);
  
  // Refs for scrolling
  const reviewSectionRef = useRef<HTMLDivElement>(null);
  
  // 載入商品詳情
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const productData = await productsApi.getProduct(productId);
        setProduct(productData);
        
        // 獲取審核歷史
        try {
          const history = await productsApi.getReviewHistory(productId) as ApiReviewHistory[];
          // 將API返回的數據轉換為本地定義的ReviewHistory類型
          const formattedHistory: ReviewHistory[] = history.map(item => ({
            id: item.id,
            productId: item.productId,
            adminId: item.adminId,
            adminName: item.adminName,
            action: item.action || 'approve', // 默認值
            note: item.note || item.comment || '',
            createdAt: new Date(item.createdAt || item.timestamp || new Date()),
            timestamp: item.timestamp ? new Date(item.timestamp) : undefined
          }));
          setReviewHistory(formattedHistory);
        } catch (historyErr) {
          console.error('獲取審核歷史失敗', historyErr);
          // 非關鍵錯誤，不影響主要功能
        }
      } catch (err) {
        console.error('獲取商品詳情失敗', err);
        setError('無法獲取此商品的詳細信息，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // 輪播圖片導航
  const nextImage = () => {
    if (product?.basicInfo.images && product.basicInfo.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === product.basicInfo.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevImage = () => {
    if (product?.basicInfo.images && product.basicInfo.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? product.basicInfo.images.length - 1 : prevIndex - 1
      );
    }
  };

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

  // 獲取狀態文字
  const getStatusText = (status: ProductStatus) => {
    switch (status) {
      case 'pending':
        return '待審核';
      case 'published':
        return '已發佈';
      case 'rejected':
        return '已拒絕';
      case 'draft':
        return '草稿';
      case 'reserved':
        return '已預訂';
      case 'sold':
        return '已售出';
      case 'negotiating':
        return '洽談中';
      case 'inspecting':
        return '實地查看中';
      case 'completed':
        return '已完成媒合';
      case 'deleted':
        return '已刪除';
      default:
        return status;
    }
  };

  // 處理審核操作
  const handleApprove = async () => {
    try {
      await productsApi.approveProduct(productId, reviewNote);
      alert('商品已成功批准');
      router.push('/admin/products/review');
    } catch (err) {
      console.error('批准商品失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleReject = async () => {
    try {
      if (!rejectionReason.trim()) {
        alert('請提供拒絕原因');
        return;
      }
      
      await productsApi.rejectProduct(productId, rejectionReason);
      alert('商品已被拒絕');
      router.push('/admin/products/review');
    } catch (err) {
      console.error('拒絕商品失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleRequestMoreInfo = async () => {
    try {
      if (!infoRequest.trim()) {
        alert('請提供需要補充的信息內容');
        return;
      }
      
      await productsApi.requestMoreInfo(productId, infoRequest);
      alert('已要求賣家提供更多信息');
      router.push('/admin/products/review');
    } catch (err) {
      console.error('請求更多信息失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  // 切換表單顯示狀態
  const toggleApproveForm = () => {
    setShowApproveForm(!showApproveForm);
    setShowRejectForm(false);
    setShowInfoRequestForm(false);
    
    // 滾動到表單位置
    if (!showApproveForm && reviewSectionRef.current) {
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const toggleRejectForm = () => {
    setShowRejectForm(!showRejectForm);
    setShowApproveForm(false);
    setShowInfoRequestForm(false);
    
    // 滾動到表單位置
    if (!showRejectForm && reviewSectionRef.current) {
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const toggleInfoRequestForm = () => {
    setShowInfoRequestForm(!showInfoRequestForm);
    setShowApproveForm(false);
    setShowRejectForm(false);
    
    // 滾動到表單位置
    if (!showInfoRequestForm && reviewSectionRef.current) {
      setTimeout(() => {
        reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || '找不到此商品'}</p>
            <div className="mt-4">
              <Link href="/admin/products/review" className="text-sm font-medium text-red-700 hover:text-red-600">
                ← 返回審核列表
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* 返回按鈕和操作區 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link 
            href="/admin/products/review"
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            <span>返回列表</span>
          </Link>
          <h1 className="ml-4 text-2xl font-bold text-gray-900">商品審核: {product.basicInfo.title}</h1>
        </div>
        
        {product.status === 'pending' && (
          <div className="flex space-x-2">
            <button
              onClick={toggleApproveForm}
              className={`px-4 py-2 rounded-md text-white ${showApproveForm ? 'bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              <div className="flex items-center">
                <Check className="h-4 w-4 mr-1" />
                <span>批准</span>
              </div>
            </button>
            <button
              onClick={toggleRejectForm}
              className={`px-4 py-2 rounded-md text-white ${showRejectForm ? 'bg-red-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              <div className="flex items-center">
                <X className="h-4 w-4 mr-1" />
                <span>拒絕</span>
              </div>
            </button>
            <button
              onClick={toggleInfoRequestForm}
              className={`px-4 py-2 rounded-md text-white ${showInfoRequestForm ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>需更多資訊</span>
              </div>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：商品詳細信息 */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            {/* 圖片輪播 */}
            <div className="relative h-96">
              {product.basicInfo.images && product.basicInfo.images.length > 0 ? (
                <>
                  <Image 
                    src={product.basicInfo.images[currentImageIndex]} 
                    alt={product.basicInfo.title}
                    fill
                    className="object-contain"
                  />
                  {product.basicInfo.images.length > 1 && (
                    <>
                      <button 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2"
                        onClick={prevImage}
                      >
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </button>
                      <button 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 rounded-full p-2"
                        onClick={nextImage}
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {product.basicInfo.images.map((_, index) => (
                          <button 
                            key={index}
                            className={`h-2 w-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}
                            onClick={() => setCurrentImageIndex(index)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <p className="text-gray-500">沒有圖片</p>
                </div>
              )}
            </div>
            
            {/* 商品基本信息 */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-4">基本信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">標題</p>
                  <p className="font-medium">{product.basicInfo.title}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">價格</p>
                  <p className="font-medium">
                    NT$ {product.basicInfo.price.toLocaleString()}
                    {product.basicInfo.negotiable && <span className="ml-2 text-yellow-600 text-sm">可議價</span>}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm">描述</p>
                  <p className="whitespace-pre-line">{product.basicInfo.description}</p>
                </div>
              </div>
            </div>
            
            {/* 位置信息 */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-4">位置信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">公墓名稱</p>
                  <p className="font-medium">{product.location.cemetery}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">所在城市/地區</p>
                  <p className="font-medium">{product.location.city} {product.location.district}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm">詳細地址</p>
                  <p className="font-medium">{product.location.address}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500 text-sm">周邊環境</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {product.location.surroundings.parking && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        有停車場
                      </span>
                    )}
                    {product.location.surroundings.temple && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        有寺廟
                      </span>
                    )}
                    {product.location.surroundings.restaurant && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        有餐廳
                      </span>
                    )}
                    {product.location.surroundings.transportation && product.location.surroundings.transportation.map(transport => (
                      <span key={transport} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transport}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 商品特性 */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-4">商品特性</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">商品類型</p>
                  <p className="font-medium">{product.features.productType || product.features.type}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">宗教信仰</p>
                  <p className="font-medium">{product.features.religion}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">尺寸</p>
                  <p className="font-medium">{product.features.size}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">樓層</p>
                  <p className="font-medium">{product.features.floor}層</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">朝向</p>
                  <p className="font-medium">{product.features.facing}</p>
                </div>
              </div>
              
              {/* 風水特性 */}
              <div className="mt-4">
                <p className="text-gray-500 text-sm">風水特點</p>
                <div className="mt-1">
                  {product.features.feng_shui.orientation && (
                    <p><span className="font-medium">坐向: </span>{product.features.feng_shui.orientation}</p>
                  )}
                  
                  {product.features.feng_shui.environment && product.features.feng_shui.environment.length > 0 && (
                    <p className="mt-1">
                      <span className="font-medium">環境: </span>
                      {product.features.feng_shui.environment.join(', ')}
                    </p>
                  )}
                  
                  {product.features.feng_shui.features && product.features.feng_shui.features.length > 0 && (
                    <p className="mt-1">
                      <span className="font-medium">特點: </span>
                      {product.features.feng_shui.features.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 法律信息 */}
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-4">法律資訊</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">登記證號碼</p>
                  <p className="font-medium">{product.legalInfo.registrationNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">所有權證明</p>
                  <p className="font-medium">{product.legalInfo.ownershipCertificate}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">有效期限</p>
                  <p className="font-medium">
                    {product.legalInfo.expiryDate ? formatDate(product.legalInfo.expiryDate) : '永久'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">可轉讓</p>
                  <p className="font-medium">{product.legalInfo.transferable ? '是' : '否'}</p>
                </div>
                {product.legalInfo.restrictions && product.legalInfo.restrictions.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 text-sm">其他限制</p>
                    <ul className="list-disc pl-5 mt-1">
                      {product.legalInfo.restrictions.map((restriction, index) => (
                        <li key={index}>{restriction}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* 驗證資料 */}
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">驗證資料</h2>
              <div>
                <p className="text-gray-500 text-sm mb-2">上傳文件</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {product.verification.documents && product.verification.documents.length > 0 ? (
                    product.verification.documents.map((doc, index) => (
                      <div key={index} className="relative h-32 bg-gray-100 rounded overflow-hidden">
                        <a href={doc} target="_blank" rel="noopener noreferrer">
                          <Image 
                            src={doc}
                            alt={`證明文件 ${index + 1}`}
                            fill
                            className="object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">無文件</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 右側：審核信息和操作 */}
        <div>
          <div className="bg-white shadow-md rounded-lg overflow-hidden sticky top-4">
            {/* 商品狀態信息 */}
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold mb-4">商品狀態</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm">商品狀態</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${
                      product.status === 'pending' ? 'yellow' : 
                      product.status === 'published' ? 'green' : 
                      product.status === 'rejected' ? 'red' : 'gray'
                    }-100 text-${
                      product.status === 'pending' ? 'yellow' : 
                      product.status === 'published' ? 'green' : 
                      product.status === 'rejected' ? 'red' : 'gray'
                    }-800`}>
                      {getStatusText(product.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">驗證狀態</p>
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
                  <p className="text-gray-500 text-sm">賣家信息</p>
                  <p className="font-medium">{product.sellerName || '未知'}</p>
                  <p className="text-xs text-gray-500">ID: {product.sellerId.slice(-6)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">提交時間</p>
                  <p className="font-medium">{formatDate(product.metadata.createdAt.toString())}</p>
                </div>
              </div>
            </div>
            
            {/* 審核表單 */}
            <div className="p-6" ref={reviewSectionRef}>
              {product.status === 'pending' ? (
                <>
                  {showApproveForm && (
                    <div className="mb-6 border-l-4 border-green-400 p-4 bg-green-50">
                      <h3 className="font-semibold mb-2">批准商品</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          審核備註 (選填)
                        </label>
                        <textarea 
                          value={reviewNote}
                          onChange={(e) => setReviewNote(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          rows={3}
                          placeholder="輸入備註信息（可選）"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleApprove}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          確認批准
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showRejectForm && (
                    <div className="mb-6 border-l-4 border-red-400 p-4 bg-red-50">
                      <h3 className="font-semibold mb-2">拒絕商品</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          拒絕原因 <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          rows={3}
                          placeholder="請輸入拒絕此商品的原因"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleReject}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          確認拒絕
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showInfoRequestForm && (
                    <div className="mb-6 border-l-4 border-blue-400 p-4 bg-blue-50">
                      <h3 className="font-semibold mb-2">請求更多資訊</h3>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          請求的資訊 <span className="text-red-500">*</span>
                        </label>
                        <textarea 
                          value={infoRequest}
                          onChange={(e) => setInfoRequest(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          placeholder="請詳細說明需要賣家補充的信息"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={handleRequestMoreInfo}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          確認送出
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!showApproveForm && !showRejectForm && !showInfoRequestForm && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">請選擇審核操作</p>
                      <div className="flex justify-center space-x-2 mt-2">
                        <button
                          onClick={toggleApproveForm}
                          className="px-3 py-1 text-sm rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          批准
                        </button>
                        <button
                          onClick={toggleRejectForm}
                          className="px-3 py-1 text-sm rounded-md text-white bg-red-600 hover:bg-red-700"
                        >
                          拒絕
                        </button>
                        <button
                          onClick={toggleInfoRequestForm}
                          className="px-3 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          需更多資訊
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">此商品已{getStatusText(product.status)}，無需審核</p>
                </div>
              )}
            </div>
            
            {/* 審核歷史 */}
            {reviewHistory.length > 0 && (
              <div className="p-6 border-t">
                <h2 className="text-lg font-semibold mb-4">審核歷史</h2>
                <div className="space-y-4">
                  {reviewHistory.map((history, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 py-1">
                      <p className="text-sm font-medium">
                        {history.action === 'approve' ? '批准' : 
                         history.action === 'reject' ? '拒絕' : 
                         history.action === 'needs_info' ? '請求更多資訊' : 
                         history.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(history.timestamp || history.createdAt)}
                      </p>
                      {history.note && (
                        <p className="text-sm text-gray-700 mt-1">{history.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 