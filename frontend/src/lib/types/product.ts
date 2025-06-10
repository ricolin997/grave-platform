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

// 驗證狀態
export type VerificationStatus = 
  | 'pending'    // 等待審核中
  | 'verified'   // 已通過驗證
  | 'rejected'   // 已被拒絕
  | 'needs_info' // 需要更多信息

// 驗證信息
export interface Verification {
  status: VerificationStatus;
  documents: string[];
  verifiedAt?: Date;
  reviewedBy?: string;  // 審核者ID
  reviewNote?: string;  // 審核備註
  rejectionReason?: string; // 拒絕原因
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
  approvedAt?: Date; // 批准時間
  soldAt?: Date;
  reviewedAt?: Date; // 審核時間
}

// 商品狀態
export type ProductStatus = 
  | 'draft'            // 草稿，尚未發佈
  | 'pending'          // 等待審核
  | 'approved-pending' // 已批准-待上架
  | 'published'        // 已發佈，可被搜索
  | 'reserved'         // 已預訂，有人有意向購買
  | 'negotiating'      // 洽談中，買家與賣家正在協商
  | 'inspecting'       // 實地查看中
  | 'completed'        // 已完成媒合，但未下架
  | 'rejected'         // 審核被拒絕
  | 'sold'             // 已售出/已完成，不再顯示
  | 'deleted';         // 已刪除

// 審核歷史記錄
export interface ReviewHistory {
  id: string;
  productId: string;
  adminId: string;
  adminName: string;
  fromStatus: ProductStatus;
  toStatus: ProductStatus;
  comment: string;
  timestamp: Date;
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
  status: ProductStatus;
  statistics: ProductStatistics;
  metadata: ProductMetadata;
  isFavorited?: boolean;
  reviewHistory?: ReviewHistory[];
  isMarked?: boolean;  // 管理員標記，需要後續關注
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

// 商品審核數據
export interface ProductReviewData {
  status: ProductStatus;
  verification: {
    status: VerificationStatus;
    reviewNote?: string;
    rejectionReason?: string;
  };
  reviewedBy: string;
}

// 查詢商品用的參數
export interface ProductQuery {
  city?: string;
  district?: string;
  religion?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  status?: string | ProductStatus;
  verification?: string | VerificationStatus;
  sortBy?: string;  // 排序欄位，如createdAt, price等
  sort?: 'asc' | 'desc';  // 排序方向，升序或降序
  marked?: boolean; // 是否只顯示被標記的商品
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