'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { productsApi } from '@/lib/api/products';
import { Product, UpdateProductData } from '@/lib/types/product';
import ImageUploader from '@/components/products/ImageUploader';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  
  // 商品類型選擇（塔位或生前契約）
  const [productCategory, setProductCategory] = useState<'tomb' | 'contract'>('tomb');
  
  // 表單數據
  const [formData, setFormData] = useState<UpdateProductData>({
    basicInfo: {
      title: '',
      description: '',
      price: 0,
      negotiable: false,
      images: [],
      video: '',
      virtualTour: '',
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
        orientation: '',
        environment: [],
        features: [],
      },
    },
    legalInfo: {
      registrationNumber: '',
      ownershipCertificate: '',
      propertyRights: [],
      expiryDate: undefined,
      transferable: true,
      restrictions: [],
    },
    verification: {
      documents: [],
    },
    status: 'draft' as 'draft' | 'published' | 'pending',
  });

  // 獲取商品數據
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!params.id) {
          throw new Error('商品ID不存在');
        }
        
        const productData = await productsApi.getProduct(params.id as string);
        setProduct(productData);
        
        // 根據商品類型判斷是塔位商品還是生前契約
        const isContract = ['基本契約', '標準契約', '豪華契約', '定制契約'].includes(productData.features.productType);
        setProductCategory(isContract ? 'contract' : 'tomb');
        
        // 設置表單數據
        setFormData({
          basicInfo: productData.basicInfo,
          location: productData.location,
          features: productData.features,
          legalInfo: productData.legalInfo,
          verification: productData.verification,
          status: (productData.status === 'draft' || productData.status === 'published') 
            ? productData.status 
            : 'draft', // 如果是已預訂或已售出狀態，表單內顯示為草稿狀態但不可更改
        });
      } catch (err: unknown) {
        console.error('獲取商品失敗', err);
        setError('無法載入商品信息，請稍後再試');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [params.id]);

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // 基本驗證
      if (!formData.basicInfo?.title || !formData.basicInfo?.price) {
        throw new Error('請填寫商品標題和價格');
      }
      
      if (!params.id) {
        throw new Error('商品ID不存在');
      }
      
      // 根據商品狀態確定可以更新的字段
      let updateData: UpdateProductData = { ...formData };

      // 如果是生前契約，確保提供塔位特有欄位的默認值，解決後端驗證問題
      if (productCategory === 'contract') {
        updateData = {
          ...updateData,
          features: {
            ...updateData.features!,
            size: '生前契約-無需填寫',
            facing: '生前契約-無需填寫',
          }
        };
      }
      
      // 如果商品已預訂，只更新允許的字段
      if (product?.status === 'reserved') {
        updateData = {
          basicInfo: {
            description: formData.basicInfo?.description,
          },
          verification: formData.verification,
        } as UpdateProductData;
      }
      
      // 提交表單
      await productsApi.updateProduct(params.id as string, updateData);
      
      // 提交成功後跳轉到商品詳情頁
      router.push(`/products/${params.id}`);
      
    } catch (err: unknown) {
      console.error('更新商品失敗', err);
      setError(
        err instanceof Error 
          ? err.message 
          : '更新商品失敗，請檢查您的輸入並重試'
      );
    } finally {
      setSubmitting(false);
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
    
    if (name.startsWith('feng_shui.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features!,
          feng_shui: {
            ...prev.features!.feng_shui,
            [field]: value,
          },
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        features: {
          ...prev.features!,
          [name]: value,
        },
      }));
    }
  };

  // 處理法律信息變化
  const handleLegalInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      legalInfo: {
        ...prev.legalInfo!,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      },
    }));
  };

  // 處理狀態變化
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      status: value as 'draft' | 'published' | 'pending',
    }));
    
    // 如果選擇提交審核，顯示確認信息
    if (value === 'pending') {
      alert('您選擇了提交審核，商品將等待管理員審核通過後才能在平台上顯示。');
    }
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

  // 判斷商品是否可編輯
  const isEditable = product?.status === 'draft' || product?.status === 'published';
  
  // 判斷商品是否部分可編輯（已預訂狀態）
  const isPartiallyEditable = product?.status === 'reserved';

  // 判斷字段是否可編輯
  const canEditField = (fieldCategory: string, fieldName?: string) => {
    if (isEditable) return true; // 草稿和已發佈狀態可完全編輯
    
    if (isPartiallyEditable) {
      // 已預訂狀態僅可編輯部分字段
      if (fieldCategory === 'basicInfo' && fieldName === 'description') return true;
      if (fieldCategory === 'verification') return true;
      return false;
    }
    
    return false; // 已售出狀態不可編輯
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

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <p className="text-red-700">{error || '找不到商品'}</p>
        </div>
        <button
          onClick={() => router.push('/products')}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  // 如果商品已售出，顯示提示並限制編輯
  if (product?.status === 'sold') {
    return (
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-6">查看商品：{product.basicInfo.title}</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <p className="text-yellow-700">此商品已售出，僅可查看無法編輯。</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">基本信息</h2>
            <p><strong>標題：</strong> {product.basicInfo.title}</p>
            <p><strong>價格：</strong> {new Intl.NumberFormat('zh-TW', {
              style: 'currency',
              currency: 'TWD',
              minimumFractionDigits: 0,
            }).format(product.basicInfo.price)}</p>
            <p><strong>描述：</strong> {product.basicInfo.description}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">商品狀態</h2>
            <p><strong>目前狀態：</strong> 已售出</p>
            <p><strong>售出時間：</strong> {product.metadata.soldAt ? new Date(product.metadata.soldAt).toLocaleDateString('zh-TW') : '未知'}</p>
          </div>
        </div>
        
        <button
          onClick={() => router.push(`/products/${params.id}`)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          查看商品詳情
        </button>
        
        <button
          onClick={() => router.push('/seller/products')}
          className="ml-4 px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
        >
          返回商品列表
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">編輯商品：{product.basicInfo.title}</h1>
      
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
                disabled={!canEditField('basicInfo', 'title')}
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
                disabled={!canEditField('basicInfo', 'price')}
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
                disabled={!canEditField('basicInfo', 'description')}
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
                disabled={!canEditField('basicInfo', 'images')}
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
        
        {/* 塔位特性/契約特性 */}
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
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">請選擇類型</option>
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
            </div>
            
            {productCategory === 'tomb' && (
              <>
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

                <div>
                  <label className="block text-gray-700 mb-2" htmlFor="feng_shui.orientation">
                    風水朝向
                  </label>
                  <input
                    type="text"
                    id="feng_shui.orientation"
                    name="feng_shui.orientation"
                    value={formData.features?.feng_shui?.orientation || ''}
                    onChange={handleFeaturesChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="例如：坐北朝南"
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
          </div>
        </div>
        
        {/* 法律信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">法律信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="registrationNumber">
                登記號碼 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="registrationNumber"
                name="registrationNumber"
                value={formData.legalInfo?.registrationNumber || ''}
                onChange={handleLegalInfoChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="ownershipCertificate">
                所有權證書 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ownershipCertificate"
                name="ownershipCertificate"
                value={formData.legalInfo?.ownershipCertificate || ''}
                onChange={handleLegalInfoChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2" htmlFor="expiryDate">
                到期日期
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={formData.legalInfo?.expiryDate ? new Date(formData.legalInfo.expiryDate).toISOString().split('T')[0] : ''}
                onChange={handleLegalInfoChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="transferable"
                  checked={formData.legalInfo?.transferable || false}
                  onChange={handleLegalInfoChange}
                  className="mr-2 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">可轉讓</span>
              </label>
            </div>
          </div>
        </div>

        {/* 驗證信息 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">驗證信息</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">
                驗證文件
              </label>
              <ImageUploader
                images={formData.verification?.documents || []}
                onChange={(images) => {
                  setFormData(prev => ({
                    ...prev,
                    verification: {
                      ...prev.verification!,
                      documents: images,
                    },
                  }));
                }}
                maxImages={5}
                disabled={!canEditField('verification', 'documents')}
              />
            </div>
          </div>
        </div>
        
        {/* 發佈狀態 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">發佈狀態</h2>
          
          {isPartiallyEditable ? (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-700">此商品已被預訂，狀態無法更改，僅可編輯描述和驗證文件。</p>
              <p className="text-blue-700 mt-2">當前狀態：已預訂</p>
            </div>
          ) : (
            <div>
              <label className="block text-gray-700 mb-2" htmlFor="status">
                商品狀態
              </label>
              <select
                id="status"
                name="status"
                value={formData.status || 'draft'}
                onChange={handleStatusChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={!canEditField('status')}
              >
                <option value="draft">草稿（不公開）</option>
                <option value="pending">提交審核（等待管理員審核）</option>
                {/* 只有已通過審核的商品才能顯示發佈選項 */}
                {(product?.status === 'published' || product?.verification?.status === 'verified') && (
                  <option value="published">發佈（公開顯示）</option>
                )}
              </select>
              
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      所有商品在發佈前必須通過管理員審核。請先選擇「提交審核」選項，待審核通過後才能發佈商品。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* 按鈕 */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submitting}
            className={`px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? '處理中...' : '保存更新'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push(`/products/${params.id}`)}
            className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
} 