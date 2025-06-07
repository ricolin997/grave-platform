'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { Product, ProductStatus, VerificationStatus } from '@/lib/types/product';

export default function ProductReviewPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // 載入待審核商品
  useEffect(() => {
    const fetchPendingProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await productsApi.getProducts({ 
          status: filterStatus as ProductStatus,
          page: currentPage,
          limit: 10
        });
        
        setProducts(response.products);
        setTotalPages(response.totalPages);
        setTotalProducts(response.total);
      } catch (err) {
        console.error('獲取待審核商品失敗', err);
        setError('無法獲取待審核商品，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProducts();
  }, [currentPage, filterStatus]);

  // 格式化時間
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // 處理審核狀態變更
  const handleApprove = async (productId: string) => {
    try {
      if (!confirm('確定要批准此商品嗎？')) return;
      
      await productsApi.approveProduct(productId);
      
      // 更新商品列表
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      // 更新總數
      setTotalProducts(prev => prev - 1);
    } catch (err) {
      console.error('批准商品失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleReject = async (productId: string) => {
    try {
      const reason = prompt('請輸入拒絕原因：');
      if (reason === null) return; // 用戶取消
      
      if (!reason.trim()) {
        alert('請提供拒絕原因');
        return;
      }
      
      await productsApi.rejectProduct(productId, reason);
      
      // 更新商品列表
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      // 更新總數
      setTotalProducts(prev => prev - 1);
    } catch (err) {
      console.error('拒絕商品失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  const handleRequestMoreInfo = async (productId: string) => {
    try {
      const message = prompt('請輸入需要賣家補充的信息：');
      if (message === null) return; // 用戶取消
      
      if (!message.trim()) {
        alert('請提供需要補充的信息內容');
        return;
      }
      
      await productsApi.requestMoreInfo(productId, message);
      
      // 更新商品列表
      setProducts(prevProducts => 
        prevProducts.filter(product => product.id !== productId)
      );
      
      // 更新總數
      setTotalProducts(prev => prev - 1);
    } catch (err) {
      console.error('請求更多信息失敗', err);
      alert('操作失敗，請稍後再試');
    }
  };

  // 獲取商品狀態標籤顏色
  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  // 轉換狀態顯示文字
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">商品審核管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            檢查並審核賣家提交的商品信息。
          </p>
        </div>

        <div className="flex space-x-2">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="pending">待審核</option>
            <option value="published">已批准</option>
            <option value="rejected">已拒絕</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">沒有待審核的商品</h3>
          <p className="text-gray-500">目前沒有需要審核的商品。</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    賣家
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    價格
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交時間
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    狀態
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative rounded overflow-hidden">
                          {product.basicInfo.images && product.basicInfo.images.length > 0 ? (
                            <Image 
                              src={product.basicInfo.images[0]} 
                              alt={product.basicInfo.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 flex items-center justify-center text-gray-500">
                              無圖
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 line-clamp-1">
                            {product.basicInfo.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {product.location.city} {product.location.district}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{product.sellerName || '未知賣家'}</div>
                      <div className="text-xs text-gray-500">ID: {product.sellerId.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        NT$ {product.basicInfo.price.toLocaleString()}
                      </div>
                      {product.basicInfo.negotiable && (
                        <div className="text-xs text-yellow-600">可議價</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(product.metadata.createdAt.toString())}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusText(product.status)}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVerificationColor(product.verification.status)}`}>
                          {product.verification.status === 'pending' ? '待驗證' : 
                           product.verification.status === 'verified' ? '已驗證' : 
                           product.verification.status === 'rejected' ? '拒絕驗證' : 
                           product.verification.status === 'needs_info' ? '需更多資訊' : 
                           product.verification.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/admin/products/review/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          查看
                        </Link>
                        
                        {product.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(product.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleReject(product.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              拒絕
                            </button>
                            <button
                              onClick={() => handleRequestMoreInfo(product.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              需更多資訊
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    顯示 <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> 到{' '}
                    <span className="font-medium">{Math.min(currentPage * 10, totalProducts)}</span> 項，共{' '}
                    <span className="font-medium">{totalProducts}</span> 項結果
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">上一頁</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* 頁碼按鈕 */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">下一頁</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 