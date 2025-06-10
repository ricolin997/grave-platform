import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret_key',
    });
  }

  async validate(payload: any) {
    try {
      this.logger.log(`驗證用戶令牌: ${payload.email}`);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        this.logger.error(`用戶不存在: ${payload.sub}`);
        throw new UnauthorizedException('使用者不存在');
      }
      
      // 獲取用戶的角色和權限
      const permissions = user.permissions || {};
      
      // 構建完整的用戶信息，包含權限
      const result = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        username: payload.username,
        permissions: permissions,
      };
      
      this.logger.debug(`用戶驗證成功: ${payload.email}, 角色: ${payload.role}`);
      return result;
    } catch (error) {
      this.logger.error(`身份驗證失敗: ${error.message || error}`);
      throw new UnauthorizedException('身份驗證失敗');
    }
  }
} 