export class MessageResponseDto {
  id: string;
  senderId: string;
  receiverId: string;
  productId: string;
  content: string;
  read: boolean;
  threadId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}

export class MessageThreadDto {
  threadId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: MessageResponseDto;
  unreadCount: number;
  messageCount: number;

  constructor(partial: Partial<MessageThreadDto>) {
    Object.assign(this, partial);
  }
}

export class MessagesResponseDto {
  messages: MessageResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}

export class ThreadsResponseDto {
  threads: MessageThreadDto[];
  total: number;
  page: number;
  totalPages: number;
} 