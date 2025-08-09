import os
import shutil
from typing import List, Dict, Any, Optional, Tuple
import mimetypes
import uuid

# 文件处理库
import PyPDF2
from docx import Document
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

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

def extract_text_from_file(file_path: str) -> str:
    """从文件中提取文本内容
    
    Args:
        file_path: 文件路径
        
    Returns:
        提取的文本内容
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")
    
    # 根据文件扩展名确定文件类型
    _, ext = os.path.splitext(file_path.lower())
    
    if ext == '.pdf':
        return extract_from_pdf(file_path)
    elif ext == '.docx':
        return extract_from_docx(file_path)
    elif ext == '.epub':
        return extract_from_epub(file_path)
    elif ext == '.txt':
        return extract_from_txt(file_path)
    else:
        raise ValueError(f"不支持的文件类型: {ext}")

def extract_from_pdf(file_path: str) -> str:
    """从PDF文件提取文本"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        raise Exception(f"PDF文件读取失败: {str(e)}")
    return text.strip()

def extract_from_docx(file_path: str) -> str:
    """从DOCX文件提取文本"""
    try:
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise Exception(f"DOCX文件读取失败: {str(e)}")

def extract_from_epub(file_path: str) -> str:
    """从EPUB文件提取文本"""
    text = ""
    try:
        book = epub.read_epub(file_path)
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                content = item.get_content().decode('utf-8')
                # 使用BeautifulSoup解析HTML并提取文本
                soup = BeautifulSoup(content, 'html.parser')
                text += soup.get_text() + "\n"
    except Exception as e:
        raise Exception(f"EPUB文件读取失败: {str(e)}")
    return text.strip()

def extract_from_txt(file_path: str) -> str:
    """从TXT文件提取文本"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except UnicodeDecodeError:
        # 尝试其他编码
        try:
            with open(file_path, 'r', encoding='gbk') as file:
                return file.read().strip()
        except Exception as e:
            raise Exception(f"TXT文件读取失败: {str(e)}")
    except Exception as e:
        raise Exception(f"TXT文件读取失败: {str(e)}")

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