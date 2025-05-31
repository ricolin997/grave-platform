'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// 定義城市和宗教選項
const cityOptions = [
  { value: '', label: '所有城市' },
  { value: '台北市', label: '台北市' },
  { value: '新北市', label: '新北市' },
  { value: '桃園市', label: '桃園市' },
  { value: '台中市', label: '台中市' },
  { value: '台南市', label: '台南市' },
  { value: '高雄市', label: '高雄市' },
  { value: '基隆市', label: '基隆市' },
  { value: '新竹市', label: '新竹市' },
  { value: '嘉義市', label: '嘉義市' },
  { value: '新竹縣', label: '新竹縣' },
  { value: '苗栗縣', label: '苗栗縣' },
  { value: '彰化縣', label: '彰化縣' },
  { value: '南投縣', label: '南投縣' },
  { value: '雲林縣', label: '雲林縣' },
  { value: '嘉義縣', label: '嘉義縣' },
  { value: '屏東縣', label: '屏東縣' },
  { value: '宜蘭縣', label: '宜蘭縣' },
  { value: '花蓮縣', label: '花蓮縣' },
  { value: '台東縣', label: '台東縣' },
  { value: '澎湖縣', label: '澎湖縣' },
];

const religionOptions = [
  { value: '', label: '所有宗教' },
  { value: '佛教', label: '佛教' },
  { value: '道教', label: '道教' },
  { value: '基督教', label: '基督教' },
  { value: '天主教', label: '天主教' },
  { value: '一般', label: '一般' },
];

const typeOptions = [
  { value: '', label: '所有類型' },
  { value: '單人塔位', label: '單人塔位' },
  { value: '雙人塔位', label: '雙人塔位' },
  { value: '家族塔位', label: '家族塔位' },
  { value: 'VIP塔位', label: 'VIP塔位' },
  { value: '基本契約', label: '基本契約' },
  { value: '標準契約', label: '標準契約' },
  { value: '豪華契約', label: '豪華契約' },
  { value: '定制契約', label: '定制契約' },
  { value: '其他', label: '其他' },
];

const floorOptions = [
  { value: '', label: '所有樓層' },
  { value: '1', label: '1樓' },
  { value: '2', label: '2樓' },
  { value: '3', label: '3樓' },
  { value: '4', label: '4樓' },
  { value: '5', label: '5樓' },
  { value: '6+', label: '6樓以上' },
];

const facingOptions = [
  { value: '', label: '所有朝向' },
  { value: '東', label: '朝東' },
  { value: '南', label: '朝南' },
  { value: '西', label: '朝西' },
  { value: '北', label: '朝北' },
  { value: '東南', label: '朝東南' },
  { value: '東北', label: '朝東北' },
  { value: '西南', label: '朝西南' },
  { value: '西北', label: '朝西北' },
];

const surroundingOptions = [
  { value: 'parking', label: '有停車場' },
  { value: 'temple', label: '有廟宇' },
  { value: 'restaurant', label: '有餐廳' },
  { value: 'transportation', label: '交通便利' },
];

const sortOptions = [
  { value: 'latest', label: '最新上架' },
  { value: 'price_asc', label: '價格由低到高' },
  { value: 'price_desc', label: '價格由高到低' },
  { value: 'views', label: '瀏覽次數' },
  { value: 'favorites', label: '收藏人數' },
];

export default function ProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  // 從 URL 參數獲取初始值
  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    district: searchParams.get('district') || '',
    religion: searchParams.get('religion') || '',
    type: searchParams.get('type') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    floor: searchParams.get('floor') || '',
    facing: searchParams.get('facing') || '',
    parking: searchParams.get('parking') === 'true',
    temple: searchParams.get('temple') === 'true',
    restaurant: searchParams.get('restaurant') === 'true',
    transportation: searchParams.get('transportation') === 'true',
    sort: searchParams.get('sort') || 'latest',
    keyword: searchParams.get('keyword') || '',
  });

  useEffect(() => {
    // 檢查是否有高級過濾器項目，如果有就打開高級過濾器區域
    const hasAdvancedFilters = 
      !!searchParams.get('floor') || 
      !!searchParams.get('facing') || 
      !!searchParams.get('parking') || 
      !!searchParams.get('temple') || 
      !!searchParams.get('restaurant') || 
      !!searchParams.get('transportation');
    
    setIsAdvancedOpen(hasAdvancedFilters);
  }, [searchParams]);

  // 處理輸入變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFilters(prev => ({ ...prev, [name]: checkbox.checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // 應用過濾器
  const applyFilters = () => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) params.set(key, 'true');
      } else if (value) {
        params.set(key, value.toString());
      }
    });
    
    // 重置頁碼
    params.set('page', '1');
    
    router.push(`/products?${params.toString()}`);
  };

  // 重置過濾器
  const resetFilters = () => {
    setFilters({
      city: '',
      district: '',
      religion: '',
      type: '',
      minPrice: '',
      maxPrice: '',
      floor: '',
      facing: '',
      parking: false,
      temple: false,
      restaurant: false,
      transportation: false,
      sort: 'latest',
      keyword: '',
    });
    router.push('/products');
  };

  // 處理排序變化
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setFilters(prev => ({ ...prev, sort: newSort }));
    
    // 立即應用排序變更
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', newSort);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold mb-4">搜尋過濾</h2>
        
        {/* 關鍵字搜索 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            關鍵字搜索
          </label>
          <div className="flex">
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleChange}
              placeholder="輸入關鍵字搜索"
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <button
              onClick={applyFilters}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 排序選項 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            排序方式
          </label>
          <select
            name="sort"
            value={filters.sort}
            onChange={handleSortChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              城市
            </label>
            <select
              name="city"
              value={filters.city}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {cityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              區域
            </label>
            <input
              type="text"
              name="district"
              value={filters.district}
              onChange={handleChange}
              placeholder="輸入區域"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              宗教信仰
            </label>
            <select
              name="religion"
              value={filters.religion}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {religionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品類型
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最低價格
            </label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleChange}
              placeholder="最低價格"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最高價格
            </label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleChange}
              placeholder="最高價格"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {/* 進階過濾選項 */}
        <div className="mb-6">
          <button 
            type="button" 
            className="flex items-center text-indigo-600 hover:text-indigo-800 focus:outline-none"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 mr-1 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            進階選項
          </button>
          
          {isAdvancedOpen && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    樓層
                  </label>
                  <select
                    name="floor"
                    value={filters.floor}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {floorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    朝向
                  </label>
                  <select
                    name="facing"
                    value={filters.facing}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {facingOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  周邊環境
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {surroundingOptions.map(option => (
                    <div key={option.value} className="flex items-center">
                      <input
                        id={`surrounding-${option.value}`}
                        name={option.value}
                        type="checkbox"
                        checked={filters[option.value as keyof typeof filters] as boolean}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`surrounding-${option.value}`} className="ml-2 text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={applyFilters}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            套用過濾
          </button>
          <button
            onClick={resetFilters}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            重置
          </button>
        </div>
      </div>
    </div>
  );
} 