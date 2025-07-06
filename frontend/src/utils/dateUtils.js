/**
 * 日期工具函数
 */

/**
 * 格式化日期为本地字符串
 * @param {string|Date} date 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '无效日期';
  }
  
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 计算相对时间（如：3分钟前，1小时前）
 * @param {string|Date} date 日期字符串或Date对象
 * @returns {string} 相对时间字符串
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '无效日期';
  }
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else if (diffMonth < 12) {
    return `${diffMonth}个月前`;
  } else {
    return `${diffYear}年前`;
  }
};

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {string|Date} date 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateYMD = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '无效日期';
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * 计算两个日期之间的天数差
 * @param {string|Date} date1 第一个日期
 * @param {string|Date} date2 第二个日期
 * @returns {number} 天数差
 */
export const getDaysDifference = (date1, date2) => {
  if (!date1 || !date2) return 0;
  
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) {
    return 0;
  }
  
  // 将时间部分设为0，只比较日期部分
  const utcDate1 = Date.UTC(
    dateObj1.getFullYear(),
    dateObj1.getMonth(),
    dateObj1.getDate()
  );
  const utcDate2 = Date.UTC(
    dateObj2.getFullYear(),
    dateObj2.getMonth(),
    dateObj2.getDate()
  );
  
  // 一天的毫秒数
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  
  return Math.floor((utcDate2 - utcDate1) / MS_PER_DAY);
};

/**
 * 格式化数字（添加千位分隔符）
 * @param {number} num 要格式化的数字
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }
  
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};