export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  resource: string;
  isBuiltIn: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreatePermissionData {
  code: string;
  name: string;
  description: string;
  resource: string;
}

export interface UpdatePermissionData {
  name?: string;
  description?: string;
  resource?: string;
} 