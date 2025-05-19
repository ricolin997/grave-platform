'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { messagesApi } from '@/lib/api/messages';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import WebSocketService from '@/lib/services/WebSocketService';
import { Message, MessageThread, SendMessageData } from '@/lib/types/message';
import { NotificationService } from '@/lib/services/NotificationService';
import { ThreadItem, MessageItem, ActiveConversation } from './types';

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
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
      const response = await messagesApi.getThreads();
      setThreads(response.threads.map(thread => ({
        threadId: thread.id,
        productId: thread.productId,
        productTitle: thread.productTitle,
        productImage: thread.productImage,
        otherUserId: thread.buyerId,
        otherUserName: thread.buyerName,
        // 從第一條消息獲取最後消息內容
        lastMessage: thread.messages && thread.messages.length > 0
          ? thread.messages[0].content
          : '沒有訊息',
        // 計算未讀消息
        unreadCount: thread.messages
          ? thread.messages.filter(msg => !msg.read && !msg.isOwn).length
          : 0,
        updatedAt: thread.messages && thread.messages.length > 0
          ? new Date(thread.messages[0].createdAt)
          : new Date()
      })));
    } catch (err) {
      setError('無法載入訊息列表');
      console.error('Error loading threads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversation = async (threadId: string) => {
    try {
      const thread = threads.find(t => t.threadId === threadId);
      if (!thread) return;

      const response = await messagesApi.getConversation(
        thread.otherUserId,
        thread.productId
      );

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
        }))
      });
    } catch (err) {
      setError('無法載入對話');
      console.error('Error loading conversation:', err);
    }
  };

  const handleSendReply = async () => {
    if (!newMessage.trim() || !activeConversation || !user) return;

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
        messages: [...prev.messages, tempMessage]
      };
    });

    setSendingMessages(prev => ({
      ...prev,
      [tempMessageId]: 'sending'
    }));

    try {
      const response = await messagesApi.send(messageData);
      
      // 更新消息狀態
      setSendingMessages(prev => ({
        ...prev,
        [tempMessageId]: 'sent'
      }));

      // 更新消息列表，替換臨時消息
      setActiveConversation(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === tempMessageId ? { ...response, isOwn: true } : msg
          )
        };
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setSendingMessages(prev => ({
        ...prev,
        [tempMessageId]: 'failed'
      }));
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
          )
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
          messages: prev.messages.filter(msg => msg.id !== messageId)
        };
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await messagesApi.searchMessages(query, searchPage);
      setSearchResults(response.messages.map(msg => ({
        ...msg,
        isOwn: msg.senderId === user?.id
      })));
      setSearchTotalPages(response.totalPages);
    } catch (err) {
      setError('搜索失敗');
      console.error('Error searching messages:', err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // 訂閱新消息
    const unsubscribe = ws.onNewMessage((message) => {
      if (activeConversation?.id === message.threadId) {
        setActiveConversation(prev => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, { ...message, isOwn: message.senderId === user?.id }]
          };
        });
      }

      notificationService.handleNewMessage(message);
    });

    return () => {
      unsubscribe(); // 清理訂閱
    };
  }, [activeConversation, user?.id]);

  // 處理消息已讀狀態更新
  useEffect(() => {
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

    const unsubscribe = ws.onNewMessage((message: any) => {
      if ('threadId' in message && 'userId' in message) {
        handleMessagesRead(message as { threadId: string, userId: string });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeConversation]);

  // 標記消息為已讀
  const markMessagesAsRead = async () => {
    if (!activeConversation || !user) return;

    try {
      await messagesApi.markAsRead([activeConversation.id]);
      // 發送 WebSocket 消息
      const wsMessage = {
        senderId: user.id,
        receiverId: activeConversation.buyerId,
        content: '',
        threadId: activeConversation.id,
        productId: activeConversation.productId,
        read: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: Date.now().toString()
      };
      ws.sendMessage(wsMessage);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // 當對話切換時標記消息為已讀
  useEffect(() => {
    if (activeConversation) {
      markMessagesAsRead();
    }
  }, [activeConversation]);

  if (isLoading) {
    return <div>載入中...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">我的訊息</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 訊息列表 */}
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="搜尋對話..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {isSearching ? (
            <div className="text-center py-4">
              <p>搜索中...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map(message => (
                <div
                  key={message.id}
                  className="p-3 rounded cursor-pointer hover:bg-gray-100"
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
                    onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                    disabled={searchPage === 1}
                    className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                  >
                    上一頁
                  </button>
                  <span className="px-3 py-1">
                    {searchPage} / {searchTotalPages}
                  </span>
                  <button
                    onClick={() => setSearchPage(p => Math.min(searchTotalPages, p + 1))}
                    disabled={searchPage === searchTotalPages}
                    className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                  >
                    下一頁
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold mb-4">訊息列表</h2>
              {threads.length === 0 ? (
                <p className="text-gray-500">目前沒有訊息</p>
              ) : (
                <div className="space-y-2">
                  {threads.map(thread => (
                    <div
                      key={thread.threadId}
                      className={`p-3 rounded cursor-pointer ${
                        activeConversation?.id === thread.threadId
                          ? 'bg-blue-100'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => loadConversation(thread.threadId)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-12">
                          <Image
                            src={thread.productImage || '/placeholder.png'}
                            alt={thread.productTitle}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {thread.productTitle}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {thread.lastMessage}
                          </p>
                        </div>
                        {thread.unreadCount > 0 && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 對話內容 */}
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          {activeConversation ? (
            <>
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative w-16 h-16">
                  <Image
                    src={activeConversation.productImage || '/placeholder.png'}
                    alt={activeConversation.productTitle}
                    fill
                    className="object-cover rounded"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {activeConversation.productTitle}
                  </h2>
                  <p className="text-sm text-gray-500">
                    買家: {activeConversation.buyerName}
                  </p>
                </div>
              </div>

              <div className="h-96 overflow-y-auto mb-4 space-y-4">
                {activeConversation.messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isOwn ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(message.createdAt).toLocaleString()}
                        </p>
                        {message.isOwn && (
                          <div className="flex items-center space-x-2">
                            <div className="message-status">
                              {sendingMessages[message.id] === 'sending' && (
                                <span className="text-gray-500 text-xs">發送中...</span>
                              )}
                              {sendingMessages[message.id] === 'failed' && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-red-500 text-xs">發送失敗</span>
                                  <button
                                    onClick={() => handleRetryMessage(message.id)}
                                    className="text-xs text-blue-300 hover:text-blue-100"
                                    title="重試發送"
                                  >
                                    重試
                                  </button>
                                </div>
                              )}
                              {sendingMessages[message.id] === 'sent' && (
                                <span className="text-green-500 text-xs">已發送</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              className="text-xs text-red-300 hover:text-red-100"
                              title="撤回消息"
                            >
                              撤回
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-2">
                <textarea
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="輸入訊息..."
                  className="flex-1 p-2 border rounded resize-none"
                  style={{ height: inputHeight }}
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
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  傳送
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500">
              請選擇一個對話
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 