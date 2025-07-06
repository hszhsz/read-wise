/**
 * 文件处理工具函数
 */
import { SUPPORTED_FILE_TYPES } from './constants';

/**
 * 获取文件扩展名
 * @param {string} filename 文件名
 * @returns {string} 文件扩展名（包含点，如 .pdf）
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  
  return filename.slice(lastDotIndex).toLowerCase();
};

/**
 * 检查文件类型是否支持
 * @param {File|string} file 文件对象或文件名
 * @returns {boolean} 是否支持
 */
export const isFileTypeSupported = (file) => {
  if (!file) return false;
  
  let extension;
  if (typeof file === 'string') {
    extension = getFileExtension(file);
  } else if (file instanceof File) {
    extension = getFileExtension(file.name);
  } else {
    return false;
  }
  
  return Object.values(SUPPORTED_FILE_TYPES).includes(extension);
};

/**
 * 获取文件类型显示名称
 * @param {string} extension 文件扩展名
 * @returns {string} 文件类型显示名称
 */
export const getFileTypeName = (extension) => {
  if (!extension) return '未知';
  
  const ext = extension.toLowerCase();
  
  switch (ext) {
    case SUPPORTED_FILE_TYPES.PDF:
      return 'PDF';
    case SUPPORTED_FILE_TYPES.EPUB:
      return 'EPUB';
    case SUPPORTED_FILE_TYPES.MOBI:
      return 'MOBI';
    case SUPPORTED_FILE_TYPES.TXT:
      return '文本文件';
    case SUPPORTED_FILE_TYPES.DOCX:
      return 'Word文档';
    default:
      return '未知';
  }
};

/**
 * 格式化文件大小
 * @param {number} bytes 文件大小（字节）
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 估算文件中的字数
 * @param {number} fileSize 文件大小（字节）
 * @param {string} fileType 文件类型
 * @returns {number} 估算的字数
 */
export const estimateWordCount = (fileSize, fileType) => {
  if (!fileSize || fileSize <= 0) return 0;
  
  // 不同文件类型的字节/字符比例估算
  const bytesPerCharacter = {
    [SUPPORTED_FILE_TYPES.PDF]: 30,    // PDF包含格式信息，每个字符约30字节
    [SUPPORTED_FILE_TYPES.EPUB]: 20,   // EPUB包含HTML标记，每个字符约20字节
    [SUPPORTED_FILE_TYPES.MOBI]: 20,   // 与EPUB类似
    [SUPPORTED_FILE_TYPES.TXT]: 2,     // 纯文本，每个字符约2字节（考虑UTF-8编码）
    [SUPPORTED_FILE_TYPES.DOCX]: 25,   // DOCX包含XML标记，每个字符约25字节
    default: 15,                       // 默认估算
  };
  
  // 获取当前文件类型的比例，如果不存在则使用默认值
  const ratio = bytesPerCharacter[fileType] || bytesPerCharacter.default;
  
  // 估算字符数
  const characterCount = Math.floor(fileSize / ratio);
  
  // 中文每个字符算一个字，英文按平均每5个字符算一个单词
  // 这里简单估算，假设混合内容，平均每2个字符算一个字/词
  return Math.floor(characterCount / 2);
};

/**
 * 从文件名中提取可能的书名
 * @param {string} filename 文件名
 * @returns {string} 可能的书名
 */
export const extractBookTitle = (filename) => {
  if (!filename) return '';
  
  // 移除扩展名
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // 移除常见的前缀和后缀
  return nameWithoutExt
    .replace(/^\[.*?\]\s*/, '') // 移除[xxx]格式的前缀
    .replace(/\(.*?\)\s*$/, '') // 移除(xxx)格式的后缀
    .replace(/【.*?】\s*/, '')    // 移除【xxx】格式的前缀
    .replace(/（.*?）\s*$/, '')   // 移除（xxx）格式的后缀
    .replace(/\s*-\s*.*$/, '')   // 移除 - xxx格式的后缀
    .trim();
};

/**
 * 生成文件的预览URL
 * @param {File} file 文件对象
 * @returns {string|null} 预览URL或null
 */
export const generateFilePreviewUrl = (file) => {
  if (!file) return null;
  
  // 只为图片和PDF生成预览URL
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const isPdf = file.type === 'application/pdf';
  const isImage = imageTypes.includes(file.type);
  
  if (!isPdf && !isImage) return null;
  
  return URL.createObjectURL(file);
};

/**
 * 释放文件预览URL
 * @param {string} url 预览URL
 */
export const revokeFilePreviewUrl = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};