'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { messagesApi, MessageThread } from '@/lib/api/messages';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WebSocketService from '@/lib/services/WebSocketService';
import type { Message } from '@/lib/types/message';
import { NotificationService } from '@/lib/services/NotificationService';
import { ThreadItem, MessageItem, ActiveConversation } from './types';
import { AxiosError } from 'axios';

// 擴展 MessageThread 類型以包含可能的產品詳情
interface ExtendedMessageThread extends MessageThread {
  product?: {
    name?: string;
    title?: string;
    image?: string;
  }
}

export default function SellerMessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const ws = WebSocketService.getInstance();
  const notificationService = NotificationService.getInstance();
  const [isLoading, setIsLoading] = useState(true);
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [error, setError] = useState('');
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessages, setSendingMessages] = useState<Record<string, 'sending' | 'sent' | 'failed'>>({});
  const [inputHeight, setInputHeight] = useState('auto');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);

  // 添加防抖功能
  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
  };

  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 延遲

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      loadThreads();
    }
  }, [user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        notificationService.resetUnreadCount();
        loadThreads();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadThreads = async () => {
    try {
      setIsLoading(true);
      const response = await messagesApi.getThreads(1, 10, true);
      console.log('獲取到的對話列表詳情:', JSON.stringify(response.threads, null, 2));
      
      setThreads(response.threads.map(thread => {
        // 使用類型斷言獲取更多屬性
        console.log(`處理對話線程 ${thread.threadId}:`, JSON.stringify(thread, null, 2));
        
        // 直接從對話線程中讀取商品名稱
        // 使用 ExtendedMessageThread 類型而不是 any
        const extendedThread = thread as ExtendedMessageThread;
        
        // 嘗試從各種可能的屬性中獲取商品名稱
        let productTitle = '';
        
        // 1. 首先檢查是否有 product 對象
        if (extendedThread.product) {
          if (extendedThread.product.name) {
            productTitle = extendedThread.product.name;
            console.log(`從 product.name 獲取商品名稱: ${productTitle}`);
          } else if (extendedThread.product.title) {
            productTitle = extendedThread.product.title;
            console.log(`從 product.title 獲取商品名稱: ${productTitle}`);
          }
        }
        
        // 2. 如果沒有從 product 對象獲取到名稱，則檢查 productTitle 屬性
        if (!productTitle && 'productTitle' in thread) {
          const title = (thread as {productTitle?: string}).productTitle;
          if (title) {
            productTitle = title;
            console.log(`從 productTitle 屬性獲取商品名稱: ${productTitle}`);
          }
        }
        
        // 3. 如果仍然沒有，則嘗試 productName 屬性
        if (!productTitle && thread.productName) {
          productTitle = thread.productName;
          console.log(`從 productName 屬性獲取商品名稱: ${productTitle}`);
        }
        
        // 如果仍然沒有商品名稱，則使用默認值
        if (!productTitle) {
          console.warn(`對話 ${thread.threadId} 沒有商品名稱，使用默認值`);
          productTitle = '未命名商品';
        } else {
          console.log(`對話 ${thread.threadId} 的最終商品名稱: ${productTitle}`);
        }
        
        // 嘗試獲取商品圖片
        let productImage = thread.productImage || '/placeholder.png';
        if (extendedThread.product && extendedThread.product.image) {
          productImage = extendedThread.product.image;
          console.log(`從 product.image 獲取商品圖片`);
        }
        
        // 構建完整的 ThreadItem 對象
        const threadItem = {
          threadId: thread.threadId,
          productId: thread.productId,
          productTitle: productTitle,
          productImage: productImage,
          otherUserId: thread.otherUserId,
          otherUserName: thread.otherUserName || '未知買家',
          lastMessage: thread.lastMessage || '沒有訊息',
          unreadCount: thread.unreadCount || 0,
          updatedAt: thread.lastMessageTime ? new Date(thread.lastMessageTime) : 
                    (thread.updatedAt ? new Date(thread.updatedAt) : new Date())
        };
        
        console.log(`構建的 ThreadItem:`, JSON.stringify(threadItem));
        return threadItem;
      }));
    } catch (err) {
      setError('無法載入訊息列表');
      console.error('Error loading threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (threadId: string) => {
    try {
      console.log('嘗試載入對話:', threadId);
      const thread = threads.find(t => t.threadId === threadId);
      
      if (!thread) {
        console.error('找不到對應的對話線程:', threadId);
        setError('找不到對應的對話');
        return;
      }

      console.log('找到對話線程:', thread);
      setMessagesPage(1);
      
      // 確保 otherUserId 和 productId 不為 undefined
      if (!thread.otherUserId) {
        console.error('對話缺少買家ID:', thread);
        setError('無法載入對話：缺少買家ID');
        return;
      }
      
      if (!thread.productId) {
        console.error('對話缺少商品ID:', thread);
        setError('無法載入對話：缺少商品ID');
        return;
      }
      
      // 設置初始狀態為加載中
      setActiveConversation({
        id: thread.threadId,
        productId: thread.productId,
        productTitle: thread.productTitle,
        productImage: thread.productImage,
        buyerId: thread.otherUserId,
        buyerName: thread.otherUserName,
        messages: [],
        loading: true,
        error: null
      });
      
      console.log('開始獲取對話消息, 買家ID:', thread.otherUserId, '商品ID:', thread.productId);
      
      const response = await messagesApi.getConversation(
        thread.otherUserId,
        thread.productId
      );

      console.log('獲取到對話消息:', response);

      // 標記消息為已讀
      const unreadMessageIds = response.messages
        .filter(msg => !msg.read && msg.receiverId === user?.id)
        .map(msg => msg.id);
        
      if (unreadMessageIds.length > 0) {
        await messagesApi.markAsRead(unreadMessageIds);
        ws.markAsRead(threadId);
        
        // 發出messagesRead事件通知，以便導航欄能更新未讀消息計數
        const event = new CustomEvent('messagesRead', {
          detail: { threadId: threadId }
        });
        window.dispatchEvent(event);
        
        // 更新本地對話列表的未讀計數
        setThreads(prevThreads => 
          prevThreads.map(t => 
            t.threadId === threadId
              ? { ...t, unreadCount: 0 } 
              : t
          )
        );
      }

      // 嘗試從 response 中獲取更多產品信息
      let productInfo = null;
      if (response.messages.length > 0) {
        interface ExtendedMessage {
          productInfo?: {
            name?: string;
            title?: string;
            image?: string;
          };
        }
        const firstMessage = response.messages[0] as ExtendedMessage;
        if (firstMessage.productInfo) {
          productInfo = firstMessage.productInfo;
          console.log('從消息中獲取到產品信息:', productInfo);
        }
      }

      setActiveConversation({
        id: thread.threadId,
        productId: thread.productId,
        productTitle: thread.productTitle,
        productImage: thread.productImage,
        buyerId: thread.otherUserId,
        buyerName: thread.otherUserName,
        messages: response.messages.map(msg => ({
          ...msg,
          isOwn: msg.senderId === user?.id
        })),
        loading: false,
        error: null
      });
      
      // 設置是否有更多消息可加載
      setHasMoreMessages(response.page < response.totalPages);
    } catch (err) {
      console.error('Error loading conversation:', err);
      
      // 如果已經設置了 activeConversation，則更新其錯誤狀態
      if (activeConversation && activeConversation.id === threadId) {
        setActiveConversation({
          ...activeConversation,
          loading: false,
          error: '無法載入對話內容，請稍後再試'
        });
      } else {
        setError('無法載入對話');
      }
    }
  };

  // 加載更多歷史訊息
  const loadMoreMessages = async () => {
    if (!activeConversation || isLoadingMoreMessages || !hasMoreMessages) return;
    
    try {
      setIsLoadingMoreMessages(true);
      
      const nextPage = messagesPage + 1;
      const thread = threads.find(t => t.threadId === activeConversation.id);
      
      if (!thread) {
        console.error('找不到對應的對話線程:', activeConversation.id);
        setIsLoadingMoreMessages(false);
        return;
      }
      
      // 確保必要的參數存在
      if (!thread.otherUserId || !thread.productId) {
        console.error('對話缺少必要參數:', thread);
        setIsLoadingMoreMessages(false);
        return;
      }
      
      console.log('加載更多消息, 頁碼:', nextPage);
      
      const response = await messagesApi.getConversation(
        thread.otherUserId,
        thread.productId,
        nextPage
      );
      
      console.log('獲取到更多消息:', response);
      
      // 合併並刪除重複消息
      const newMessages = response.messages.map(msg => ({
        ...msg,
        isOwn: msg.senderId === user?.id
      }));
      
      // 檢查是否有重複消息
      const existingMessageIds = activeConversation.messages.map(m => m.id);
      const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.includes(msg.id));
      
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...uniqueNewMessages, ...prev.messages],
          loading: false,
          error: null
        };
      });
      
      setMessagesPage(nextPage);
      setHasMoreMessages(response.page < response.totalPages);
    } catch (error) {
      console.error('Error loading more messages:', error);
      notificationService.showNotification(
        '載入失敗',
        '無法加載更多消息，請稍後再試'
      );
      
      // 更新錯誤狀態但保留現有消息
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          loading: false,
          error: '無法加載更多消息，請稍後再試'
        };
      });
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

    // 避免在之前的訊息仍在發送時重複發送
    if (Object.values(sendingMessages).includes('sending')) {
      notificationService.showNotification('提示', '正在發送訊息，請稍候再試');
      return;
    }

    const tempMessageId = Date.now().toString();
    const messageData = {
      content: newMessage,
      receiverId: activeConversation.buyerId,
      productId: activeConversation.productId,
      threadId: activeConversation.id
    };

    // 添加臨時消息到對話中
    const tempMessage: MessageItem = {
      id: tempMessageId,
      content: newMessage,
      senderId: user.id,
      receiverId: activeConversation.buyerId,
      threadId: activeConversation.id,
      productId: activeConversation.productId,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isOwn: true
    };

    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage],
        loading: false,
        error: null
      };
    });

    setSendingMessages(prev => ({
      ...prev,
      [tempMessageId]: 'sending',
      'new': 'sending'
    }));

    try {
      const response = await messagesApi.send(messageData);
      
      // 更新消息狀態
      setSendingMessages(prev => ({
        ...prev,
        [tempMessageId]: 'sent',
        'new': 'sent'
      }));

      // 更新消息列表，替換臨時消息，確保 isOwn 設為 true
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === tempMessageId ? { ...response, isOwn: true } : msg
          ),
          loading: false,
          error: null
        };
      });

      // 自動滾動到底部
      scrollToBottom();
      
      // 清空輸入框
      setNewMessage('');
      
      // 清除發送狀態
      setTimeout(() => {
        setSendingMessages(prev => {
          const newState = { ...prev };
          delete newState['new'];
          return newState;
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setSendingMessages(prev => ({
        ...prev,
        [tempMessageId]: 'failed',
        'new': 'failed'
      }));
      
      // 顯示錯誤通知
      notificationService.showNotification(
        '發送失敗',
        '訊息發送失敗，請檢查網絡連接後重試'
      );
      
      // 清除發送狀態
      setTimeout(() => {
        setSendingMessages(prev => {
          const newState = { ...prev };
          delete newState['new'];
          return newState;
        });
      }, 2000);
    }
  };

  // 重試發送失敗的消息
  const handleRetryMessage = async (messageId: string) => {
    if (!activeConversation || !user) return;

    const failedMessage = activeConversation.messages.find(msg => msg.id === messageId);
    if (!failedMessage) return;

    setSendingMessages(prev => ({
      ...prev,
      [messageId]: 'sending'
    }));

    const messageData = {
      content: failedMessage.content,
      receiverId: failedMessage.receiverId,
      productId: failedMessage.productId,
      threadId: failedMessage.threadId
    };

    try {
      const response = await messagesApi.send(messageData);
      
      // 更新消息狀態
      setSendingMessages(prev => ({
        ...prev,
        [messageId]: 'sent'
      }));

      // 更新消息列表，替換失敗消息
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? { ...response, isOwn: true } : msg
          ),
          loading: false,
          error: null
        };
      });
    } catch (error) {
      console.error('Error retrying message:', error);
      setSendingMessages(prev => ({
        ...prev,
        [messageId]: 'failed'
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    // 自動調整高度
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    setInputHeight(e.target.style.height);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;

    try {
      await messagesApi.deleteMessage(messageId);
      
      // 更新本地消息列表
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== messageId),
          loading: false,
          error: null
        };
      });
      
      // 顯示成功通知
      notificationService.showNotification(
        '成功',
        '訊息已撤回'
      );
    } catch (error: unknown) {
      console.error('Error deleting message:', error);
      
      // 檢查是否為 403 錯誤（消息超過 2 分鐘無法撤回）
      const axiosError = error as AxiosError<{message: string}>;
      if (axiosError.response && axiosError.response.status === 403) {
        notificationService.showNotification(
          '無法撤回消息',
          axiosError.response.data?.message || '消息超過 2 分鐘，無法撤回'
        );
      } else {
        // 其他錯誤
        notificationService.showNotification(
          '操作失敗',
          '撤回消息失敗，請稍後再試'
        );
      }
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchTotalPages(1);
      return;
    }

    try {
      setIsSearching(true);
      console.log(`執行搜尋: "${query}", 頁碼: ${searchPage}`);
      const response = await messagesApi.searchMessages(query, searchPage);
      
      if (response && response.messages) {
        setSearchResults(response.messages.map(msg => ({
          ...msg,
          isOwn: msg.senderId === user?.id
        })));
        setSearchTotalPages(response.totalPages || 1);
        console.log(`搜尋結果: 找到 ${response.messages.length} 條訊息, 共 ${response.totalPages} 頁`);
      } else {
        console.error('搜尋返回了無效的數據格式:', response);
        setSearchResults([]);
        setSearchTotalPages(1);
        notificationService.showNotification('搜尋失敗', '返回了無效的數據格式');
      }
    } catch (err) {
      console.error('搜尋訊息時發生錯誤:', err);
      setSearchResults([]);
      setSearchTotalPages(1);
      
      // 特別處理 500 內部伺服器錯誤
      const axiosError = err as AxiosError<{message: string, statusCode: number}>;
      if (axiosError.response && axiosError.response.status === 500) {
        console.error('後端伺服器內部錯誤:', axiosError.response.data);
        
        // 顯示友好的錯誤消息，提示用戶搜尋功能暫不可用
        notificationService.showNotification(
          '搜尋功能暫不可用', 
          '系統管理員正在修復此問題，請稍後再試'
        );
        
        // 清空搜尋框，返回到消息列表
        setSearchQuery('');
      } else {
        notificationService.showNotification(
          '搜尋失敗', 
          axiosError.message || '無法執行搜尋，請稍後再試'
        );
      }
    } finally {
      setIsSearching(false);
    }
  };

  // 當防抖後的搜尋查詢變更時，執行搜尋
  useEffect(() => {
    if (debouncedSearchQuery) {
      handleSearch(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  // 當搜尋頁面變更時，重新執行搜尋
  useEffect(() => {
    if (debouncedSearchQuery && searchPage > 0) {
      handleSearch(debouncedSearchQuery);
    }
  }, [searchPage]);

  // 處理頁面變更
  const handlePageChange = (newPage: number) => {
    console.log(`切換到頁面: ${newPage}`);
    setSearchPage(newPage);
  };

  // 設置 WebSocket 連接和監聽器
  useEffect(() => {
    if (user) {
      // 確保 WebSocket 連接
      ws.connect();
    }
    
    // 組件卸載時斷開連接
    return () => {
      // 只在組件完全卸載時斷開連接
      ws.removeListeners();
    };
  }, [user]);

  // 訂閱新消息
  useEffect(() => {
    if (user) {
      // 使用正確的方式添加消息監聽器
      const handleNewMessage = (message: Message) => {
        // 更新對話列表中的最新消息
        setThreads(prevThreads => {
          const threadIndex = prevThreads.findIndex(t => t.threadId === message.threadId);
          if (threadIndex === -1) return prevThreads; // 如果找不到對話，就不更新
          
          const updatedThreads = [...prevThreads];
          // 只有當消息發送給當前用戶且不是當前用戶發送的消息，才增加未讀計數
          const shouldIncrementUnread = message.receiverId === user?.id && message.senderId !== user?.id;
          
          // 保留原有的商品名稱和其他屬性，只更新最新消息、更新時間和未讀數量
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            lastMessage: message.content,
            updatedAt: new Date(),
            unreadCount: shouldIncrementUnread 
              ? (updatedThreads[threadIndex].unreadCount || 0) + 1 
              : (updatedThreads[threadIndex].unreadCount || 0)
          };
          
          console.log('更新對話線程:', updatedThreads[threadIndex]);
          return updatedThreads;
        });
        
        // 如果消息屬於當前活動對話，則更新活動對話
        if (activeConversation?.id === message.threadId) {
          setActiveConversation(prev => {
            if (!prev) return null;
            
            // 明確設置 isOwn 屬性
            const isOwnMessage = message.senderId === user?.id;
            
            return {
              ...prev,
              messages: [...prev.messages, { ...message, isOwn: isOwnMessage }]
            };
          });
          
          // 如果接收到的消息是發給當前用戶且不是當前用戶發送的，則標記為已讀
          if (message.receiverId === user?.id && message.senderId !== user?.id) {
            messagesApi.markAsRead([message.id]);
            ws.markAsRead(message.threadId);
          }
        } else if (message.receiverId === user?.id && message.senderId !== user?.id) {
          // 如果消息不屬於當前對話但是發給當前用戶的，則顯示通知
          notificationService.showNotification(
            '新消息',
            `${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`
          );
        }
      };

      // 正確地添加監聽器
      ws.onNewMessage(handleNewMessage);
      
      // 這裡不需要清理函數，因為我們在組件卸載時會調用 removeListeners
    }
  }, [activeConversation, user?.id]);

  // 處理消息已讀狀態更新
  useEffect(() => {
    if (user) {
      const handleMessagesRead = (data: { threadId: string, userId: string }) => {
        if (activeConversation?.id === data.threadId) {
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: prev.messages.map(msg => ({
                ...msg,
                read: msg.senderId === data.userId ? true : msg.read
              }))
            };
          });
        }
      };

      // 正確地添加監聽器
      ws.onMessagesRead(handleMessagesRead);
      
      // 這裡不需要清理函數，因為我們在組件卸載時會調用 removeListeners
    }
  }, [activeConversation, user]);

  // 標記消息為已讀
  const markMessagesAsRead = useCallback(async () => {
    if (!activeConversation || !user) return;

    try {
      // 找出所有未讀且接收者是當前用戶的消息
      const unreadMessageIds = activeConversation.messages
        .filter(msg => !msg.read && msg.receiverId === user.id)
        .map(msg => msg.id);
      
      // 如果沒有未讀消息，則不需要調用 API
      if (unreadMessageIds.length === 0) return;
      
      console.log('標記消息為已讀:', unreadMessageIds);
      
      // 調用 API 標記消息為已讀
      await messagesApi.markAsRead(unreadMessageIds);
      
      // 發送 WebSocket 消息，使用正確的參數順序
      ws.sendMessage('markAsRead', { threadId: activeConversation.id });
      
      // 更新本地對話列表的未讀計數
      setThreads(prevThreads => 
        prevThreads.map(t => 
          t.threadId === activeConversation.id
            ? { ...t, unreadCount: 0 } 
            : t
        )
      );
      
      // 更新活動對話中的消息已讀狀態
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(msg => ({
            ...msg,
            read: msg.receiverId === user.id ? true : msg.read
          }))
        };
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [activeConversation, user]);

  // 當對話切換時標記消息為已讀
  useEffect(() => {
    if (activeConversation && user) {
      // 檢查是否有未讀消息
      const hasUnreadMessages = activeConversation.messages.some(
        msg => !msg.read && msg.receiverId === user.id
      );
      
      if (hasUnreadMessages) {
        markMessagesAsRead();
      }
    }
  }, [activeConversation?.id, user?.id, markMessagesAsRead]);

  useEffect(() => {
    if (activeConversation?.messages.length) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);

  // 處理發送回覆後的已讀消息更新
  useEffect(() => {
    const updateNavbarUnreadCount = () => {
      // 發出自定義事件通知導航欄更新未讀消息數
      const event = new CustomEvent('messagesRead');
      window.dispatchEvent(event);
    };
    
    // 在組件掛載和卸載時觸發更新
    updateNavbarUnreadCount();
    
    return () => {
      // 在組件卸載時也觸發一次更新，確保導航欄數字準確
      updateNavbarUnreadCount();
    };
  }, []);

  if (isLoading) {
    return <div>載入中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto flex flex-col md:flex-row h-[calc(100vh-4rem)] gap-4 p-2 md:p-4">
      {/* 對話列表 */}
      <div className={`${activeConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 lg:w-1/4 overflow-y-auto rounded-lg border bg-white p-3 md:p-4 mb-4 md:mb-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">我的對話</h2>
          {activeConversation && (
            <button 
              onClick={() => setActiveConversation(null)}
              className="md:hidden rounded-full p-2 bg-gray-100 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
          )}
        </div>
        
        {/* 添加搜尋框 */}
        <div className="mb-4 sticky top-0 bg-white z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              placeholder="搜尋對話..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pl-10 text-sm"
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        ) : isSearching ? (
          <div className="text-center py-4">
            <div className="flex justify-center items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p>搜尋中...</p>
            </div>
          </div>
        ) : searchQuery.trim() && searchResults.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500">沒有找到符合「{searchQuery}」的訊息</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            <div className="mb-2 text-sm text-gray-500">
              搜尋「{searchQuery}」的結果：
            </div>
            {searchResults.map(message => (
              <div
                key={message.id}
                className="p-3 rounded cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => loadConversation(message.threadId)}
              >
                <p className="text-sm font-medium truncate">
                  {message.content}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {searchTotalPages > 1 && (
              <div className="mt-4 flex justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, searchPage - 1))}
                  disabled={searchPage === 1 || isSearching}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  上一頁
                </button>
                <span className="px-3 py-1">
                  {searchPage} / {searchTotalPages}
                </span>
                <button
                  onClick={() => handlePageChange(Math.min(searchTotalPages, searchPage + 1))}
                  disabled={searchPage === searchTotalPages || isSearching}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  下一頁
                </button>
              </div>
            )}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-4 text-gray-600">暫無對話</div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.threadId}
                className={`cursor-pointer rounded-lg p-2 md:p-3 transition-colors ${
                  activeConversation?.id === thread.threadId
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => loadConversation(thread.threadId)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full flex-shrink-0">
                    <Image
                      src={thread.productImage || '/placeholder.png'}
                      alt={thread.productTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm md:text-base truncate max-w-[70%]">{thread.productTitle || '未命名商品'}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-1 md:ml-2">
                        {new Date(thread.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mb-1 truncate">
                      買家: {thread.otherUserName || '未知買家'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs md:text-sm text-gray-600 truncate max-w-[80%]">{thread.lastMessage}</p>
                      {thread.unreadCount > 0 && (
                        <span className="rounded-full bg-primary px-1.5 md:px-2 py-0.5 md:py-1 text-xs text-white min-w-[20px] text-center">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 對話內容 */}
      <div className={`${activeConversation ? 'block' : 'hidden md:block'} flex-1 flex flex-col rounded-lg border bg-white p-3 md:p-4`}>
        {activeConversation ? (
          <>
            <div className="mb-3 md:mb-4 flex items-center gap-2 md:gap-3 border-b pb-3 md:pb-4">
              <button 
                onClick={() => setActiveConversation(null)}
                className="md:hidden rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 mr-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full flex-shrink-0">
                <Image
                  src={activeConversation.productImage || '/placeholder.png'}
                  alt={activeConversation.productTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm md:text-base truncate">{activeConversation.productTitle}</h3>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  買家: {activeConversation.buyerName}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeConversation.loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : activeConversation.error ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                  {activeConversation.error}
                </div>
              ) : activeConversation.messages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-600">
                  暫無消息
                </div>
              ) : (
                <div className="max-h-[calc(100vh-250px)] md:max-h-[calc(100vh-300px)] min-h-[200px] md:min-h-[300px] overflow-y-auto space-y-3 md:space-y-4 p-2 md:p-4">
                  {hasMoreMessages && (
                    <div className="flex justify-center py-2">
                      <button
                        onClick={loadMoreMessages}
                        disabled={isLoadingMoreMessages}
                        className="px-3 md:px-4 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isLoadingMoreMessages ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            載入中...
                          </span>
                        ) : (
                          '載入更早的訊息'
                        )}
                      </button>
                    </div>
                  )}
                  {activeConversation.messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3 ${
                          message.isOwn
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm md:text-base break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[10px] md:text-xs opacity-70">
                            {new Date(message.createdAt).toLocaleString()}
                          </p>
                          {message.isOwn && (
                            <div>
                              {sendingMessages[message.id] === 'sending' && (
                                <span className="text-[10px] md:text-xs text-gray-300 ml-2">發送中...</span>
                              )}
                              {sendingMessages[message.id] === 'failed' && (
                                <div className="flex items-center space-x-1 ml-2">
                                  <span className="text-[10px] md:text-xs text-red-300">發送失敗</span>
                                  <button
                                    onClick={() => handleRetryMessage(message.id)}
                                    className="text-[10px] md:text-xs text-blue-300 hover:text-blue-100 transition-colors ml-1"
                                    title="重試發送"
                                  >
                                    重試
                                  </button>
                                </div>
                              )}
                              {(() => {
                                // 檢查消息是否在 2 分鐘內
                                const messageTime = new Date(message.createdAt).getTime();
                                const currentTime = new Date().getTime();
                                const timeDiff = currentTime - messageTime;
                                const canDelete = timeDiff <= 2 * 60 * 1000; // 2 分鐘 = 120,000 毫秒
                                
                                // 只有在可以刪除時才顯示撤回按鈕
                                return canDelete ? (
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="text-[10px] md:text-xs text-red-300 hover:text-red-100 transition-colors ml-2"
                                    title="撤回訊息"
                                  >
                                    撤回
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="mt-3 md:mt-4 flex gap-1 md:gap-2">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                placeholder="輸入消息..."
                className="flex-1 rounded-lg border p-2 text-sm md:text-base focus:border-primary focus:outline-none resize-none"
                style={{ height: inputHeight, maxHeight: '120px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!newMessage.trim()}
                className="rounded-lg bg-primary px-3 md:px-4 py-2 text-sm md:text-base text-white disabled:opacity-50"
              >
                {sendingMessages['new'] === 'sending' ? '發送中...' : '發送'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600">
            <div className="text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-center">請選擇一個對話</p>
              <p className="text-xs text-gray-500 mt-2 hidden md:block">從左側列表中選擇一個對話開始聊天</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 