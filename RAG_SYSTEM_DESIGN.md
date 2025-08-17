# ReadWise RAG系统设计方案

## 1. 系统概述

本方案旨在为ReadWise智能读书助手的`/api/chat`接口设计一个完整的RAG（Retrieval-Augmented Generation）系统，实现基于书籍内容的智能对话功能。

## 2. 系统架构

### 2.1 整体架构图
```
用户查询 → 查询处理 → 向量检索 → 上下文增强 → LLM生成 → 响应返回
    ↓           ↓           ↓           ↓           ↓
  预处理    → 向量数据库  → 相关文档片段 → 提示工程   → 最终回答
```

### 2.2 核心组件

1. **文档处理模块**
   - 文本提取（已有）
   - 文档分块（Chunking）
   - 元数据提取

2. **向量化模块**
   - 文本嵌入生成
   - 向量存储
   - 索引管理

3. **检索模块**
   - 语义相似度搜索
   - 混合检索（语义+关键词）
   - 结果排序和过滤

4. **生成模块**
   - 上下文构建
   - 提示工程
   - LLM调用
   - 响应后处理

## 3. 技术选型

### 3.1 向量数据库
**推荐：Qdrant**
- 理由：高性能、易部署、支持过滤、Python友好
- 备选：Chroma（轻量级）、Weaviate（功能丰富）

### 3.2 嵌入模型
**推荐方案一：智谱AI embedding-3 (GLM)**
- 理由：国产API、成本适中、中文优化、API兼容OpenAI格式
- 模型：embedding-3，输出维度 2048
- 优势：与DeepSeek聊天模型搭配使用，访问稳定

**推荐方案二：text-embedding-3-small (OpenAI)**
- 理由：性能优秀、成本适中、支持中文
- 模型：text-embedding-3-small，输出维度 1536

**备选方案：bge-large-zh-v1.5（本地部署）**
- 理由：完全免费、中文优化、可本地部署
- 模型：BAAI/bge-large-zh-v1.5，输出维度 1024

### 3.3 文档分块策略
**推荐：递归字符分割 + 语义分割**
- 块大小：800-1200字符
- 重叠：100-200字符
- 保持段落完整性

## 4. 数据库设计

### 4.1 MongoDB集合扩展

```python
# 扩展现有books集合
{
    "id": "book_uuid",
    "title": "书名",
    "author": "作者",
    # ... 现有字段
    "vector_status": "pending|processing|completed|failed",
    "chunk_count": 150,
    "embedding_model": "embedding-3",
    "last_vectorized": "2024-01-01T00:00:00Z"
}

# 新增book_chunks集合
{
    "id": "chunk_uuid",
    "book_id": "book_uuid",
    "chunk_index": 0,
    "content": "文档片段内容",
    "metadata": {
        "chapter": "第一章",
        "page_number": 10,
        "section": "引言",
        "word_count": 200
    },
    "vector_id": "qdrant_point_id",
    "created_at": "2024-01-01T00:00:00Z"
}
```

### 4.2 Qdrant向量存储结构

```python
# Qdrant Point结构
{
    "id": "chunk_uuid",
    "vector": [0.1, 0.2, ...],  # 智谱AI embedding-3 (2048维) 或 OpenAI (1536维)
    "payload": {
        "book_id": "book_uuid",
        "book_title": "书名",
        "author": "作者",
        "chunk_index": 0,
        "content": "文档片段内容",
        "chapter": "第一章",
        "page_number": 10,
        "word_count": 200
    }
}
```

## 5. 核心服务设计

### 5.1 向量化服务 (VectorService)

```python
class VectorService:
    async def vectorize_book(self, book_id: str)
    async def create_embeddings(self, texts: List[str]) -> List[List[float]]
    async def store_vectors(self, chunks: List[DocumentChunk])
    async def search_similar(self, query: str, book_id: str, top_k: int) -> List[SearchResult]
```

### 5.2 RAG服务 (RAGService)

```python
class RAGService:
    async def generate_response(self, query: str, book_id: str) -> str
    async def retrieve_context(self, query: str, book_id: str) -> List[str]
    async def build_prompt(self, query: str, context: List[str], book_info: dict) -> str
    async def post_process_response(self, response: str) -> str
```

## 6. API接口设计

### 6.1 现有接口改造

```python
@router.post("/")
async def send_book_message(request: BookChatRequest, db = Depends(get_database)):
    """
    发送基于书籍的聊天消息 - RAG增强版本
    """
    # 1. 验证书籍存在
    book = await db.books.find_one({"id": request.book_id})
    if not book:
        raise HTTPException(status_code=404, detail="书籍不存在")
    
    # 2. 检查向量化状态
    if book.get("vector_status") != "completed":
        raise HTTPException(status_code=400, detail="书籍尚未完成向量化处理")
    
    # 3. 使用RAG生成回复
    rag_service = RAGService()
    ai_response = await rag_service.generate_response(
        query=request.message,
        book_id=request.book_id
    )
    
    # 4. 保存对话历史
    # ... 现有逻辑
    
    return {"response": ai_response, "message_id": ai_message["id"]}
```

### 6.2 新增管理接口

```python
@router.post("/vectorize/{book_id}")
async def vectorize_book(book_id: str):
    """手动触发书籍向量化"""
    
@router.get("/vector-status/{book_id}")
async def get_vector_status(book_id: str):
    """获取书籍向量化状态"""
    
@router.delete("/vectors/{book_id}")
async def delete_book_vectors(book_id: str):
    """删除书籍向量数据"""
```

## 7. 实施计划

### 阶段1：基础设施搭建（1-2天）
1. 安装和配置Qdrant
2. 添加向量化相关依赖
3. 创建数据库模型和集合

### 阶段2：向量化服务开发（2-3天）
1. 实现文档分块优化
2. 开发嵌入生成服务
3. 实现向量存储和检索

### 阶段3：RAG服务开发（2-3天）
1. 开发检索服务
2. 实现提示工程
3. 集成LLM生成

### 阶段4：API集成和测试（1-2天）
1. 改造现有chat接口
2. 添加管理接口
3. 端到端测试

### 阶段5：优化和部署（1-2天）
1. 性能优化
2. 错误处理完善
3. 生产环境部署

## 8. 性能考虑

### 8.1 检索优化
- 使用向量索引加速搜索
- 实现查询缓存
- 支持批量检索

### 8.2 生成优化
- 控制上下文长度
- 实现流式响应
- 添加响应缓存

### 8.3 资源管理
- 向量数据库连接池
- 嵌入模型复用
- 内存使用监控

## 9. 监控和日志

### 9.1 关键指标
- 检索准确率
- 响应时间
- 向量化进度
- 系统资源使用

### 9.2 日志记录
- 用户查询日志
- 检索结果日志
- 错误和异常日志
- 性能指标日志

## 10. 扩展性考虑

### 10.1 多模态支持
- 图片内容理解
- 表格数据处理
- 音频转文本

### 10.2 高级功能
- 多轮对话上下文
- 个性化推荐
- 知识图谱集成
- 实时学习更新

---

**总结**：本方案提供了一个完整的RAG系统设计，能够显著提升ReadWise的智能对话能力，为用户提供基于书籍内容的精准、相关的回答。通过分阶段实施，可以确保系统稳定性和可维护性。