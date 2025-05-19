import { getToken } from '@/lib/auth';
import { Message } from '@/lib/types/message';
import { io, Socket } from 'socket.io-client';

type MessageHandler<T = unknown> = (data: T) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectTimeout = 1000;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = getToken();
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5001';
      
      // 使用 Socket.io 客戶端
      this.socket = io(`${wsUrl}/messages`, {
        auth: { token }, // 在 auth 對象中提供 token
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectTimeout,
        transports: ['websocket', 'polling'] // 明確指定傳輸方式
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      });

      this.socket.on('newMessage', (data) => {
        const handlers = this.messageHandlers.get('newMessage');
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      });

      this.socket.on('messagesRead', (data) => {
        const handlers = this.messageHandlers.get('messagesRead');
        if (handlers) {
          handlers.forEach(handler => handler(data));
        }
      });

      this.socket.on('error', (error) => {
        console.error('Socket.io error:', error);
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      this.socket.on('reconnect_attempt', (attemptNumber) => {
        this.reconnectAttempts = attemptNumber;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('Max reconnection attempts reached');
      });
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public sendMessage(type: string, data: unknown): void {
    if (this.socket?.connected) {
      this.socket.emit(type, data);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  public addMessageHandler<T>(type: string, handler: MessageHandler<T>): void {
    const handlers = this.messageHandlers.get(type) || [];
    handlers.push(handler as MessageHandler);
    this.messageHandlers.set(type, handlers);
  }

  public removeMessageHandler<T>(type: string, handler: MessageHandler<T>): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler);
      if (index !== -1) {
        handlers.splice(index, 1);
        if (handlers.length === 0) {
          this.messageHandlers.delete(type);
        } else {
          this.messageHandlers.set(type, handlers);
        }
      }
    }
  }

  public onNewMessage(callback: (message: Message) => void): void {
    this.addMessageHandler<Message>('newMessage', callback);
  }

  public onMessagesRead(callback: (data: { threadId: string; userId: string }) => void): void {
    this.addMessageHandler<{ threadId: string; userId: string }>('messagesRead', callback);
  }

  public markAsRead(threadId: string): void {
    this.sendMessage('markAsRead', { threadId });
  }

  public removeListeners(): void {
    this.messageHandlers.clear();
  }
}

export default WebSocketService; 