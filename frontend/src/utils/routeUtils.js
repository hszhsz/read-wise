/**
 * 路由工具函数
 */
import { ROUTES } from './constants';

/**
 * 生成书籍详情页面的路由路径
 * @param {string} bookId 书籍ID
 * @returns {string} 路由路径
 */
export const getBookDetailRoute = (bookId) => {
  if (!bookId) return ROUTES.BOOKS;
  
  return ROUTES.BOOK_DETAIL.replace(':id', bookId);
};

/**
 * 从当前URL中提取书籍ID
 * @returns {string|null} 书籍ID或null
 */
export const extractBookIdFromUrl = () => {
  const path = window.location.pathname;
  const match = path.match(/\/books\/([^\/]+)/);
  
  return match ? match[1] : null;
};

/**
 * 检查当前路由是否匹配指定路径
 * @param {string} currentPath 当前路径
 * @param {string} routePath 路由路径（可能包含参数，如/books/:id）
 * @returns {boolean} 是否匹配
 */
export const isRouteActive = (currentPath, routePath) => {
  if (currentPath === routePath) return true;
  
  // 处理带参数的路由
  if (routePath.includes(':')) {
    // 将路由路径转换为正则表达式
    const regexPath = routePath
      .replace(/:[^\s/]+/g, '([^/]+)') // 将:id替换为捕获组
      .replace(/\//g, '\\/'); // 转义斜杠
    
    const regex = new RegExp(`^${regexPath}$`);
    return regex.test(currentPath);
  }
  
  return false;
};

/**
 * 获取查询参数
 * @param {string} name 参数名
 * @returns {string|null} 参数值
 */
export const getQueryParam = (name) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
};

/**
 * 构建带查询参数的URL
 * @param {string} baseUrl 基础URL
 * @param {Object} params 查询参数对象
 * @returns {string} 完整URL
 */
export const buildUrlWithParams = (baseUrl, params = {}) => {
  const url = new URL(baseUrl, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, value);
    }
  });
  
  return url.toString();
};

/**
 * 解析URL中的查询参数为对象
 * @param {string} url URL字符串
 * @returns {Object} 查询参数对象
 */
export const parseQueryParams = (url = window.location.search) => {
  const params = {};
  const urlParams = new URLSearchParams(url);
  
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
};

/**
 * 导航到指定路由（用于非React组件中）
 * @param {string} path 路由路径
 */
export const navigateTo = (path) => {
  window.location.href = path;
};