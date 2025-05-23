'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { messagesApi } from '@/lib/api/messages';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WebSocketService from '@/lib/services/WebSocketService';
import { Message, MessageThread, SendMessageData } from '@/lib/types/message';
import { NotificationService } from '@/lib/services/NotificationService';

interface WebSocketMessage {
  type: string;
  data: any;
}

export default function UserMessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const ws = WebSocketService.getInstance();
  const notificationService = NotificationService.getInstance();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesPage, setMessagesPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);

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
      
      setThreads(response.threads);
      setTotalPages(response.totalPages);
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
  const loadConversation = async (thread: MessageThread) => {
    if (!user) return;

    try {
      setSelectedThread(thread);
      setActiveConversation({
        threadId: thread.threadId,
        messages: [],
        loading: true,
        error: null,
        productId: thread.productId,
        otherUserId: thread.otherUserId,
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0
      });
      
      // 重置分頁狀態
      setMessagesPage(1);
      
      const response = await messagesApi.getConversation(
        thread.otherUserId,
        thread.productId
      );
      
      // 標記對話中所有未讀消息為已讀
      const unreadMessageIds = response.messages
        .filter(msg => !msg.read && msg.receiverId === user.id)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        await messagesApi.markAsRead(unreadMessageIds);
        ws.markAsRead(thread.threadId);
        
        // 發出messagesRead事件通知，以便導航欄能更新未讀消息計數
        const event = new CustomEvent('messagesRead', {
          detail: { threadId: thread.threadId }
        });
        window.dispatchEvent(event);
        
        // 更新本地對話列表的未讀計數
        setThreads(prevThreads => 
          prevThreads.map(t => 
            t.threadId === thread.threadId 
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
        threadId: thread.threadId,
        messages: formattedMessages,
        loading: false,
        error: null,
        productId: thread.productId,
        otherUserId: thread.otherUserId,
        lastMessage: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].content : '',
        lastMessageTime: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1].createdAt : '',
        unreadCount: 0
      });
      
      // 設置是否有更多消息可加載
      setHasMoreMessages(response.page < response.totalPages);
    } catch (err) {
      console.error('獲取對話消息失敗', err);
      setActiveConversation(prev => ({
        ...prev,
        loading: false,
        error: '無法載入對話內容，請稍後再試',
      }));
    }
  };
  
  // 加載更多歷史訊息
  const loadMoreMessages = async () => {
    if (!activeConversation || !selectedThread || isLoadingMoreMessages || !hasMoreMessages) return;
    
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
    <div className="container mx-auto flex h-[calc(100vh-4rem)] gap-4 p-4">
      {/* 對話列表 */}
      <div className="w-1/3 overflow-y-auto rounded-lg border bg-white p-4">
        <h2 className="mb-4 text-xl font-bold">我的對話</h2>
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-600">{error}</div>
        ) : threads.length === 0 ? (
          <div className="rounded-lg bg-gray-50 p-4 text-gray-600">暫無對話</div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.threadId}
                className={`cursor-pointer rounded-lg p-3 transition-colors ${
                  selectedThread?.threadId === thread.threadId
                    ? 'bg-primary/10'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => loadConversation(thread)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={thread.productImage}
                      alt={thread.productTitle}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{thread.otherUserName}</h3>
                      {thread.unreadCount > 0 && (
                        <span className="rounded-full bg-primary px-2 py-1 text-xs text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{thread.lastMessage}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(thread.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 對話內容 */}
      <div className="flex flex-1 flex-col rounded-lg border bg-white p-4">
        {selectedThread ? (
          <>
            <div className="mb-4 flex items-center gap-3 border-b pb-4">
              <div className="relative h-12 w-12 overflow-hidden rounded-full">
                <Image
                  src={selectedThread.productImage}
                  alt={selectedThread.productTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{selectedThread.otherUserName}</h3>
                <p className="text-sm text-gray-600">{selectedThread.productTitle}</p>
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
                <div className="max-h-[calc(100vh-300px)] min-h-[300px] overflow-y-auto space-y-4 p-4">
                  {hasMoreMessages && (
                    <div className="flex justify-center py-2">
                      <button
                        onClick={loadMoreMessages}
                        disabled={isLoadingMoreMessages}
                        className="px-4 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isLoadingMoreMessages ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                  {activeConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.isOwn
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className="mt-1 text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
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
                className="flex-1 rounded-lg border p-2 focus:border-primary focus:outline-none"
              />
              <button
                onClick={() => handleSendReply(replyMessage)}
                disabled={sendingReply || !replyMessage.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-white disabled:opacity-50"
              >
                {sendingReply ? '發送中...' : '發送'}
              </button>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-gray-600">
            請選擇一個對話
          </div>
        )}
      </div>
    </div>
  );
} 