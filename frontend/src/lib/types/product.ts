// 商品基本信息
export interface ProductBasicInfo {
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  images: string[];
  video?: string;
  virtualTour?: string;
}

// 商品位置
export interface ProductLocation {
  cemetery: string;
  address: string;
  city: string;
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  surroundings: {
    parking: boolean;
    temple: boolean;
    restaurant: boolean;
    transportation: string[];
  };
}

// 風水信息
export interface FengShui {
  orientation?: string;
  environment: string[];
  features: string[];
}

// 商品特點
export interface ProductFeatures {
  productType: string;
  /** @deprecated 使用productType代替 */
  type?: string;
  size: string;
  facing: string;
  floor: number;
  religion: string;
  feng_shui: FengShui;
}

// 法律信息
export interface LegalInfo {
  registrationNumber: string;
  ownershipCertificate: string;
  propertyRights: string[];
  expiryDate?: Date;
  transferable: boolean;
  restrictions: string[];
}

// 驗證信息
export interface Verification {
  status: 'pending' | 'verified' | 'rejected';
  documents: string[];
  verifiedAt?: Date;
}

// 商品統計
export interface ProductStatistics {
  views: number;
  favorites: number;
  compares: number;
  inquiries: number;
  lastViewed?: Date;
}

// 商品元數據
export interface ProductMetadata {
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  soldAt?: Date;
}

// 商品狀態
export type ProductStatus = 
  | 'draft'        // 草稿，尚未發佈
  | 'published'    // 已發佈，可被搜索
  | 'reserved'     // 已預訂，有人有意向購買
  | 'negotiating'  // 洽談中，買家與賣家正在協商
  | 'inspecting'   // 實地查看中
  | 'completed'    // 已完成媒合，但未下架
  | 'sold'         // 已售出/已完成，不再顯示
  | 'deleted';     // 已刪除

// 完整商品信息
export interface Product {
  id: string;
  sellerId: string;
  sellerName?: string;
  basicInfo: ProductBasicInfo;
  location: ProductLocation;
  features: ProductFeatures;
  legalInfo: LegalInfo;
  verification: Verification;
  status: ProductStatus;
  statistics: ProductStatistics;
  metadata: ProductMetadata;
  isFavorited?: boolean;
}

// 創建商品用的數據
export interface CreateProductData {
  basicInfo: ProductBasicInfo;
  location: ProductLocation;
  features: ProductFeatures;
  legalInfo: LegalInfo;
  verification: {
    documents: string[];
  };
  status: ProductStatus;
}

// 更新商品用的數據
export interface UpdateProductData extends Partial<CreateProductData> {
  updatedAt?: Date;
}

// 查詢商品用的參數
export interface ProductQuery {
  city?: string;
  district?: string;
  religion?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}

// 查詢結果
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
} 