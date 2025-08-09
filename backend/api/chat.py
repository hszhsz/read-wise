from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
import asyncio
import uuid
from datetime import datetime

from agents.workflow import BookAnalysisAgent
from agents.state import AgentState, ChatMessage, BookInfo
from models.database import get_database
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