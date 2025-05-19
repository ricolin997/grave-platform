import axiosInstance from './axios';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductQuery,
  ProductsResponse,
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
}; 