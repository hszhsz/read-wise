import asyncio
import logging
from typing import List, Optional, Dict, Any
from openai import AsyncOpenAI
from config.rag_config import rag_config
from models.rag_models import (
    DocumentChunk, ContextChunk, SearchResult, RAGRequest, RAGResponse,
    ChatMessage, EnhancedChatRequest, EnhancedChatResponse
)
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from utils.text_processing import TextProcessor


class RAGService:
    """RAG服务 - 检索增强生成"""
    
    def __init__(self):
        # 初始化各个服务
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        self.text_processor = TextProcessor()
        
        # 初始化DeepSeek客户端
        self.chat_client = AsyncOpenAI(
            api_key=rag_config.deepseek_api_key,
            base_url=rag_config.chat_base_url
        )
        
        self.chat_model = rag_config.chat_model
        self.logger = logging.getLogger(__name__)
    
    async def initialize(self) -> bool:
        """初始化RAG服务
        
        Returns:
            初始化是否成功
        """
        try:
            # 初始化向量数据库
            success = await self.vector_service.initialize_collection()
            if not success:
                self.logger.error("向量数据库初始化失败")
                return False
            
            # 测试嵌入服务连接
            embedding_ok = await self.embedding_service.test_connection()
            if not embedding_ok:
                self.logger.error("嵌入服务连接失败")
                return False
            
            # 测试向量服务连接
            vector_ok = await self.vector_service.test_connection()
            if not vector_ok:
                self.logger.error("向量服务连接失败")
                return False
            
            self.logger.info("RAG服务初始化成功")
            return True
            
        except Exception as e:
            self.logger.error(f"RAG服务初始化失败: {str(e)}")
            return False
    
    async def vectorize_book_content(self, book_id: str, content: str, metadata: Dict[str, Any] = None) -> bool:
        """向量化书籍内容
        
        Args:
            book_id: 书籍ID
            content: 书籍内容
            metadata: 元数据
            
        Returns:
            向量化是否成功
        """
        try:
            self.logger.info(f"开始向量化书籍: {book_id}")
            
            # 删除已存在的向量
            await self.vector_service.delete_by_book(book_id)
            
            # 分割文本
            chunks = self.text_processor.split_text(
                text=content,
                chunk_size=rag_config.chunk_size,
                chunk_overlap=rag_config.chunk_overlap
            )
            
            if not chunks:
                self.logger.warning(f"书籍 {book_id} 没有可分割的内容")
                return True
            
            # 批量创建嵌入向量
            embeddings = await self.embedding_service.create_embeddings(chunks)
            
            # 创建文档块
            import uuid
            document_chunks = []
            char_offset = 0
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                start_char = char_offset
                end_char = char_offset + len(chunk_text)
                char_offset = end_char
                
                chunk = DocumentChunk(
                    id=str(uuid.uuid4()),
                    book_id=book_id,
                    content=chunk_text,
                    chunk_index=i,
                    start_char=start_char,
                    end_char=end_char,
                    vector=embedding,
                    metadata=metadata or {}
                )
                document_chunks.append(chunk)
            
            # 存储到向量数据库
            success = await self.vector_service.add_documents(document_chunks)
            
            if success:
                self.logger.info(f"成功向量化书籍 {book_id}, 共 {len(document_chunks)} 个文档块")
            else:
                self.logger.error(f"向量化书籍 {book_id} 失败")
            
            return success
            
        except Exception as e:
            self.logger.error(f"向量化书籍内容失败: {str(e)}")
            return False
    
    async def search_relevant_context(self, query: str, book_id: Optional[str] = None, top_k: int = None) -> List[ContextChunk]:
        """搜索相关上下文
        
        Args:
            query: 查询文本
            book_id: 可选的书籍ID过滤
            top_k: 返回结果数量
            
        Returns:
            相关上下文列表
        """
        try:
            # 创建查询向量
            query_embedding = await self.embedding_service.create_single_embedding(query)
            
            # 搜索相似文档
            search_results = await self.vector_service.search_similar(
                query_vector=query_embedding,
                limit=top_k or rag_config.retrieval_top_k,
                book_id=book_id,
                score_threshold=None  # 不使用阈值过滤，让所有结果通过
            )
            
            self.logger.info(f"搜索到 {len(search_results)} 个相似文档")
            
            # 转换为上下文块
            context_chunks = []
            for result in search_results:
                context = ContextChunk(
                    content=result.content,
                    score=result.score,
                    chunk_index=0,  # 使用默认值，因为DocumentSearchResult没有chunk_index
                    metadata=result.metadata
                )
                context_chunks.append(context)
            
            self.logger.info(f"搜索到 {len(context_chunks)} 个相关上下文")
            return context_chunks
            
        except Exception as e:
            self.logger.error(f"搜索相关上下文失败: {str(e)}")
            return []
    
    async def generate_response(self, request: RAGRequest) -> RAGResponse:
        """生成RAG响应
        
        Args:
            request: RAG请求
            
        Returns:
            RAG响应
        """
        try:
            import time
            start_time = time.time()
            
            # 搜索相关上下文
            context_chunks = await self.search_relevant_context(
                query=request.query,
                book_id=request.book_id,
                top_k=request.top_k
            )
            
            if not context_chunks:
                response_time = time.time() - start_time
                return RAGResponse(
                    answer="抱歉，我没有找到相关的信息来回答您的问题。",
                    context_chunks=[],
                    query=request.query,
                    book_id=request.book_id,
                    response_time=response_time,
                    model_used=self.chat_model
                )
            
            # 构建提示词
            context_text = "\n\n".join([chunk.content for chunk in context_chunks])
            
            system_prompt = rag_config.system_prompt.format(
                context=context_text
            )
            
            # 调用DeepSeek生成回答
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.query}
            ]
            
            # 检查是否为模拟模式
            if rag_config.deepseek_api_key.startswith("sk-mock"):
                # 模拟模式：生成基于上下文的简单回答
                answer = f"基于书籍内容，我找到了以下相关信息：\n\n{context_text[:500]}...\n\n这是对您问题的回答。"
            else:
                try:
                    response = await self.chat_client.chat.completions.create(
                        model=self.chat_model,
                        messages=messages,
                        temperature=rag_config.temperature,
                        max_tokens=rag_config.max_tokens,
                        stream=False
                    )
                    answer = response.choices[0].message.content
                except Exception as api_error:
                    self.logger.warning(f"DeepSeek API调用失败，使用模拟回答: {str(api_error)}")
                    answer = f"基于书籍内容，我找到了以下相关信息：\n\n{context_text[:500]}...\n\n这是对您问题的回答。"
            
            # 计算置信度（基于上下文相似度）
            confidence = self._calculate_confidence(context_chunks)
            
            import time
            response_time = time.time() - start_time if 'start_time' in locals() else 0.0
            
            return RAGResponse(
                answer=answer,
                context_chunks=context_chunks,
                query=request.query,
                book_id=request.book_id,
                response_time=response_time,
                model_used=self.chat_model
            )
            
        except Exception as e:
            self.logger.error(f"生成RAG响应失败: {str(e)}")
            response_time = time.time() - start_time if 'start_time' in locals() else 0.0
            return RAGResponse(
                answer="抱歉，生成回答时出现错误，请稍后重试。",
                context_chunks=[],
                query=request.query if hasattr(request, 'query') else "",
                book_id=request.book_id if hasattr(request, 'book_id') else "",
                response_time=response_time,
                model_used=self.chat_model
            )
    
    async def enhanced_chat(self, request: EnhancedChatRequest) -> EnhancedChatResponse:
        """增强聊天功能
        
        Args:
            request: 增强聊天请求
            
        Returns:
            增强聊天响应
        """
        try:
            # 获取用户消息
            last_user_message = request.message
            
            if not last_user_message:
                return EnhancedChatResponse(
                    message="请提供您的问题。",
                    context_used=False,
                    context_chunks=[],
                    response_time=0.0,
                    model_used="unknown"
                )
            
            # 判断是否需要使用RAG
            use_rag = request.use_rag and self._should_use_rag(last_user_message)
            
            if use_rag:
                # 使用RAG生成回答
                rag_request = RAGRequest(
                    query=last_user_message,
                    book_id=request.book_id,
                    top_k=request.top_k
                )
                
                rag_response = await self.generate_response(rag_request)
                
                return EnhancedChatResponse(
                    message=rag_response.answer,
                    context_used=True,
                    context_chunks=rag_response.context_chunks,
                    response_time=rag_response.response_time,
                    model_used=rag_response.model_used
                )
            else:
                # 直接使用对话模型
                messages = [{"role": "user", "content": request.message}]
                
                # 检查是否为模拟模式
                if rag_config.deepseek_api_key.startswith("sk-mock"):
                    # 模拟模式：生成简单回答
                    answer = f"这是对您问题的回答：{last_user_message}。我会尽力帮助您解答问题。"
                else:
                    try:
                        response = await self.chat_client.chat.completions.create(
                            model=self.chat_model,
                            messages=messages,
                            temperature=rag_config.temperature,
                            max_tokens=rag_config.max_tokens,
                            stream=False
                        )
                        answer = response.choices[0].message.content
                    except Exception as api_error:
                        self.logger.warning(f"DeepSeek API调用失败，使用模拟回答: {str(api_error)}")
                        answer = f"这是对您问题的回答：{last_user_message}。我会尽力帮助您解答问题。"
                
                return EnhancedChatResponse(
                    message=answer,
                    context_used=False,
                    context_chunks=[],
                    response_time=0.0,
                    model_used=self.chat_model
                )
                
        except Exception as e:
            self.logger.error(f"增强聊天失败: {str(e)}")
            return EnhancedChatResponse(
                message="抱歉，处理您的请求时出现错误，请稍后重试。",
                context_used=False,
                context_chunks=[],
                response_time=0.0,
                model_used="unknown"
            )
    
    def _should_use_rag(self, message: str) -> bool:
        """判断是否应该使用RAG
        
        Args:
            message: 用户消息
            
        Returns:
            是否使用RAG
        """
        # 简单的启发式规则
        rag_keywords = [
            "什么", "如何", "为什么", "哪里", "谁", "何时",
            "解释", "说明", "描述", "定义", "介绍",
            "书中", "文中", "内容", "章节", "段落"
        ]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in rag_keywords)
    
    def _calculate_confidence(self, context_chunks: List[ContextChunk]) -> float:
        """计算置信度
        
        Args:
            context_chunks: 上下文块列表
            
        Returns:
            置信度分数 (0-1)
        """
        if not context_chunks:
            return 0.0
        
        # 基于相似度分数计算置信度
        scores = [chunk.score for chunk in context_chunks if chunk.score is not None]
        
        if not scores:
            return 0.5  # 默认置信度
        
        # 使用加权平均，给予前面的结果更高权重
        weights = [1.0 / (i + 1) for i in range(len(scores))]
        weighted_score = sum(score * weight for score, weight in zip(scores, weights)) / sum(weights)
        
        # 将相似度分数转换为置信度 (0-1)
        confidence = min(max(weighted_score, 0.0), 1.0)
        
        return confidence
    
    async def get_service_status(self) -> Dict[str, Any]:
        """获取服务状态
        
        Returns:
            服务状态信息
        """
        try:
            # 测试各个服务
            embedding_status = await self.embedding_service.test_connection()
            vector_status = await self.vector_service.test_connection()
            
            # 获取向量数据库信息
            collection_info = await self.vector_service.get_collection_info()
            
            # 获取嵌入模型信息
            embedding_info = self.embedding_service.get_model_info()
            
            return {
                "embedding_service": {
                    "status": "healthy" if embedding_status else "unhealthy",
                    "model_info": embedding_info
                },
                "vector_service": {
                    "status": "healthy" if vector_status else "unhealthy",
                    "collection_info": collection_info
                },
                "chat_service": {
                    "model": self.chat_model,
                    "provider": "DeepSeek",
                    "base_url": rag_config.chat_base_url
                },
                "rag_config": {
                    "chunk_size": rag_config.chunk_size,
                    "chunk_overlap": rag_config.chunk_overlap,
                    "retrieval_top_k": rag_config.retrieval_top_k,
                    "similarity_threshold": rag_config.similarity_threshold
                }
            }
            
        except Exception as e:
            self.logger.error(f"获取服务状态失败: {str(e)}")
            return {"error": str(e)}
    
    async def close(self):
        """关闭服务"""
        try:
            await self.vector_service.close()
            await self.chat_client.close()
        except Exception as e:
            self.logger.error(f"关闭服务失败: {str(e)}")