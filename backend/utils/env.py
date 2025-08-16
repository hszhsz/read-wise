import os
import logging
from pathlib import Path
from dotenv import load_dotenv

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 获取项目根目录
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent

# 加载环境变量
def load_env_vars():
    """加载环境变量，优先从项目根目录的.env文件加载"""
    # 尝试从项目根目录加载.env文件
    root_env_path = ROOT_DIR / ".env"
    if root_env_path.exists():
        load_dotenv(dotenv_path=root_env_path)
        logger.info(f"从 {root_env_path} 加载环境变量")
    else:
        # 如果根目录没有.env文件，尝试从后端目录加载
        backend_env_path = BACKEND_DIR / ".env"
        if backend_env_path.exists():
            load_dotenv(dotenv_path=backend_env_path)
            logger.info(f"从 {backend_env_path} 加载环境变量")
        else:
            # 如果都没有.env文件，使用默认环境变量
            load_dotenv()
            logger.warning("未找到.env文件，使用系统环境变量")

    # 检查必要的环境变量
    required_vars = ["OPENAI_API_KEY", "MONGO_URL", "DATABASE_NAME"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        logger.warning(f"缺少以下环境变量: {', '.join(missing_vars)}")
        if "OPENAI_API_KEY" in missing_vars:
            logger.error("缺少OPENAI_API_KEY，大语言模型功能将无法使用")

# 获取环境变量，带默认值
def get_env(key, default=None):
    """获取环境变量，如果不存在则返回默认值"""
    return os.getenv(key, default)

# 获取上传目录
def get_upload_dir():
    """获取文件上传目录，如果不存在则创建"""
    upload_dir = os.getenv("UPLOAD_DIR", "uploads")
    # 如果是相对路径，则相对于后端目录
    if not os.path.isabs(upload_dir):
        upload_dir = os.path.join(BACKEND_DIR, upload_dir)
    
    # 确保目录存在
    os.makedirs(upload_dir, exist_ok=True)
    
    return upload_dir

# 获取最大上传大小（字节）
def get_max_upload_size():
    """获取最大上传文件大小（字节）"""
    try:
        return int(os.getenv("MAX_UPLOAD_SIZE", 52428800))  # 默认50MB
    except ValueError:
        logger.warning("MAX_UPLOAD_SIZE环境变量格式错误，使用默认值50MB")
        return 52428800  # 默认50MB

# 初始化加载环境变量
load_env_vars()