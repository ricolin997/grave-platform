import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
  ) {}

  async findAll(): Promise<Permission[]> {
    return this.permissionModel.find().exec();
  }

  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionModel.findById(id).exec();
    if (!permission) {
      throw new NotFoundException(`權限 ID: ${id} 不存在`);
    }
    return permission;
  }

  async findByCode(code: string): Promise<Permission | null> {
    return this.permissionModel.findOne({ code }).exec();
  }

  async create(permission: Partial<Permission>): Promise<Permission> {
    const createdPermission = new this.permissionModel(permission);
    return createdPermission.save();
  }

  async update(id: string, permission: Partial<Permission>): Promise<Permission> {
    const updatedPermission = await this.permissionModel
      .findByIdAndUpdate(id, { $set: permission }, { new: true })
      .exec();
    
    if (!updatedPermission) {
      throw new NotFoundException(`權限 ID: ${id} 不存在`);
    }
    
    return updatedPermission;
  }

  async remove(id: string): Promise<void> {
    const result = await this.permissionModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`權限 ID: ${id} 不存在`);
    }
  }

  async initializeDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // 商品權限
      { 
        code: 'product:create', 
        name: '創建商品', 
        description: '允許創建新商品',
        resource: 'product',
        isBuiltIn: true
      },
      { 
        code: 'product:read', 
        name: '查看商品', 
        description: '允許查看商品詳細資訊',
        resource: 'product',
        isBuiltIn: true
      },
      { 
        code: 'product:update', 
        name: '更新商品', 
        description: '允許更新商品資訊',
        resource: 'product',
        isBuiltIn: true
      },
      { 
        code: 'product:delete', 
        name: '刪除商品', 
        description: '允許刪除商品',
        resource: 'product',
        isBuiltIn: true
      },
      { 
        code: 'product:review', 
        name: '審核商品', 
        description: '允許審核商品和更改其狀態',
        resource: 'product',
        isBuiltIn: true
      },
      
      // 用戶權限
      { 
        code: 'user:create', 
        name: '創建用戶', 
        description: '允許創建新用戶',
        resource: 'user',
        isBuiltIn: true
      },
      { 
        code: 'user:read', 
        name: '查看用戶', 
        description: '允許查看用戶資訊',
        resource: 'user',
        isBuiltIn: true
      },
      { 
        code: 'user:update', 
        name: '更新用戶', 
        description: '允許更新用戶資訊',
        resource: 'user',
        isBuiltIn: true
      },
      { 
        code: 'user:delete', 
        name: '刪除用戶', 
        description: '允許刪除用戶',
        resource: 'user',
        isBuiltIn: true
      },
      { 
        code: 'user:manage', 
        name: '管理用戶', 
        description: '允許管理用戶（啟用/禁用等操作）',
        resource: 'user',
        isBuiltIn: true
      },
      
      // 角色權限
      { 
        code: 'role:create', 
        name: '創建角色', 
        description: '允許創建新角色',
        resource: 'role',
        isBuiltIn: true
      },
      { 
        code: 'role:read', 
        name: '查看角色', 
        description: '允許查看角色詳細資訊',
        resource: 'role',
        isBuiltIn: true
      },
      { 
        code: 'role:update', 
        name: '更新角色', 
        description: '允許更新角色資訊',
        resource: 'role',
        isBuiltIn: true
      },
      { 
        code: 'role:delete', 
        name: '刪除角色', 
        description: '允許刪除角色',
        resource: 'role',
        isBuiltIn: true
      },
      { 
        code: 'role:assign', 
        name: '分配角色', 
        description: '允許將角色分配給用戶',
        resource: 'role',
        isBuiltIn: true
      },
      
      // 統計和系統相關權限
      { 
        code: 'statistics:view', 
        name: '查看統計資訊', 
        description: '允許查看系統統計資訊',
        resource: 'system',
        isBuiltIn: true
      },
      { 
        code: 'settings:manage', 
        name: '管理設置', 
        description: '允許修改系統設置',
        resource: 'system',
        isBuiltIn: true
      },
    ];

    for (const permission of defaultPermissions) {
      const exists = await this.permissionModel.findOne({ code: permission.code }).exec();
      if (!exists) {
        await this.create(permission);
      }
    }
  }
} 