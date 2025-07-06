import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getThemeMode, toggleThemeMode } from '../utils/themeUtils';
import { getRecentBooks, saveRecentBook } from '../utils/storageUtils';
import { userApi } from '../services';

// 创建上下文
const AppContext = createContext();

/**
 * 应用上下文提供者组件
 * @param {Object} props 组件属性
 * @returns {JSX.Element} 组件
 */
export const AppProvider = ({ children }) => {
  // 主题模式状态
  const [themeMode, setThemeMode] = useState(getThemeMode());
  
  // 用户状态
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  
  // 最近查看的书籍
  const [recentBooks, setRecentBooks] = useState(getRecentBooks());
  
  // 正在上传的书籍
  const [uploadingBook, setUploadingBook] = useState(null);
  
  // 全局通知状态
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // 加载用户信息
  const loadUserInfo = useCallback(async () => {
    try {
      setUserLoading(true);
      const response = await userApi.getUserInfo();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to load user info:', error);
      // 非关键错误，可以静默失败
    } finally {
      setUserLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    loadUserInfo();
  }, [loadUserInfo]);

  // 切换主题模式
  const handleThemeToggle = useCallback(() => {
    const newMode = toggleThemeMode();
    setThemeMode(newMode);
    return newMode;
  }, []);

  // 添加最近查看的书籍
  const addRecentBook = useCallback((book) => {
    const updatedBooks = saveRecentBook(book);
    setRecentBooks(updatedBooks);
  }, []);
  
  // 设置正在上传的书籍
  const setUploadingBookData = useCallback((book) => {
    setUploadingBook(book);
  }, []);
  
  // 清除正在上传的书籍
  const clearUploadingBook = useCallback(() => {
    setUploadingBook(null);
  }, []);

  // 显示通知
  const showNotification = useCallback((message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  }, []);
  
  // 添加通知（别名，与showNotification功能相同）
  const addNotification = useCallback((options) => {
    const { message, severity = 'info' } = options;
    showNotification(message, severity);
  }, [showNotification]);

  // 关闭通知
  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 上下文值
  const contextValue = {
    // 主题相关
    themeMode,
    toggleTheme: handleThemeToggle,
    
    // 用户相关
    user,
    userLoading,
    loadUserInfo,
    
    // 最近查看的书籍
    recentBooks,
    addRecentBook,
    
    // 正在上传的书籍
    uploadingBook,
    setUploadingBookData,
    clearUploadingBook,
    
    // 通知相关
    notification,
    showNotification,
    addNotification,
    closeNotification,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  /**
   * 子组件
   */
  children: PropTypes.node.isRequired,
};

/**
 * 使用应用上下文的Hook
 * @returns {Object} 上下文值
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;