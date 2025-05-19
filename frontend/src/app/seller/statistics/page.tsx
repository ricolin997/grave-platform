'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';

interface Statistics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  soldProducts: number;
  totalViews: number;
  totalFavorites: number;
  totalInquiries: number;
  popularProducts: Array<{
    id: string;
    title: string;
    views: number;
    price: number;
  }>;
  recentSales: Array<{
    id: string;
    title: string;
    price: number;
    soldAt: Date;
  }>;
}

export default function SellerStatisticsPage() {
  const [stats, setStats] = useState<Statistics>({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    soldProducts: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalInquiries: 0,
    popularProducts: [],
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 獲取所有商品
        const allProducts = await productsApi.getSellerProducts({ limit: 100 });
        const products = allProducts.products;

        // 計算基本統計信息
        const publishedProducts = products.filter(p => p.status === 'published');
        const draftProducts = products.filter(p => p.status === 'draft');
        const soldProducts = products.filter(p => p.status === 'sold');
        const totalViews = products.reduce((sum, product) => sum + product.statistics.views, 0);
        const totalFavorites = products.reduce((sum, product) => sum + product.statistics.favorites, 0);
        const totalInquiries = products.reduce((sum, product) => sum + product.statistics.inquiries, 0);

        // 按瀏覽量排序獲取熱門商品
        const popularProducts = [...products]
          .sort((a, b) => b.statistics.views - a.statistics.views)
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.basicInfo.title,
            views: p.statistics.views,
            price: p.basicInfo.price,
          }));

        // 獲取最近銷售
        const recentSales = soldProducts
          .filter(p => p.metadata.soldAt)
          .sort((a, b) => {
            // TypeScript需要非空斷言，因為我們已經過濾了soldAt為真的商品
            return new Date(b.metadata.soldAt!).getTime() - new Date(a.metadata.soldAt!).getTime();
          })
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.basicInfo.title,
            price: p.basicInfo.price,
            soldAt: p.metadata.soldAt as Date,
          }));

        setStats({
          totalProducts: products.length,
          publishedProducts: publishedProducts.length,
          draftProducts: draftProducts.length,
          soldProducts: soldProducts.length,
          totalViews,
          totalFavorites,
          totalInquiries,
          popularProducts,
          recentSales,
        });
      } catch (err) {
        console.error('獲取數據失敗', err);
        setError('無法載入數據，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">銷售統計</h1>

      {/* 時間範圍選擇 */}
      <div className="mb-8">
        <div className="flex space-x-2 border-b pb-2">
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-t-lg ${
              timeRange === 'week' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            本週
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-t-lg ${
              timeRange === 'month' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            本月
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-t-lg ${
              timeRange === 'year' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            本年
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded-t-lg ${
              timeRange === 'all' ? 'bg-indigo-100 font-medium text-indigo-700' : 'hover:bg-gray-100'
            }`}
          >
            全部
          </button>
        </div>
      </div>

      {/* 主要數據卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">商品總數</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalProducts}</p>
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>已發佈: {stats.publishedProducts}</span>
            <span>草稿: {stats.draftProducts}</span>
            <span>已售出: {stats.soldProducts}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">總瀏覽量</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalViews}</p>
          <p className="text-sm text-gray-500 mt-4">
            平均每個商品 {stats.totalProducts ? Math.round(stats.totalViews / stats.totalProducts) : 0} 次瀏覽
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">總收藏數</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.totalFavorites}</p>
          <p className="text-sm text-gray-500 mt-4">
            收藏率 {stats.totalViews ? Math.round((stats.totalFavorites / stats.totalViews) * 100) : 0}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">總詢問數</h3>
          <p className="text-3xl font-bold text-green-600">{stats.totalInquiries}</p>
          <p className="text-sm text-gray-500 mt-4">
            詢問率 {stats.totalViews ? Math.round((stats.totalInquiries / stats.totalViews) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 熱門商品 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">熱門商品</h2>
        {stats.popularProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    價格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    瀏覽量
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.popularProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900">
                        查看詳情
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">暫無熱門商品數據</p>
        )}
      </div>

      {/* 最近銷售 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">最近銷售</h2>
        {stats.recentSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名稱
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    價格
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    售出日期
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPrice(sale.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(sale.soldAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">暫無近期銷售記錄</p>
        )}
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/seller"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          返回儀表板
        </Link>
      </div>
    </div>
  );
} 