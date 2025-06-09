import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { RolesService } from '../../roles/roles.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolesService: RolesService,
    private usersService: UsersService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) {
      return true; // 如果沒有設置權限要求，默認允許訪問
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('沒有登入或認證失效');
    }
    
    // 創辦人（特定郵箱）始終具有所有權限
    if (user.email === 'paul@mumu.com') {
      return true;
    }
    
    // 如果用戶不是管理員，直接拒絕訪問
    if (user.role !== 'admin') {
      throw new ForbiddenException('只有管理員可以訪問該資源');
    }
    
    // 檢查用戶是否有指定權限（舊版權限系統）
    if (user.permissions) {
      for (const permission of requiredPermissions) {
        switch (permission) {
          case 'product:review':
            if (!user.permissions.canReviewProducts) {
              throw new ForbiddenException(`缺少權限: ${permission}`);
            }
            break;
          case 'user:manage':
            if (!user.permissions.canManageUsers) {
              throw new ForbiddenException(`缺少權限: ${permission}`);
            }
            break;
          case 'statistics:view':
            if (!user.permissions.canViewStatistics) {
              throw new ForbiddenException(`缺少權限: ${permission}`);
            }
            break;
          case 'settings:manage':
            if (!user.permissions.canManageSettings) {
              throw new ForbiddenException(`缺少權限: ${permission}`);
            }
            break;
          default:
            throw new ForbiddenException(`缺少權限: ${permission}`);
        }
      }
      return true;
    }
    
    // 如果用戶沒有直接設置權限，則檢查其角色權限
    if (user.roleId) {
      try {
        const role = await this.rolesService.findOne(user.roleId);
        
        // 如果是超級管理員角色，具有所有權限
        if (role.permissions.includes('*')) {
          return true;
        }
        
        // 檢查角色是否有所有需要的權限
        for (const permission of requiredPermissions) {
          if (!role.permissions.includes(permission)) {
            throw new ForbiddenException(`缺少角色權限: ${permission}`);
          }
        }
        
        return true;
      } catch (error) {
        throw new ForbiddenException('無法驗證用戶角色權限');
      }
    }
    
    throw new ForbiddenException('用戶沒有足夠的權限');
  }
} 