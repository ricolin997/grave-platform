'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsApi } from '@/lib/api/products';

export default function SellerDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    reservedProducts: 0,
    soldProducts: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const reservedProducts = products.filter(p => p.status === 'reserved');
        const soldProducts = products.filter(p => p.status === 'sold');
        const totalViews = products.reduce((sum, product) => sum + product.statistics.views, 0);

        setStats({
          totalProducts: products.length,
          publishedProducts: publishedProducts.length,
          draftProducts: draftProducts.length,
          reservedProducts: reservedProducts.length,
          soldProducts: soldProducts.length,
          totalViews,
        });
      } catch (err) {
        console.error('獲取數據失敗', err);
        setError('無法載入數據，請稍後再試');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
      <h1 className="text-3xl font-bold mb-8">賣家中心</h1>

      {/* 基本統計摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">商品總數</h3>
          <p className="text-3xl font-bold text-indigo-600">{stats.totalProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">已發佈商品</h3>
          <p className="text-3xl font-bold text-green-600">{stats.publishedProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">草稿商品</h3>
          <p className="text-3xl font-bold text-yellow-600">{stats.draftProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">已預訂商品</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.reservedProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">已售出商品</h3>
          <p className="text-3xl font-bold text-gray-600">{stats.soldProducts}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">總瀏覽次數</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
        </div>
      </div>

      {/* 快速操作入口 */}
      <h2 className="text-2xl font-bold mb-6">快速操作</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Link href="/seller/products/new" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">發佈新商品</h3>
            <p className="text-gray-600">創建並發佈新的墓地產品到平台</p>
          </div>
        </Link>

        <Link href="/seller/products" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">管理商品</h3>
            <p className="text-gray-600">查看、編輯或刪除您的所有商品</p>
          </div>
        </Link>

        <Link href="/seller/statistics" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">銷售統計</h3>
            <p className="text-gray-600">查看詳細的銷售與統計數據</p>
          </div>
        </Link>
      </div>

      {/* 更多功能入口 */}
      <h2 className="text-2xl font-bold mb-6">管理工具</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">消息通知</h2>
          <p className="text-gray-600 mb-4">查看您的最新消息和通知。</p>
          <Link
            href="/seller/messages"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            查看消息
          </Link>
        </div>

        <Link href="#" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">訂單管理</h3>
            <p className="text-gray-600">處理預約與購買請求</p>
          </div>
        </Link>

        <Link href="#" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">賣家設定</h3>
            <p className="text-gray-600">管理您的賣家資料與設定</p>
          </div>
        </Link>

        <Link href="#" className="block">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">幫助中心</h3>
            <p className="text-gray-600">取得賣家指南與支援</p>
          </div>
        </Link>
      </div>

      {/* 提示區塊 */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r mb-8">
        <h3 className="text-lg font-semibold text-blue-700 mb-2">賣家提示</h3>
        <p className="text-blue-600">
          完整填寫商品資訊並上傳高品質照片可提高瀏覽量和銷售機會。確保您的價格設定合理且具有競爭力。
        </p>
      </div>
    </div>
  );
} 