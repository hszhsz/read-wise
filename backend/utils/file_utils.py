import os
import shutil
from typing import List, Dict, Any, Optional, Tuple
import mimetypes
import uuid

# 支持的文件类型映射
SUPPORTED_MIMETYPES = {
    "application/pdf": ".pdf",
    "application/epub+zip": ".epub",
    "application/x-mobipocket-ebook": ".mobi",
    "text/plain": ".txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
}

# 上传目录
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def is_valid_file_type(content_type: str) -> bool:
    """检查文件类型是否支持
    
    Args:
        content_type: 文件的MIME类型
        
    Returns:
        是否支持该文件类型
    """
    return content_type in SUPPORTED_MIMETYPES

def get_file_extension(content_type: str) -> str:
    """获取文件扩展名
    
    Args:
        content_type: 文件的MIME类型
        
    Returns:
        文件扩展名
    """
    return SUPPORTED_MIMETYPES.get(content_type, "")

def generate_unique_filename(original_filename: str, content_type: str) -> Tuple[str, str]:
    """生成唯一的文件名
    
    Args:
        original_filename: 原始文件名
        content_type: 文件的MIME类型
        
    Returns:
        (唯一文件名, 文件路径)
    """
    # 获取文件扩展名
    ext = get_file_extension(content_type)
    if not ext and '.' in original_filename:
        ext = os.path.splitext(original_filename)[1]
    
    # 生成唯一文件名
    unique_id = str(uuid.uuid4())
    unique_filename = f"{unique_id}{ext}"
    
    # 构建文件路径
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    return unique_filename, file_path

async def save_uploaded_file(file_content: bytes, file_path: str) -> bool:
    """保存上传的文件
    
    Args:
        file_content: 文件内容
        file_path: 保存路径
        
    Returns:
        是否保存成功
    """
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
        return True
    except Exception as e:
        print(f"保存文件失败: {str(e)}")
        return False

def delete_file(file_path: str) -> bool:
    """删除文件
    
    Args:
        file_path: 文件路径
        
    Returns:
        是否删除成功
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        return True
    except Exception as e:
        print(f"删除文件失败: {str(e)}")
        return False

def get_file_size(file_path: str) -> int:
    """获取文件大小
    
    Args:
        file_path: 文件路径
        
    Returns:
        文件大小（字节）
    """
    try:
        return os.path.getsize(file_path)
    except Exception:
        return 0

def clean_old_files(days: int = 7) -> int:
    """清理指定天数前的旧文件
    
    Args:
        days: 天数阈值
        
    Returns:
        清理的文件数量
    """
    import time
    from datetime import datetime, timedelta
    
    # 计算截止时间
    cutoff = time.time() - (days * 24 * 60 * 60)
    count = 0
    
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            # 获取文件的修改时间
            mtime = os.path.getmtime(file_path)
            if mtime < cutoff:
                # 删除文件
                try:
                    os.remove(file_path)
                    count += 1
                except Exception as e:
                    print(f"删除文件 {file_path} 失败: {str(e)}")
    
    return count