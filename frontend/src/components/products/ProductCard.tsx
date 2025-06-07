'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Product, ProductStatus } from '@/lib/types/product';
import { productsApi } from '@/lib/api/products';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  showFavoriteButton?: boolean;
  onFavoriteChange?: (productId: string, isFavorite: boolean) => void;
}

// 產品狀態對應的標籤設定
const statusConfig: Record<ProductStatus, { bg: string, text: string, label: string }> = {
  published: { bg: 'bg-green-100', text: 'text-green-800', label: '銷售中' },
  draft: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '草稿' },
  reserved: { bg: 'bg-blue-100', text: 'text-blue-800', label: '已預訂' },
  negotiating: { bg: 'bg-purple-100', text: 'text-purple-800', label: '洽談中' },
  inspecting: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: '實地查看中' },
  completed: { bg: 'bg-teal-100', text: 'text-teal-800', label: '已完成媒合' },
  sold: { bg: 'bg-gray-100', text: 'text-gray-800', label: '已售出' },
  deleted: { bg: 'bg-red-100', text: 'text-red-800', label: '已刪除' }
};

export default function ProductCard({ 
  product, 
  showFavoriteButton = true,
  onFavoriteChange 
}: ProductCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(product.isFavorited || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // 在組件掛載時檢查收藏狀態
  useEffect(() => {
    // 如果商品已經有初始的收藏狀態，使用它
    if (product.isFavorited !== undefined) {
      setIsFavorite(product.isFavorited);
      return;
    }
    
    // 如果用戶已登錄且沒有初始收藏狀態，檢查收藏狀態
    if (user && showFavoriteButton) {
      const checkFavoriteStatus = async () => {
        try {
          const favorites = await productsApi.getFavorites();
          const isFavorited = favorites.products.some(fav => fav.id === product.id);
          setIsFavorite(isFavorited);
        } catch (error) {
          console.error('無法檢查收藏狀態:', error);
        }
      };
      
      checkFavoriteStatus();
    }
  }, [user, product.id, product.isFavorited, showFavoriteButton]);
  
  // 獲取第一張圖片作為封面
  const coverImage = product.basicInfo.images.length > 0
    ? product.basicInfo.images[0]
    : '/images/placeholder.jpg';

  // 第二張圖片（如果有）用於懸停效果
  const secondImage = product.basicInfo.images.length > 1
    ? product.basicInfo.images[1]
    : coverImage;
  
  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  // 獲取發佈時間
  const getPublishedTime = () => {
    const publishedDate = product.metadata.publishedAt || product.metadata.createdAt;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - new Date(publishedDate).getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)}週前`;
    } else {
      return new Date(publishedDate).toLocaleDateString('zh-TW');
    }
  };
  
  // 切換收藏狀態
  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isFavorite) {
        await productsApi.removeFromFavorites(product.id);
        setIsFavorite(false);
        onFavoriteChange?.(product.id, false);
      } else {
        await productsApi.addToFavorites(product.id);
        setIsFavorite(true);
        onFavoriteChange?.(product.id, true);
      }
    } catch (err) {
      console.error('收藏操作失敗', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得狀態配置
  const getStatusConfig = (status: ProductStatus) => {
    return statusConfig[status] || statusConfig.published;
  };

  const config = getStatusConfig(product.status);

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative h-48 w-full overflow-hidden">
          {/* 主圖與懸停切換效果 */}
          <Image
            src={coverImage}
            alt={product.basicInfo.title}
            fill
            className={`object-cover transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* 懸停時顯示的第二張圖 */}
          <Image
            src={secondImage}
            alt={`${product.basicInfo.title} - 第二張圖`}
            fill
            className={`object-cover transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* 狀態標籤 */}
          {product.status !== 'published' && (
            <div className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${config.bg} ${config.text} z-10`}>
              {config.label}
            </div>
          )}
          
          {/* 時間標籤 */}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full z-10">
            {getPublishedTime()}
          </div>
          
          {/* 可議價標籤 */}
          {product.basicInfo.negotiable && (
            <div className="absolute bottom-2 right-2 bg-yellow-500/80 text-white text-xs px-2 py-1 rounded-full z-10">
              可議價
            </div>
          )}
          
          {/* 收藏按鈕 */}
          {user && showFavoriteButton && (
            <button
              onClick={toggleFavorite}
              disabled={isLoading}
              className="absolute top-2 right-2 bg-white/80 p-2 rounded-full shadow-md hover:bg-white z-10"
              aria-label={isFavorite ? '取消收藏' : '收藏'}
            >
              {isLoading ? (
                <div className="w-5 h-5 animate-spin rounded-full border-2 border-t-transparent border-pink-600"></div>
              ) : (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 ${isFavorite ? 'text-pink-600 fill-pink-600' : 'text-gray-600'}`}
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  fill={isFavorite ? 'currentColor' : 'none'}
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                  />
                </svg>
              )}
            </button>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800 leading-tight line-clamp-2">
              {product.basicInfo.title}
            </h3>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <span className="text-indigo-600 font-bold">
              {formatPrice(product.basicInfo.price)}
            </span>
            {product.basicInfo.negotiable && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                可議價
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-2">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="mr-2">{product.location.city}</span>
              <span>{product.location.district}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
            <div className="flex items-center space-x-2">
              <span className="bg-gray-100 px-2 py-1 rounded-full truncate max-w-[100px]">{product.features.productType}</span>
              <span className="bg-gray-100 px-2 py-1 rounded-full truncate max-w-[70px]">{product.features.religion}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {product.statistics?.views || 0}
              </span>
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {product.statistics?.favorites || 0}
              </span>
            </div>
          </div>
          
          {/* 快速操作懸停顯示 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-600 to-indigo-500 text-white py-3 text-center font-medium transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            查看詳情
          </div>
        </div>
      </Link>
    </div>
  );
} 