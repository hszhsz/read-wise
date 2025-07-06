/**
 * 本地存储工具函数
 */
import { STORAGE_KEYS } from './constants';

/**
 * 保存数据到本地存储
 * @param {string} key 存储键
 * @param {any} data 要存储的数据
 */
export const saveToStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error('保存到本地存储失败:', error);
  }
};

/**
 * 从本地存储获取数据
 * @param {string} key 存储键
 * @param {any} defaultValue 默认值
 * @returns {any} 存储的数据或默认值
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error('从本地存储获取数据失败:', error);
    return defaultValue;
  }
};

/**
 * 从本地存储删除数据
 * @param {string} key 存储键
 */
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('从本地存储删除数据失败:', error);
  }
};

/**
 * 清除所有本地存储
 */
export const clearStorage = () => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('清除本地存储失败:', error);
  }
};

/**
 * 保存最近查看的书籍ID
 * @param {string} bookId 书籍ID
 * @param {number} maxItems 最大保存数量
 */
export const saveRecentBook = (bookId, maxItems = 10) => {
  try {
    // 获取现有的最近书籍列表
    const recentBooks = getFromStorage(STORAGE_KEYS.RECENT_BOOKS, []);
    
    // 如果已存在，先移除
    const updatedList = recentBooks.filter(id => id !== bookId);
    
    // 添加到列表开头
    updatedList.unshift(bookId);
    
    // 如果超过最大数量，截取
    if (updatedList.length > maxItems) {
      updatedList.length = maxItems;
    }
    
    // 保存更新后的列表
    saveToStorage(STORAGE_KEYS.RECENT_BOOKS, updatedList);
  } catch (error) {
    console.error('保存最近书籍失败:', error);
  }
};

/**
 * 获取最近查看的书籍ID列表
 * @returns {string[]} 书籍ID列表
 */
export const getRecentBooks = () => {
  return getFromStorage(STORAGE_KEYS.RECENT_BOOKS, []);
};

/**
 * 保存用户偏好设置
 * @param {Object} preferences 偏好设置对象
 */
export const saveUserPreferences = (preferences) => {
  // 获取现有的偏好设置
  const currentPreferences = getFromStorage(STORAGE_KEYS.USER_PREFERENCES, {});
  
  // 合并新的偏好设置
  const updatedPreferences = {
    ...currentPreferences,
    ...preferences,
  };
  
  // 保存更新后的偏好设置
  saveToStorage(STORAGE_KEYS.USER_PREFERENCES, updatedPreferences);
};

/**
 * 获取用户偏好设置
 * @param {string} key 偏好设置键
 * @param {any} defaultValue 默认值
 * @returns {any} 偏好设置值
 */
export const getUserPreference = (key, defaultValue = null) => {
  const preferences = getFromStorage(STORAGE_KEYS.USER_PREFERENCES, {});
  return preferences[key] !== undefined ? preferences[key] : defaultValue;
};

/**
 * 保存主题模式
 * @param {string} mode 主题模式 ('light' 或 'dark')
 */
export const saveThemeMode = (mode) => {
  saveToStorage(STORAGE_KEYS.THEME_MODE, mode);
};

/**
 * 获取主题模式
 * @returns {string} 主题模式
 */
export const getThemeMode = () => {
  return getFromStorage(STORAGE_KEYS.THEME_MODE, 'light');
};