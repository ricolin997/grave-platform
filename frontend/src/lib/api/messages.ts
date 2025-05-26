import axiosInstance from './axios';

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
  lastMessageTime?: string;
  updatedAt?: string; // 支持 updatedAt 或 lastMessageTime
  unreadCount: number;
  messageCount?: number;
}

export interface SendMessageData {
  content: string;
  receiverId: string;
  productId: string;
  threadId?: string;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ThreadsResponse {
  threads: MessageThread[];
  total: number;
  page: number;
  totalPages: number;
}

export const messagesApi = {
  // 檢查ID是否為有效的MongoDB ObjectId格式，如果不是，嘗試轉換它
  ensureValidMongoId: (id: string | undefined | null): string => {
    // 如果 id 是 undefined 或 null，返回一個默認值
    if (id === undefined || id === null) {
      console.error('收到無效的 ID: undefined 或 null');
      // 返回一個有效的 MongoDB ID 格式（24個0）
      return '000000000000000000000000';
    }
    
    // 輸出調試信息，幫助理解轉換過程
    console.log(`嘗試轉換ID: ${id}, 類型: ${typeof id}, 長度: ${id.length}`);
    
    // MongoDB ObjectId應為24位十六進制字符
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      console.log(`ID "${id}" 已經是有效的MongoDB ID格式`);
      return id; // 已經是有效的MongoDB ID格式
    }
    
    // 如果 ID 包含了其他格式，嘗試提取有效的 MongoDB ID
    // 例如，某些 API 可能返回的 ID 有前綴或後綴
    const extractedId = id.match(/([0-9a-fA-F]{24})/);
    if (extractedId && extractedId[1]) {
      console.log(`轉換了ID格式，原始: ${id}, 轉換後: ${extractedId[1]}`);
      return extractedId[1];
    }
    
    // 檢查是否是數字或其他簡單值，嘗試直接轉換
    if (!isNaN(Number(id))) {
      // 是數字，填充或截斷為24位十六進制
      const numStr = Number(id).toString(16).padStart(24, '0');
      console.log(`從數字轉換了ID，原始: ${id}, 轉換後: ${numStr}`);
      return numStr;
    }
    
    // 嘗試更強硬的修復方法 - 如果長度不是24，則填充或截斷
    let fixedId = String(id); // 確保是字符串
    
    if (fixedId.length < 24) {
      // 如果太短，用0填充到24位
      fixedId = fixedId.padEnd(24, '0');
    } else if (fixedId.length > 24) {
      // 如果太長，截斷到24位
      fixedId = fixedId.substring(0, 24);
    }
    
    // 替換所有非十六進制字符為0
    fixedId = fixedId.replace(/[^0-9a-fA-F]/g, '0');
    
    console.log(`強制修復ID，原始: ${id}, 修復後: ${fixedId}`);
    
    // 檢查修復後的ID是否是有效的MongoDB ID格式
    if (/^[0-9a-fA-F]{24}$/.test(fixedId)) {
      return fixedId;
    }
    
    // 最後的嘗試：生成一個全新的有效ID
    const newId = Array.from({length: 24}, () => 
      '0123456789abcdef'[Math.floor(Math.random() * 16)]
    ).join('');
    
    console.log(`無法修復ID，生成新ID: ${newId}`);
    return newId;
  },

  // 發送消息
  sendMessage: async (data: SendMessageData): Promise<Message> => {
    // 確保ID符合MongoDB格式
    try {
      console.log('發送消息原始數據:', JSON.stringify(data));
      
      const validatedData = {
        ...data,
        productId: messagesApi.ensureValidMongoId(data.productId),
        receiverId: messagesApi.ensureValidMongoId(data.receiverId),
      };
      
      // 如果沒有提供threadId或為空字符串，設置為undefined讓後端自動生成
      if (!validatedData.threadId) {
        delete validatedData.threadId;
      }
      
      console.log('發送消息驗證後數據:', JSON.stringify(validatedData));
      
      const response = await axiosInstance.post<Message>('/messages', validatedData);
      return response.data;
    } catch (error) {
      console.error('發送消息失敗:', error);
      if (error instanceof Error) {
        // 重新拋出我們的驗證錯誤，以便UI可以正確處理
        throw error;
      }
      throw error; // 其他錯誤直接拋出
    }
  },

  // 發送消息的別名，兼容現有代碼
  send: async (data: SendMessageData): Promise<Message> => {
    return messagesApi.sendMessage(data);
  },

  // 獲取與特定用戶關於特定產品的對話消息
  getConversation: async (
    otherUserId: string,
    productId: string,
    page = 1,
    limit = 20
  ): Promise<MessagesResponse> => {
    // 確保ID符合MongoDB格式
    const validOtherUserId = messagesApi.ensureValidMongoId(otherUserId);
    const validProductId = messagesApi.ensureValidMongoId(productId);
    
    const response = await axiosInstance.get<MessagesResponse>(
      `/messages/conversation/${validOtherUserId}/${validProductId}`,
      {
        params: { page, limit }
      }
    );
    return response.data;
  },

  // 獲取用戶的所有消息對話
  getThreads: async (page = 1, limit = 10, includeProductDetails = true): Promise<ThreadsResponse> => {
    console.log('開始獲取消息對話列表, 頁碼:', page, '每頁數量:', limit, '包含商品詳情:', includeProductDetails);
    
    const response = await axiosInstance.get<ThreadsResponse>('/messages/threads', {
      params: { 
        page, 
        limit, 
        includeProductDetails,
        includeFullProduct: true,  // 添加參數以獲取完整的商品信息
        withProductDetails: true   // 兼容可能的其他參數名
      }
    });
    
    console.log('獲取到消息對話列表原始數據:', JSON.stringify(response.data, null, 2));
    console.log('對話線程數量:', response.data.threads.length);
    
    // 檢查每個對話線程的屬性
    response.data.threads.forEach((thread, index) => {
      console.log(`對話線程 ${index + 1}:`, JSON.stringify(thread, null, 2));
      // 特別檢查商品名稱
      console.log(`對話線程 ${index + 1} 的商品名稱:`, thread.productName || '無商品名稱');
      
      // 檢查是否有 product 屬性
      interface ExtendedThread extends MessageThread {
        product?: {
          name?: string;
          title?: string;
          image?: string;
        };
      }
      
      const extendedThread = thread as ExtendedThread;
      if (extendedThread.product) {
        console.log(`對話線程 ${index + 1} 的商品詳情:`, JSON.stringify(extendedThread.product, null, 2));
      }
    });
    
    return response.data;
  },

  // 標記消息為已讀
  markAsRead: async (messageIds: string[]): Promise<{ success: boolean }> => {
    const response = await axiosInstance.patch<{ success: boolean }>('/messages/read', {
      messageIds
    });
    return response.data;
  },

  // 獲取未讀消息數量
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await axiosInstance.get<{ count: number }>('/messages/unread/count');
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<void> => {
    const response = await axiosInstance.delete(`/messages/${messageId}`);
    return response.data;
  },

  searchMessages: async (query: string, page: number = 1, limit: number = 10): Promise<MessagesResponse> => {
    try {
      console.log('搜尋訊息, 關鍵字:', query, '頁碼:', page, '每頁數量:', limit);
      
      // 確保查詢參數有效
      if (!query || query.trim() === '') {
        console.warn('搜尋關鍵字為空');
        return { messages: [], total: 0, page: 1, totalPages: 1 };
      }
      
      const response = await axiosInstance.get<MessagesResponse>('/messages/search', {
        params: { 
          query: query.trim(),
          page, 
          limit,
          role: 'seller' // 明確指定角色為賣家
        }
      });
      
      console.log('搜尋結果:', response.data);
      return response.data;
    } catch (error) {
      console.error('搜尋訊息API錯誤:', error);
      
      // 重新拋出錯誤，讓調用者處理
      throw error;
    }
  }
}; 