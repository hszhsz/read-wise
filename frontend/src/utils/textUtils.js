/**
 * 文本处理工具函数
 */

/**
 * 截断文本到指定长度，并添加省略号
 * @param {string} text 原始文本
 * @param {number} maxLength 最大长度
 * @returns {string} 截断后的文本
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength) + '...';
};

/**
 * 高亮文本中的关键词
 * @param {string} text 原始文本
 * @param {string} keyword 关键词
 * @param {string} highlightClass 高亮CSS类名
 * @returns {string} 包含HTML标记的高亮文本
 */
export const highlightKeyword = (text, keyword, highlightClass = 'highlight') => {
  if (!text || !keyword) return text;
  
  const regex = new RegExp(`(${keyword})`, 'gi');
  return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
};

/**
 * 计算文本的阅读时间（分钟）
 * @param {string} text 文本内容
 * @param {number} wordsPerMinute 每分钟阅读字数
 * @returns {number} 阅读时间（分钟）
 */
export const calculateReadingTime = (text, wordsPerMinute = 200) => {
  if (!text) return 0;
  
  // 中文每个字符算一个字，英文按空格分词
  const wordCount = text.match(/[\u4e00-\u9fa5]|[a-zA-Z]+/g)?.length || 0;
  
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * 从文本中提取摘要
 * @param {string} text 原始文本
 * @param {number} maxLength 最大长度
 * @returns {string} 摘要文本
 */
export const extractSummary = (text, maxLength = 200) => {
  if (!text) return '';
  
  // 移除HTML标签
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // 如果文本长度小于最大长度，直接返回
  if (plainText.length <= maxLength) return plainText;
  
  // 尝试在句子结束处截断
  const sentences = plainText.match(/[^.!?。！？]+[.!?。！？]+/g) || [];
  let summary = '';
  
  for (const sentence of sentences) {
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence;
    } else {
      break;
    }
  }
  
  // 如果没有找到完整的句子，或者摘要为空，则直接截断
  if (!summary) {
    summary = plainText.slice(0, maxLength) + '...';
  } else if (summary.length < plainText.length) {
    summary += '...';
  }
  
  return summary;
};

/**
 * 格式化数字
 * @param {number} num 数字
 * @param {string} locale 地区设置
 * @returns {string} 格式化后的数字
 */
export const formatNumber = (num, locale = 'zh-CN') => {
  if (num === undefined || num === null) return '';
  
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * 将文本转换为标题格式（每个单词首字母大写）
 * @param {string} text 原始文本
 * @returns {string} 标题格式文本
 */
export const toTitleCase = (text) => {
  if (!text) return '';
  
  // 对于英文文本，将每个单词的首字母大写
  return text.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
};

/**
 * 从HTML中提取纯文本
 * @param {string} html HTML文本
 * @returns {string} 纯文本
 */
export const htmlToText = (html) => {
  if (!html) return '';
  
  // 创建临时DOM元素
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // 获取纯文本
  return temp.textContent || temp.innerText || '';
};

/**
 * 计算文本中的字数
 * @param {string} text 文本内容
 * @returns {number} 字数
 */
export const countWords = (text) => {
  if (!text) return 0;
  
  // 中文字符计数
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 英文单词计数（简化处理，按空格分词）
  const englishWords = text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/).filter(Boolean).length;
  
  // 中文字符算一个字，英文单词算一个词
  return chineseCount + englishWords;
};