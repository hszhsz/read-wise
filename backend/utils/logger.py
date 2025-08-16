import os
import logging
import logging.handlers
from pathlib import Path
from datetime import datetime

# 获取项目根目录
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
LOGS_DIR = ROOT_DIR / "logs" / "backend"

# 确保日志目录存在
LOGS_DIR.mkdir(parents=True, exist_ok=True)

def setup_logger(name: str = "readwise_backend", level: str = "INFO") -> logging.Logger:
    """
    设置日志配置
    
    Args:
        name: 日志器名称
        level: 日志级别 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        配置好的日志器
    """
    logger = logging.getLogger(name)
    
    # 避免重复配置
    if logger.handlers:
        return logger
    
    # 设置日志级别
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 控制台处理器
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件处理器 - 所有日志
    today = datetime.now().strftime('%Y-%m-%d')
    all_log_file = LOGS_DIR / f"app_{today}.log"
    file_handler = logging.handlers.RotatingFileHandler(
        all_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    
    # 错误日志文件处理器
    error_log_file = LOGS_DIR / f"error_{today}.log"
    error_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)
    logger.addHandler(error_handler)
    
    # API访问日志处理器
    access_log_file = LOGS_DIR / f"access_{today}.log"
    access_handler = logging.handlers.RotatingFileHandler(
        access_log_file,
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    access_handler.setLevel(logging.INFO)
    access_formatter = logging.Formatter(
        '%(asctime)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    access_handler.setFormatter(access_formatter)
    
    # 创建专门的访问日志器
    access_logger = logging.getLogger(f"{name}.access")
    access_logger.setLevel(logging.INFO)
    access_logger.addHandler(access_handler)
    access_logger.propagate = False  # 不传播到父日志器
    
    return logger

def get_logger(name: str = "readwise_backend") -> logging.Logger:
    """
    获取日志器实例
    
    Args:
        name: 日志器名称
    
    Returns:
        日志器实例
    """
    return logging.getLogger(name)

def get_access_logger(name: str = "readwise_backend") -> logging.Logger:
    """
    获取访问日志器实例
    
    Args:
        name: 日志器名称
    
    Returns:
        访问日志器实例
    """
    return logging.getLogger(f"{name}.access")

# 初始化默认日志器
default_logger = setup_logger()

# 导出常用函数
def log_info(message: str, logger_name: str = "readwise_backend"):
    """记录信息日志"""
    get_logger(logger_name).info(message)

def log_error(message: str, logger_name: str = "readwise_backend", exc_info: bool = True):
    """记录错误日志"""
    get_logger(logger_name).error(message, exc_info=exc_info)

def log_warning(message: str, logger_name: str = "readwise_backend"):
    """记录警告日志"""
    get_logger(logger_name).warning(message)

def log_debug(message: str, logger_name: str = "readwise_backend"):
    """记录调试日志"""
    get_logger(logger_name).debug(message)

def log_access(method: str, path: str, status_code: int, response_time: float = None, user_id: str = None):
    """记录API访问日志"""
    access_logger = get_access_logger()
    message_parts = [f"{method} {path} - {status_code}"]
    
    if response_time is not None:
        message_parts.append(f"- {response_time:.3f}s")
    
    if user_id:
        message_parts.append(f"- User: {user_id}")
    
    access_logger.info(" ".join(message_parts))