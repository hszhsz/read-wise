from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class BookMetadata(BaseModel):
    """书籍元数据模型"""
    id: str
    title: str
    author: str
    file_path: str
    file_type: str
    upload_date: datetime
    status: str = "pending"  # pending, processing, completed, failed
    page_count: Optional[int] = None
    word_count: Optional[int] = None
    language: Optional[str] = None
    publisher: Optional[str] = None
    publication_date: Optional[str] = None
    isbn: Optional[str] = None

class BookSummary(BaseModel):
    """书籍摘要模型"""
    main_points: List[str] = Field(..., description="书籍的主要观点")
    key_concepts: List[Dict[str, str]] = Field(..., description="关键概念及其解释")
    chapter_summaries: Optional[Dict[str, str]] = Field(None, description="各章节摘要")
    conclusion: str = Field(..., description="总体结论")

class AuthorInfo(BaseModel):
    """作者信息模型"""
    name: str
    background: str = Field(..., description="作者背景")
    writing_style: str = Field(..., description="写作风格")
    notable_works: List[str] = Field(..., description="代表作品")
    influence: Optional[str] = Field(None, description="影响力")

class ReadingRecommendation(BaseModel):
    """阅读推荐模型"""
    title: str
    author: str
    reason: str = Field(..., description="推荐理由")
    similarity: float = Field(..., ge=0, le=1, description="相似度评分")

class BookAnalysisResult(BaseModel):
    """书籍分析结果模型"""
    book_id: str
    metadata: BookMetadata
    summary: BookSummary
    author_info: AuthorInfo
    recommendations: List[ReadingRecommendation]
    processing_time: float = Field(..., description="处理时间（秒）")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: Optional[datetime] = None
    raw_analysis: Optional[Dict[str, Any]] = Field(None, description="原始分析数据")