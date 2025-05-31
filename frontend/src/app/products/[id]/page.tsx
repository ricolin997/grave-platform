'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { messagesApi } from '@/lib/api/messages';
import { Product } from '@/lib/types/product';
import BuyButton from '@/components/products/BuyButton';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // 詢問相關狀態
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('商品ID不存在');
        }
        
        const productData = await productsApi.getProduct(params.id as string);
        
        // 打印數據結構以調試
        console.log('產品數據結構:', {
          'product.id': productData.id,
          'product.id type': typeof productData.id,
          'product.id is valid MongoDB ID': /^[0-9a-fA-F]{24}$/.test(productData.id),
          'product.sellerId': productData.sellerId,
          'product.sellerId type': typeof productData.sellerId,
          'product.sellerId is valid MongoDB ID': /^[0-9a-fA-F]{24}$/.test(productData.sellerId)
        });
        
        setProduct(productData);
        
        // 在這裡我們可以檢查產品是否已被收藏，但由於我們沒有完整實現後端，暫時設為false
        // 未來可以通過API獲取該用戶的收藏列表，檢查此產品是否在其中
        setIsFavorite(false);
      } catch (err) {
        console.error('獲取商品詳情失敗', err);
        setError('無法載入商品詳情，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 聯繫賣家 - 打開詢問對話框
  const contactSeller = () => {
    setShowInquiryModal(true);
  };
  
  // 發送詢問消息
  const sendInquiry = async () => {
    if (!product || !inquiryMessage.trim()) return;
    
    try {
      setSendingInquiry(true);
      
      // 打印詳細的產品 ID 和賣家 ID 信息
      console.log('發送詢問 - 產品數據:', {
        'product.id': product.id,
        'product.id 類型': typeof product.id,
        'product.id 長度': product.id?.length,
        'product.sellerId': product.sellerId,
        'product.sellerId 類型': typeof product.sellerId,
        'product.sellerId 長度': product.sellerId?.length,
      });
      
      // 使用簡化的API調用，讓 messagesApi 處理 ID 格式轉換
      await messagesApi.send({
        productId: product.id,
        receiverId: product.sellerId,
        content: inquiryMessage,
        // 不提供 threadId，讓後端自動生成
      });
      
      // 成功發送後清空並關閉對話框
      setInquiryMessage('');
      setShowInquiryModal(false);
      alert('詢問消息已成功發送，賣家會盡快回覆您');
    } catch (err: unknown) {
      console.error('發送詢問失敗', err);
      
      // 顯示更詳細的錯誤信息
      let errorMessage = '發送詢問失敗，請稍後再試';
      
      // 如果是本地驗證錯誤
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      // 檢查是否為axios錯誤
      else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            status?: number, 
            data?: { 
              message?: string | string[] 
            } 
          } 
        };
        
        // 打印完整錯誤對象，幫助診斷
        console.log('詳細錯誤對象:', JSON.stringify(axiosError, null, 2));
        
        // 處理401/403錯誤(未登錄)
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
          errorMessage = '請先登錄後再發送詢問';
          alert(errorMessage);
          router.push('/login');
          return;
        }
        
        // 處理其他錯誤
        if (axiosError.response?.data?.message) {
          if (Array.isArray(axiosError.response.data.message)) {
            errorMessage = `錯誤: ${axiosError.response.data.message.join(', ')}`;
          } else {
            errorMessage = `錯誤: ${axiosError.response.data.message}`;
          }
        }
      }
      
      alert(errorMessage);
    } finally {
      setSendingInquiry(false);
    }
  };
  
  // 收藏/取消收藏
  const toggleFavorite = async () => {
    if (!product) return;
    
    try {
      setFavoriteLoading(true);
      
      if (isFavorite) {
        // 取消收藏
        await productsApi.removeFromFavorites(product.id);
        setIsFavorite(false);
      } else {
        // 添加收藏
        await productsApi.addToFavorites(product.id);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('收藏操作失敗', err);
      alert(isFavorite ? '取消收藏失敗' : '添加收藏失敗');
    } finally {
      setFavoriteLoading(false);
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
          onClick={() => router.push('/products')}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 面包屑導航 */}
      <div className="text-sm breadcrumbs mb-6">
        <ul className="flex space-x-2">
          <li>
            <Link href="/" className="text-gray-500 hover:text-indigo-600">
              首頁
            </Link>
          </li>
          <li className="before:content-['>'] before:mx-2 before:text-gray-400">
            <Link href="/products" className="text-gray-500 hover:text-indigo-600">
              商品列表
            </Link>
          </li>
          <li className="before:content-['>'] before:mx-2 before:text-gray-400">
            <span className="text-gray-900">{product.basicInfo.title}</span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* 商品圖片區 */}
        <div>
          <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
            {product.basicInfo.images && product.basicInfo.images.length > 0 ? (
              <>
                <Image
                  src={product.basicInfo.images[activeImage]}
                  alt={product.basicInfo.title}
                  fill
                  className="object-contain"
                  priority={activeImage === 0}
                />
                
                {/* 左右切換按鈕 */}
                {product.basicInfo.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((prev) => (prev === 0 ? product.basicInfo.images.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md"
                      aria-label="上一張圖片"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveImage((prev) => (prev === product.basicInfo.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-md"
                      aria-label="下一張圖片"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* 圖片計數指示器 */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {activeImage + 1} / {product.basicInfo.images.length}
                </div>
                
                {/* 幻燈片指示器 */}
                {product.basicInfo.images.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                    {product.basicInfo.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(index)}
                        className={`w-2.5 h-2.5 rounded-full ${
                          activeImage === index ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                        aria-label={`切換到圖片 ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="block text-center">無圖片</span>
                </div>
              </div>
            )}
          </div>

          {/* 縮略圖預覽 */}
          {product.basicInfo.images && product.basicInfo.images.length > 1 && (
            <div className="flex overflow-x-auto space-x-2 pb-2 hide-scrollbar">
              {product.basicInfo.images.map((image, index) => (
                <div
                  key={index}
                  className={`relative w-20 h-20 flex-shrink-0 cursor-pointer border-2 rounded ${
                    activeImage === index ? 'border-indigo-600' : 'border-transparent'
                  }`}
                  onClick={() => setActiveImage(index)}
                >
                  <Image
                    src={image}
                    alt={`縮略圖 ${index + 1}`}
                    fill
                    className="object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* 虛擬看房選項 */}
          {product.basicInfo.virtualTour && (
            <div className="mt-4">
              <a
                href={product.basicInfo.virtualTour}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
                虛擬看房
              </a>
            </div>
          )}
          
          {/* 視頻選項 */}
          {product.basicInfo.video && (
            <div className="mt-2">
              <a
                href={product.basicInfo.video}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                觀看視頻
              </a>
            </div>
          )}
        </div>

        {/* 商品資訊區 */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded ${
              product.status === 'published' ? 'bg-green-100 text-green-800' :
              product.status === 'reserved' ? 'bg-blue-100 text-blue-800' :
              product.status === 'sold' ? 'bg-gray-100 text-gray-800' :
              product.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {product.status === 'published' ? '銷售中' :
               product.status === 'reserved' ? '已預訂' :
               product.status === 'sold' ? '已售出' :
               product.status === 'draft' ? '草稿' :
               '未知'}
            </span>
            <span className="text-sm text-gray-500">
              ID: {product.id.substring(product.id.length - 8)}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{product.basicInfo.title}</h1>
          
          {/* 價格與操作區域 */}
          <div className="border-t border-gray-200 pt-6 mt-6 space-y-6">
            {/* 價格區 */}
            <div className="flex items-center mb-4">
              <span className="text-3xl font-bold text-indigo-600 mr-2">
                {formatPrice(product.basicInfo.price)}
              </span>
              {product.basicInfo.negotiable && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                  價格可議
                </span>
              )}
            </div>
            
            {/* 操作按鈕 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BuyButton product={product} />
              
              <button
                onClick={contactSeller}
                className="w-full bg-white border border-indigo-600 text-indigo-600 py-3 rounded-md hover:bg-indigo-50 flex items-center justify-center font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                聯繫賣家
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="col-span-1">
              <span className="text-gray-600">位置:</span>
              <div className="font-medium mt-1">
                {product.location.city} {product.location.district}
              </div>
            </div>
            
            <div className="col-span-1">
              <span className="text-gray-600">
                {['基本契約', '標準契約', '豪華契約', '定制契約'].includes(product.features.productType) ? '契約類型:' : '塔位類型:'}
              </span>
              <div className="font-medium mt-1">{product.features.productType}</div>
            </div>
            
            <div className="col-span-1">
              <span className="text-gray-600">宗教屬性:</span>
              <div className="font-medium mt-1">{product.features.religion}</div>
            </div>
            
            <div className="col-span-1">
              <span className="text-gray-600">發佈日期:</span>
              <div className="font-medium mt-1">
                {new Date(product.metadata.createdAt).toLocaleDateString('zh-TW')}
              </div>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 bg-gray-200 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <span className="text-gray-600">賣家:</span>
                <div className="font-medium">{product.sellerName || '未知賣家'}</div>
                <div className="text-sm text-gray-500 mt-1">
                  加入時間: {new Date(product.metadata.createdAt).toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {product.statistics.views} 次瀏覽
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {product.statistics.favorites} 人收藏
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                {product.statistics.inquiries} 人詢問
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={toggleFavorite}
              disabled={favoriteLoading}
              className={`px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isFavorite 
                  ? 'bg-pink-100 text-pink-700 focus:ring-pink-500 hover:bg-pink-200' 
                  : 'bg-gray-100 text-gray-800 focus:ring-gray-300 hover:bg-gray-200'
              }`}
              aria-label={isFavorite ? '取消收藏' : '加入收藏'}
            >
              {favoriteLoading ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-t-transparent border-pink-600"></div>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-6 w-6 ${isFavorite ? 'text-pink-600 fill-pink-600' : 'text-gray-600'}`}
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  fill={isFavorite ? 'currentColor' : 'none'}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              )}
            </button>
            {/* 分享按鈕 */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.basicInfo.title,
                    text: `查看這個塔位：${product.basicInfo.title}`,
                    url: window.location.href,
                  });
                } else {
                  // 複製鏈接到剪貼板
                  navigator.clipboard.writeText(window.location.href);
                  alert('連結已複製到剪貼板');
                }
              }}
              className="px-4 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
              aria-label="分享"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={() => router.push('/products')}
            className="text-indigo-600 hover:text-indigo-800 font-medium focus:outline-none flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回商品列表
          </button>
        </div>
      </div>

      {/* 商品詳情描述 */}
      <div className="border-t pt-8 mb-10">
        <h2 className="text-2xl font-bold mb-4">商品描述</h2>
        <div className="prose max-w-none">
          {product.basicInfo.description ? (
            <p className="whitespace-pre-line">{product.basicInfo.description}</p>
          ) : (
            <p className="text-gray-500">賣家未提供詳細描述</p>
          )}
        </div>
      </div>

      {/* 特色與賣點 */}
      {product.features.feng_shui.features && product.features.feng_shui.features.length > 0 && (
        <div className="border-t pt-8 mb-10">
          <h2 className="text-2xl font-bold mb-4">特色與賣點</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.features.feng_shui.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block rounded-full bg-green-100 p-1 mr-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 詳細規格 */}
      <div className="border-t pt-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">商品詳細資訊</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">位置資訊</h3>
            <dl className="space-y-2">
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">墓園名稱：</dt>
                <dd className="col-span-2 font-medium">{product.location.cemetery}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">詳細地址：</dt>
                <dd className="col-span-2 font-medium">{product.location.address}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">城市：</dt>
                <dd className="col-span-2 font-medium">{product.location.city}</dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">區域：</dt>
                <dd className="col-span-2 font-medium">{product.location.district}</dd>
              </div>
            </dl>
          </div>

          {/* 根據商品類型顯示不同的特性內容 */}
          {(() => {
            const isContractProduct = ['基本契約', '標準契約', '豪華契約', '定制契約'].includes(product.features.productType);
            
            if (isContractProduct) {
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">契約特性</h3>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">契約類型：</dt>
                      <dd className="col-span-2 font-medium">{product.features.productType}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">宗教：</dt>
                      <dd className="col-span-2 font-medium">{product.features.religion}</dd>
                    </div>
                    {product.features.feng_shui.features && product.features.feng_shui.features.length > 0 && (
                      <div className="grid grid-cols-3">
                        <dt className="text-gray-600">服務內容：</dt>
                        <dd className="col-span-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {product.features.feng_shui.features.map((feature, index) => (
                              <li key={index} className="font-medium">{feature}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                    {product.features.feng_shui.environment && product.features.feng_shui.environment.length > 0 && (
                      <div className="grid grid-cols-3">
                        <dt className="text-gray-600">契約細節：</dt>
                        <dd className="col-span-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {product.features.feng_shui.environment.map((item, index) => (
                              <li key={index} className="font-medium">{item}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              );
            } else {
              return (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">塔位特性</h3>
                  <dl className="space-y-2">
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">類型：</dt>
                      <dd className="col-span-2 font-medium">{product.features.productType}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">尺寸：</dt>
                      <dd className="col-span-2 font-medium">{product.features.size}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">朝向：</dt>
                      <dd className="col-span-2 font-medium">{product.features.facing}</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">樓層：</dt>
                      <dd className="col-span-2 font-medium">{product.features.floor}樓</dd>
                    </div>
                    <div className="grid grid-cols-3">
                      <dt className="text-gray-600">宗教：</dt>
                      <dd className="col-span-2 font-medium">{product.features.religion}</dd>
                    </div>
                  </dl>
                </div>
              );
            }
          })()}

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">周邊環境</h3>
            <dl className="space-y-2">
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">停車場：</dt>
                <dd className="col-span-2 font-medium">
                  {product.location.surroundings.parking ? '有' : '無'}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">廟宇：</dt>
                <dd className="col-span-2 font-medium">
                  {product.location.surroundings.temple ? '有' : '無'}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">餐廳：</dt>
                <dd className="col-span-2 font-medium">
                  {product.location.surroundings.restaurant ? '有' : '無'}
                </dd>
              </div>
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">交通方式：</dt>
                <dd className="col-span-2 font-medium">
                  {product.location.surroundings.transportation.length > 0 
                    ? product.location.surroundings.transportation.join('、') 
                    : '無資料'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 只對塔位顯示風水資訊 */}
          {!['基本契約', '標準契約', '豪華契約', '定制契約'].includes(product.features.productType) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">風水資訊</h3>
              <dl className="space-y-2">
                <div className="grid grid-cols-3">
                  <dt className="text-gray-600">方位：</dt>
                  <dd className="col-span-2 font-medium">
                    {product.features.feng_shui.orientation || '未提供'}
                  </dd>
                </div>
                <div className="grid grid-cols-3">
                  <dt className="text-gray-600">環境：</dt>
                  <dd className="col-span-2 font-medium">
                    {product.features.feng_shui.environment.length > 0 
                      ? product.features.feng_shui.environment.join('、') 
                      : '未提供'}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* 法律資訊 */}
      <div className="border-t pt-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">法律資訊</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="grid grid-cols-3">
              <dt className="text-gray-600">登記號碼：</dt>
              <dd className="col-span-2 font-medium">{product.legalInfo.registrationNumber}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-gray-600">所有權證書：</dt>
              <dd className="col-span-2 font-medium">{product.legalInfo.ownershipCertificate}</dd>
            </div>
            <div className="grid grid-cols-3">
              <dt className="text-gray-600">產權：</dt>
              <dd className="col-span-2 font-medium">
                {product.legalInfo.propertyRights.join('、')}
              </dd>
            </div>
            {product.legalInfo.expiryDate && (
              <div className="grid grid-cols-3">
                <dt className="text-gray-600">到期日：</dt>
                <dd className="col-span-2 font-medium">
                  {new Date(product.legalInfo.expiryDate).toLocaleDateString('zh-TW')}
                </dd>
              </div>
            )}
            <div className="grid grid-cols-3">
              <dt className="text-gray-600">可轉讓：</dt>
              <dd className="col-span-2 font-medium">
                {product.legalInfo.transferable ? '是' : '否'}
              </dd>
            </div>
            {product.legalInfo.restrictions.length > 0 && (
              <div className="col-span-2 grid grid-cols-3">
                <dt className="text-gray-600">限制條件：</dt>
                <dd className="col-span-2 font-medium">
                  {product.legalInfo.restrictions.join('、')}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* 詢問對話框 Modal */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">詢問此商品</h3>
                <button 
                  onClick={() => setShowInquiryModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-2">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md mb-2">
                  <Image
                    src={product.basicInfo.images[0] || '/images/placeholder.jpg'}
                    width={50}
                    height={50}
                    alt={product.basicInfo.title}
                    className="rounded-md object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{product.basicInfo.title}</h4>
                    <p className="text-sm text-indigo-600">{formatPrice(product.basicInfo.price)}</p>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="inquiryMessage" className="block text-sm font-medium text-gray-700 mb-2">
                  您的詢問內容
                </label>
                <textarea
                  id="inquiryMessage"
                  rows={5}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder="例如：請問此塔位的確切位置？可以安排現場看嗎？"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
                <p className="mt-1 text-xs text-gray-500">
                  收到詢問後，賣家會在24小時內回覆您，回覆將發送到您的消息中心。
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowInquiryModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  取消
                </button>
                <button
                  onClick={sendInquiry}
                  disabled={!inquiryMessage.trim() || sendingInquiry}
                  className={`flex-1 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    !inquiryMessage.trim() || sendingInquiry ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {sendingInquiry ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      發送中...
                    </span>
                  ) : '發送詢問'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 相似商品推薦 */}
      <div className="border-t pt-8 mb-10">
        <h2 className="text-2xl font-bold mb-6">您可能還會喜歡</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* 這裡應該從API獲取相似商品，但目前模擬3個相似商品 */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="relative h-48 w-full bg-gray-200 animate-pulse"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 