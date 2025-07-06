import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? '/api' : process.env.REACT_APP_API_BASE_URL + '/api',
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证令牌等
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
    // 处理错误响应
    console.error('API错误:', error.response || error.message);
    return Promise.reject(error);
  }
);

// 上传书籍
export const uploadBook = (formData, onUploadProgress) => {
  return api.post('/books/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// 获取书籍列表
export const getBooks = (params = {}) => {
  const { page = 1, limit = 10, search, status, sort_by, sort_order } = params;
  
  return api.get('/books', {
    params: {
      skip: (page - 1) * limit,
      limit,
      search,
      status,
      sort_by,
      sort_order
    },
  });
};

// 获取书籍详情
export const getBookDetails = (bookId) => {
  if (!bookId) {
    return Promise.reject(new Error('书籍ID不存在，无法获取书籍详情'));
  }
  return api.get(`/books/${bookId}`);
};

// 获取单本书籍和分析结果
export const getBook = async (bookId) => {
  if (!bookId) {
    throw new Error('书籍ID不存在，无法获取书籍详情');
  }
  
  try {
    const response = await api.get(`/books/${bookId}`);
    // 确保返回的数据包含必要的字段
    const bookData = response.data;
    
    // 导入extractBookTitle函数
    const { extractBookTitle } = await import('../utils/fileUtils');
    
    // 处理可能的状态码 202（处理中）情况
    if (response.status === 202 && bookData.status) {
      return {
        id: bookId,
        status: bookData.status,
        // 确保标题字段存在，优先使用设置的标题，其次使用extractBookTitle函数提取文件名中的标题
        title: bookData.title || 
               (bookData.file_name && extractBookTitle(bookData.file_name)) || 
               (bookData.fileName && extractBookTitle(bookData.fileName)) || 
               '未命名书籍',
        author: bookData.author || '未知',
        ...bookData
      };
    }
    
    // 确保返回的数据包含标题
    if (!bookData.title) {
      if (bookData.file_name) {
        bookData.title = extractBookTitle(bookData.file_name);
      } else if (bookData.fileName) {
        bookData.title = extractBookTitle(bookData.fileName);
      } else {
        bookData.title = '未命名书籍';
      }
    }
    
    return bookData;
  } catch (error) {
    // 如果是 404 错误，可能是书籍不存在
    if (error.response && error.response.status === 404) {
      throw new Error('未找到该书籍');
    }
    throw new Error(error.response?.data?.message || '获取书籍失败');
  }
};

// 获取书籍分析结果 (与getBook相同，保留此函数以保持代码兼容性)
export const getBookAnalysis = async (bookId) => {
  return getBook(bookId);
};

// 删除书籍
export const deleteBook = async (bookId) => {
  if (!bookId) {
    throw new Error('书籍ID不存在，无法删除书籍');
  }
  
  try {
    const response = await api.delete(`/books/${bookId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '删除书籍失败');
  }
};

// 轮询书籍处理状态
export const pollBookStatus = async (bookId, callback, interval = 5000, maxAttempts = 60) => {
  // 如果 bookId 不存在，直接返回错误
  if (!bookId) {
    const error = new Error('书籍ID不存在，无法获取处理状态');
    if (typeof callback === 'function') {
      callback('failed', 0);
    }
    return Promise.reject(error);
  }
  
  let attempts = 0;
  
  const checkStatus = () => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await getBookDetails(bookId);
          const bookData = response.data;
          
          // 使用书籍的状态字段，而不是HTTP状态码
          const bookStatus = bookData.status;
          const progress = bookData.processing_progress || 0;
          
          // 调用回调函数，传递书籍状态和进度
          if (typeof callback === 'function') {
            callback(bookStatus, progress);
          }
          
          // 检查书籍处理状态
          if (bookStatus === 'completed' || bookStatus === 'failed') {
            // 处理完成或失败，返回结果
            resolve(bookData);
          } else {
            // 继续轮询
            attempts++;
            
            if (attempts >= maxAttempts) {
              reject(new Error('处理超时，请稍后查看结果'));
              return;
            }
            
            setTimeout(poll, interval);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // 资源不存在
            reject(new Error('未找到书籍分析结果'));
          } else {
            attempts++;
            
            if (attempts >= maxAttempts) {
              reject(new Error('轮询失败，请稍后查看结果'));
              return;
            }
            
            // 继续轮询
            setTimeout(poll, interval);
          }
        }
      };
      
      poll();
    });
  };
  
  return checkStatus();
};

export default api;