/**
 * 错误处理工具函数
 */

/**
 * 解析API错误响应
 * @param {Error} error Axios错误对象
 * @returns {Object} 包含错误信息的对象
 */
export const parseApiError = (error) => {
  // 默认错误信息
  const defaultError = {
    message: '发生未知错误，请稍后重试',
    status: 500,
    details: null,
  };
  
  if (!error) return defaultError;
  
  // 如果是网络错误或请求被取消
  if (error.message === 'Network Error') {
    return {
      message: '网络连接错误，请检查您的网络连接',
      status: 0,
      details: null,
    };
  }
  
  if (error.message === 'canceled') {
    return {
      message: '请求已取消',
      status: 0,
      details: null,
    };
  }
  
  // 如果有响应对象
  if (error.response) {
    const { status, data } = error.response;
    
    // 根据状态码返回不同的错误信息
    switch (status) {
      case 400:
        return {
          message: data.detail || '请求参数错误',
          status,
          details: data,
        };
      case 401:
        return {
          message: '未授权，请重新登录',
          status,
          details: data,
        };
      case 403:
        return {
          message: '没有权限执行此操作',
          status,
          details: data,
        };
      case 404:
        return {
          message: '请求的资源不存在',
          status,
          details: data,
        };
      case 413:
        return {
          message: '上传的文件太大',
          status,
          details: data,
        };
      case 415:
        return {
          message: '不支持的文件类型',
          status,
          details: data,
        };
      case 429:
        return {
          message: '请求过于频繁，请稍后再试',
          status,
          details: data,
        };
      case 500:
        return {
          message: '服务器内部错误',
          status,
          details: data,
        };
      case 502:
        return {
          message: '网关错误',
          status,
          details: data,
        };
      case 503:
        return {
          message: '服务不可用，请稍后再试',
          status,
          details: data,
        };
      case 504:
        return {
          message: '网关超时',
          status,
          details: data,
        };
      default:
        return {
          message: data.detail || `请求失败 (${status})`,
          status,
          details: data,
        };
    }
  }
  
  // 如果有请求配置但没有响应
  if (error.request) {
    return {
      message: '服务器未响应，请稍后重试',
      status: 0,
      details: null,
    };
  }
  
  // 其他错误
  return {
    message: error.message || defaultError.message,
    status: error.status || defaultError.status,
    details: error.details || defaultError.details,
  };
};

/**
 * 格式化错误消息以显示给用户
 * @param {Error|Object|string} error 错误对象或消息
 * @returns {string} 格式化后的错误消息
 */
export const formatErrorMessage = (error) => {
  if (!error) return '发生未知错误';
  
  // 如果是字符串，直接返回
  if (typeof error === 'string') return error;
  
  // 如果是Axios错误，解析它
  if (error.isAxiosError) {
    const parsedError = parseApiError(error);
    return parsedError.message;
  }
  
  // 如果是对象且有message属性
  if (error.message) return error.message;
  
  // 如果是对象且有detail属性（FastAPI错误格式）
  if (error.detail) return error.detail;
  
  // 其他情况，转为字符串
  try {
    return JSON.stringify(error);
  } catch (e) {
    return '发生未知错误';
  }
};

/**
 * 记录错误到控制台
 * @param {Error|Object|string} error 错误对象或消息
 * @param {string} context 错误发生的上下文
 */
export const logError = (error, context = '') => {
  const contextPrefix = context ? `[${context}] ` : '';
  
  if (!error) {
    console.error(`${contextPrefix}未知错误`);
    return;
  }
  
  // 如果是Axios错误，记录更详细的信息
  if (error.isAxiosError) {
    const { config, response } = error;
    console.error(`${contextPrefix}API错误:`, {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      data: response?.data,
      message: error.message,
    });
    return;
  }
  
  // 其他类型的错误
  console.error(`${contextPrefix}错误:`, error);
};