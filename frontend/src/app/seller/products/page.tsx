'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/lib/types/product';

export default function SellerProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [error, setError] = useState<string | null>(null);

  // 從查詢參數獲取當前頁碼和過濾狀態
  const page = searchParams.get('page')
    ? parseInt(searchParams.get('page') as string, 10)
    : 1;
  const status = searchParams.get('status') || undefined;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 執行 API 查詢
        const response = await productsApi.getSellerProducts({
          status,
          page,
          limit: 10,
        });
        
        setProducts(response.products);
        setPagination({
          total: response.total,
          page: response.page,
          totalPages: response.totalPages,
        });
      } catch (err) {
        console.error('獲取商品失敗', err);
        setError('無法載入商品，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [status, page]);

  // 刪除商品
  const handleDelete = async (id: string) => {
    if (window.confirm('確定要刪除這個商品嗎？此操作不可逆。')) {
      try {
        await productsApi.deleteProduct(id);
        
        // 重新獲取商品列表
        const response = await productsApi.getSellerProducts({
          status,
          page,
          limit: 10,
        });
        
        setProducts(response.products);
        setPagination({
          total: response.total,
          page: response.page,
          totalPages: response.totalPages,
        });
      } catch (err: unknown) {
        console.error('刪除商品失敗', err);
        alert('刪除商品失敗，請稍後再試');
      }
    }
  };

  // 標記為已售出
  const handleMarkAsSold = async (id: string) => {
    if (window.confirm('確定要將此商品標記為已售出嗎？')) {
      try {
        await productsApi.markAsSold(id);
        
        // 重新獲取商品列表
        const response = await productsApi.getSellerProducts({
          status,
          page,
          limit: 10,
        });
        
        setProducts(response.products);
        setPagination({
          total: response.total,
          page: response.page,
          totalPages: response.totalPages,
        });
      } catch (err: unknown) {
        console.error('標記為已售出失敗', err);
        alert('操作失敗，請稍後再試');
      }
    }
  };

  // 恢復商品為已發佈
  const handleRestoreToPublished = async (id: string) => {
    if (window.confirm('確定要將此商品恢復為已發佈狀態嗎？')) {
      try {
        await productsApi.restoreToPublished(id);
        
        // 重新獲取商品列表
        const response = await productsApi.getSellerProducts({
          status,
          page,
          limit: 10,
        });
        
        setProducts(response.products);
        setPagination({
          total: response.total,
          page: response.page,
          totalPages: response.totalPages,
        });
      } catch (err: unknown) {
        console.error('恢復商品狀態失敗', err);
        alert('操作失敗，請稍後再試');
      }
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

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW');
  };

  // 切換狀態篩選
  const changeStatusFilter = (newStatus?: string) => {
    const params = new URLSearchParams();
    if (newStatus) {
      params.set('status', newStatus);
    }
    router.push(`/seller/products?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">我的商品管理</h1>
        <Link
          href="/seller/products/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
        >
          新增商品
        </Link>
      </div>

      {/* 狀態篩選 */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
          <button
            onClick={() => changeStatusFilter(undefined)}
            className={`px-4 py-2 rounded-t-lg ${
              !status ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          
          <button
            onClick={() => changeStatusFilter('draft')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'draft' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            草稿
          </button>

          <button
            onClick={() => changeStatusFilter('pending')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'pending' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            待審核
          </button>
          
          <button
            onClick={() => changeStatusFilter('published')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'published' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            已發佈
          </button>
          
          <button
            onClick={() => changeStatusFilter('reserved')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'reserved' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            已預訂
          </button>
          
          <button
            onClick={() => changeStatusFilter('negotiating')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'negotiating' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            洽談中
          </button>
          
          <button
            onClick={() => changeStatusFilter('inspecting')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'inspecting' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            實地查看中
          </button>
          
          <button
            onClick={() => changeStatusFilter('completed')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'completed' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            已完成媒合
          </button>
          
          <button
            onClick={() => changeStatusFilter('rejected')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'rejected' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            審核被拒
          </button>
          
          <button
            onClick={() => changeStatusFilter('sold')}
            className={`px-4 py-2 rounded-t-lg ${
              status === 'sold' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            已售出
          </button>
          
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">還沒有商品</h3>
          <p className="text-gray-600 mb-4">您目前沒有任何商品。點擊「新增商品」來新增塔位商品或生前契約！</p>
          <Link
            href="/seller/products/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            新增商品
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    價格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    瀏覽次數
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    發佈日期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 flex-shrink-0 relative">
                          {product.basicInfo.images && product.basicInfo.images.length > 0 ? (
                            <Image
                              src={product.basicInfo.images[0]}
                              alt={product.basicInfo.title}
                              fill
                              className="object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500">無圖片</span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            <Link href={`/products/${product.id}`} className="hover:text-indigo-600">
                              {product.basicInfo.title}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.location.city} {product.location.district}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatPrice(product.basicInfo.price)}</div>
                      {product.basicInfo.negotiable && (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          可議價
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : product.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : product.status === 'sold'
                            ? 'bg-gray-100 text-gray-800'
                            : product.status === 'reserved'
                            ? 'bg-blue-100 text-blue-800'
                            : product.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : product.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : product.status === 'negotiating'
                            ? 'bg-purple-100 text-purple-800'
                            : product.status === 'inspecting'
                            ? 'bg-indigo-100 text-indigo-800'
                            : product.status === 'completed'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {product.status === 'published'
                          ? '已發佈'
                          : product.status === 'draft'
                          ? '草稿'
                          : product.status === 'sold'
                          ? '已售出'
                          : product.status === 'reserved'
                          ? '已預訂'
                          : product.status === 'pending'
                          ? '待審核'
                          : product.status === 'rejected'
                          ? '審核被拒'
                          : product.status === 'negotiating'
                          ? '洽談中'
                          : product.status === 'inspecting'
                          ? '實地查看中'
                          : product.status === 'completed'
                          ? '已完成媒合'
                          : '未知'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.statistics.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.metadata.publishedAt
                        ? formatDate(product.metadata.publishedAt)
                        : '尚未發佈'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/products/${product.id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            查看
                          </Link>
                          <Link
                            href={`/seller/products/edit/${product.id}`}
                            className="text-yellow-600 hover:text-yellow-900"
                          >
                            編輯
                          </Link>
                        </div>
                        <div className="flex space-x-2">
                          {product.status !== 'sold' && (
                            <button
                              onClick={() => handleMarkAsSold(product.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              標記已售
                            </button>
                          )}
                          {product.status === 'reserved' && (
                            <button
                              onClick={() => handleRestoreToPublished(product.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              恢復發佈
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分頁控制 */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center my-8">
              {pagination.page > 1 && (
                <Link
                  href={`/seller/products?${new URLSearchParams({
                    ...status ? { status } : {},
                    page: (pagination.page - 1).toString(),
                  })}`}
                  className="px-4 py-2 mx-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                >
                  上一頁
                </Link>
              )}
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Link
                  key={pageNum}
                  href={`/seller/products?${new URLSearchParams({
                    ...status ? { status } : {},
                    page: pageNum.toString(),
                  })}`}
                  className={`px-4 py-2 mx-1 rounded ${
                    pageNum === pagination.page
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </Link>
              ))}
              
              {pagination.page < pagination.totalPages && (
                <Link
                  href={`/seller/products?${new URLSearchParams({
                    ...status ? { status } : {},
                    page: (pagination.page + 1).toString(),
                  })}`}
                  className="px-4 py-2 mx-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                >
                  下一頁
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
} 