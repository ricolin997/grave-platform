'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { CreateProductData } from '@/lib/types/product';
import ImageUploader from '@/components/products/ImageUploader';

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 表單數據
  const [formData, setFormData] = useState<Partial<CreateProductData>>({
    basicInfo: {
      title: '',
      description: '',
      price: 0,
      negotiable: false,
      images: [],
    },
    location: {
      cemetery: '',
      address: '',
      city: '',
      district: '',
      coordinates: {
        lat: 0,
        lng: 0,
      },
      surroundings: {
        parking: false,
        temple: false,
        restaurant: false,
        transportation: [],
      },
    },
    features: {
      type: '',
      size: '',
      facing: '',
      floor: 0,
      religion: '',
      feng_shui: {
        environment: [],
        features: [],
      },
    },
    legalInfo: {
      registrationNumber: '',
      ownershipCertificate: '',
      propertyRights: [],
      transferable: true,
      restrictions: [],
    },
    verification: {
      documents: [],
    },
    status: 'draft',
  });

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // 基本驗證
      if (!formData.basicInfo?.title || !formData.basicInfo?.price) {
        throw new Error('請填寫商品標題和價格');
      }
      
      // 提交表單
      await productsApi.create(formData as CreateProductData);
      
      // 提交成功後跳轉到產品列表頁
      router.push('/products');
      
    } catch (err: unknown) {
      console.error('添加商品失敗', err);
      setError(
        err instanceof Error 
          ? err.message 
          : '添加商品失敗，請檢查您的輸入並重試'
      );
    } finally {
      setLoading(false);
    }
  };

  // 處理輸入變化（基本信息）
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo!,
        [name]: type === 'number' ? parseFloat(value) : value,
      },
    }));
  };

  // 處理勾選框變化
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo!,
        [name]: checked,
      },
    }));
  };

  // 處理位置信息變化
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location!,
        [name]: value,
      },
    }));
  };

  // 處理特性信息變化
  const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        [name]: value,
      },
    }));
  };

  // 處理圖片變化
  const handleImagesChange = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo!,
        images,
      },
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">添加新塔位</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">基本信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="title">
                商品標題 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.basicInfo?.title || ''}
                onChange={handleBasicInfoChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="price">
                價格 (NT$) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.basicInfo?.price || ''}
                onChange={handleBasicInfoChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2" htmlFor="description">
                商品描述
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.basicInfo?.description || ''}
                onChange={handleBasicInfoChange}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                商品圖片
              </label>
              <ImageUploader
                images={formData.basicInfo?.images || []}
                onChange={handleImagesChange}
                maxImages={8}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="negotiable"
                  checked={formData.basicInfo?.negotiable || false}
                  onChange={handleCheckboxChange}
                  className="mr-2 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">價格可商議</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* 位置信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">位置信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="cemetery">
                墓園名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cemetery"
                name="cemetery"
                value={formData.location?.cemetery || ''}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="address">
                詳細地址
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.location?.address || ''}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="city">
                城市 <span className="text-red-500">*</span>
              </label>
              <select
                id="city"
                name="city"
                value={formData.location?.city || ''}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">請選擇城市</option>
                <option value="台北市">台北市</option>
                <option value="新北市">新北市</option>
                <option value="桃園市">桃園市</option>
                <option value="台中市">台中市</option>
                <option value="高雄市">高雄市</option>
                {/* 可根據需要添加更多選項 */}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="district">
                區域 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.location?.district || ''}
                onChange={handleLocationChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
        </div>
        
        {/* 塔位特性 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">塔位特性</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="type">
                塔位類型 <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.features?.type || ''}
                onChange={handleFeaturesChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">請選擇類型</option>
                <option value="單人塔位">單人塔位</option>
                <option value="雙人塔位">雙人塔位</option>
                <option value="家庭塔位">家庭塔位</option>
                <option value="骨灰罐位">骨灰罐位</option>
                <option value="其他">其他</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="size">
                塔位尺寸
              </label>
              <input
                type="text"
                id="size"
                name="size"
                value={formData.features?.size || ''}
                onChange={handleFeaturesChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：30x30cm"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="religion">
                宗教屬性 <span className="text-red-500">*</span>
              </label>
              <select
                id="religion"
                name="religion"
                value={formData.features?.religion || ''}
                onChange={handleFeaturesChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">請選擇宗教</option>
                <option value="佛教">佛教</option>
                <option value="道教">道教</option>
                <option value="基督教">基督教</option>
                <option value="天主教">天主教</option>
                <option value="伊斯蘭教">伊斯蘭教</option>
                <option value="無宗教限制">無宗教限制</option>
                <option value="其他">其他</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="facing">
                朝向
              </label>
              <input
                type="text"
                id="facing"
                name="facing"
                value={formData.features?.facing || ''}
                onChange={handleFeaturesChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：坐北朝南"
              />
            </div>
          </div>
        </div>
        
        {/* 按鈕 */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? '處理中...' : '保存並發佈'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
} 