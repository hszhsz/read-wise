import os
import uuid
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime

# 导入服务和模型
# from services.book_processor import process_book  # 暂时注释，等langchain问题解决
from models.book import BookMetadata, BookAnalysisResult
from models.database import get_database
from utils.file_utils import save_uploaded_file, extract_text_from_file, generate_unique_filename
from services.deepseek_client import DeepSeekClient

router = APIRouter(tags=["books"])

# 支持的文件类型
SUPPORTED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "application/epub+zip": ".epub",
    "application/x-mobipocket-ebook": ".mobi",
    "text/plain": ".txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"
}

# 上传目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 从文件名中提取可能的书名
def extract_book_title(filename):
    if not filename:
        return ""
    
    # 移除扩展名
    name_without_ext = re.sub(r"\.[^/.]+$", "", filename)
    
    # 移除常见的前缀和后缀
    return re.sub(r"^\[.*?\]\s*", "", 
           re.sub(r"\(.*?\)\s*$", "", 
           re.sub(r"【.*?】\s*", "", 
           re.sub(r"（.*?）\s*$", "", 
           re.sub(r"\s*-\s*.*$", "", name_without_ext))))).strip()

@router.post("/books/upload", response_model=dict)
async def upload_book(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    author: Optional[str] = Form(None),
    db = Depends(get_database)
):
    # 验证文件类型
    content_type = file.content_type
    if content_type not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"不支持的文件格式: {content_type}。支持的格式: {', '.join(SUPPORTED_FILE_TYPES.values())}"
        )
    
    # 生成唯一文件名
    file_extension = SUPPORTED_FILE_TYPES[content_type]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # 保存文件
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件保存失败: {str(e)}")
    
    # 创建书籍元数据
    book_id = str(uuid.uuid4())
    metadata = BookMetadata(
        id=book_id,
        title=title or extract_book_title(file.filename),  # 如果没有提供标题，使用提取的标题
        author=author or "未知",
        file_path=file_path,
        file_type=file_extension,
        upload_date=datetime.now(),
        status="pending"
    )
    
    # 保存元数据到数据库
    await db.books.insert_one(metadata.dict())
    
    # 在后台启动处理任务
    background_tasks.add_task(process_book, book_id, file_path)
    
    return {
        "message": "文件上传成功，正在处理中",
        "book_id": book_id,
        "status": "pending"
    }

@router.get("/books/{book_id}", response_model=BookAnalysisResult)
async def get_book_analysis(book_id: str, db = Depends(get_database)):
    # 从数据库获取书籍分析结果
    result = await db.book_results.find_one({"book_id": book_id})
    if not result:
        # 检查书籍是否存在但尚未处理完成
        book = await db.books.find_one({"id": book_id})
        if book:
            return JSONResponse(
                status_code=202,
                content={"message": "书籍正在处理中", "status": book["status"]}
            )
        raise HTTPException(status_code=404, detail="未找到该书籍的分析结果")
    
    return BookAnalysisResult(**result)

@router.get("/books/{book_id}/analysis", response_model=BookAnalysisResult)
async def get_book_analysis_alt(book_id: str, db = Depends(get_database)):
    """替代路由，与 /books/{book_id} 功能相同，提供更明确的API路径"""
    return await get_book_analysis(book_id, db)

@router.get("/books")
async def list_books(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: Optional[str] = "upload_date",
    sort_order: Optional[str] = "desc",
    db = Depends(get_database)
):
    # 构建查询条件
    query = {}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}}
        ]
    if status:
        query["status"] = status
    
    # 构建排序条件
    sort_direction = -1 if sort_order == "desc" else 1
    sort_criteria = [(sort_by, sort_direction)]
    
    # 获取总数
    total = await db.books.count_documents(query)
    
    # 获取分页数据
    cursor = db.books.find(query).sort(sort_criteria).skip(skip).limit(limit)
    books = await cursor.to_list(length=limit)
    
    # 将MongoDB文档转换为可序列化的字典
    serializable_books = []
    for book in books:
        # 处理datetime类型，转换为ISO格式字符串
        if "upload_date" in book and isinstance(book["upload_date"], datetime):
            book["upload_date"] = book["upload_date"].isoformat()
        serializable_books.append(book)
    
    # 计算总页数
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    # 构建响应
    result = {
        "data": serializable_books,
        "total": total,
        "total_pages": total_pages,
        "page": (skip // limit) + 1 if skip else 1,
        "limit": limit
    }
    
    return result