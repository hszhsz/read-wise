/**
 * 应用常量
 */

// 书籍处理状态
export const BOOK_STATUS = {
  PENDING: 'pending',   // 等待处理
  PROCESSING: 'processing', // 处理中
  COMPLETED: 'completed',  // 处理完成
  FAILED: 'failed',     // 处理失败
};

// 书籍处理状态显示文本
export const BOOK_STATUS_TEXT = {
  [BOOK_STATUS.PENDING]: '等待处理',
  [BOOK_STATUS.PROCESSING]: '处理中',
  [BOOK_STATUS.COMPLETED]: '已完成',
  [BOOK_STATUS.FAILED]: '处理失败',
};

// 书籍处理状态颜色
export const BOOK_STATUS_COLOR = {
  [BOOK_STATUS.PENDING]: 'warning',
  [BOOK_STATUS.PROCESSING]: 'info',
  [BOOK_STATUS.COMPLETED]: 'success',
  [BOOK_STATUS.FAILED]: 'error',
};

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  PDF: '.pdf',
  EPUB: '.epub',
  MOBI: '.mobi',
  TXT: '.txt',
  DOCX: '.docx',
};

// 文件类型图标映射
export const FILE_TYPE_ICON = {
  [SUPPORTED_FILE_TYPES.PDF]: 'picture_as_pdf',
  [SUPPORTED_FILE_TYPES.EPUB]: 'auto_stories',
  [SUPPORTED_FILE_TYPES.MOBI]: 'auto_stories',
  [SUPPORTED_FILE_TYPES.TXT]: 'description',
  [SUPPORTED_FILE_TYPES.DOCX]: 'article',
  default: 'insert_drive_file',
};

// 轮询间隔（毫秒）
export const POLLING_INTERVAL = 5000;

// 最大轮询次数
export const MAX_POLLING_COUNT = 60; // 5分钟

// 分页默认值
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// 本地存储键
export const STORAGE_KEYS = {
  RECENT_BOOKS: 'readwise_recent_books',
  THEME_MODE: 'readwise_theme_mode',
  USER_PREFERENCES: 'readwise_user_preferences',
};

// 路由路径
export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  BOOKS: '/books',
  BOOK_DETAIL: '/books/:id',
};

// 导航菜单项
export const NAV_ITEMS = [
  {
    label: '首页',
    path: ROUTES.HOME,
    icon: 'home',
  },
  {
    label: '上传书籍',
    path: ROUTES.UPLOAD,
    icon: 'upload_file',
  },
  {
    label: '我的书籍',
    path: ROUTES.BOOKS,
    icon: 'library_books',
  },
];

// 书籍分析结果标签页
export const BOOK_DETAIL_TABS = [
  {
    label: '书籍摘要',
    value: 'summary',
    icon: 'summarize',
  },
  {
    label: '作者背景',
    value: 'author',
    icon: 'person',
  },
  {
    label: '阅读推荐',
    value: 'recommendations',
    icon: 'recommend',
  },
];

// 书籍分析详细标签页
export const BOOK_ANALYSIS_TABS = [
  {
    label: '主要观点',
    value: 'main_points',
    icon: 'format_list_bulleted',
  },
  {
    label: '关键概念',
    value: 'key_concepts',
    icon: 'lightbulb',
  },
  {
    label: '总体结论',
    value: 'conclusion',
    icon: 'insights',
  },
];

// 默认错误消息
export const DEFAULT_ERROR_MESSAGE = '发生错误，请稍后重试';

// 默认成功消息
export const DEFAULT_SUCCESS_MESSAGE = '操作成功';

// 最大上传文件大小（MB）
export const MAX_UPLOAD_SIZE_MB = 50;

// API端点
export const API_ENDPOINTS = {
  UPLOAD_BOOK: '/books/upload',
  GET_BOOKS: '/books',
  GET_BOOK_DETAIL: '/books/{id}',
};