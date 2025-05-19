import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Injectable, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { MessageDocument } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
    };
  };
}

@Injectable()
@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(WsJwtAuthGuard)
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, AuthenticatedSocket> = new Map();
  private messagesService: MessagesService;

  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  afterInit() {
    // 這個方法會在 Gateway 初始化後被調用
  }

  setMessagesService(service: MessagesService) {
    this.messagesService = service;
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const userId = client.data.user.id;
      this.userSockets.set(userId, client);
      await client.join(`user:${userId}`);
      console.log(`用戶 ${userId} 已連接`);
    } catch (error) {
      console.error('WebSocket 連接錯誤:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    try {
      const userId = client.data.user.id;
      this.userSockets.delete(userId);
      console.log(`用戶 ${userId} 已斷開連接`);
    } catch (error) {
      console.error('WebSocket 斷開連接錯誤:', error);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    client: AuthenticatedSocket,
    data: { threadId: string },
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(client.data.user.id);
      await this.messagesService.markAsRead(userId, data.threadId);
      
      // 通知相關用戶消息已讀
      const threads = await this.messagesService.getThreads(userId, 1, 1);
      if (threads && threads.threads.length > 0) {
        const thread = threads.threads[0];
        const otherUserId = thread.otherUserId;
        if (otherUserId) {
          const otherUserSocket = this.userSockets.get(otherUserId);
          if (otherUserSocket) {
            otherUserSocket.emit('messagesRead', {
              threadId: data.threadId,
              userId: userId.toString(),
            });
          }
        }
      }
    } catch (error) {
      console.error('標記消息為已讀錯誤:', error);
      client.emit('error', { message: '標記消息為已讀失敗' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: AuthenticatedSocket,
    data: CreateMessageDto,
  ): Promise<void> {
    try {
      const userId = new Types.ObjectId(client.data.user.id);
      const savedMessage = await this.messagesService.create(userId, data);

      // 通知接收者新消息
      const receiverSocket = this.userSockets.get(data.receiverId.toString());
      if (receiverSocket) {
        receiverSocket.emit('newMessage', savedMessage);
      }

      // 同時通知發送者消息已發送
      client.emit('newMessage', savedMessage);
    } catch (error) {
      console.error('發送消息錯誤:', error);
      client.emit('error', { message: '發送消息失敗' });
    }
  }

  public notifyNewMessage(message: MessageDocument): void {
    try {
      const senderSocket = this.userSockets.get(message.senderId.toString());
      const receiverSocket = this.userSockets.get(message.receiverId.toString());

      if (senderSocket) {
        senderSocket.emit('newMessage', message);
      }
      if (receiverSocket) {
        receiverSocket.emit('newMessage', message);
      }
    } catch (error) {
      console.error('通知新消息錯誤:', error);
    }
  }
} 