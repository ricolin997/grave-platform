export interface User {
  id: string;
  role: 'buyer' | 'seller';
  email: string;
  profile: {
    name: string;
    phone?: string;
    avatar?: string;
    identityVerified: boolean;
    realNameVerified: boolean;
  };
  preferences: {
    religions: string[];
    priceRange: {
      min: number;
      max: number;
    };
    locations: string[];
  };
  statistics: {
    listings: number;
    matches: number;
    views: number;
  };
  metadata: {
    status: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface RegisterData {
  role: 'buyer' | 'seller';
  email: string;
  password: string;
  name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
  accessToken: string;
}

// 存儲在localStorage中的簡化用戶信息類型
export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  name: string;
} 