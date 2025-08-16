import axios from 'axios';

// 获取API基础URL
const getApiBaseUrl = () => {
  // 优先使用环境变量
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // 根据环境自动判断
  if (process.env.NODE_ENV === 'production') {
    return '/api';
  }
  
  // 开发环境默认值
  const host = process.env.NEXT_PUBLIC_API_HOST || 'localhost';
  const port = process.env.NEXT_PUBLIC_API_PORT || '8000';
  return `http://${host}:${port}/api`;
};

// 创建axios实例
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 打印当前API配置（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', getApiBaseUrl());
}

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 书籍相关API
export const booksApi = {
  // 获取书籍列表
  getBooks: (params = {}) => {
    return api.get('/books', { params });
  },

  // 获取单本书籍详情
  getBook: (bookId) => {
    return api.get(`/books/${bookId}`);
  },

  // 获取书籍详情（别名方法）
  getBookDetail: (bookId) => {
    return api.get(`/books/${bookId}/info`);
  },

  // 上传书籍
  uploadBook: (formData) => {
    return api.post('/books/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2分钟超时
    });
  },

  // 删除书籍
  deleteBook: (bookId) => {
    return api.delete(`/books/${bookId}`);
  },

  // 获取书籍分析
  getBookAnalysis: (bookId) => {
    return api.get(`/books/${bookId}/analysis`);
  },
};

// 聊天相关API
export const chatApi = {
  // 发送聊天消息
  sendMessage: (bookId, message) => {
    return api.post('/chat/', {
      book_id: bookId,
      message: message,
    });
  },

  // 获取聊天历史
  getChatHistory: (bookId) => {
    return api.get(`/chat/history/${bookId}`);
  },
};

export default api;