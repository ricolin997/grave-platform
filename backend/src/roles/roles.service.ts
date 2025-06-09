import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleModel.findById(id).exec();
    if (!role) {
      throw new NotFoundException(`角色 ID: ${id} 不存在`);
    }
    return role;
  }

  async create(role: Partial<Role>): Promise<Role> {
    const createdRole = new this.roleModel(role);
    return createdRole.save();
  }

  async update(id: string, role: Partial<Role>): Promise<Role> {
    const updatedRole = await this.roleModel
      .findByIdAndUpdate(id, { $set: role }, { new: true })
      .exec();
    
    if (!updatedRole) {
      throw new NotFoundException(`角色 ID: ${id} 不存在`);
    }
    
    return updatedRole;
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleModel.deleteOne({ _id: id }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`角色 ID: ${id} 不存在`);
    }
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async assignPermission(roleId: string, permissionCode: string): Promise<Role> {
    const role = await this.roleModel.findById(roleId).exec();
    
    if (!role) {
      throw new NotFoundException(`角色 ID: ${roleId} 不存在`);
    }
    
    if (!role.permissions.includes(permissionCode)) {
      role.permissions.push(permissionCode);
      return role.save();
    }
    
    return role;
  }

  async revokePermission(roleId: string, permissionCode: string): Promise<Role> {
    const role = await this.roleModel.findById(roleId).exec();
    
    if (!role) {
      throw new NotFoundException(`角色 ID: ${roleId} 不存在`);
    }
    
    role.permissions = role.permissions.filter(p => p !== permissionCode);
    return role.save();
  }

  async initializeDefaultRoles(): Promise<void> {
    // 檢查是否已存在超級管理員角色
    const superAdminExists = await this.roleModel.findOne({ name: '超級管理員' }).exec();
    
    if (!superAdminExists) {
      await this.create({
        name: '超級管理員',
        description: '擁有系統所有權限的角色，通常分配給創辦人',
        isBuiltIn: true,
        permissions: ['*'] // 特殊權限代碼表示所有權限
      });
    }

    // 其他默認角色
    const defaultRoles = [
      {
        name: '商品審核員',
        description: '負責審核和管理商品',
        isBuiltIn: true,
        permissions: ['product:read', 'product:review', 'product:update']
      },
      {
        name: '用戶管理員',
        description: '負責管理用戶和處理相關事務',
        isBuiltIn: true,
        permissions: ['user:read', 'user:update']
      },
      {
        name: '客服專員',
        description: '處理客戶咨詢和訂單相關問題',
        isBuiltIn: true,
        permissions: ['support:read', 'support:respond', 'order:read']
      },
      {
        name: '內容編輯',
        description: '負責編輯和管理網站內容',
        isBuiltIn: true,
        permissions: ['content:read', 'content:create', 'content:update']
      }
    ];

    for (const role of defaultRoles) {
      const exists = await this.roleModel.findOne({ name: role.name }).exec();
      if (!exists) {
        await this.create(role);
      }
    }
  }
} 