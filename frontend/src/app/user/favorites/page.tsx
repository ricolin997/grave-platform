'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/lib/types/product';

export default function UserFavoritesPage() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await productsApi.getFavorites({ page, limit: 10 });
        
        setFavorites(response.products);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error('獲取收藏列表失敗', err);
        setError('無法載入收藏清單，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [page]);

  // 格式化價格
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // 移除收藏
  const handleRemoveFromFavorites = async (productId: string) => {
    try {
      if (!confirm('確定要從收藏清單中移除此商品嗎？')) {
        return;
      }
      
      await productsApi.removeFromFavorites(productId);
      
      // 更新收藏列表
      setFavorites(favorites.filter(product => product.id !== productId));
    } catch (err) {
      console.error('移除收藏失敗', err);
      alert('移除收藏失敗，請稍後再試');
    }
  };

  if (loading && favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">我的收藏</h1>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">您的收藏列表是空的</h2>
          <p className="text-gray-600 mb-6">瀏覽更多商品，將喜歡的項目添加到收藏列表中。</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            瀏覽商品
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {favorites.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-48">
                  {product.basicInfo.images && product.basicInfo.images.length > 0 ? (
                    <Image
                      src={product.basicInfo.images[0]}
                      alt={product.basicInfo.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex justify-center items-center h-full bg-gray-100">
                      <span className="text-gray-400">無圖片</span>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2 hover:text-indigo-600">
                    <Link href={`/products/${product.id}`}>
                      {product.basicInfo.title}
                    </Link>
                  </h2>
                  
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-indigo-600">
                      {formatPrice(product.basicInfo.price)}
                    </span>
                    
                    {product.basicInfo.negotiable && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        可議價
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <div className="flex items-center mb-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {product.location.city} {product.location.district}
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(product.metadata.createdAt).toLocaleDateString('zh-TW')}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/products/${product.id}`}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white text-center rounded hover:bg-indigo-700 transition-colors"
                    >
                      查看詳情
                    </Link>
                    
                    <button
                      onClick={() => handleRemoveFromFavorites(product.id)}
                      className="px-4 py-2 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 分頁控制 */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mb-8">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded ${
                  page === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                上一頁
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 rounded ${
                    page === i + 1
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded ${
                  page === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 