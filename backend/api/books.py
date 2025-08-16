import os
import uuid
import re
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Form, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime

# 导入服务和模型
# from services.book_processor import process_book  # 暂时注释，等langchain依赖解决
from models.book import BookMetadata, BookAnalysisResult
from models.database import get_database
from utils.file_utils import save_uploaded_file, extract_text_from_file, generate_unique_filename
from services.openai_client import OpenAIClient
from agents.workflow import run_analysis

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
    # background_tasks.add_task(process_book, book_id, file_path)  # 暂时注释，等langchain依赖解决
    
    return {
        "message": "文件上传成功，正在处理中",
        "book_id": book_id,
        "status": "pending"
    }

@router.get("/books/{book_id}/info", response_model=BookMetadata)
async def get_book_info(book_id: str, db = Depends(get_database)):
    """获取书籍基本信息（元数据）"""
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="未找到该书籍")
    
    # 移除MongoDB的ObjectId字段
    if "_id" in book:
        del book["_id"]
    
    # 处理datetime类型，转换为ISO格式字符串
    if "upload_date" in book and isinstance(book["upload_date"], datetime):
        book["upload_date"] = book["upload_date"].isoformat()
    
    return BookMetadata(**book)

@router.get("/books/{book_id}", response_model=BookAnalysisResult)
async def get_book_analysis(book_id: str, db = Depends(get_database)):
    # 从数据库获取书籍分析结果
    result = await db.book_analysis.find_one({"book_id": book_id})
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

@router.post("/books/{book_id}/analyze")
async def analyze_book(book_id: str, background_tasks: BackgroundTasks, db = Depends(get_database)):
    """手动触发书籍分析"""
    # 检查书籍是否存在
    book = await db.books.find_one({"id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    # 启动分析任务
    background_tasks.add_task(analyze_book_content, book_id, book["file_path"], db)
    
    return {"message": "分析任务已启动", "book_id": book_id}

async def analyze_book_content(book_id: str, file_path: str, db):
    """分析书籍内容的后台任务"""
    print(f"开始分析书籍: {book_id}")
    try:
        # 更新状态为处理中
        print(f"更新书籍状态为processing: {book_id}")
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"status": "processing"}}
        )
        
        # 读取文件内容
        print(f"读取文件内容: {file_path}")
        try:
            content = extract_text_from_file(file_path)
            print(f"文件内容长度: {len(content)} 字符")
        except Exception as e:
            print(f"文件内容提取失败: {str(e)}")
            raise Exception(f"无法提取文件内容: {str(e)}")
        
        # 使用Agent Workflow进行分析
        print("开始使用Agent Workflow分析书籍")
        
        # 调用agent workflow
        analysis_result = await run_analysis(
            book_content=content,
            user_input="请分析这本书的内容，提供摘要、关键点和推荐"
        )
        print(f"Agent分析结果: {analysis_result}")
        
        # 从agent结果中提取信息
        if analysis_result and hasattr(analysis_result, 'final_output'):
            summary = analysis_result.final_output.get('summary', '分析完成')
            key_points = analysis_result.final_output.get('key_points', [])
        else:
            summary = '分析完成'
            key_points = []
        
        # 获取书籍元数据
        book = await db.books.find_one({"id": book_id})
        
        # 构建符合BookAnalysisResult模型的数据结构
        analysis_result = {
            "book_id": book_id,
            "metadata": {
                "id": book["id"],
                "title": book["title"],
                "author": book["author"],
                "file_path": book["file_path"],
                "file_type": book["file_type"],
                "upload_date": book["upload_date"],
                "status": "completed"
            },
            "summary": {
                "main_points": key_points[:5] if key_points else ["暂无关键点"],
                "key_concepts": [{"concept": "暂无概念", "description": "暂无描述"}],
                "conclusion": summary or "分析完成"
            },
            "author_info": {
                "name": book["author"],
                "background": "暂无信息",
                "writing_style": "暂无信息",
                "notable_works": ["暂无作品"]
            },
            "recommendations": [],
            "processing_time": 0.0,
            "created_at": datetime.now()
        }
        print(f"准备保存分析结果: {analysis_result}")
        
        # 更新数据库
        print("开始更新book_analysis集合")
        result = await db.book_analysis.replace_one(
            {"book_id": book_id},
            analysis_result,
            upsert=True
        )
        print(f"book_analysis更新结果: {result.modified_count} modified, {result.upserted_id} upserted")
        
        # 更新书籍状态
        print("开始更新书籍状态为completed")
        book_result = await db.books.update_one(
            {"id": book_id},
            {"$set": {"status": "completed"}}
        )
        print(f"书籍状态更新结果: {book_result.modified_count} modified")
        print(f"分析任务完成: {book_id}")
        
    except Exception as e:
        # 更新状态为失败
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"status": "failed"}}
        )
        print(f"分析书籍 {book_id} 时出错: {str(e)}")

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
        # 移除MongoDB的ObjectId字段
        if "_id" in book:
            del book["_id"]
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

@router.delete("/books/{book_id}")
async def delete_book(book_id: str, db = Depends(get_database)):
    """删除书籍"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 删除相关的聊天记录
        await db.chat_messages.delete_many({"book_id": book_id})
        
        # 删除书籍文件（如果存在）
        if "file_path" in book and book["file_path"] and os.path.exists(book["file_path"]):
            try:
                os.remove(book["file_path"])
            except Exception as e:
                print(f"删除文件失败: {e}")
        
        # 从数据库中删除书籍记录
        result = await db.books.delete_one({"id": book_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="删除书籍失败")
        
        return {
            "message": "书籍删除成功",
            "book_id": book_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除书籍时发生错误: {str(e)}")