export type UserRole = 'buyer' | 'seller' | 'admin';

export interface User {
  id: string;
  role: UserRole;
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
    status: 'active' | 'suspended' | 'deleted';
    createdAt: Date;
    updatedAt: Date;
    lastLogin?: Date;
  };
  permissions?: {
    canReviewProducts: boolean;
    canManageUsers: boolean;
    canViewStatistics: boolean;
    canManageSettings: boolean;
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
    permissions?: {
      canReviewProducts: boolean;
      canManageUsers: boolean;
      canViewStatistics: boolean;
      canManageSettings: boolean;
    };
  };
  accessToken: string;
}

// 存儲在localStorage中的簡化用戶信息類型
export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  name: string;
  permissions?: {
    canReviewProducts: boolean;
    canManageUsers: boolean;
    canViewStatistics: boolean;
    canManageSettings: boolean;
  };
}

// 用戶管理相關類型
export interface UserListItem {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  lastLogin?: Date;
  statistics: {
    listings: number;
    matches: number;
    views: number;
  };
}

export interface UsersResponse {
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface UserQuery {
  role?: UserRole;
  status?: 'active' | 'suspended' | 'deleted';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateUserData {
  role?: UserRole;
  email?: string;
  profile?: {
    name?: string;
    phone?: string;
    avatar?: string;
    identityVerified?: boolean;
    realNameVerified?: boolean;
  };
  metadata?: {
    status?: 'active' | 'suspended' | 'deleted';
  };
  permissions?: {
    canReviewProducts?: boolean;
    canManageUsers?: boolean;
    canViewStatistics?: boolean;
    canManageSettings?: boolean;
  };
} 