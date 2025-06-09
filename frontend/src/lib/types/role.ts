import { Permission } from './permission';

export interface Role {
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissions?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleWithPermissions extends Role {
  permissionDetails: Permission[];
} 