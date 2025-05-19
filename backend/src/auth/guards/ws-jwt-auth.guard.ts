import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // 嘗試從多個地方獲取 token
      let token = client.handshake.auth?.token; // 從 auth 對象獲取
      
      // 如果 auth 對象中沒有，嘗試從查詢參數獲取
      if (!token && client.handshake.query && client.handshake.query.token) {
        token = Array.isArray(client.handshake.query.token)
          ? client.handshake.query.token[0]
          : client.handshake.query.token;
      }
      
      // 如果 headers 中有，嘗試從 headers 獲取
      if (!token && client.handshake.headers.authorization) {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7); // 移除 'Bearer ' 前綴
        } else {
          token = authHeader;
        }
      }

      if (!token) {
        console.error('未提供認證令牌 - 連接來自:', client.id);
        throw new WsException('未提供認證令牌');
      }

      try {
        const payload = await this.jwtService.verifyAsync(token);
        client.data = client.data || {};
        client.data.user = payload;
        console.log('WebSocket 認證成功: 用戶', payload.sub);
        return true;
      } catch (jwtError) {
        console.error('令牌驗證失敗:', jwtError.message);
        throw new WsException('認證失敗: 無效的令牌');
      }
    } catch (error) {
      console.error('WebSocket 認證失敗:', error);
      throw new WsException('認證失敗');
    }
  }
} 