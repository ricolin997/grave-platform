import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器，添加令牌
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 調試信息
    console.log('發送請求:', config.method?.toUpperCase(), config.url);
    
    // 檢查 MongoDB ID 格式
    if (config.data && (config.url?.includes('/messages') || config.url?.includes('/products'))) {
      console.log('請求數據:', JSON.stringify(config.data, null, 2));
      
      // 檢查常見的 MongoDB ID 字段
      const commonIdFields = ['id', 'productId', 'sellerId', 'receiverId', 'userId', 'threadId'];
      
      for (const field of commonIdFields) {
        if (config.data[field] && typeof config.data[field] === 'string') {
          const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(config.data[field]);
          console.log(`字段 ${field}: ${config.data[field]}, 有效的 MongoDB ID: ${isValidMongoId}`);
          
          if (!isValidMongoId && field !== 'threadId') {
            console.warn(`警告: ${field} 不是有效的 MongoDB ID 格式`);
          }
        }
      }
    }
    
    return config;
  },
  (error) => {
    console.error('請求錯誤:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器，處理錯誤
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('收到響應:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('響應錯誤:', error);
    if (error.response) {
      console.error('響應狀態:', error.response.status);
      console.error('響應標頭:', error.response.headers);
      console.error('完整錯誤響應數據:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data && error.response.data.message) {
        error.message = error.response.data.message;
        
        if (error.response.data.errors) {
          error.validationErrors = error.response.data.errors;
          console.error('驗證錯誤:', error.response.data.errors);
        }
      }
    } else if (error.request) {
      console.error('請求發送但沒有收到回應:', error.request);
    } else {
      console.error('請求設置錯誤:', error.message);
    }
    
    if (error.response && error.response.status === 401) {
      // 清除登錄信息並重定向到登錄頁面
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 