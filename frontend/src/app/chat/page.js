'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, BookOpen, MessageCircle, Loader2, Trash2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../../context/AppContext';
import { chatApi, booksApi } from '../../services/api';

const ChatPage = () => {
  const { books, setBooks, addNotification } = useAppContext();
  const [selectedBookId, setSelectedBookId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBookId) {
      fetchChatHistory();
    } else {
      setMessages([]);
    }
  }, [selectedBookId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchBooks = async () => {
    try {
      const response = await booksApi.getBooks();
      setBooks(response.data?.books || []);
    } catch (error) {
      console.error('获取书籍列表失败:', error);
    }
  };

  const fetchChatHistory = async () => {
    if (!selectedBookId) return;
    
    try {
      setIsLoading(true);
      const response = await chatApi.getChatHistory(selectedBookId);
      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error('获取聊天历史失败:', error);
      addNotification({
        message: '获取聊天历史失败',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !selectedBookId) return;

    const userMessage = {
      id: Date.now(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await chatApi.sendMessage(selectedBookId, newMessage);
      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('发送消息失败:', error);
      addNotification({
        message: '发送消息失败',
        severity: 'error'
      });
      // 移除用户消息
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = async () => {
    if (!selectedBookId || messages.length === 0) return;
    
    if (!confirm('确定要清空当前对话记录吗？')) return;
    
    try {
      await chatApi.clearChatHistory(selectedBookId);
      setMessages([]);
      addNotification({
        message: '对话记录已清空',
        severity: 'success'
      });
    } catch (error) {
      console.error('清空对话失败:', error);
      addNotification({
        message: '清空对话失败',
        severity: 'error'
      });
    }
  };

  const resetChat = () => {
    setMessages([]);
    setNewMessage('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedBook = books.find(book => book.id === selectedBookId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-8 w-8 text-orange-600" />
                <h1 className="text-2xl font-bold text-gray-800">AI 对话</h1>
              </div>
              
              {selectedBook && (
                <div className="hidden md:flex items-center space-x-2 text-gray-600">
                  <span>正在讨论:</span>
                  <span className="font-medium text-gray-800">{selectedBook.title}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {messages.length > 0 && (
                <>
                  <button
                    onClick={resetChat}
                    className="flex items-center space-x-1 text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">重置</span>
                  </button>
                  <button
                    onClick={clearChat}
                    className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">清空</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* 侧边栏 - 书籍选择 */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-orange-600" />
                <span>选择书籍</span>
              </h2>
              
              {books.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">还没有上传任何书籍</p>
                  <a
                    href="/upload"
                    className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <span>上传书籍</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {books.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => setSelectedBookId(book.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                        selectedBookId === book.id
                          ? 'bg-orange-100 border-2 border-orange-300 text-orange-800'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent text-gray-700'
                      }`}
                    >
                      <div className="font-medium truncate mb-1">
                        {book.title || '未知标题'}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {book.author || '未知作者'}
                      </div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${
                        book.status === 'completed' 
                          ? 'bg-green-100 text-green-700'
                          : book.status === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {book.status === 'completed' ? '已完成' : 
                         book.status === 'processing' ? '处理中' : '处理失败'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 主聊天区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg h-full flex flex-col">
              {!selectedBookId ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      选择一本书开始对话
                    </h3>
                    <p className="text-gray-500">
                      从左侧选择一本书，开始与 AI 讨论书籍内容
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 聊天消息区域 */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-600 mb-2">
                            开始与 AI 对话
                          </h3>
                          <p className="text-gray-500 mb-4">
                            你可以询问关于《{selectedBook?.title}》的任何问题
                          </p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p>• 询问书籍的主要内容和观点</p>
                            <p>• 请求详细解释某个概念</p>
                            <p>• 寻求相关的实践建议</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start space-x-3 ${
                              message.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {message.sender === 'ai' && (
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                  <Bot className="h-5 w-5 text-orange-600" />
                                </div>
                              </div>
                            )}
                            
                            <div
                              className={`max-w-xs lg:max-w-2xl px-4 py-3 rounded-2xl ${
                                message.sender === 'user'
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  className={message.sender === 'user' ? 'text-white' : 'text-gray-800'}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              <div className={`text-xs mt-2 ${
                                message.sender === 'user' ? 'text-orange-100' : 'text-gray-500'
                              }`}>
                                {formatDate(message.timestamp)}
                              </div>
                            </div>
                            
                            {message.sender === 'user' && (
                              <div className="flex-shrink-0">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {isSending && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <Bot className="h-5 w-5 text-orange-600" />
                              </div>
                            </div>
                            <div className="bg-gray-100 rounded-2xl px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                                <span className="text-gray-600">AI 正在思考...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>

                  {/* 消息输入区域 */}
                  <div className="border-t border-gray-200 p-6">
                    <form onSubmit={handleSendMessage} className="flex space-x-4">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`询问关于《${selectedBook?.title}》的问题...`}
                        disabled={isSending}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                      >
                        {isSending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                        <span className="hidden sm:inline">
                          {isSending ? '发送中' : '发送'}
                        </span>
                      </button>
                    </form>
                    
                    <div className="mt-3 text-xs text-gray-500 text-center">
                      AI 可能会产生不准确的信息，请谨慎核实重要内容
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;