'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { messagesApi } from '@/lib/api/messages';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WebSocketService from '@/lib/services/WebSocketService';
import { Message, MessageThread, SendMessageData } from '@/lib/types/message';
import { NotificationService } from '@/lib/services/NotificationService';
import { AxiosError } from 'axios';

// 擴展 MessageThread 類型以處理可能的 updatedAt 屬性
interface ExtendedMessageThread extends MessageThread {
  updatedAt?: string;
  productTitle?: string;
}

export default function UserMessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const ws = WebSocketService.getInstance();
  const notificationService = NotificationService.getInstance();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<ExtendedMessageThread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page] = useState(1);
  const [selectedThread, setSelectedThread] = useState<ExtendedMessageThread | null>(null);
  const [activeConversation, setActiveConversation] = useState<{
    threadId: string;
    messages: Array<Message & { isOwn: boolean }>;
    loading: boolean;
    error: string | null;
    productId: string;
    otherUserId: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  } | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  
  // 添加搜尋相關狀態
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<Message & { isOwn: boolean }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  
  // 添加防抖函數
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

  // 滾動到底部的函數
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 當訊息更新時自動滾動到底部
  useEffect(() => {
    if (activeConversation?.messages.length) {
      scrollToBottom();
    }
  }, [activeConversation?.messages]);

  // 檢查用戶是否已登入
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // 設置 WebSocket 事件監聽器
  useEffect(() => {
    if (user) {
      // 確保 WebSocket 連接
      ws.connect();
      
      // 設置 WebSocket 事件監聽器
      const handleNewMessage = (message: Message) => {
        // 更新對話列表
        setThreads(prevThreads => {
          const threadIndex = prevThreads.findIndex(t => t.threadId === message.threadId);
          if (threadIndex === -1) {
            // 如果是新對話，需要重新獲取對話列表
            loadThreads();
            return prevThreads;
          }
          const updatedThreads = [...prevThreads];
          // 只有當消息接收者是當前用戶且發送者不是當前用戶時，才增加未讀數
          const shouldIncrementUnread = message.receiverId === user.id && message.senderId !== user.id;
          
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            lastMessage: message.content,
            // 使用可選鏈避免 undefined 錯誤
            unreadCount: shouldIncrementUnread ? 
              ((updatedThreads[threadIndex].unreadCount || 0) + 1) : 
              (updatedThreads[threadIndex].unreadCount || 0),
          };
          return updatedThreads;
        });

        // 如果當前正在查看這個對話，更新消息列表
        if (activeConversation && 
            activeConversation.threadId === message.threadId) {
          setActiveConversation(prev => {
            if (!prev) return null;
            
            // 確保設置正確的 isOwn 屬性
            const isOwnMessage = message.senderId === user.id;
            
            return {
              ...prev,
              messages: [...prev.messages, {
                ...message,
                isOwn: isOwnMessage,
              }],
              lastMessage: message.content,
              lastMessageTime: message.createdAt
            };
          });
          
          // 如果接收到新消息且當前正在查看該對話，則自動標記為已讀
          if (message.receiverId === user.id && message.senderId !== user.id) {
            messagesApi.markAsRead([message.id]);
            ws.markAsRead(message.threadId);
          }
        } else if (message.receiverId === user.id && message.senderId !== user.id) {
          // 如果接收到新消息但未查看該對話，顯示通知
          notificationService.showNotification(
            '新消息',
            `您有一則新消息: ${message.content.substring(0, 30)}${message.content.length > 30 ? '...' : ''}`
          );
        }
      };

      const handleMessageRead = (data: { threadId: string; userId: string }) => {
        setThreads(prevThreads => 
          prevThreads.map(thread => 
            thread.threadId === data.threadId 
              ? { ...thread, unreadCount: 0 }
              : thread
          )
        );
      };

      // 使用 Socket.io 特定的事件添加方式
      ws.onNewMessage(handleNewMessage);
      ws.onMessagesRead(handleMessageRead);

      // 清理函數
      return () => {
        // 清理事件監聽器
        ws.removeListeners();
      };
    }
  }, [user, activeConversation]);

  // 加載消息列表
  const loadThreads = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await messagesApi.getThreads(page);
      
      // 確保類型相容
      const formattedThreads = response.threads.map(thread => ({
        ...thread,
        // 確保所有必要屬性都有默認值
        lastMessageTime: thread.lastMessageTime || thread.updatedAt || new Date().toISOString(),
        // 如果後端返回了 productTitle，則使用它，否則嘗試使用 productName
        productTitle: thread.productTitle || thread.productName || '未命名商品'
      }));
      
      setThreads(formattedThreads);
    } catch (err) {
      console.error('獲取消息列表失敗', err);
      setError('無法載入消息列表，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [page, user]);

  // 加載特定對話消息
  const loadConversation = async (thread: ExtendedMessageThread | string) => {
    if (!user) return;

    try {
      // 處理當 thread 是 threadId 字符串的情況（從搜尋結果點擊）
      let targetThread: ExtendedMessageThread | undefined;
      if (typeof thread === 'string') {
        targetThread = threads.find(t => t.threadId === thread);
        if (!targetThread) {
          console.error('找不到對應的對話線程:', thread);
          notificationService.showNotification('錯誤', '找不到對應的對話');
          return;
        }
      } else {
        targetThread = thread;
      }

      setSelectedThread(targetThread);
      setActiveConversation({
        threadId: targetThread.threadId,
        messages: [],
        loading: true,
        error: null,
        productId: targetThread.productId,
        otherUserId: targetThread.otherUserId,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0
      });
      
      // 重置分頁狀態
      setMessagesPage(1);
      
      const response = await messagesApi.getConversation(
        targetThread.otherUserId,
        targetThread.productId
      );
      
      // 標記對話中所有未讀消息為已讀
      const unreadMessageIds = response.messages
        .filter(msg => !msg.read && msg.receiverId === user.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await messagesApi.markAsRead(unreadMessageIds);
        ws.markAsRead(targetThread.threadId);
        
        // 發出messagesRead事件通知，以便導航欄能更新未讀消息計數
        const event = new CustomEvent('messagesRead', {
          detail: { threadId: targetThread.threadId }
        });
        window.dispatchEvent(event);
        
        // 更新本地對話列表的未讀計數
        setThreads(prevThreads => 
          prevThreads.map(t => 
            t.threadId === targetThread.threadId 
              ? { ...t, unreadCount: 0 } 
              : t
          )
        );
      }
      
      // 格式化消息以便於顯示
      const formattedMessages = response.messages.map(msg => ({
        ...msg,
        isOwn: msg.senderId === user.id,
      })) as Array<Message & { isOwn: boolean }>;
      
      setActiveConversation({
        threadId: targetThread.threadId,
        messages: formattedMessages,
        loading: false,
        error: null,
        productId: targetThread.productId,
        otherUserId: targetThread.otherUserId,
        lastMessage: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].content : '',
        lastMessageTime: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].createdAt : '',
        unreadCount: 0
      });
      
      // 設置是否有更多消息可加載
      setHasMoreMessages(response.page < response.totalPages);
    } catch (err) {
      console.error('獲取對話消息失敗', err);
      // 確保返回完整的對象結構，避免類型錯誤
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          threadId: prev.threadId,
          messages: prev.messages || [],
          loading: false,
          error: '無法載入對話內容，請稍後再試',
          productId: prev.productId,
          otherUserId: prev.otherUserId,
          lastMessage: prev.lastMessage,
          lastMessageTime: prev.lastMessageTime,
          unreadCount: prev.unreadCount
        };
      });
    }
  };
  
  // 加載更多歷史訊息
  const loadMoreMessages = async () => {
    if (!activeConversation || !selectedThread || isLoadingMoreMessages || !hasMoreMessages || !user) return;
    
    try {
      setIsLoadingMoreMessages(true);
      
      const nextPage = messagesPage + 1;
      
      const response = await messagesApi.getConversation(
        activeConversation.otherUserId,
        activeConversation.productId,
        nextPage
      );
      
      // 合併並刪除重複消息
      const newMessages = response.messages.map(msg => ({
        ...msg,
        isOwn: msg.senderId === user.id,
      })) as Array<Message & { isOwn: boolean }>;
      
      // 檢查是否有重複消息
      const existingMessageIds = activeConversation.messages.map(m => m.id);
      const uniqueNewMessages = newMessages.filter(msg => !existingMessageIds.includes(msg.id));
      
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...uniqueNewMessages, ...prev.messages]
        };
      });
      
      setMessagesPage(nextPage);
      setHasMoreMessages(response.page < response.totalPages);
    } catch (error) {
      console.error('加載更多訊息失敗:', error);
      notificationService.showNotification(
        '載入失敗',
        '無法加載更多訊息，請稍後再試'
      );
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // 發送回覆消息
  const handleSendReply = async (content: string) => {
    if (!activeConversation || !user || !content.trim()) return;
    
    // 避免重複發送
    if (sendingReply) {
      notificationService.showNotification('提示', '正在發送訊息，請稍候再試');
      return;
    }
    
    // 設置正在發送狀態
    setSendingReply(true);
    
    // 創建臨時消息用於立即顯示
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content,
      senderId: user.id,
      receiverId: activeConversation.otherUserId,
      threadId: activeConversation.threadId,
      productId: activeConversation.productId,
      read: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOwn: true
    };
    
    // 先將臨時消息添加到對話，提供即時反饋
    setActiveConversation(prev => {
      if (!prev) return null;
      return {
        ...prev,
        messages: [...prev.messages, tempMessage],
        lastMessage: content,
        lastMessageTime: tempMessage.createdAt
      };
    });
    
    // 清空輸入框
    setReplyMessage('');

    try {
      const messageData: SendMessageData = {
        productId: activeConversation.productId,
        receiverId: activeConversation.otherUserId,
        content,
        threadId: activeConversation.threadId
      };

      const newMessage = await messagesApi.sendMessage(messageData);
      
      // 用服務器返回的消息替換臨時消息
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === tempMessage.id ? { ...newMessage, isOwn: true } : msg
          ),
          lastMessage: newMessage.content,
          lastMessageTime: newMessage.createdAt
        };
      });
      
      // 自動滾動到底部
      scrollToBottom();
    } catch (error) {
      console.error('發送消息失敗:', error);
      
      // 顯示錯誤通知
      notificationService.showNotification(
        '發送失敗',
        '訊息發送失敗，請檢查網絡連接後重試'
      );
      
      // 移除失敗的臨時消息
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== tempMessage.id)
        };
      });
    } finally {
      setSendingReply(false);
    }
  };

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

  // 添加搜尋功能
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

  // 添加撤回訊息功能
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;

    try {
      await messagesApi.deleteMessage(messageId);
      
      // 更新本地消息列表
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter(msg => msg.id !== messageId)
        };
      });
      
      // 顯示成功通知
      notificationService.showNotification(
        '成功',
        '訊息已撤回'
      );
    } catch (error: unknown) {
      console.error('撤回訊息失敗:', error);
      
      // 檢查是否為 403 錯誤（消息超過 2 分鐘無法撤回）
      const axiosError = error as AxiosError<{message: string}>;
      if (axiosError.response && axiosError.response.status === 403) {
        notificationService.showNotification(
          '無法撤回訊息',
          axiosError.response.data?.message || '訊息超過 2 分鐘，無法撤回'
        );
      } else {
        // 其他錯誤
        notificationService.showNotification(
          '操作失敗',
          '撤回訊息失敗，請稍後再試'
        );
      }
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto flex flex-col md:flex-row h-[calc(100vh-4rem)] gap-4 p-2 md:p-4">
      {/* 對話列表 */}
      <div className={`${selectedThread ? 'hidden md:block' : 'block'} w-full md:w-1/3 lg:w-1/4 overflow-y-auto rounded-lg border bg-white p-3 md:p-4 mb-4 md:mb-0`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold">我的對話</h2>
          {selectedThread && (
            <button 
              onClick={() => setSelectedThread(null)}
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
        
        {loading ? (
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
                  selectedThread?.threadId === thread.threadId
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => loadConversation(thread)}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full flex-shrink-0">
                    <Image
                      src={thread.productImage || '/placeholder.png'}
                      alt={thread.productTitle || '未命名商品'}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm md:text-base truncate max-w-[70%]">{thread.productTitle || '未命名商品'}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-1 md:ml-2">
                        {new Date(thread.lastMessageTime || thread.updatedAt || '').toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 mb-1 truncate">
                      賣家: {thread.otherUserName}
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
      <div className={`${selectedThread ? 'block' : 'hidden md:block'} flex-1 flex flex-col rounded-lg border bg-white p-3 md:p-4`}>
        {selectedThread ? (
          <>
            <div className="mb-3 md:mb-4 flex items-center gap-2 md:gap-3 border-b pb-3 md:pb-4">
              <button 
                onClick={() => setSelectedThread(null)}
                className="md:hidden rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 mr-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <div className="relative h-10 w-10 md:h-12 md:w-12 overflow-hidden rounded-full flex-shrink-0">
                <Image
                  src={selectedThread.productImage || '/placeholder.png'}
                  alt={selectedThread.productTitle || '未命名商品'}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm md:text-base truncate">{selectedThread.productTitle || '未命名商品'}</h3>
                <p className="text-xs md:text-sm text-gray-600 truncate">
                  賣家: {selectedThread.otherUserName}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {activeConversation?.loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : activeConversation?.error ? (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">
                  {activeConversation.error}
                </div>
              ) : activeConversation?.messages.length === 0 ? (
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
                  {activeConversation?.messages?.map((message) => (
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
              <input
                type="text"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(replyMessage);
                  }
                }}
                placeholder="輸入消息..."
                className="flex-1 rounded-lg border p-2 text-sm md:text-base focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleSendReply(replyMessage)}
                disabled={sendingReply || !replyMessage.trim()}
                className="rounded-lg bg-primary px-3 md:px-4 py-2 text-sm md:text-base text-white disabled:opacity-50"
              >
                {sendingReply ? '發送中...' : '發送'}
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