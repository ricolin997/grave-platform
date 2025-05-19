'use client';

import { useState, useEffect } from 'react';
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
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            lastMessage: message.content,
            updatedAt: new Date().toISOString(),
            unreadCount: message.receiverId === user.id ? 
              (updatedThreads[threadIndex].unreadCount || 0) + 1 : 
              updatedThreads[threadIndex].unreadCount,
          };
          return updatedThreads;
        });

        // 如果當前正在查看這個對話，更新消息列表
        if (activeConversation && 
            activeConversation.messages.length > 0 && 
            activeConversation.messages[0].threadId === message.threadId) {
          setActiveConversation(prev => {
            if (!prev) return null;
            return {
              ...prev,
              messages: [...prev.messages, {
                ...message,
                isOwn: message.senderId === user.id,
              }],
            };
          });
        }
        
        // 如果消息不是自己發送的，顯示通知
        if (message.senderId !== user.id) {
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
        lastMessage: formattedMessages[formattedMessages.length - 1].content,
        lastMessageTime: formattedMessages[formattedMessages.length - 1].createdAt,
        unreadCount: 0
      });
    } catch (err) {
      console.error('獲取對話消息失敗', err);
      setActiveConversation(prev => ({
        ...prev,
        loading: false,
        error: '無法載入對話內容，請稍後再試',
      }));
    }
  };

  // 發送回覆消息
  const handleSendReply = async (content: string) => {
    if (!activeConversation || !user) return;

    try {
      const messageData: SendMessageData = {
        productId: activeConversation.productId,
        receiverId: activeConversation.otherUserId,
        content,
        threadId: activeConversation.threadId
      };

      const newMessage = await messagesApi.sendMessage(messageData);
      
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage.content,
          lastMessageTime: newMessage.createdAt,
          unreadCount: 0
        };
      });
    } catch (error) {
      console.error('發送消息失敗:', error);
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
                <div className="space-y-4">
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