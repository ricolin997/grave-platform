import axiosInstance from './axios';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductQuery,
  ProductsResponse,
  ProductReviewData,
  ReviewHistory,
} from '../types/product';

export const productsApi = {
  // 創建商品
  create: async (data: CreateProductData): Promise<Product> => {
    const response = await axiosInstance.post<Product>('/products', data);
    return response.data;
  },

  // 獲取商品列表
  getProducts: async (query: ProductQuery = {}): Promise<ProductsResponse> => {
    const response = await axiosInstance.get<ProductsResponse>('/products', {
      params: query,
    });
    return response.data;
  },

  // 獲取待審核商品列表
  getPendingProducts: async (query: Omit<ProductQuery, 'status'> = {}): Promise<ProductsResponse> => {
    return productsApi.getProducts({ ...query, status: 'pending' });
  },

  // 獲取單個商品詳情
  getProduct: async (id: string): Promise<Product> => {
    const response = await axiosInstance.get<Product>(`/products/${id}`);
    return response.data;
  },

  // 更新商品
  updateProduct: async (id: string, data: UpdateProductData): Promise<Product> => {
    const response = await axiosInstance.patch<Product>(`/products/${id}`, data);
    return response.data;
  },

  // 刪除商品
  deleteProduct: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/products/${id}`);
  },

  // 標記商品為已售出
  markAsSold: async (id: string): Promise<Product> => {
    const response = await axiosInstance.patch<Product>(`/products/${id}/mark-as-sold`, {});
    return response.data;
  },

  // 將已預訂商品恢復為已發佈
  restoreToPublished: async (id: string): Promise<Product> => {
    const response = await axiosInstance.patch<Product>(`/products/${id}/restore`, { status: 'published' });
    return response.data;
  },

  // 獲取賣家的商品
  getSellerProducts: async (query: Omit<ProductQuery, 'city' | 'district' | 'religion' | 'minPrice' | 'maxPrice' | 'type'> = {}): Promise<ProductsResponse> => {
    const response = await axiosInstance.get<ProductsResponse>('/products/seller/listings', {
      params: query,
    });
    return response.data;
  },

  // 添加收藏
  addToFavorites: async (productId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.post<{ success: boolean }>(`/products/${productId}/favorites`);
    return response.data;
  },

  // 移除收藏
  removeFromFavorites: async (productId: string): Promise<{ success: boolean }> => {
    const response = await axiosInstance.delete<{ success: boolean }>(`/products/${productId}/favorites`);
    return response.data;
  },

  // 獲取用戶收藏
  getFavorites: async (query: Partial<ProductQuery> = {}): Promise<ProductsResponse> => {
    const response = await axiosInstance.get<ProductsResponse>('/user/favorites', {
      params: query,
    });
    return response.data;
  },

  // 審核商品 - 管理員功能
  reviewProduct: async (id: string, reviewData: ProductReviewData): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/review`, reviewData);
    return response.data;
  },

  // 批准商品 - 管理員功能
  approveProduct: async (id: string, reviewNote?: string): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/approve`, { reviewNote });
    return response.data;
  },

  // 拒絕商品 - 管理員功能
  rejectProduct: async (id: string, rejectionReason: string): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/reject`, { rejectionReason });
    return response.data;
  },

  // 請求更多信息 - 管理員功能
  requestMoreInfo: async (id: string, message: string): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/request-info`, { message });
    return response.data;
  },

  // 獲取審核歷史 - 管理員功能
  getReviewHistory: async (productId: string): Promise<ReviewHistory[]> => {
    const response = await axiosInstance.get<ReviewHistory[]>(`/admin/products/${productId}/review-history`);
    return response.data;
  },

  // 獲取所有審核歷史 - 管理員功能
  getAllReviewHistory: async (query: { page?: number; limit?: number } = {}): Promise<{ history: ReviewHistory[]; total: number; page: number; totalPages: number }> => {
    const response = await axiosInstance.get<{ history: ReviewHistory[]; total: number; page: number; totalPages: number }>('/admin/products/review-history', {
      params: query,
    });
    return response.data;
  },

  // 標記商品 - 管理員功能
  markProduct: async (id: string): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/mark`, {});
    return response.data;
  },

  // 取消標記商品 - 管理員功能
  unmarkProduct: async (id: string): Promise<Product> => {
    const response = await axiosInstance.post<Product>(`/admin/products/${id}/unmark`, {});
    return response.data;
  },

  // 獲取待審核商品數量
  getPendingProductsCount: async (): Promise<number> => {
    const response = await axiosInstance.get<{ count: number }>('/admin/products/pending-count');
    return response.data.count;
  },

  // 將商品上架
  publishProduct: async (id: string, newPrice?: number): Promise<Product> => {
    const payload = newPrice !== undefined ? { price: newPrice } : {};
    const response = await axiosInstance.patch<Product>(`/products/${id}/publish`, payload);
    return response.data;
  },
}; 