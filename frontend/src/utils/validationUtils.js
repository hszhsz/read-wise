/**
 * 表单验证工具函数
 */

/**
 * 验证是否为空
 * @param {string} value 要验证的值
 * @returns {boolean} 是否为空
 */
export const isEmpty = (value) => {
  return value === undefined || value === null || value === '';
};

/**
 * 验证是否为有效的电子邮件
 * @param {string} email 电子邮件
 * @returns {boolean} 是否有效
 */
export const isValidEmail = (email) => {
  if (isEmpty(email)) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证是否为有效的URL
 * @param {string} url URL
 * @returns {boolean} 是否有效
 */
export const isValidUrl = (url) => {
  if (isEmpty(url)) return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 验证字符串长度是否在指定范围内
 * @param {string} value 要验证的字符串
 * @param {number} min 最小长度
 * @param {number} max 最大长度
 * @returns {boolean} 是否有效
 */
export const isLengthValid = (value, min, max) => {
  if (isEmpty(value)) return false;
  
  const length = String(value).length;
  
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  
  return true;
};

/**
 * 验证是否为数字
 * @param {any} value 要验证的值
 * @returns {boolean} 是否为数字
 */
export const isNumber = (value) => {
  if (isEmpty(value)) return false;
  
  return !isNaN(Number(value));
};

/**
 * 验证是否为整数
 * @param {any} value 要验证的值
 * @returns {boolean} 是否为整数
 */
export const isInteger = (value) => {
  if (!isNumber(value)) return false;
  
  return Number.isInteger(Number(value));
};

/**
 * 验证是否为正数
 * @param {any} value 要验证的值
 * @returns {boolean} 是否为正数
 */
export const isPositive = (value) => {
  if (!isNumber(value)) return false;
  
  return Number(value) > 0;
};

/**
 * 验证是否为非负数
 * @param {any} value 要验证的值
 * @returns {boolean} 是否为非负数
 */
export const isNonNegative = (value) => {
  if (!isNumber(value)) return false;
  
  return Number(value) >= 0;
};

/**
 * 验证是否在数值范围内
 * @param {any} value 要验证的值
 * @param {number} min 最小值
 * @param {number} max 最大值
 * @returns {boolean} 是否在范围内
 */
export const isInRange = (value, min, max) => {
  if (!isNumber(value)) return false;
  
  const num = Number(value);
  
  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;
  
  return true;
};

/**
 * 验证是否为有效的中国手机号
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
export const isValidChinesePhone = (phone) => {
  if (isEmpty(phone)) return false;
  
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * 验证是否为有效的身份证号
 * @param {string} id 身份证号
 * @returns {boolean} 是否有效
 */
export const isValidChineseID = (id) => {
  if (isEmpty(id)) return false;
  
  // 简单验证15位或18位
  const idRegex = /(^\d{15}$)|(^\d{17}(\d|X|x)$)/;
  return idRegex.test(id);
};

/**
 * 验证是否包含特殊字符
 * @param {string} value 要验证的值
 * @returns {boolean} 是否包含特殊字符
 */
export const hasSpecialChars = (value) => {
  if (isEmpty(value)) return false;
  
  const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
  return specialCharsRegex.test(value);
};

/**
 * 验证是否为强密码
 * @param {string} password 密码
 * @returns {boolean} 是否为强密码
 */
export const isStrongPassword = (password) => {
  if (isEmpty(password)) return false;
  if (password.length < 8) return false;
  
  // 至少包含一个小写字母、一个大写字母、一个数字和一个特殊字符
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
  
  return hasLowerCase && hasUpperCase && hasNumber && hasSpecialChar;
};

/**
 * 获取密码强度评分（0-4）
 * @param {string} password 密码
 * @returns {number} 强度评分
 */
export const getPasswordStrength = (password) => {
  if (isEmpty(password)) return 0;
  
  let score = 0;
  
  // 长度检查
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // 复杂度检查
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 0.5;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) score += 0.5;
  
  return Math.min(4, Math.floor(score));
};