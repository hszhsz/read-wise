/**
 * 用户API服务
 */
import api from './api';

/**
 * 获取当前用户信息
 * @returns {Promise} 用户信息请求
 */
export const getUserInfo = async () => {
  // 注意：这是一个模拟实现，实际项目中应该连接到真实的后端API
  return Promise.resolve({
    data: {
      id: 'user-1',
      username: '测试用户',
      email: 'test@example.com',
      avatar: null,
      preferences: {
        notificationsEnabled: true,
        theme: 'auto'
      }
    }
  });
};

/**
 * 更新用户偏好设置
 * @param {Object} preferences 用户偏好设置
 * @returns {Promise} 更新请求
 */
export const updateUserPreferences = async (preferences) => {
  // 注意：这是一个模拟实现，实际项目中应该连接到真实的后端API
  return Promise.resolve({
    data: {
      success: true,
      message: '用户偏好设置已更新'
    }
  });
};

// 导出所有用户API函数
const userApi = {
  getUserInfo,
  updateUserPreferences
};

export default userApi;