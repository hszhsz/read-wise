/**
 * 环境变量工具函数
 */

/**
 * 获取API基础URL
 * @returns {string} API基础URL
 */
export const getApiBaseUrl = () => {
  return process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
};

/**
 * 获取最大上传文件大小（MB）
 * @returns {number} 最大上传文件大小（MB）
 */
export const getMaxUploadSize = () => {
  const size = process.env.REACT_APP_MAX_UPLOAD_SIZE || '50';
  return parseInt(size, 10);
};

/**
 * 获取支持的文件类型数组
 * @returns {string[]} 支持的文件类型数组
 */
export const getSupportedFileTypes = () => {
  const types = process.env.REACT_APP_SUPPORTED_FILE_TYPES || '.pdf,.epub,.mobi,.txt,.docx';
  return types.split(',');
};

/**
 * 获取支持的文件类型描述
 * @returns {string} 支持的文件类型描述
 */
export const getSupportedFileTypesDescription = () => {
  const types = getSupportedFileTypes();
  return types.join(', ');
};

/**
 * 检查文件类型是否支持
 * @param {File} file 文件对象
 * @returns {boolean} 是否支持
 */
export const isFileTypeSupported = (file) => {
  if (!file) return false;
  
  const fileName = file.name.toLowerCase();
  const supportedTypes = getSupportedFileTypes().map(type => type.toLowerCase());
  
  return supportedTypes.some(type => fileName.endsWith(type));
};

/**
 * 获取文件大小描述
 * @param {number} bytes 文件大小（字节）
 * @returns {string} 文件大小描述
 */
export const getFileSizeDescription = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 检查文件大小是否超过限制
 * @param {File} file 文件对象
 * @returns {boolean} 是否超过限制
 */
export const isFileSizeExceeded = (file) => {
  if (!file) return false;
  
  const maxSizeMB = getMaxUploadSize();
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  return file.size > maxSizeBytes;
};