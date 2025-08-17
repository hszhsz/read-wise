from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class VectorizeStatus(str, Enum):
    """向量化状态枚举"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentChunk(BaseModel):
    """文档块模型"""
    id: str = Field(..., description="块ID")
    book_id: str = Field(..., description="书籍ID")
    content: str = Field(..., description="文本内容")
    chunk_index: int = Field(..., description="块索引")
    start_char: int = Field(..., description="起始字符位置")
    end_char: int = Field(..., description="结束字符位置")
    vector: List[float] = Field(..., description="嵌入向量")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")


class ContextChunk(BaseModel):
    """上下文块模型（用于RAG响应）"""
    content: str = Field(..., description="文本内容")
    score: float = Field(..., description="相似度分数")
    chunk_index: int = Field(..., description="块索引")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class DocumentSearchResult(BaseModel):
    """单个文档搜索结果模型"""
    chunk_id: str = Field(..., description="块ID")
    book_id: str = Field(..., description="书籍ID")
    chapter_id: Optional[str] = Field(default=None, description="章节ID")
    content: str = Field(..., description="文本内容")
    score: float = Field(..., description="相似度分数")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="元数据")


class SearchResult(BaseModel):
    """搜索结果模型"""
    chunks: List[ContextChunk] = Field(..., description="相关文档块")
    total_chunks: int = Field(..., description="总块数")
    query: str = Field(..., description="查询文本")
    search_time: float = Field(..., description="搜索耗时（秒）")


class VectorizeRequest(BaseModel):
    """向量化请求模型"""
    book_id: str = Field(..., description="书籍ID")
    force_rebuild: bool = Field(default=False, description="是否强制重建")


class VectorizeResponse(BaseModel):
    """向量化响应模型"""
    book_id: str = Field(..., description="书籍ID")
    status: VectorizeStatus = Field(..., description="向量化状态")
    chunk_count: int = Field(default=0, description="生成的块数量")
    message: str = Field(..., description="状态消息")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")


class RAGRequest(BaseModel):
    """RAG请求模型"""
    book_id: str = Field(..., description="书籍ID")
    query: str = Field(..., description="用户查询")
    top_k: Optional[int] = Field(default=5, description="检索数量")
    similarity_threshold: Optional[float] = Field(default=0.7, description="相似度阈值")
    include_context: bool = Field(default=True, description="是否包含上下文")


class RAGResponse(BaseModel):
    """RAG响应模型"""
    answer: str = Field(..., description="生成的回答")
    context_chunks: List[ContextChunk] = Field(default_factory=list, description="参考的上下文块")
    query: str = Field(..., description="原始查询")
    book_id: str = Field(..., description="书籍ID")
    response_time: float = Field(..., description="响应耗时（秒）")
    model_used: str = Field(..., description="使用的模型")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")


class BookVectorStatus(BaseModel):
    """书籍向量化状态模型"""
    book_id: str = Field(..., description="书籍ID")
    status: VectorizeStatus = Field(..., description="向量化状态")
    chunk_count: int = Field(default=0, description="块数量")
    embedding_model: str = Field(..., description="嵌入模型")
    last_vectorized: Optional[datetime] = Field(default=None, description="最后向量化时间")
    error_message: Optional[str] = Field(default=None, description="错误信息")


class ChatMessage(BaseModel):
    """聊天消息模型（扩展原有模型）"""
    role: str = Field(..., description="角色：user/assistant")
    content: str = Field(..., description="消息内容")
    context_chunks: Optional[List[ContextChunk]] = Field(default=None, description="相关上下文块")
    timestamp: datetime = Field(default_factory=datetime.now, description="时间戳")


class EnhancedChatRequest(BaseModel):
    """增强的聊天请求模型"""
    book_id: str = Field(..., description="书籍ID")
    message: str = Field(..., description="用户消息")
    use_rag: bool = Field(default=True, description="是否使用RAG")
    top_k: Optional[int] = Field(default=5, description="检索数量")
    similarity_threshold: Optional[float] = Field(default=0.7, description="相似度阈值")


class EnhancedChatResponse(BaseModel):
    """增强的聊天响应模型"""
    message: str = Field(..., description="AI回复")
    context_used: bool = Field(..., description="是否使用了上下文")
    context_chunks: List[ContextChunk] = Field(default_factory=list, description="使用的上下文块")
    response_time: float = Field(..., description="响应耗时")
    model_used: str = Field(..., description="使用的模型")
    created_at: datetime = Field(default_factory=datetime.now, description="创建时间")