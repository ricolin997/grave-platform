'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductFilter from '@/components/products/ProductFilter';
import ProductCard from '@/components/products/ProductCard';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/lib/types/product';
import { useAuth } from '@/lib/contexts/AuthContext';

// 定義過濾器標籤的標籤名稱映射
const filterLabels: Record<string, string> = {
  city: '城市',
  district: '區域',
  religion: '宗教信仰',
  type: '塔位類型',
  minPrice: '最低價格',
  maxPrice: '最高價格',
  floor: '樓層',
  facing: '朝向',
  parking: '有停車場',
  temple: '有廟宇',
  restaurant: '有餐廳',
  transportation: '交通便利',
  keyword: '關鍵字',
};

// 定義排序選項映射
const sortLabels: Record<string, string> = {
  latest: '最新上架',
  price_asc: '價格由低到高',
  price_desc: '價格由高到低',
  views: '瀏覽次數',
  favorites: '收藏人數',
};

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const observer = useRef<IntersectionObserver | null>(null);

  // 從查詢參數獲取當前排序方式
  const sort = searchParams.get('sort') || 'latest';

  // 獲取用戶收藏
  useEffect(() => {
    if (user) {
      const fetchFavorites = async () => {
        try {
          const response = await productsApi.getFavorites();
          const favoriteIds = response.products.map(product => product.id);
          setFavorites(favoriteIds);
        } catch (err) {
          console.error('獲取收藏失敗', err);
        }
      };
      
      fetchFavorites();
    }
  }, [user]);

  // 構建查詢對象
  const buildQuery = (page: number) => {
    return {
      city: searchParams.get('city') || undefined,
      district: searchParams.get('district') || undefined,
      religion: searchParams.get('religion') || undefined,
      minPrice: searchParams.get('minPrice') 
        ? parseInt(searchParams.get('minPrice') as string, 10) 
        : undefined,
      maxPrice: searchParams.get('maxPrice') 
        ? parseInt(searchParams.get('maxPrice') as string, 10) 
        : undefined,
      type: searchParams.get('type') || undefined,
      floor: searchParams.get('floor') || undefined,
      facing: searchParams.get('facing') || undefined,
      parking: searchParams.get('parking') === 'true' ? true : undefined,
      temple: searchParams.get('temple') === 'true' ? true : undefined,
      restaurant: searchParams.get('restaurant') === 'true' ? true : undefined,
      transportation: searchParams.get('transportation') === 'true' ? true : undefined,
      keyword: searchParams.get('keyword') || undefined,
      sort,
      page,
      limit: 12,
    };
  };

  // 獲取產品數據
  const fetchProducts = async (page: number, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // 執行 API 查詢
      const query = buildQuery(page);
      const response = await productsApi.getProducts(query);

      // 如果用戶已登錄，標記收藏狀態
      let newProducts = response.products;
      if (user && favorites.length > 0) {
        newProducts = response.products.map(product => ({
          ...product,
          isFavorited: favorites.includes(product.id),
        }));
      }

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setPagination({
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      });
      setCurrentPage(page);
    } catch (err) {
      console.error('獲取商品失敗', err);
      setError('無法載入商品，請稍後再試');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 初始加載
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, false);
  }, [searchParams, sort, favorites, user]);

  // 無限滾動監聽器
  const lastProductRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < pagination.totalPages) {
        fetchProducts(currentPage + 1, true);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, currentPage, pagination.totalPages]);

  // 處理收藏變化
  const handleFavoriteChange = (productId: string, isFavorite: boolean) => {
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, isFavorited: isFavorite } 
          : product
      )
    );

    // 更新收藏列表
    if (isFavorite) {
      setFavorites(prev => [...prev, productId]);
    } else {
      setFavorites(prev => prev.filter(id => id !== productId));
    }
  };

  // 獲取活躍的過濾條件
  const getActiveFilters = () => {
    const activeFilters: Array<{key: string, value: string, label: string}> = [];
    
    searchParams.forEach((value, key) => {
      if (key !== 'page' && key !== 'sort' && value) {
        if (key === 'minPrice') {
          activeFilters.push({
            key,
            value,
            label: `${filterLabels[key]}: NT$ ${value}`,
          });
        } else if (key === 'maxPrice') {
          activeFilters.push({
            key,
            value,
            label: `${filterLabels[key]}: NT$ ${value}`,
          });
        } else if (key === 'parking' || key === 'temple' || key === 'restaurant' || key === 'transportation') {
          if (value === 'true') {
            activeFilters.push({
              key,
              value,
              label: filterLabels[key],
            });
          }
        } else {
          activeFilters.push({
            key,
            value,
            label: `${filterLabels[key]}: ${value}`,
          });
        }
      }
    });
    
    return activeFilters;
  };

  // 移除單個過濾條件
  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    return '/products?' + params.toString();
  };

  // 清除所有過濾條件
  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (searchParams.has('sort')) {
      params.set('sort', searchParams.get('sort')!);
    }
    return '/products?' + params.toString();
  };

  // 生成結果描述
  const getResultDescription = () => {
    const activeFilters = getActiveFilters();
    let description = `共 ${pagination.total} 個符合`;
    
    if (activeFilters.length > 0) {
      description += '以下條件';
    }
    
    return `${description}的塔位`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">塔位列表</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 左側過濾器 */}
        <div className="lg:col-span-1">
          <ProductFilter />
        </div>
        
        {/* 右側商品列表 */}
        <div className="lg:col-span-3">
          {/* 排序和過濾條件 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-lg font-semibold">{getResultDescription()}</h2>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="sort" className="mr-2 text-sm text-gray-600">排序方式:</label>
              <select
                id="sort"
                className="border rounded p-2 text-sm"
                value={sort}
                onChange={(e) => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('sort', e.target.value);
                  window.location.href = '/products?' + params.toString();
                }}
              >
                {Object.entries(sortLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* 活躍過濾條件標籤 */}
          {getActiveFilters().length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-gray-600">已選條件:</span>
              
              {getActiveFilters().map((filter) => (
                <Link
                  key={`${filter.key}-${filter.value}`}
                  href={removeFilter(filter.key)}
                  className="inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm text-gray-700 hover:bg-gray-200"
                >
                  {filter.label}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Link>
              ))}
              
              <Link
                href={clearAllFilters()}
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm"
              >
                清除全部
              </Link>
            </div>
          )}
          
          {/* 錯誤提示 */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {/* 商品列表 */}
          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
              <h3 className="text-lg font-semibold mb-2">未找到符合條件的塔位</h3>
              <p className="text-gray-600 mb-4">請嘗試調整搜索條件或查看所有塔位</p>
              <Link
                href="/products"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                查看所有塔位
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product, index) => {
                  if (index === products.length - 1) {
                    return (
                      <div ref={lastProductRef} key={product.id}>
                        <ProductCard 
                          product={product} 
                          onFavoriteChange={handleFavoriteChange}
                        />
                      </div>
                    );
                  } else {
                    return (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onFavoriteChange={handleFavoriteChange}
                      />
                    );
                  }
                })}
              </div>
              
              {/* 加載更多指示器 */}
              {loadingMore && (
                <div className="flex justify-center my-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              )}
              
              {/* "返回頂部"按鈕 */}
              {products.length > 12 && (
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="fixed bottom-8 right-8 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors z-10"
                  aria-label="返回頂部"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 