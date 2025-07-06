/**
 * 书籍数据处理工具函数
 */
import { formatDate, formatNumber } from './dateUtils';
import { BOOK_STATUS, BOOK_STATUS_TEXT, BOOK_STATUS_COLOR } from './constants';
import { getFileTypeName } from './fileUtils';

/**
 * 格式化书籍元数据
 * @param {Object} book 书籍数据
 * @returns {Object} 格式化后的书籍数据
 */
export const formatBookMetadata = (book) => {
  if (!book) return null;
  
  return {
    ...book,
    upload_time: book.upload_time ? formatDate(book.upload_time) : '',
    word_count: book.word_count ? formatNumber(book.word_count) : '未知',
    file_type_display: book.file_type ? getFileTypeName(book.file_type) : '未知',
    status_text: book.status ? BOOK_STATUS_TEXT[book.status] || '未知状态' : '未知状态',
    status_color: book.status ? BOOK_STATUS_COLOR[book.status] || 'default' : 'default',
  };
};

/**
 * 格式化书籍列表
 * @param {Array} books 书籍列表
 * @returns {Array} 格式化后的书籍列表
 */
export const formatBookList = (books) => {
  if (!books || !Array.isArray(books)) return [];
  
  return books.map(book => formatBookMetadata(book));
};

/**
 * 获取书籍处理状态的显示文本
 * @param {string} status 状态代码
 * @returns {string} 状态显示文本
 */
export const getBookStatusText = (status) => {
  return BOOK_STATUS_TEXT[status] || '未知状态';
};

/**
 * 获取书籍处理状态的颜色
 * @param {string} status 状态代码
 * @returns {string} 状态颜色
 */
export const getBookStatusColor = (status) => {
  return BOOK_STATUS_COLOR[status] || 'default';
};

/**
 * 检查书籍处理是否已完成
 * @param {string} status 状态代码
 * @returns {boolean} 是否已完成
 */
export const isBookProcessingComplete = (status) => {
  return status === BOOK_STATUS.COMPLETED || status === BOOK_STATUS.FAILED;
};

/**
 * 检查书籍处理是否正在进行中
 * @param {string} status 状态代码
 * @returns {boolean} 是否正在处理
 */
export const isBookProcessing = (status) => {
  return status === BOOK_STATUS.PROCESSING;
};

/**
 * 检查书籍处理是否等待中
 * @param {string} status 状态代码
 * @returns {boolean} 是否等待处理
 */
export const isBookPending = (status) => {
  return status === BOOK_STATUS.PENDING;
};

/**
 * 检查书籍处理是否失败
 * @param {string} status 状态代码
 * @returns {boolean} 是否处理失败
 */
export const isBookFailed = (status) => {
  return status === BOOK_STATUS.FAILED;
};

/**
 * 获取书籍处理进度估计
 * @param {Object} book 书籍数据
 * @returns {number} 进度百分比（0-100）
 */
export const getBookProcessingProgress = (book) => {
  if (!book) return 0;
  
  // 如果书籍已完成处理，返回100%
  if (book.status === BOOK_STATUS.COMPLETED) return 100;
  
  // 如果书籍处理失败，返回进度为0
  if (book.status === BOOK_STATUS.FAILED) return 0;
  
  // 如果书籍等待处理，返回5%
  if (book.status === BOOK_STATUS.PENDING) return 5;
  
  // 如果书籍正在处理中，根据处理阶段返回不同进度
  if (book.status === BOOK_STATUS.PROCESSING) {
    // 如果有明确的进度信息，直接使用
    if (book.processing_progress && book.processing_progress > 0) {
      return Math.min(95, book.processing_progress);
    }
    
    // 否则，根据处理阶段估算进度
    if (book.processing_stage) {
      switch (book.processing_stage) {
        case 'extracting_text':
          return 20;
        case 'analyzing_content':
          return 40;
        case 'generating_summary':
          return 60;
        case 'generating_author_info':
          return 75;
        case 'generating_recommendations':
          return 85;
        case 'finalizing':
          return 95;
        default:
          return 30; // 默认进度
      }
    }
    
    // 如果没有处理阶段信息，返回默认进度
    return 30;
  }
  
  return 0;
};

/**
 * 获取书籍处理阶段的显示文本
 * @param {string} stage 处理阶段
 * @returns {string} 阶段显示文本
 */
export const getProcessingStageText = (stage) => {
  if (!stage) return '准备中';
  
  const stageTextMap = {
    'extracting_text': '正在提取文本',
    'analyzing_content': '正在分析内容',
    'generating_summary': '正在生成摘要',
    'generating_author_info': '正在获取作者信息',
    'generating_recommendations': '正在生成阅读推荐',
    'finalizing': '正在完成处理',
  };
  
  return stageTextMap[stage] || '处理中';
};

/**
 * 格式化书籍分析结果
 * @param {Object} result 分析结果数据
 * @returns {Object} 格式化后的分析结果
 */
export const formatBookAnalysisResult = (result) => {
  if (!result) return null;
  
  // 确保各部分数据存在
  const formattedResult = {
    ...result,
    summary: result.summary || {
      main_points: [],
      key_concepts: [],
      overall_conclusion: '',
    },
    author_info: result.author_info || {
      background: '',
      writing_style: '',
      notable_works: [],
      influence: '',
    },
    reading_recommendations: result.reading_recommendations || [],
  };
  
  return formattedResult;
};