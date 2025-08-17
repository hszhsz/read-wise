from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Optional
from pydantic import BaseModel
import asyncio
import uuid
from datetime import datetime

from agents.workflow import BookAnalysisAgent
from agents.state import AgentState, ChatMessage, BookInfo
from models.database import get_database
from models.rag_models import RAGRequest, EnhancedChatRequest, ChatMessage as RAGChatMessage
from services.rag_service import RAGService
from utils.file_utils import save_uploaded_file, extract_text_from_file, generate_unique_filename
import os

router = APIRouter(prefix="/chat", tags=["chat"])

# 请求和响应模型
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    message: str
    session_id: str
    agent_state: Optional[dict] = None
    is_processing: bool = False

class SessionInfo(BaseModel):
    session_id: str
    created_at: datetime
    last_activity: datetime
    book_title: Optional[str] = None
    status: str

# 存储活跃的会话
active_sessions = {}

@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """发送聊天消息"""
    try:
        # 获取或创建会话
        session_id = request.session_id or str(uuid.uuid4())
        
        if session_id not in active_sessions:
            # 创建新的智能体实例
            agent = BookAnalysisAgent()
            active_sessions[session_id] = {
                "agent": agent,
                "created_at": datetime.now(),
                "last_activity": datetime.now(),
                "status": "active"
            }
        else:
            active_sessions[session_id]["last_activity"] = datetime.now()
        
        agent = active_sessions[session_id]["agent"]
        
        # 处理用户消息
        response = await agent.handle_user_message(request.message)
        
        return ChatResponse(
            message=response["message"],
            session_id=session_id,
            agent_state=response.get("state"),
            is_processing=response.get("is_processing", False)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理消息失败: {str(e)}")

@router.post("/upload")
async def upload_book_for_analysis(
    file: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    """上传书籍文件进行分析"""
    try:
        # 验证文件类型
        if not file.content_type or file.content_type not in [
            "application/pdf",
            "application/epub+zip", 
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ]:
            raise HTTPException(status_code=400, detail="不支持的文件类型")
        
        # 获取或创建会话
        session_id = session_id or str(uuid.uuid4())
        
        if session_id not in active_sessions:
            agent = BookAnalysisAgent()
            active_sessions[session_id] = {
                "agent": agent,
                "created_at": datetime.now(),
                "last_activity": datetime.now(),
                "status": "active"
            }
        
        # 保存文件
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        unique_filename, file_path = generate_unique_filename(file.filename, upload_dir)
        
        # 保存上传的文件
        file_content = await file.read()
        await save_uploaded_file(file_content, file_path)
        
        # 提取文本
        try:
            book_text = extract_text_from_file(file_path)
        except Exception as e:
            # 清理文件
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"文件处理失败: {str(e)}")
        
        # 创建书籍信息
        book_info = BookInfo(
            title=file.filename,
            file_path=file_path,
            content=book_text[:10000]  # 限制内容长度
        )
        
        # 开始分析
        agent = active_sessions[session_id]["agent"]
        response = await agent.start_book_analysis(book_info)
        
        return {
            "session_id": session_id,
            "message": response["message"],
            "book_title": file.filename,
            "status": "uploaded"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"上传失败: {str(e)}")

@router.get("/sessions", response_model=List[SessionInfo])
async def get_sessions():
    """获取所有会话信息"""
    sessions = []
    for session_id, session_data in active_sessions.items():
        agent_state = session_data["agent"].state
        sessions.append(SessionInfo(
            session_id=session_id,
            created_at=session_data["created_at"],
            last_activity=session_data["last_activity"],
            book_title=agent_state.book_info.title if agent_state.book_info else None,
            status=session_data["status"]
        ))
    return sessions

@router.get("/sessions/{session_id}/state")
async def get_session_state(session_id: str):
    """获取会话状态"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    agent = active_sessions[session_id]["agent"]
    return {
        "session_id": session_id,
        "state": agent.get_state_dict(),
        "chat_history": [msg.dict() for msg in agent.state.chat_history],
        "current_plan": agent.state.current_plan.dict() if agent.state.current_plan else None,
        "analysis_result": agent.state.analysis_result.dict() if agent.state.analysis_result else None
    }

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """删除会话"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    # 清理文件
    agent = active_sessions[session_id]["agent"]
    if agent.state.book_info and agent.state.book_info.file_path:
        file_path = agent.state.book_info.file_path
        if os.path.exists(file_path):
            os.remove(file_path)
    
    del active_sessions[session_id]
    return {"message": "会话已删除"}

@router.get("/sessions/{session_id}/analysis")
async def get_analysis_result(session_id: str):
    """获取分析结果"""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="会话不存在")
    
    agent = active_sessions[session_id]["agent"]
    if not agent.state.analysis_result:
        raise HTTPException(status_code=404, detail="分析结果不存在")
    
    return agent.state.analysis_result.dict()

# 基于书籍ID的聊天API
class BookChatRequest(BaseModel):
    book_id: str
    message: str
    use_rag: bool = True
    context_limit: int = 5

class BookChatMessage(BaseModel):
    id: str
    content: str
    sender: str  # 'user' or 'ai'
    timestamp: str

# 全局RAG服务实例
rag_service = None

async def get_rag_service():
    """获取RAG服务实例"""
    global rag_service
    if rag_service is None:
        rag_service = RAGService()
        try:
            # 尝试初始化，但不阻塞启动
            await asyncio.wait_for(rag_service.initialize(), timeout=5.0)
        except asyncio.TimeoutError:
            print("RAG服务初始化超时，将在后台继续尝试")
        except Exception as e:
            print(f"RAG服务初始化失败: {str(e)}")
    return rag_service

@router.post("/")
async def send_book_message(request: BookChatRequest, db = Depends(get_database)):
    """发送基于书籍的聊天消息（支持RAG）"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": request.book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 保存用户消息到数据库
        user_message = {
            "id": str(uuid.uuid4()),
            "book_id": request.book_id,
            "content": request.message,
            "sender": "user",
            "timestamp": datetime.now().isoformat()
        }
        await db.chat_messages.insert_one(user_message)
        
        # 获取RAG服务
        rag_svc = await get_rag_service()
        
        if request.use_rag:
            # 使用RAG生成回复
            rag_request = RAGRequest(
                query=request.message,
                book_id=request.book_id,
                top_k=request.context_limit
            )
            
            rag_response = await rag_svc.generate_response(rag_request)
            ai_response = rag_response.answer
            
            # 保存AI消息到数据库（包含上下文信息）
            ai_message = {
                "id": str(uuid.uuid4()),
                "book_id": request.book_id,
                "content": ai_response,
                "sender": "ai",
                "timestamp": datetime.now().isoformat(),
                "rag_used": True,
                "context_count": len(rag_response.context_chunks)
            }
            await db.chat_messages.insert_one(ai_message)
            
            return {
                "response": ai_response,
                "message_id": ai_message["id"],
                "rag_used": True,
                "context_count": len(rag_response.context_chunks),
                "context": [{
                    "content": ctx.content[:200] + "..." if len(ctx.content) > 200 else ctx.content,
                    "source": f"book_{request.book_id}_chunk_{ctx.chunk_index}",
                    "score": ctx.score
                } for ctx in rag_response.context_chunks]
            }
        else:
            # 获取聊天历史构建上下文
            cursor = db.chat_messages.find({"book_id": request.book_id}).sort("timestamp", -1).limit(10)
            recent_messages = await cursor.to_list(length=None)
            recent_messages.reverse()  # 按时间正序
            
            # 构建聊天消息列表
            chat_messages = []
            for msg in recent_messages:
                role = "user" if msg["sender"] == "user" else "assistant"
                chat_messages.append(RAGChatMessage(role=role, content=msg["content"]))
            
            # 添加当前用户消息
            chat_messages.append(RAGChatMessage(role="user", content=request.message))
            
            # 使用增强聊天功能
            enhanced_request = EnhancedChatRequest(
                message=request.message,
                use_rag=False,
                book_id=request.book_id
            )
            
            enhanced_response = await rag_svc.enhanced_chat(enhanced_request)
            ai_response = enhanced_response.message
            
            # 保存AI消息到数据库
            ai_message = {
                "id": str(uuid.uuid4()),
                "book_id": request.book_id,
                "content": ai_response,
                "sender": "ai",
                "timestamp": datetime.now().isoformat(),
                "rag_used": False
            }
            await db.chat_messages.insert_one(ai_message)
            
            return {
                "response": ai_response,
                "message_id": ai_message["id"],
                "rag_used": False
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送消息失败: {str(e)}")

@router.get("/history/{book_id}")
async def get_book_chat_history(book_id: str, db = Depends(get_database)):
    """获取书籍的聊天历史"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 获取聊天历史
        cursor = db.chat_messages.find({"book_id": book_id}).sort("timestamp", 1)
        messages = await cursor.to_list(length=None)
        
        # 转换消息格式
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "id": msg["id"],
                "content": msg["content"],
                "sender": msg["sender"],
                "timestamp": msg["timestamp"]
            })
        
        return {
            "messages": formatted_messages,
            "book_id": book_id,
            "total": len(formatted_messages)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取聊天历史失败: {str(e)}")

@router.delete("/history/{book_id}")
async def clear_book_chat_history(book_id: str, db = Depends(get_database)):
    """清空书籍的聊天历史"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 删除聊天历史
        result = await db.chat_messages.delete_many({"book_id": book_id})
        
        return {
            "message": "聊天历史已清空",
            "deleted_count": result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"清空聊天历史失败: {str(e)}")

@router.post("/vectorize/{book_id}")
async def vectorize_book(book_id: str, db = Depends(get_database)):
    """向量化书籍内容"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 获取RAG服务
        rag_svc = await get_rag_service()
        
        # 获取书籍内容
        content = book.get("content", "")
        if not content:
            # 尝试从文件路径读取内容
            file_path = book.get("file_path", "")
            if file_path:
                try:
                    from utils.file_utils import extract_text_from_file
                    # 如果file_path是绝对路径，直接使用；否则与当前目录拼接
                    if os.path.isabs(file_path):
                        full_path = file_path
                    else:
                        full_path = os.path.join(os.getcwd(), file_path)
                    content = extract_text_from_file(full_path)
                    if not content:
                        raise HTTPException(status_code=400, detail="无法从文件中提取内容")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"读取文件失败: {str(e)}")
            else:
                raise HTTPException(status_code=400, detail="书籍内容为空且无文件路径")
        
        # 向量化书籍内容
        success = await rag_svc.vectorize_book_content(
            book_id=book_id,
            content=content,
            metadata={
                "title": book.get("title", ""),
                "author": book.get("author", ""),
                "upload_time": book.get("upload_time", "")
            }
        )
        
        if success:
            # 更新书籍状态
            await db.books.update_one(
                {"id": book_id},
                {"$set": {"vectorized": True, "vectorized_at": datetime.now().isoformat()}}
            )
            
            return {
                "message": "书籍向量化成功",
                "book_id": book_id,
                "vectorized": True
            }
        else:
            raise HTTPException(status_code=500, detail="书籍向量化失败")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"向量化失败: {str(e)}")

@router.get("/rag/status")
async def get_rag_status():
    """获取RAG服务状态"""
    try:
        rag_svc = await get_rag_service()
        status = await rag_svc.get_service_status()
        
        return {
            "status": "healthy" if all(
                service.get("status") == "healthy" 
                for service in [status.get("embedding_service", {}), status.get("vector_service", {})]
            ) else "unhealthy",
            "services": status
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }

@router.delete("/vectorize/{book_id}")
async def delete_book_vectors(book_id: str, db = Depends(get_database)):
    """删除书籍的向量数据"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 获取RAG服务
        rag_svc = await get_rag_service()
        
        # 删除向量数据
        success = await rag_svc.vector_service.delete_by_book(book_id)
        
        if success:
            # 更新书籍状态
            await db.books.update_one(
                {"id": book_id},
                {"$unset": {"vectorized": "", "vectorized_at": ""}}
            )
            
            return {
                "message": "书籍向量数据已删除",
                "book_id": book_id
            }
        else:
            raise HTTPException(status_code=500, detail="删除向量数据失败")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除向量数据失败: {str(e)}")

@router.get("/vectorize/{book_id}/status")
async def get_book_vector_status(book_id: str, db = Depends(get_database)):
    """获取书籍向量化状态"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 获取RAG服务
        rag_svc = await get_rag_service()
        
        # 统计向量数量
        vector_count = await rag_svc.vector_service.count_documents(book_id)
        
        return {
            "book_id": book_id,
            "vectorized": book.get("vectorized", False),
            "vectorized_at": book.get("vectorized_at"),
            "vector_count": vector_count,
            "title": book.get("title", "")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取向量化状态失败: {str(e)}")