# ReadWise RAG系统技术实现方案

## 1. 项目结构调整

### 1.1 新增目录结构
```
backend/
├── services/
│   ├── vector_service.py      # 向量化服务
│   ├── rag_service.py         # RAG核心服务
│   ├── embedding_service.py   # 嵌入生成服务
│   └── retrieval_service.py   # 检索服务
├── models/
│   ├── vector_models.py       # 向量相关数据模型
│   └── rag_models.py          # RAG请求响应模型
├── utils/
│   ├── text_processing.py     # 文本处理工具
│   └── vector_utils.py        # 向量操作工具
└── config/
    └── rag_config.py          # RAG配置
```

## 2. 依赖包更新

### 2.1 pyproject.toml 新增依赖
```toml
dependencies = [
    # 现有依赖...
    "qdrant-client==1.7.0",
    "sentence-transformers==2.2.2",
    "tiktoken==0.5.2",
    "numpy>=1.24.0",
    "scikit-learn>=1.3.0",
]
```

### 2.2 嵌入模型API说明

**方案一：智谱AI + DeepSeek 组合（推荐）**
- **嵌入模型**：智谱AI `embedding-3`，输出维度 2048，中文优化
- **对话模型**：DeepSeek `deepseek-chat`，支持长上下文，适合RAG场景
- **API兼容性**：两者都兼容 OpenAI 格式，无需额外依赖
- **成本优势**：相比纯OpenAI方案更经济实惠
- **服务稳定性**：国内访问稳定，无需代理

**方案二：纯OpenAI方案**
- **嵌入模型**：OpenAI `text-embedding-3-small`，输出维度 1536
- **对话模型**：OpenAI `gpt-4` 或 `gpt-3.5-turbo`
- **优势**：技术成熟，性能稳定
- **劣势**：成本较高，需要稳定的国际网络

## 3. 配置文件

### 3.1 RAG配置 (config/rag_config.py)
```python
from pydantic import BaseModel
from typing import Optional
import os

class RAGConfig(BaseModel):
    # Qdrant配置
    qdrant_host: str = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", "6333"))
    qdrant_collection_name: str = "readwise_books"
    
    # 嵌入模型配置
     embedding_model: str = os.getenv("EMBEDDING_MODEL", "embedding-3")
     embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "2048"))
    
    # 文档分块配置
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # 检索配置
    top_k: int = 5
    similarity_threshold: float = 0.7
    
    # 生成配置
    max_context_length: int = 4000
    temperature: float = 0.7
    max_tokens: int = 1000

rag_config = RAGConfig()
```

## 4. 数据模型定义

### 4.1 向量数据模型 (models/vector_models.py)
```python
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class DocumentChunk(BaseModel):
    """文档块模型"""
    id: str
    book_id: str
    chunk_index: int
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    vector_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)

class SearchResult(BaseModel):
    """搜索结果模型"""
    chunk_id: str
    content: str
    score: float
    metadata: Dict[str, Any]
    book_info: Dict[str, str]

class VectorizeRequest(BaseModel):
    """向量化请求模型"""
    book_id: str
    force_reprocess: bool = False

class VectorizeStatus(BaseModel):
    """向量化状态模型"""
    book_id: str
    status: str  # pending, processing, completed, failed
    progress: float = 0.0
    total_chunks: Optional[int] = None
    processed_chunks: Optional[int] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
```

### 4.2 RAG请求响应模型 (models/rag_models.py)
```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class RAGRequest(BaseModel):
    """RAG请求模型"""
    query: str
    book_id: str
    conversation_history: Optional[List[Dict[str, str]]] = None
    max_context_chunks: int = 5
    include_metadata: bool = True

class RAGResponse(BaseModel):
    """RAG响应模型"""
    response: str
    sources: List[Dict[str, Any]]
    confidence_score: Optional[float] = None
    processing_time: float
    context_used: int

class ContextChunk(BaseModel):
    """上下文块模型"""
    content: str
    source: str
    relevance_score: float
    metadata: Dict[str, Any]
```

## 5. 核心服务实现

### 5.1 嵌入服务 (services/embedding_service.py)
```python
import asyncio
from typing import List
import os
from openai import AsyncOpenAI
from config.rag_config import rag_config
from utils.logger import get_logger

logger = get_logger(__name__)

class EmbeddingService:
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=os.getenv("ZHIPU_API_KEY"),
            base_url=os.getenv("EMBEDDING_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
        )
        self.model = rag_config.embedding_model
    
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """批量生成文本嵌入"""
        try:
            # 分批处理，避免API限制
            batch_size = 100
            all_embeddings = []
            
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                response = await self.client.embeddings.create(
                    model=self.model,
                    input=batch
                )
                
                batch_embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(batch_embeddings)
                
                # 添加延迟避免频率限制
                if i + batch_size < len(texts):
                    await asyncio.sleep(0.1)
            
            return all_embeddings
            
        except Exception as e:
            logger.error(f"生成嵌入失败: {e}")
            raise
    
    async def create_single_embedding(self, text: str) -> List[float]:
        """生成单个文本嵌入"""
        embeddings = await self.create_embeddings([text])
        return embeddings[0]
```

### 5.2 向量服务 (services/vector_service.py)
```python
import asyncio
from typing import List, Optional, Dict, Any
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
from models.vector_models import DocumentChunk, SearchResult, VectorizeStatus
from services.embedding_service import EmbeddingService
from config.rag_config import rag_config
from utils.logger import get_logger
from models.database import get_database

logger = get_logger(__name__)

class VectorService:
    def __init__(self):
        self.client = AsyncQdrantClient(
            host=rag_config.qdrant_host,
            port=rag_config.qdrant_port
        )
        self.collection_name = rag_config.qdrant_collection_name
        self.embedding_service = EmbeddingService()
    
    async def initialize_collection(self):
        """初始化Qdrant集合"""
        try:
            # 检查集合是否存在
            collections = await self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                # 创建新集合
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=rag_config.embedding_dimension,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"创建Qdrant集合: {self.collection_name}")
            
        except Exception as e:
            logger.error(f"初始化Qdrant集合失败: {e}")
            raise
    
    async def vectorize_book(self, book_id: str, force_reprocess: bool = False) -> VectorizeStatus:
        """向量化书籍"""
        db = await get_database()
        
        try:
            # 检查书籍是否存在
            book = await db.books.find_one({"id": book_id})
            if not book:
                raise ValueError(f"书籍不存在: {book_id}")
            
            # 检查是否需要重新处理
            if not force_reprocess and book.get("vector_status") == "completed":
                return VectorizeStatus(
                    book_id=book_id,
                    status="completed",
                    progress=1.0
                )
            
            # 更新状态为处理中
            await db.books.update_one(
                {"id": book_id},
                {"$set": {
                    "vector_status": "processing",
                    "vectorize_started_at": datetime.now()
                }}
            )
            
            # 获取或创建文档块
            chunks = await self._get_or_create_chunks(book_id, book)
            
            # 生成嵌入并存储
            await self._process_chunks(book_id, chunks)
            
            # 更新完成状态
            await db.books.update_one(
                {"id": book_id},
                {"$set": {
                    "vector_status": "completed",
                    "vectorize_completed_at": datetime.now(),
                    "chunk_count": len(chunks)
                }}
            )
            
            return VectorizeStatus(
                book_id=book_id,
                status="completed",
                progress=1.0,
                total_chunks=len(chunks),
                processed_chunks=len(chunks)
            )
            
        except Exception as e:
            # 更新失败状态
            await db.books.update_one(
                {"id": book_id},
                {"$set": {
                    "vector_status": "failed",
                    "vectorize_error": str(e)
                }}
            )
            logger.error(f"向量化书籍失败 {book_id}: {e}")
            raise
    
    async def search_similar(self, query: str, book_id: str, top_k: int = None) -> List[SearchResult]:
        """搜索相似文档块"""
        if top_k is None:
            top_k = rag_config.top_k
        
        try:
            # 生成查询嵌入
            query_embedding = await self.embedding_service.create_single_embedding(query)
            
            # 执行向量搜索
            search_result = await self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="book_id",
                            match=MatchValue(value=book_id)
                        )
                    ]
                ),
                limit=top_k,
                score_threshold=rag_config.similarity_threshold
            )
            
            # 转换搜索结果
            results = []
            for point in search_result:
                results.append(SearchResult(
                    chunk_id=str(point.id),
                    content=point.payload["content"],
                    score=point.score,
                    metadata=point.payload.get("metadata", {}),
                    book_info={
                        "title": point.payload.get("book_title", ""),
                        "author": point.payload.get("author", "")
                    }
                ))
            
            return results
            
        except Exception as e:
            logger.error(f"向量搜索失败: {e}")
            raise
    
    async def _get_or_create_chunks(self, book_id: str, book: dict) -> List[DocumentChunk]:
        """获取或创建文档块"""
        db = await get_database()
        
        # 检查是否已有文档块
        existing_chunks = await db.book_chunks.find({"book_id": book_id}).to_list(None)
        
        if existing_chunks:
            return [DocumentChunk(**chunk) for chunk in existing_chunks]
        
        # 创建新的文档块
        from utils.text_processing import split_text_into_chunks
        
        # 读取书籍内容
        content = await self._read_book_content(book["file_path"])
        
        # 分割文本
        chunks = split_text_into_chunks(content, book_id)
        
        # 保存到数据库
        chunk_docs = [chunk.dict() for chunk in chunks]
        await db.book_chunks.insert_many(chunk_docs)
        
        return chunks
    
    async def _process_chunks(self, book_id: str, chunks: List[DocumentChunk]):
        """处理文档块，生成嵌入并存储"""
        # 提取文本内容
        texts = [chunk.content for chunk in chunks]
        
        # 生成嵌入
        embeddings = await self.embedding_service.create_embeddings(texts)
        
        # 准备Qdrant点数据
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point = PointStruct(
                id=chunk.id,
                vector=embedding,
                payload={
                    "book_id": chunk.book_id,
                    "content": chunk.content,
                    "metadata": chunk.metadata,
                    "chunk_index": chunk.chunk_index,
                    "book_title": chunk.metadata.get("book_title", ""),
                    "author": chunk.metadata.get("author", "")
                }
            )
            points.append(point)
        
        # 批量上传到Qdrant
        await self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )
        
        # 更新数据库中的vector_id
        db = await get_database()
        for chunk in chunks:
            await db.book_chunks.update_one(
                {"id": chunk.id},
                {"$set": {"vector_id": chunk.id}}
            )
```

### 5.3 RAG服务 (services/rag_service.py)
```python
import time
from typing import List, Dict, Any, Optional
from services.vector_service import VectorService
from services.openai_client import OpenAIClient
from models.rag_models import RAGRequest, RAGResponse, ContextChunk
from config.rag_config import rag_config
from utils.logger import get_logger
from models.database import get_database

logger = get_logger(__name__)

class RAGService:
    def __init__(self):
        self.vector_service = VectorService()
         self.openai_client = OpenAIClient(
             api_key=os.getenv("DEEPSEEK_API_KEY"),
             base_url=os.getenv("CHAT_BASE_URL", "https://api.deepseek.com/v1"),
             model=os.getenv("DEFAULT_MODEL", "deepseek-chat")
        )
    
    async def generate_response(self, request: RAGRequest) -> RAGResponse:
        """生成RAG响应"""
        start_time = time.time()
        
        try:
            # 1. 检索相关上下文
            search_results = await self.vector_service.search_similar(
                query=request.query,
                book_id=request.book_id,
                top_k=request.max_context_chunks
            )
            
            if not search_results:
                return RAGResponse(
                    response="抱歉，我在这本书中没有找到与您问题相关的内容。",
                    sources=[],
                    processing_time=time.time() - start_time,
                    context_used=0
                )
            
            # 2. 构建上下文
            context_chunks = await self._build_context(search_results, request)
            
            # 3. 生成提示
            prompt = await self._build_prompt(request, context_chunks)
            
            # 4. 调用LLM生成回答
            response = await self.openai_client.chat_completion(
                messages=[
                    {"role": "system", "content": "你是一个专业的读书助手，基于提供的书籍内容回答用户问题。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=rag_config.temperature,
                max_tokens=rag_config.max_tokens
            )
            
            # 5. 后处理响应
            final_response = await self._post_process_response(response)
            
            # 6. 准备源信息
            sources = [
                {
                    "content": chunk.content[:200] + "...",
                    "score": chunk.relevance_score,
                    "metadata": chunk.metadata
                }
                for chunk in context_chunks
            ]
            
            return RAGResponse(
                response=final_response,
                sources=sources,
                processing_time=time.time() - start_time,
                context_used=len(context_chunks)
            )
            
        except Exception as e:
            logger.error(f"RAG生成失败: {e}")
            return RAGResponse(
                response="抱歉，处理您的问题时出现了错误，请稍后重试。",
                sources=[],
                processing_time=time.time() - start_time,
                context_used=0
            )
    
    async def _build_context(self, search_results: List, request: RAGRequest) -> List[ContextChunk]:
        """构建上下文块"""
        context_chunks = []
        total_length = 0
        
        for result in search_results:
            # 检查是否超过最大上下文长度
            if total_length + len(result.content) > rag_config.max_context_length:
                break
            
            context_chunk = ContextChunk(
                content=result.content,
                source=f"《{result.book_info.get('title', '未知')}》",
                relevance_score=result.score,
                metadata=result.metadata
            )
            
            context_chunks.append(context_chunk)
            total_length += len(result.content)
        
        return context_chunks
    
    async def _build_prompt(self, request: RAGRequest, context_chunks: List[ContextChunk]) -> str:
        """构建提示词"""
        # 获取书籍信息
        db = await get_database()
        book = await db.books.find_one({"id": request.book_id})
        book_title = book.get("title", "未知书籍") if book else "未知书籍"
        book_author = book.get("author", "未知作者") if book else "未知作者"
        
        # 构建上下文文本
        context_text = "\n\n".join([
            f"片段{i+1}：{chunk.content}"
            for i, chunk in enumerate(context_chunks)
        ])
        
        # 构建完整提示
        prompt = f"""
基于以下来自《{book_title}》（作者：{book_author}）的内容片段，回答用户的问题。

相关内容片段：
{context_text}

用户问题：{request.query}

请基于上述内容片段回答问题，要求：
1. 回答要准确、相关，直接基于提供的内容
2. 如果内容片段不足以完全回答问题，请说明
3. 保持回答的自然和易懂
4. 可以适当引用原文

回答："""
        
        return prompt
    
    async def _post_process_response(self, response: str) -> str:
        """后处理响应"""
        # 移除可能的系统提示残留
        response = response.strip()
        
        # 确保回答完整
        if not response.endswith(('。', '！', '？', '.', '!', '?')):
            response += "。"
        
        return response
```

## 6. 工具函数实现

### 6.1 文本处理工具 (utils/text_processing.py)
```python
import re
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from models.vector_models import DocumentChunk
from config.rag_config import rag_config
import uuid

def split_text_into_chunks(content: str, book_id: str, book_metadata: dict = None) -> List[DocumentChunk]:
    """将文本分割为文档块"""
    # 创建文本分割器
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=rag_config.chunk_size,
        chunk_overlap=rag_config.chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", "。", "！", "？", ";", ":", " ", ""]
    )
    
    # 分割文本
    text_chunks = text_splitter.split_text(content)
    
    # 创建文档块对象
    chunks = []
    for i, chunk_text in enumerate(text_chunks):
        # 提取章节信息（简单实现）
        chapter_info = extract_chapter_info(chunk_text)
        
        chunk = DocumentChunk(
            id=str(uuid.uuid4()),
            book_id=book_id,
            chunk_index=i,
            content=chunk_text.strip(),
            metadata={
                "chapter": chapter_info.get("chapter", f"片段{i+1}"),
                "word_count": len(chunk_text),
                "book_title": book_metadata.get("title", "") if book_metadata else "",
                "author": book_metadata.get("author", "") if book_metadata else ""
            }
        )
        chunks.append(chunk)
    
    return chunks

def extract_chapter_info(text: str) -> dict:
    """从文本中提取章节信息"""
    # 简单的章节检测正则
    chapter_patterns = [
        r'第[一二三四五六七八九十\d]+章',
        r'Chapter\s+\d+',
        r'第[一二三四五六七八九十\d]+节',
        r'\d+\.',
    ]
    
    for pattern in chapter_patterns:
        match = re.search(pattern, text[:100])  # 只检查前100字符
        if match:
            return {"chapter": match.group()}
    
    return {"chapter": "未知章节"}

def clean_text(text: str) -> str:
    """清理文本"""
    # 移除多余空白
    text = re.sub(r'\s+', ' ', text)
    
    # 移除特殊字符
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    return text.strip()
```

## 7. API接口更新

### 7.1 更新chat.py
```python
# 在现有chat.py中添加以下导入和路由

from services.rag_service import RAGService
from services.vector_service import VectorService
from models.rag_models import RAGRequest
from models.vector_models import VectorizeRequest, VectorizeStatus

# 添加RAG服务实例
rag_service = RAGService()
vector_service = VectorService()

# 更新现有的send_book_message函数
@router.post("/")
async def send_book_message(request: BookChatRequest, db = Depends(get_database)):
    """发送基于书籍的聊天消息 - RAG增强版本"""
    try:
        # 检查书籍是否存在
        book = await db.books.find_one({"id": request.book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        # 检查向量化状态
        if book.get("vector_status") != "completed":
            raise HTTPException(
                status_code=400, 
                detail="书籍尚未完成向量化处理，请先进行向量化"
            )
        
        # 保存用户消息
        user_message = {
            "id": str(uuid.uuid4()),
            "book_id": request.book_id,
            "content": request.message,
            "sender": "user",
            "timestamp": datetime.now().isoformat()
        }
        await db.chat_messages.insert_one(user_message)
        
        # 使用RAG生成回复
        rag_request = RAGRequest(
            query=request.message,
            book_id=request.book_id
        )
        
        rag_response = await rag_service.generate_response(rag_request)
        
        # 保存AI消息
        ai_message = {
            "id": str(uuid.uuid4()),
            "book_id": request.book_id,
            "content": rag_response.response,
            "sender": "ai",
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "sources_count": len(rag_response.sources),
                "processing_time": rag_response.processing_time,
                "context_used": rag_response.context_used
            }
        }
        await db.chat_messages.insert_one(ai_message)
        
        return {
            "response": rag_response.response,
            "message_id": ai_message["id"],
            "sources": rag_response.sources,
            "metadata": ai_message["metadata"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送消息失败: {str(e)}")

# 新增向量化管理接口
@router.post("/vectorize/{book_id}")
async def vectorize_book(book_id: str, force: bool = False, db = Depends(get_database)):
    """手动触发书籍向量化"""
    try:
        status = await vector_service.vectorize_book(book_id, force_reprocess=force)
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"向量化失败: {str(e)}")

@router.get("/vector-status/{book_id}")
async def get_vector_status(book_id: str, db = Depends(get_database)):
    """获取书籍向量化状态"""
    try:
        book = await db.books.find_one({"id": book_id})
        if not book:
            raise HTTPException(status_code=404, detail="书籍不存在")
        
        return {
            "book_id": book_id,
            "status": book.get("vector_status", "pending"),
            "chunk_count": book.get("chunk_count", 0),
            "error_message": book.get("vectorize_error"),
            "started_at": book.get("vectorize_started_at"),
            "completed_at": book.get("vectorize_completed_at")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取状态失败: {str(e)}")
```

## 8. 部署和初始化

### 8.1 Docker Compose更新
```yaml
# 在docker-compose.yml中添加Qdrant服务
services:
  qdrant:
    image: qdrant/qdrant:v1.7.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334

volumes:
  qdrant_data:
```

### 8.2 初始化脚本
```python
# scripts/init_rag.py
import asyncio
from services.vector_service import VectorService

async def initialize_rag_system():
    """初始化RAG系统"""
    vector_service = VectorService()
    
    # 初始化Qdrant集合
    await vector_service.initialize_collection()
    
    print("RAG系统初始化完成")

if __name__ == "__main__":
    asyncio.run(initialize_rag_system())
```

### 8.3 环境变量配置
```bash
# 环境变量配置（智谱AI + DeepSeek 组合）
ZHIPU_API_KEY=your_zhipu_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
EMBEDDING_BASE_URL=https://open.bigmodel.cn/api/paas/v4
CHAT_BASE_URL=https://api.deepseek.com/v1
EMBEDDING_MODEL=embedding-3
EMBEDDING_DIMENSION=2048
QDRANT_HOST=localhost
QDRANT_PORT=6333
```

## 9. 测试方案

### 9.1 单元测试
```python
# tests/test_rag_service.py
import pytest
from services.rag_service import RAGService
from models.rag_models import RAGRequest

@pytest.mark.asyncio
async def test_rag_response():
    rag_service = RAGService()
    request = RAGRequest(
        query="这本书的主要观点是什么？",
        book_id="test_book_id"
    )
    
    response = await rag_service.generate_response(request)
    assert response.response
    assert response.processing_time > 0
```

### 9.2 集成测试脚本
```python
# scripts/test_rag_integration.py
import asyncio
from services.vector_service import VectorService
from services.rag_service import RAGService

async def test_full_pipeline():
    """测试完整RAG流程"""
    # 1. 向量化测试书籍
    vector_service = VectorService()
    await vector_service.vectorize_book("test_book_id")
    
    # 2. 测试检索
    results = await vector_service.search_similar(
        "测试查询", "test_book_id"
    )
    
    # 3. 测试RAG生成
    rag_service = RAGService()
    response = await rag_service.generate_response(
        RAGRequest(query="测试问题", book_id="test_book_id")
    )
    
    print(f"RAG响应: {response.response}")
    print(f"处理时间: {response.processing_time}秒")
    print(f"使用上下文: {response.context_used}个片段")

if __name__ == "__main__":
    asyncio.run(test_full_pipeline())
```

### 9.3 嵌入服务测试
```python
# scripts/test_embedding.py
import asyncio
from services.embedding_service import EmbeddingService

async def test_embedding():
    """测试嵌入功能"""
    embedding_service = EmbeddingService()
    
    # 测试嵌入功能
test_text = "这是一个测试文本"
embedding = await embedding_service.create_single_embedding(test_text)
print(f"嵌入维度: {len(embedding)}")  # 智谱AI embedding-3 输出 2048
    
    # 测试批量嵌入
    test_texts = ["文本1", "文本2", "文本3"]
    embeddings = await embedding_service.create_embeddings(test_texts)
    print(f"批量嵌入数量: {len(embeddings)}")

if __name__ == "__main__":
    asyncio.run(test_embedding())
```

---

**实施建议**：
1. 按照模块顺序逐步实现
2. 每个模块完成后进行单元测试
3. 使用小规模数据进行集成测试
4. 优化性能和错误处理
5. 部署到生产环境前进行压力测试