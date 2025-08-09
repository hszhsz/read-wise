'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Filter, Grid, List, Plus, Eye, Trash2, Calendar, FileText } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { booksApi } from '../../services/api';
import Layout from '../../components/Layout';

const BooksPage = () => {
  const { books, setBooks, setLoading, addNotification } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('created_at');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await booksApi.getBooks();
      setBooks(response.data?.books || []);
    } catch (error) {
      console.error('获取书籍列表失败:', error);
      addNotification({
        message: '获取书籍列表失败',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm('确定要删除这本书吗？')) return;
    
    try {
      await booksApi.deleteBook(bookId);
      setBooks(books.filter(book => book.id !== bookId));
      addNotification({
        message: '书籍删除成功',
        severity: 'success'
      });
    } catch (error) {
      console.error('删除书籍失败:', error);
      addNotification({
        message: '删除书籍失败',
        severity: 'error'
      });
    }
  };

  // 过滤和排序书籍
  const filteredBooks = books
    .filter(book => {
      const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           book.author?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || book.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'author':
          return (a.author || '').localeCompare(b.author || '');
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
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
      case 'failed':
        return '处理失败';
      default:
        return '未知状态';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const BookCard = ({ book }) => (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
            {book.title || '未知标题'}
          </h3>
          <p className="text-gray-600 mb-2">
            {book.author || '未知作者'}
          </p>
          <div className="flex items-center space-x-2 mb-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
              {getStatusText(book.status)}
            </span>
            <span className="text-gray-500 text-sm flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(book.created_at)}
            </span>
          </div>
        </div>
      </div>
      
      {book.description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {book.description}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">
            {book.page_count ? `${book.page_count} 页` : '页数未知'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link
            href={`/books/${book.id}`}
            className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>查看</span>
          </Link>
          <button
            onClick={() => handleDeleteBook(book.id)}
            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  );

  const BookListItem = ({ book }) => (
    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                {book.title || '未知标题'}
              </h3>
              <p className="text-gray-600">{book.author || '未知作者'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(book.status)}`}>
                {getStatusText(book.status)}
              </span>
              <span className="text-gray-500 text-sm">
                {formatDate(book.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/books/${book.id}`}
            className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
          >
            <Eye className="h-4 w-4" />
            <span>查看</span>
          </Link>
          <button
            onClick={() => handleDeleteBook(book.id)}
            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              我的<span className="text-orange-600">书库</span>
            </h1>
            <p className="text-xl text-gray-600">
              管理你的阅读收藏，探索知识的海洋
            </p>
          </div>

          {/* 工具栏 */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索书籍标题或作者..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 过滤和排序 */}
              <div className="flex items-center space-x-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="completed">已完成</option>
                  <option value="processing">处理中</option>
                  <option value="failed">处理失败</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="created_at">按上传时间</option>
                  <option value="title">按标题</option>
                  <option value="author">按作者</option>
                </select>

                {/* 视图切换 */}
                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-600 hover:text-orange-600'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* 添加书籍按钮 */}
                <Link
                  href="/upload"
                  className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>添加书籍</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 书籍列表 */}
          {filteredBooks.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {books.length === 0 ? '还没有上传任何书籍' : '没有找到匹配的书籍'}
              </h3>
              <p className="text-gray-500 mb-6">
                {books.length === 0 ? '开始上传你的第一本书，开启智慧阅读之旅' : '尝试调整搜索条件或过滤器'}
              </p>
              {books.length === 0 && (
                <Link
                  href="/upload"
                  className="inline-flex items-center space-x-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>上传第一本书</span>
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredBooks.map((book) => (
                viewMode === 'grid' 
                  ? <BookCard key={book.id} book={book} />
                  : <BookListItem key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BooksPage;