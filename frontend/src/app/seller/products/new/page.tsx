'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { CreateProductData } from '@/lib/types/product';
import ImageUploader from '@/components/products/ImageUploader';

export default function SellerAddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 商品類型選擇
  const [productCategory, setProductCategory] = useState<'tomb' | 'contract'>('tomb');
  
  // 表單數據
  const [formData, setFormData] = useState<Partial<CreateProductData>>({
    basicInfo: {
      title: '',
      description: '',
      price: 0,
      negotiable: false,
      images: [],
      video: undefined,
      virtualTour: undefined,
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
      productType: '',
      size: '',
      facing: '',
      floor: 0,
      religion: '',
      feng_shui: {
        environment: [],
        features: [],
        orientation: undefined,
      },
    },
    legalInfo: {
      registrationNumber: '',
      ownershipCertificate: '',
      propertyRights: [],
      transferable: true,
      restrictions: [],
      expiryDate: undefined,
    },
    verification: {
      documents: [],
    },
    status: 'draft',
  });

  // 欄位驗證錯誤信息
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // 是否顯示自定義輸入欄位
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [showCustomFacing, setShowCustomFacing] = useState(false);

  // 處理商品類型變更
  const handleProductCategoryChange = (category: 'tomb' | 'contract') => {
    setProductCategory(category);
    
    // 重設特性信息，因為不同商品類型的特性信息不同
    setFormData(prev => ({
      ...prev,
      features: {
        productType: '',
        size: '',
        facing: '',
        floor: 0,
        religion: '',
        feng_shui: {
          environment: [],
          features: [],
          orientation: undefined,
        },
      },
    }));
    
    // 重設相關錯誤信息
    const newFieldErrors = { ...fieldErrors };
    delete newFieldErrors.productType;
    delete newFieldErrors.size;
    delete newFieldErrors.facing;
    delete newFieldErrors.religion;
    setFieldErrors(newFieldErrors);
  };

  // 驗證欄位
  const validateField = (name: string, value: string | number | boolean | undefined) => {
    let error = '';
    
    // 根據欄位名稱進行不同的驗證
    switch(name) {
      case 'title':
        if (value && typeof value === 'string' && value.length > 50) error = '標題不能超過50個字';
        break;
      case 'price':
        if (value && typeof value === 'number' && (isNaN(value) || value <= 0)) error = '價格必須是大於0的數字';
        break;
      case 'registrationNumber':
        if (value && typeof value === 'string' && value.length < 4) error = '登記編號長度不能少於4個字符';
        break;
      case 'ownershipCertificate':
        if (value && typeof value === 'string' && value.length < 4) error = '所有權證明長度不能少於4個字符';
        break;
      // 可以添加更多欄位驗證
    }
    
    // 更新錯誤狀態
    setFieldErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === '';
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent, submitStatus: 'draft' | 'pending') => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // 重置所有欄位錯誤
      setFieldErrors({});
      
      // 驗證必填欄位
      const errors: Record<string, string> = {};
      
      // 驗證基本信息
      if (!formData.basicInfo?.title) errors.title = '商品標題不能為空';
      else if (typeof formData.basicInfo.title === 'string' && formData.basicInfo.title.length > 50) errors.title = '標題不能超過50個字';
      
      if (!formData.basicInfo?.price || typeof formData.basicInfo.price === 'number' && formData.basicInfo.price <= 0) errors.price = '價格必須大於0';
      
      if (!formData.basicInfo?.images || !Array.isArray(formData.basicInfo.images) || formData.basicInfo.images.length === 0) errors.images = '請上傳至少一張商品圖片';
      
      // 驗證位置信息
      if (!formData.location?.cemetery) errors.cemetery = '墓園名稱不能為空';
      if (!formData.location?.address) errors.address = '詳細地址不能為空';
      if (!formData.location?.city) errors.city = '城市不能為空';
      if (!formData.location?.district) errors.district = '地區不能為空';
      
      // 根據商品類型進行不同的驗證
      if (productCategory === 'tomb') {
        // 驗證塔位商品特點
        if (!formData.features?.productType) errors.productType = '塔位類型不能為空';
        if (!formData.features?.size) errors.size = '尺寸不能為空';
        if (!formData.features?.facing) errors.facing = '朝向不能為空';
        if (!formData.features?.religion) errors.religion = '宗教類型不能為空';
      } else if (productCategory === 'contract') {
        // 驗證生前契約商品特點
        if (!formData.features?.productType) errors.productType = '契約類型不能為空';
        if (!formData.features?.religion) errors.religion = '宗教類型不能為空';
      }
      
      // 驗證法律信息
      if (!formData.legalInfo?.registrationNumber) errors.registrationNumber = '登記編號不能為空';
      else if (typeof formData.legalInfo.registrationNumber === 'string' && formData.legalInfo.registrationNumber.length < 4) errors.registrationNumber = '登記編號長度不能少於4個字符';
      
      if (!formData.legalInfo?.ownershipCertificate) errors.ownershipCertificate = '所有權證明不能為空';
      else if (typeof formData.legalInfo.ownershipCertificate === 'string' && formData.legalInfo.ownershipCertificate.length < 4) errors.ownershipCertificate = '所有權證明長度不能少於4個字符';
      
      // 更新錯誤狀態
      setFieldErrors(errors);
      
      // 如果有錯誤，終止提交
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        
        // 找到第一個錯誤欄位並滾動到該位置
        const firstErrorField = Object.keys(errors)[0];
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
            errorElement.classList.add('ring-2', 'ring-red-500');
          }
        }, 100);
        
        throw new Error(`表單驗證失敗：有 ${Object.keys(errors).length} 個欄位需要修正`);
      }
      
      // 檢查 feng_shui 是否有值，如果沒有，創建一個空對象
      if (!formData.features?.feng_shui) {
        formData.features = {
          ...formData.features!,
          feng_shui: {
            environment: [],
            features: [],
          }
        };
      }
      
      // 構建提交表單數據
      const completeFormData: CreateProductData = {
        basicInfo: {
          title: formData.basicInfo!.title.trim(),
          description: (formData.basicInfo!.description || '').trim(),
          price: Number(formData.basicInfo!.price),
          negotiable: Boolean(formData.basicInfo!.negotiable),
          images: formData.basicInfo!.images || [],
          video: formData.basicInfo!.video,
          virtualTour: formData.basicInfo!.virtualTour,
        },
        location: {
          cemetery: formData.location!.cemetery.trim(),
          address: formData.location!.address.trim(),
          city: formData.location!.city.trim(),
          district: formData.location!.district.trim(),
          coordinates: {
            lat: Number(formData.location!.coordinates?.lat || 0),
            lng: Number(formData.location!.coordinates?.lng || 0),
          },
          surroundings: {
            parking: Boolean(formData.location!.surroundings?.parking),
            temple: Boolean(formData.location!.surroundings?.temple),
            restaurant: Boolean(formData.location!.surroundings?.restaurant),
            transportation: formData.location!.surroundings?.transportation || [],
          },
        },
        features: {
          productType: String(formData.features!.productType || '').trim(),
          size: productCategory === 'contract' ? '生前契約-無需填寫' : String(formData.features!.size || '').trim(),
          facing: productCategory === 'contract' ? '生前契約-無需填寫' : String(formData.features!.facing || '').trim(),
          floor: Number(formData.features!.floor || 0),
          religion: String(formData.features!.religion || '').trim(),
          feng_shui: {
            orientation: formData.features!.feng_shui?.orientation?.trim(),
            environment: formData.features!.feng_shui?.environment || [],
            features: formData.features!.feng_shui?.features || [],
          },
        },
        legalInfo: {
          registrationNumber: formData.legalInfo!.registrationNumber.trim(),
          ownershipCertificate: formData.legalInfo!.ownershipCertificate.trim(),
          propertyRights: formData.legalInfo!.propertyRights || [],
          expiryDate: formData.legalInfo!.expiryDate,
          transferable: formData.legalInfo!.transferable === undefined ? true : Boolean(formData.legalInfo!.transferable),
          restrictions: formData.legalInfo!.restrictions || [],
        },
        verification: {
          documents: formData.verification!.documents || [],
        },
        status: submitStatus,
      };
      
      // 檢查 features 中的字段，確保它們都是字符串而不是物件
      console.log('商品 features 類型檢查:', {
        productType: typeof completeFormData.features.productType,
        size: typeof completeFormData.features.size,
        facing: typeof completeFormData.features.facing,
        floor: typeof completeFormData.features.floor,
        religion: typeof completeFormData.features.religion,
      });
      
      // 輸出提交的數據（調試用）
      console.log('表單提交數據:', JSON.stringify(completeFormData, null, 2));
      
      // 提交表單
      const product = await productsApi.create(completeFormData);
      console.log('創建商品成功:', product);
      router.push('/seller/products');
    } catch (err: unknown) {
      console.error('創建商品失敗:', err);
      
      // 處理後端返回的驗證錯誤
      const error = err as { message?: string; validationErrors?: Record<string, string> };
      if (error.validationErrors) {
        const validationErrors: Record<string, string> = {};
        
        // 處理嵌套的驗證錯誤
        for (const key in error.validationErrors) {
          const path = key.split('.');
          
          if (path.length === 1) {
            validationErrors[key] = error.validationErrors[key];
          } else {
            // 處理嵌套屬性，例如 basicInfo.title
            const field = path[path.length - 1];
            validationErrors[field] = error.validationErrors[key];
            
            // 如果是生前契約特有的錯誤，進行特殊處理
            if (productCategory === 'contract' && (field === 'size' || field === 'facing')) {
              // 這些欄位在生前契約中不應該顯示錯誤，忽略它們
              delete validationErrors[field];
            }
          }
        }
        
        setFieldErrors(validationErrors);
        
        // 找到第一個錯誤欄位並滾動到該位置
        const firstErrorField = Object.keys(validationErrors)[0];
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField);
          if (errorElement) {
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            errorElement.focus();
            errorElement.classList.add('ring-2', 'ring-red-500');
          }
        }, 100);
        
        setError(`表單驗證失敗：有 ${Object.keys(validationErrors).length} 個欄位需要修正`);
      } else {
        setError(error.message || '創建商品失敗，請稍後再試');
      }
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
    
    // 驗證欄位
    validateField(name, value);
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
    
    // 檢查是否選擇了「其他尺寸」或「其他朝向」
    if (name === 'size') {
      setShowCustomSize(value === '其他尺寸');
    } else if (name === 'facing') {
      setShowCustomFacing(value === '其他朝向');
    }
    
    // 確保 type 是字符串而不是物件
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        [name]: value,
      },
    }));
  };

  // 處理自定義尺寸變化
  const handleCustomSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        size: value,
      },
    }));
  };
  
  // 處理自定義朝向變化
  const handleCustomFacingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features!,
        facing: value,
      },
    }));
  };

  // 處理法律信息變化
  const handleLegalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      legalInfo: {
        ...prev.legalInfo!,
        [name]: type === 'number' ? parseFloat(value) : value,
      },
    }));
    
    // 驗證欄位
    validateField(name, value);
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">新增商品</h1>
        <button
          onClick={() => router.push('/seller/products')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          返回商品管理
        </button>
      </div>
      
      {/* 商品類型選擇 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">選擇商品類型</h2>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => handleProductCategoryChange('tomb')}
            className={`flex-1 py-3 rounded-lg border-2 ${
              productCategory === 'tomb'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-lg font-medium">塔位商品</div>
            <div className="text-sm text-gray-500">骨灰塔位、納骨塔等</div>
          </button>
          <button
            type="button"
            onClick={() => handleProductCategoryChange('contract')}
            className={`flex-1 py-3 rounded-lg border-2 ${
              productCategory === 'contract'
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-lg font-medium">生前契約</div>
            <div className="text-sm text-gray-500">預先規劃的喪葬服務契約</div>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <h3 className="text-lg font-bold text-red-700 mb-2">表單驗證錯誤</h3>
          <p className="text-red-700">{error}</p>
          
          {/* 錯誤欄位摘要 */}
          {Object.keys(fieldErrors).length > 0 && (
            <div className="mt-2">
              <p className="font-semibold text-red-700">請修正以下欄位:</p>
              <ul className="list-disc list-inside mt-1">
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field} className="text-red-600">
                    <button 
                      type="button"
                      onClick={() => {
                        const element = document.getElementById(field);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.focus();
                        }
                      }}
                      className="underline hover:text-red-800"
                    >
                      {field === 'title' && '商品標題'}
                      {field === 'description' && '商品描述'}
                      {field === 'price' && '價格'}
                      {field === 'images' && '商品圖片'}
                      {field === 'cemetery' && '墓園名稱'}
                      {field === 'address' && '詳細地址'}
                      {field === 'city' && '城市'}
                      {field === 'district' && '區域'}
                      {field === 'productType' && (productCategory === 'tomb' ? '塔位類型' : '契約類型')}
                      {field === 'size' && '尺寸'}
                      {field === 'facing' && '朝向'}
                      {field === 'religion' && '宗教類型'}
                      {field === 'registrationNumber' && '登記編號'}
                      {field === 'ownershipCertificate' && '所有權證明'}
                      {field === 'customSize' && '自定義尺寸'}
                      {field === 'customFacing' && '自定義朝向'}
                      {field === 'contractServices' && '服務內容'}
                      {field === 'contractDetails' && '契約細節'}
                    </button>: {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={(e) => handleSubmit(e, 'pending')} className="space-y-8">
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.title ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請輸入清晰明確的標題，最多50個字"
                required
              />
              {fieldErrors.title && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
              )}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.price ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請輸入整數金額，如：10000"
                min="0"
                required
              />
              {fieldErrors.price && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.price}</p>
              )}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.description ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請詳細描述商品，包括其特點、條件等信息"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                商品圖片 <span className="text-red-500">*</span>
              </label>
              <div className={fieldErrors.images ? 'border-2 border-red-500 p-2 rounded-lg' : ''}>
                <ImageUploader
                  images={formData.basicInfo?.images || []}
                  onChange={handleImagesChange}
                  maxImages={8}
                />
              </div>
              {fieldErrors.images && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.images}</p>
              )}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.cemetery ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="例如：福田墓園、天寧寺墓園"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="address">
                詳細地址 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.location?.address || ''}
                onChange={handleLocationChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.address ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請輸入完整地址，如：台北市內湖區福田路123號"
                required
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.city ? 'border-red-500 bg-red-50' : ''
                }`}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.district ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="例如：內湖區、中正區"
                required
              />
            </div>
          </div>
        </div>
        
        {/* 特性信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {productCategory === 'tomb' ? '塔位特性' : '契約特性'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="productType">
                {productCategory === 'tomb' ? '塔位類型' : '契約類型'} <span className="text-red-500">*</span>
              </label>
              <select
                id="productType"
                name="productType"
                value={formData.features?.productType || ''}
                onChange={handleFeaturesChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.productType ? 'border-red-500 bg-red-50' : ''
                }`}
                required
              >
                <option value="">請選擇{productCategory === 'tomb' ? '塔位類型' : '契約類型'}</option>
                {productCategory === 'tomb' ? (
                  <>
                    <option value="單人塔位">單人塔位</option>
                    <option value="雙人塔位">雙人塔位</option>
                    <option value="家族塔位">家族塔位</option>
                    <option value="VIP塔位">VIP塔位</option>
                    <option value="其他">其他</option>
                  </>
                ) : (
                  <>
                    <option value="基本契約">基本契約</option>
                    <option value="標準契約">標準契約</option>
                    <option value="豪華契約">豪華契約</option>
                    <option value="定制契約">定制契約</option>
                    <option value="其他">其他</option>
                  </>
                )}
              </select>
              {fieldErrors.productType && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.productType}</p>
              )}
            </div>
            
            {productCategory === 'tomb' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="size">
                    尺寸 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="size"
                    name="size"
                    value={formData.features?.size || ''}
                    onChange={handleFeaturesChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.size ? 'border-red-500 bg-red-50' : ''
                    }`}
                    required
                  >
                    <option value="">請選擇尺寸</option>
                    <option value="2尺X2尺">2尺X2尺</option>
                    <option value="50公分X50公分">50公分X50公分</option>
                    <option value="2.5尺X2.5尺">2.5尺X2.5尺</option>
                    <option value="3尺X3尺">3尺X3尺</option>
                    <option value="60公分X60公分">60公分X60公分</option>
                    <option value="70公分X70公分">70公分X70公分</option>
                    <option value="80公分X80公分">80公分X80公分</option>
                    <option value="2尺X3尺">2尺X3尺</option>
                    <option value="2尺X4尺">2尺X4尺</option>
                    <option value="其他尺寸">其他尺寸</option>
                  </select>
                  
                  {showCustomSize && (
                    <div className="mt-2">
                      <input
                        type="text"
                        id="customSize"
                        name="customSize"
                        value={formData.features?.size !== '其他尺寸' ? formData.features?.size || '' : ''}
                        onChange={handleCustomSizeChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="請輸入自定義尺寸，如：1.8尺X2.2尺"
                        required
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="facing">
                    朝向 <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="facing"
                    name="facing"
                    value={formData.features?.facing || ''}
                    onChange={handleFeaturesChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      fieldErrors.facing ? 'border-red-500 bg-red-50' : ''
                    }`}
                    required
                  >
                    <option value="">請選擇朝向</option>
                    <option value="坐北朝南">坐北朝南</option>
                    <option value="坐南朝北">坐南朝北</option>
                    <option value="坐東朝西">坐東朝西</option>
                    <option value="坐西朝東">坐西朝東</option>
                    <option value="坐東北朝西南">坐東北朝西南</option>
                    <option value="坐西南朝東北">坐西南朝東北</option>
                    <option value="坐東南朝西北">坐東南朝西北</option>
                    <option value="坐西北朝東南">坐西北朝東南</option>
                    <option value="朝山">朝山</option>
                    <option value="朝水">朝水</option>
                    <option value="其他朝向">其他朝向</option>
                  </select>
                  
                  {showCustomFacing && (
                    <div className="mt-2">
                      <input
                        type="text"
                        id="customFacing"
                        name="customFacing"
                        value={formData.features?.facing !== '其他朝向' ? formData.features?.facing || '' : ''}
                        onChange={handleCustomFacingChange}
                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="請輸入自定義朝向"
                        required
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="floor">
                    樓層
                  </label>
                  <input
                    type="number"
                    id="floor"
                    name="floor"
                    value={formData.features?.floor || ''}
                    onChange={handleFeaturesChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="請輸入樓層數字，例如：1、2、3"
                  />
                </div>
              </>
            )}
            
            {productCategory === 'contract' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="contractServices">
                    服務內容
                  </label>
                  <textarea
                    id="contractServices"
                    name="contractServices"
                    value={formData.features?.feng_shui?.features.join('\n') || ''}
                    onChange={(e) => {
                      const value = e.target.value.split('\n');
                      setFormData(prev => ({
                        ...prev,
                        features: {
                          ...prev.features!,
                          feng_shui: {
                            ...prev.features?.feng_shui || { environment: [], orientation: undefined },
                            features: value,
                          },
                        },
                      }));
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="請詳細列出契約包含的服務內容，每行一項，如：遺體接運、壽衣著裝、告別式場地"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="contractDetails">
                    契約細節
                  </label>
                  <textarea
                    id="contractDetails"
                    name="contractDetails"
                    value={formData.features?.feng_shui?.environment.join('\n') || ''}
                    onChange={(e) => {
                      const value = e.target.value.split('\n');
                      setFormData(prev => ({
                        ...prev,
                        features: {
                          ...prev.features!,
                          feng_shui: {
                            ...prev.features?.feng_shui || { features: [], orientation: undefined },
                            environment: value,
                          },
                        },
                      }));
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="請描述契約細節，每行一項，如：適用期限、升級選項"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="religion">
                宗教類型 <span className="text-red-500">*</span>
              </label>
              <select
                id="religion"
                name="religion"
                value={formData.features?.religion || ''}
                onChange={handleFeaturesChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.religion ? 'border-red-500 bg-red-50' : ''
                }`}
                required
              >
                <option value="">請選擇宗教類型</option>
                <option value="佛教">佛教</option>
                <option value="道教">道教</option>
                <option value="基督教">基督教</option>
                <option value="天主教">天主教</option>
                <option value="一般">一般</option>
                <option value="其他">其他</option>
              </select>
            </div>

            {productCategory === 'tomb' && (
              <>
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="feng_shui_environment">
                    環境描述
                  </label>
                  <textarea
                    id="feng_shui_environment"
                    name="feng_shui_environment"
                    value={formData.features?.feng_shui?.environment.join('\n') || ''}
                    onChange={(e) => {
                      const value = e.target.value.split('\n');
                      setFormData(prev => ({
                        ...prev,
                        features: {
                          ...prev.features!,
                          feng_shui: {
                            ...prev.features?.feng_shui || { features: [], orientation: undefined },
                            environment: value,
                          },
                        },
                      }));
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="請描述周圍環境，每行一項特點，如：山水環繞、靠近主道"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="feng_shui_features">
                    風水特點
                  </label>
                  <textarea
                    id="feng_shui_features"
                    name="feng_shui_features"
                    value={formData.features?.feng_shui?.features.join('\n') || ''}
                    onChange={(e) => {
                      const value = e.target.value.split('\n');
                      setFormData(prev => ({
                        ...prev,
                        features: {
                          ...prev.features!,
                          feng_shui: {
                            ...prev.features?.feng_shui || { environment: [], orientation: undefined },
                            features: value,
                          },
                        },
                      }));
                    }}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="請描述風水特點，每行一項，如：藏風聚氣、左青龍右白虎"
                  />
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 法律信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">法律信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="registrationNumber">
                登記編號 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.legalInfo?.registrationNumber || ''}
                onChange={handleLegalInfoChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.registrationNumber ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請輸入官方登記編號，如：A12345678"
                required
              />
              {fieldErrors.registrationNumber && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.registrationNumber}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="ownershipCertificate">
                所有權證明 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ownershipCertificate"
                name="ownershipCertificate"
                value={formData.legalInfo?.ownershipCertificate || ''}
                onChange={handleLegalInfoChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  fieldErrors.ownershipCertificate ? 'border-red-500 bg-red-50' : ''
                }`}
                placeholder="請輸入所有權證明文件編號或名稱"
                required
              />
              {fieldErrors.ownershipCertificate && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.ownershipCertificate}</p>
              )}
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="propertyRights">
                產權
              </label>
              <textarea
                id="propertyRights"
                name="propertyRights"
                value={formData.legalInfo?.propertyRights.join('\n') || ''}
                onChange={(e) => {
                  const value = e.target.value.split('\n');
                  setFormData(prev => ({
                    ...prev,
                    legalInfo: {
                      ...prev.legalInfo!,
                      propertyRights: value,
                    },
                  }));
                }}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="請描述產權信息，每行一項，如：永久產權、50年使用權"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="expiryDate">
                到期日
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.legalInfo?.expiryDate?.toISOString().split('T')[0] || ''}
                onChange={(e) => {
                  const value = e.target.value ? new Date(e.target.value) : undefined;
                  setFormData(prev => ({
                    ...prev,
                    legalInfo: {
                      ...prev.legalInfo!,
                      expiryDate: value,
                    },
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="如有產權到期日，請選擇日期"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="transferable">
                可轉讓
              </label>
              <select
                id="transferable"
                name="transferable"
                value={formData.legalInfo?.transferable ? '是' : '否'}
                onChange={(e) => {
                  const value = e.target.value === '是';
                  setFormData(prev => ({
                    ...prev,
                    legalInfo: {
                      ...prev.legalInfo!,
                      transferable: value,
                    },
                  }));
                }}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="是">是</option>
                <option value="否">否</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="restrictions">
                限制
              </label>
              <textarea
                id="restrictions"
                name="restrictions"
                value={formData.legalInfo?.restrictions.join('\n') || ''}
                onChange={(e) => {
                  const value = e.target.value.split('\n');
                  setFormData(prev => ({
                    ...prev,
                    legalInfo: {
                      ...prev.legalInfo!,
                      restrictions: value,
                    },
                  }));
                }}
                rows={4}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="請描述使用限制，每行一項，如：不可改建、需按規定祭拜"
              />
            </div>
          </div>
        </div>
        
        {/* 按鈕 */}
        <div className="mt-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  請選擇是保存為草稿還是提交審核。<strong>提交審核</strong>後的商品將等待管理員審核通過後才能在平台上顯示。
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'draft')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  處理中...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  保存為草稿
                </>
              )}
            </button>
            <button
              type="button" 
              onClick={(e) => handleSubmit(e, 'pending')}
              className="w-full px-4 py-3 border border-transparent rounded-lg shadow-sm bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  處理中...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  提交審核
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => router.push('/seller/products')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            disabled={loading}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
} 