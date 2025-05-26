export interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  threadId: string;
  productId: string;
  read: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  isOwn: boolean;
}

export interface ThreadItem {
  threadId: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  unreadCount: number;
  updatedAt: Date;
}

export interface ActiveConversation {
  id: string;
  productId: string;
  productTitle: string;
  productImage?: string;
  buyerId: string;
  buyerName: string;
  messages: MessageItem[];
  loading?: boolean;
  error?: string | null;
} 