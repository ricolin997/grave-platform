export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  threadId: string;
  productId: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessageThread {
  threadId: string;
  productId: string;
  productName: string;
  productImage?: string;
  productTitle?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  product?: {
    id: string;
    name?: string;
    title?: string;
    image?: string;
  };
}

export interface SendMessageData {
  productId: string;
  receiverId: string;
  content: string;
  threadId?: string;
}

export interface Conversation {
  messages: Message[];
  hasMore: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
}

export interface ThreadsResponse {
  threads: MessageThread[];
  total: number;
  page: number;
  limit: number;
} 