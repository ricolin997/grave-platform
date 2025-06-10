import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly logger = new Logger(AdminGuard.name);
  
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      this.logger.warn('認證失敗：沒有用戶信息');
      throw new ForbiddenException('沒有登入或認證失效');
    }
    
    this.logger.log(`檢查管理員權限: ${user.email}, 角色: ${user.role}`);
    
    // 檢查是否為超級管理員或普通管理員
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      this.logger.warn(`用戶 ${user.email} 不是管理員，角色: ${user.role}`);
      throw new ForbiddenException('只有管理員可以訪問該資源');
    }
    
    // 檢查權限存在
    if (!user.permissions) {
      this.logger.warn(`用戶 ${user.email} 沒有權限信息`);
      user.permissions = {}; // 設置空權限對象以避免後續錯誤
    }
    
    this.logger.log(`管理員權限驗證通過: ${user.email}`);
    return true;
  }
} 