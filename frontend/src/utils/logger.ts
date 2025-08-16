/**
 * 前端日志工具
 * 支持开发和生产环境的日志记录
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
  stack?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    let formattedMessage = `[${timestamp}] [${levelName}] ${message}`;
    
    if (data) {
      formattedMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  private createLogEntry(level: LogLevel, message: string, data?: any, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };

    if (error && error.stack) {
      entry.stack = error.stack;
    }

    return entry;
  }

  private addToLogs(entry: LogEntry) {
    this.logs.push(entry);
    
    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // 在生产环境中，将错误日志发送到服务器
    if (!this.isDevelopment && entry.level >= LogLevel.ERROR) {
      this.sendLogToServer(entry);
    }
  }

  private async sendLogToServer(entry: LogEntry) {
    try {
      // 发送日志到后端API
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // 静默处理发送失败，避免无限循环
      console.error('Failed to send log to server:', error);
    }
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, data);
    this.addToLogs(entry);
    
    if (this.isDevelopment) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, data));
    }
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry = this.createLogEntry(LogLevel.INFO, message, data);
    this.addToLogs(entry);
    
    if (this.isDevelopment) {
      console.info(this.formatMessage(LogLevel.INFO, message, data));
    }
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry = this.createLogEntry(LogLevel.WARN, message, data);
    this.addToLogs(entry);
    
    console.warn(this.formatMessage(LogLevel.WARN, message, data));
  }

  error(message: string, error?: Error | any, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, data, error);
    this.addToLogs(entry);
    
    console.error(this.formatMessage(LogLevel.ERROR, message, data));
    if (error) {
      console.error(error);
    }
  }

  // API调用日志
  logApiCall(method: string, url: string, status: number, duration: number, data?: any) {
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;
    
    if (status >= 400) {
      this.error(message, undefined, data);
    } else {
      this.info(message, data);
    }
  }

  // 用户行为日志
  logUserAction(action: string, data?: any) {
    this.info(`User Action: ${action}`, data);
  }

  // 页面访问日志
  logPageView(page: string, data?: any) {
    this.info(`Page View: ${page}`, data);
  }

  // 获取所有日志
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // 获取特定级别的日志
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // 清空日志
  clearLogs() {
    this.logs = [];
  }

  // 导出日志到文件（开发环境）
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // 下载日志文件（开发环境）
  downloadLogs() {
    if (!this.isDevelopment) return;
    
    const dataStr = this.exportLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `frontend-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

// 创建全局日志实例
const logger = new Logger();

// 捕获未处理的错误
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason);
  });
}

export default logger;

// 便捷导出
// 导出绑定了正确上下文的方法
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);
export const logApiCall = logger.logApiCall.bind(logger);
export const logUserAction = logger.logUserAction.bind(logger);
export const logPageView = logger.logPageView.bind(logger);