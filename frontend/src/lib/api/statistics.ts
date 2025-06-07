import axiosInstance from './axios';

export interface SystemStatistics {
  userStats: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    buyerCount: number;
    sellerCount: number;
    adminCount: number;
    userGrowthData: { date: string; count: number }[];
  };
  productStats: {
    totalProducts: number;
    publishedProducts: number;
    pendingReviewProducts: number;
    completedMatches: number;
    totalViews: number;
    averagePrice: number;
    productGrowthData: { date: string; count: number }[];
  };
  transactionStats: {
    totalInquiries: number;
    activeNegotiations: number;
    pendingInspections: number;
    successfulMatches: number;
    transactionGrowthData: { date: string; count: number }[];
  };
  platformStats: {
    totalPageViews: number;
    uniqueVisitors: number;
    averageSessionDuration: string;
    conversionRate: number;
    popularProducts: Array<{
      id: string;
      title: string;
      views: number;
      inquiries: number;
    }>;
    popularSearchTerms: Array<{
      term: string;
      count: number;
    }>;
  };
}

export const statisticsApi = {
  // 獲取系統概覽統計數據
  getSystemStatistics: async (): Promise<SystemStatistics> => {
    const response = await axiosInstance.get<SystemStatistics>('/admin/statistics/overview');
    return response.data;
  },

  // 獲取用戶統計數據
  getUserStatistics: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SystemStatistics['userStats']> => {
    const response = await axiosInstance.get<SystemStatistics['userStats']>('/admin/statistics/users', {
      params: { period }
    });
    return response.data;
  },

  // 獲取產品統計數據
  getProductStatistics: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SystemStatistics['productStats']> => {
    const response = await axiosInstance.get<SystemStatistics['productStats']>('/admin/statistics/products', {
      params: { period }
    });
    return response.data;
  },

  // 獲取交易統計數據
  getTransactionStatistics: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SystemStatistics['transactionStats']> => {
    const response = await axiosInstance.get<SystemStatistics['transactionStats']>('/admin/statistics/transactions', {
      params: { period }
    });
    return response.data;
  },

  // 獲取平台使用情況統計數據
  getPlatformStatistics: async (period: 'day' | 'week' | 'month' | 'year' = 'month'): Promise<SystemStatistics['platformStats']> => {
    const response = await axiosInstance.get<SystemStatistics['platformStats']>('/admin/statistics/platform', {
      params: { period }
    });
    return response.data;
  },

  // 獲取自訂時間範圍的統計數據
  getCustomRangeStatistics: async (startDate: string, endDate: string): Promise<SystemStatistics> => {
    const response = await axiosInstance.get<SystemStatistics>('/admin/statistics/custom-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // 獲取系統圖表數據
  getChartData: async (
    type: 'users' | 'products' | 'transactions' | 'pageviews',
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<Array<{ date: string; value: number }>> => {
    const response = await axiosInstance.get<Array<{ date: string; value: number }>>('/admin/statistics/chart', {
      params: { type, period }
    });
    return response.data;
  },
}; 