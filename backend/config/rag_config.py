import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class RAGConfig:
    """RAG系统配置"""
    
    # 智谱AI API配置
    zhipu_api_key: str = os.getenv("ZHIPU_API_KEY", "1df3e95dd18942caae73dacc0d88c01a.fL8tUoeFY9kKMg3Z")
    embedding_base_url: str = os.getenv("EMBEDDING_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    
    # DeepSeek API配置
    deepseek_api_key: str = os.getenv("DEEPSEEK_API_KEY", "")
    chat_base_url: str = os.getenv("CHAT_BASE_URL", "https://api.deepseek.com/v1")
    chat_model: str = os.getenv("CHAT_MODEL", "deepseek-chat")
    
    # 嵌入模型配置
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "embedding-3")
    embedding_dimension: int = int(os.getenv("EMBEDDING_DIMENSION", "2048"))
    
    # 文档分块配置
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))
    
    # 向量数据库配置
    qdrant_host: str = os.getenv("QDRANT_HOST", "localhost")
    qdrant_port: int = int(os.getenv("QDRANT_PORT", "6333"))
    qdrant_collection_name: str = os.getenv("QDRANT_COLLECTION_NAME", "readwise_documents")
    
    # 检索配置
    retrieval_top_k: int = int(os.getenv("RETRIEVAL_TOP_K", "5"))
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.1"))
    
    # 生成配置
    max_context_length: int = int(os.getenv("MAX_CONTEXT_LENGTH", "4000"))
    temperature: float = float(os.getenv("TEMPERATURE", "0.7"))
    max_tokens: int = int(os.getenv("MAX_TOKENS", "1000"))
    
    # 系统提示词
    system_prompt: str = os.getenv(
        "SYSTEM_PROMPT",
        "你是一个智能读书助手，基于提供的书籍内容回答用户问题。请根据上下文信息准确回答，如果上下文中没有相关信息，请明确说明。"
    )


# 全局配置实例
rag_config = RAGConfig()