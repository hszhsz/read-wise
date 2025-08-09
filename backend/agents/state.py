from typing import List, Dict, Any, Optional, TypedDict, Annotated
from datetime import datetime
from pydantic import BaseModel, Field
from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage

class BookAnalysisTask(BaseModel):
    """书籍分析任务"""
    task_id: str
    task_type: str  # summary, author_research, recommendation
    description: str
    status: str = "pending"  # pending, in_progress, completed, failed
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None

class BookInfo(BaseModel):
    """书籍信息"""
    book_id: str
    title: str
    author: str
    file_path: str
    content: str
    metadata: Dict[str, Any] = {}

class AgentState(TypedDict):
    """智能体状态"""
    # 消息历史
    messages: Annotated[List[BaseMessage], add_messages]
    
    # 书籍信息
    book_info: Optional[BookInfo]
    
    # 任务规划
    plan: List[BookAnalysisTask]
    
    # 当前执行的任务
    current_task: Optional[BookAnalysisTask]
    
    # 执行结果
    results: Dict[str, Any]
    
    # 执行步骤记录
    execution_steps: List[Dict[str, Any]]
    
    # 错误信息
    errors: List[str]
    
    # 会话ID
    session_id: str
    
    # 用户输入
    user_input: str
    
    # 是否需要人工干预
    needs_human_input: bool
    
    # 当前状态
    current_step: str
    
    # 完成状态
    is_complete: bool

class ExecutionStep(BaseModel):
    """执行步骤"""
    step_id: str
    step_name: str
    agent_name: str
    input_data: Dict[str, Any]
    output_data: Optional[Dict[str, Any]] = None
    status: str = "pending"  # pending, running, completed, failed
    start_time: datetime = Field(default_factory=datetime.now)
    end_time: Optional[datetime] = None
    duration: Optional[float] = None
    error: Optional[str] = None

class ChatMessage(BaseModel):
    """聊天消息"""
    message_id: str
    session_id: str
    role: str  # user, assistant, system
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)
    metadata: Dict[str, Any] = {}

class AnalysisResult(BaseModel):
    """分析结果"""
    book_summary: Optional[Dict[str, Any]] = None
    author_info: Optional[Dict[str, Any]] = None
    recommendations: Optional[List[Dict[str, Any]]] = None
    execution_log: List[ExecutionStep] = []
    total_duration: Optional[float] = None
    status: str = "pending"