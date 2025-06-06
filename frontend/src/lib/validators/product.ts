import { CreateProductData } from '../types/product';

export interface ValidationErrors {
  [key: string]: string;
}

interface NestedValidationErrors {
  basicInfo?: {
    title?: string;
    price?: string;
    description?: string;
    images?: string;
  };
  location?: {
    cemetery?: string;
    city?: string;
    district?: string;
  };
  features?: {
    productType?: string;
    religion?: string;
  };
}

// 驗證產品表單
export const validateProduct = (data: Partial<CreateProductData>): ValidationErrors => {
  // 將嵌套錯誤轉換為扁平結構
  const flattenErrors = (nestedErrors: NestedValidationErrors): ValidationErrors => {
    const flat: ValidationErrors = {};
    
    if (nestedErrors.basicInfo) {
      Object.entries(nestedErrors.basicInfo).forEach(([key, value]) => {
        flat[key] = value;
      });
    }
    
    if (nestedErrors.location) {
      Object.entries(nestedErrors.location).forEach(([key, value]) => {
        flat[key] = value;
      });
    }
    
    if (nestedErrors.features) {
      Object.entries(nestedErrors.features).forEach(([key, value]) => {
        flat[key] = value;
      });
    }
    
    return flat;
  };
  
  const nestedErrors: NestedValidationErrors = {};
  
  // 驗證基本信息
  if (!data.basicInfo?.title) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.title = '請輸入商品標題';
  } else if (data.basicInfo.title.length < 3) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.title = '商品標題至少需要3個字符';
  } else if (data.basicInfo.title.length > 100) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.title = '商品標題不能超過100個字符';
  }
  
  if (data.basicInfo?.price === undefined || data.basicInfo.price === null) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.price = '請輸入商品價格';
  } else if (data.basicInfo.price < 0) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.price = '商品價格不能為負數';
  }
  
  if (data.basicInfo?.description && data.basicInfo.description.length > 2000) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.description = '商品描述不能超過2000個字符';
  }
  
  // 驗證圖片
  if (!data.basicInfo?.images || data.basicInfo.images.length === 0) {
    if (!nestedErrors.basicInfo) nestedErrors.basicInfo = {};
    nestedErrors.basicInfo.images = '請至少上傳一張商品圖片';
  }
  
  // 驗證位置信息
  if (!data.location?.cemetery) {
    if (!nestedErrors.location) nestedErrors.location = {};
    nestedErrors.location.cemetery = '請輸入墓園名稱';
  }
  
  if (!data.location?.city) {
    if (!nestedErrors.location) nestedErrors.location = {};
    nestedErrors.location.city = '請選擇城市';
  }
  
  if (!data.location?.district) {
    if (!nestedErrors.location) nestedErrors.location = {};
    nestedErrors.location.district = '請輸入區域';
  }
  
  // 驗證特性信息
  if (!data.features?.productType) {
    if (!nestedErrors.features) nestedErrors.features = {};
    nestedErrors.features.productType = '請選擇塔位類型';
  }
  
  if (!data.features?.religion) {
    if (!nestedErrors.features) nestedErrors.features = {};
    nestedErrors.features.religion = '請選擇宗教屬性';
  }
  
  // 返回扁平化的錯誤
  return flattenErrors(nestedErrors);
};

// 檢查是否通過驗證
export const isValidProduct = (data: Partial<CreateProductData>): boolean => {
  const errors = validateProduct(data);
  return Object.keys(errors).length === 0;
};

// 只驗證特定欄位
export const validateProductField = (
  data: Partial<CreateProductData>, 
  field: string
): ValidationErrors => {
  const errors: ValidationErrors = {};
  const allErrors = validateProduct(data);
  
  if (field in allErrors) {
    errors[field] = allErrors[field];
  }
  
  return errors;
}; 