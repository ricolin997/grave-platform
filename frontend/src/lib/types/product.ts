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
  status: 'draft' | 'published' | 'reserved' | 'sold' | 'deleted';
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
  status: 'draft' | 'published' | 'reserved' | 'sold';
}

// 更新商品用的數據
export interface UpdateProductData extends Partial<CreateProductData> {}

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