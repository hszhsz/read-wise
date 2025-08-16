'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, MessageCircle, FileText, Calendar, User, Loader2, Send, Bot, User as UserIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '../../../context/AppContext';
import { booksApi, chatApi } from '../../../services/api';
import Layout from '../../../components/Layout';

const BookDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { bookId } = params;
  const { currentBook, setCurrentBook, setLoading, addNotification } = useAppContext();
  
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'chat'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (bookId) {
      fetchBookDetail();
      fetchChatHistory();
    }
  }, [bookId]);

  const fetchBookDetail = async () => {
    try {
      setLoading(true);
      
      // 获取书籍基本信息
      const infoResponse = await booksApi.getBookDetail(bookId);
      const bookInfo = infoResponse.data;
      
      // 尝试获取分析结果
      try {
        const analysisResponse = await booksApi.getBookAnalysis(bookId);
        const analysisData = analysisResponse.data;
        
        // 合并基本信息和分析结果
        const combinedData = {
          ...bookInfo,
          // 从分析结果中提取摘要和关键信息
          summary: analysisData.summary?.conclusion || null,
          main_points: analysisData.summary?.main_points || [],
          key_concepts: analysisData.summary?.key_concepts || [],
          author_info: analysisData.author_info || null,
          recommendations: analysisData.recommendations || [],
          analysis_available: true
        };
        
        setCurrentBook(combinedData);
      } catch (analysisError) {
        console.log('分析结果暂未生成或获取失败:', analysisError);
        // 如果分析结果不存在，只使用基本信息
        setCurrentBook({
          ...bookInfo,
          analysis_available: false
        });
      }
    } catch (error) {
      console.error('获取书籍详情失败:', error);
      addNotification({
        message: '获取书籍详情失败',
        severity: 'error'
      });
      router.push('/books');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setChatLoading(true);
      const response = await chatApi.getChatHistory(bookId);
      setMessages(response.data?.messages || []);
    } catch (error) {
      console.error('获取聊天历史失败:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

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
      const response = await chatApi.sendMessage(bookId, newMessage);
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

  const formatDate = (dateString) => {
    if (!dateString) {
      return '未知日期';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '无效日期';
      }
      
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '日期格式错误';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '处理中';
      case 'pending':
        return '等待处理';
      case 'failed':
        return '处理失败';
      default:
        return '未知状态';
    }
  };

  if (!currentBook) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* 返回按钮 */}
          <div className="mb-6">
            <Link
              href="/books"
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>返回书库</span>
            </Link>
          </div>

          {/* 书籍标题区域 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                  {currentBook.title || '未知标题'}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700">{currentBook.author || '未知作者'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-600">{formatDate(currentBook.upload_date)}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBook.status)}`}>
                    {getStatusText(currentBook.status)}
                  </span>
                </div>
                {currentBook.description && (
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {currentBook.description}
                  </p>
                )}
              </div>
              
              <div className="mt-6 lg:mt-0 lg:ml-8">
                <div className="bg-orange-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold text-gray-800">书籍信息</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">页数:</span>
                      <span className="font-medium">{currentBook.page_count || '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">文件大小:</span>
                      <span className="font-medium">{currentBook.file_size || '未知'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">格式:</span>
                      <span className="font-medium">{currentBook.file_type || '未知'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 标签页导航 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'info'
                      ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <BookOpen className="h-5 w-5" />
                    <span>书籍详情</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'chat'
                      ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI 对话</span>
                  </div>
                </button>
              </nav>
            </div>

            {/* 标签页内容 */}
            <div className="p-8">
              {activeTab === 'info' && (
                <div className="space-y-8">
                  {/* 分析状态提示 */}
                  {(currentBook.status === 'pending' || currentBook.status === 'processing' || !currentBook.analysis_available) && currentBook.status !== 'completed' && (
                    <div className={`border rounded-xl p-6 ${
                      currentBook.status === 'pending' 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Loader2 className={`h-5 w-5 animate-spin ${
                          currentBook.status === 'pending' 
                            ? 'text-blue-600' 
                            : 'text-yellow-600'
                        }`} />
                        <div>
                          <h3 className={`text-lg font-semibold ${
                            currentBook.status === 'pending' 
                              ? 'text-blue-800' 
                              : 'text-yellow-800'
                          }`}>
                            {currentBook.status === 'pending' ? '等待AI分析' : 'AI 分析进行中'}
                          </h3>
                          <p className={`${
                            currentBook.status === 'pending' 
                              ? 'text-blue-700' 
                              : 'text-yellow-700'
                          }`}>
                            {currentBook.status === 'pending' 
                              ? '书籍已上传成功，正在等待AI智能分析，请稍候...' 
                              : '书籍正在进行智能分析，分析完成后将显示详细结果。'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 书籍摘要 */}
                  {currentBook.summary && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">AI 智能摘要</h3>
                      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6">
                        <div className="prose prose-orange max-w-none">
                          <ReactMarkdown>
                            {currentBook.summary}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 主要观点 */}
                  {currentBook.main_points && currentBook.main_points.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">主要观点</h3>
                      <div className="bg-blue-50 rounded-xl p-6">
                        <ul className="space-y-3">
                          {currentBook.main_points.map((point, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {index + 1}
                              </span>
                              <span className="text-gray-800">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* 关键概念 */}
                  {currentBook.key_concepts && currentBook.key_concepts.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">关键概念</h3>
                      <div className="grid gap-4">
                        {currentBook.key_concepts.map((concept, index) => (
                          <div key={index} className="bg-purple-50 rounded-xl p-4">
                            <h4 className="font-semibold text-purple-800 mb-2">{concept.name || concept.title}</h4>
                            <p className="text-purple-700">{concept.description || concept.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 作者信息 */}
                  {currentBook.author_info && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">作者信息</h3>
                      <div className="bg-green-50 rounded-xl p-6">
                        <h4 className="font-semibold text-green-800 mb-2">{currentBook.author_info.name}</h4>
                        {currentBook.author_info.background && (
                          <p className="text-green-700 mb-3">{currentBook.author_info.background}</p>
                        )}
                        {currentBook.author_info.writing_style && (
                          <div className="mb-3">
                            <span className="font-medium text-green-800">写作风格：</span>
                            <span className="text-green-700">{currentBook.author_info.writing_style}</span>
                          </div>
                        )}
                        {currentBook.author_info.notable_works && currentBook.author_info.notable_works.length > 0 && (
                          <div>
                            <span className="font-medium text-green-800">代表作品：</span>
                            <span className="text-green-700">{currentBook.author_info.notable_works.join('、')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 推荐书籍 */}
                  {currentBook.recommendations && currentBook.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">相关推荐</h3>
                      <div className="grid gap-4">
                        {currentBook.recommendations.map((rec, index) => (
                          <div key={index} className="bg-rose-50 rounded-xl p-4">
                            <h4 className="font-semibold text-rose-800 mb-1">{rec.title}</h4>
                            <p className="text-rose-600 text-sm mb-2">作者：{rec.author}</p>
                            <p className="text-rose-700">{rec.reason}</p>
                            {rec.similarity_score && (
                              <div className="mt-2">
                                <span className="text-xs text-rose-600">相似度：{Math.round(rec.similarity_score * 100)}%</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 关键词（保留原有功能） */}
                  {currentBook.keywords && currentBook.keywords.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">关键词</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentBook.keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 章节目录 */}
                  {currentBook.chapters && currentBook.chapters.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-4">章节目录</h3>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="space-y-2">
                          {currentBook.chapters.map((chapter, index) => (
                            <div key={index} className="flex items-center space-x-3 py-2">
                              <span className="text-orange-600 font-medium">{index + 1}.</span>
                              <span className="text-gray-800">{chapter.title}</span>
                              {chapter.page && (
                                <span className="text-gray-500 text-sm ml-auto">第 {chapter.page} 页</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="h-96 flex flex-col">
                  {/* 聊天消息区域 */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {chatLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">还没有对话记录</p>
                          <p className="text-gray-500 text-sm">开始与 AI 讨论这本书的内容吧！</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start space-x-3 ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.sender === 'ai' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <Bot className="h-4 w-4 text-orange-600" />
                              </div>
                            </div>
                          )}
                          
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              message.sender === 'user'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            <div className={`text-xs mt-1 ${
                              message.sender === 'user' ? 'text-orange-100' : 'text-gray-500'
                            }`}>
                              {formatDate(message.timestamp)}
                            </div>
                          </div>
                          
                          {message.sender === 'user' && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-gray-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* 消息输入区域 */}
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="输入你的问题..."
                      disabled={isSending}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookDetailPage;