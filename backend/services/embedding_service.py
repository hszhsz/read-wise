import asyncio
import logging
from typing import List, Optional
from openai import AsyncOpenAI
from config.rag_config import rag_config


class EmbeddingService:
    """嵌入服务 - 使用智谱AI的embedding-3模型"""
    
    def __init__(self):
        self.client = AsyncOpenAI(
            api_key=rag_config.zhipu_api_key,
            base_url=rag_config.embedding_base_url
        )
        self.model = rag_config.embedding_model
        self.dimension = rag_config.embedding_dimension
        self.logger = logging.getLogger(__name__)
    
    async def create_single_embedding(self, text: str) -> List[float]:
        """创建单个文本的嵌入向量
        
        Args:
            text: 输入文本
            
        Returns:
            嵌入向量列表
            
        Raises:
            Exception: 当API调用失败时
        """
        try:
            # 清理文本
            cleaned_text = self._clean_text(text)
            
            if not cleaned_text.strip():
                self.logger.warning("输入文本为空，返回零向量")
                return [0.0] * self.dimension
            
            # 调用智谱AI API
            response = await self.client.embeddings.create(
                model=self.model,
                input=cleaned_text,
                encoding_format="float"
            )
            
            embedding = response.data[0].embedding
            
            # 验证向量维度
            if len(embedding) != self.dimension:
                self.logger.warning(
                    f"嵌入向量维度不匹配: 期望 {self.dimension}, 实际 {len(embedding)}"
                )
            
            return embedding
            
        except Exception as e:
            self.logger.error(f"创建嵌入向量失败: {str(e)}")
            raise Exception(f"嵌入服务错误: {str(e)}")
    
    async def create_embeddings(self, texts: List[str], batch_size: int = 10) -> List[List[float]]:
        """批量创建文本嵌入向量
        
        Args:
            texts: 文本列表
            batch_size: 批处理大小
            
        Returns:
            嵌入向量列表的列表
        """
        if not texts:
            return []
        
        embeddings = []
        
        # 分批处理
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i + batch_size]
            batch_embeddings = await self._create_batch_embeddings(batch_texts)
            embeddings.extend(batch_embeddings)
            
            # 避免API限流
            if i + batch_size < len(texts):
                await asyncio.sleep(0.1)
        
        return embeddings
    
    async def _create_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """创建批量嵌入向量
        
        Args:
            texts: 文本列表
            
        Returns:
            嵌入向量列表
        """
        try:
            # 清理文本
            cleaned_texts = [self._clean_text(text) for text in texts]
            
            # 过滤空文本
            valid_texts = []
            text_indices = []
            
            for i, text in enumerate(cleaned_texts):
                if text.strip():
                    valid_texts.append(text)
                    text_indices.append(i)
            
            if not valid_texts:
                self.logger.warning("批量文本全部为空，返回零向量")
                return [[0.0] * self.dimension] * len(texts)
            
            # 调用API
            response = await self.client.embeddings.create(
                model=self.model,
                input=valid_texts,
                encoding_format="float"
            )
            
            # 构建结果
            embeddings = [[0.0] * self.dimension] * len(texts)
            
            for i, embedding_data in enumerate(response.data):
                original_index = text_indices[i]
                embeddings[original_index] = embedding_data.embedding
            
            return embeddings
            
        except Exception as e:
            self.logger.error(f"批量创建嵌入向量失败: {str(e)}")
            # 降级到单个处理
            return await self._fallback_single_embeddings(texts)
    
    async def _fallback_single_embeddings(self, texts: List[str]) -> List[List[float]]:
        """降级处理：逐个创建嵌入向量
        
        Args:
            texts: 文本列表
            
        Returns:
            嵌入向量列表
        """
        embeddings = []
        
        for text in texts:
            try:
                embedding = await self.create_single_embedding(text)
                embeddings.append(embedding)
            except Exception as e:
                self.logger.error(f"单个文本嵌入失败: {str(e)}")
                embeddings.append([0.0] * self.dimension)
            
            # 避免API限流
            await asyncio.sleep(0.1)
        
        return embeddings
    
    def _clean_text(self, text: str) -> str:
        """清理文本
        
        Args:
            text: 原始文本
            
        Returns:
            清理后的文本
        """
        if not text:
            return ""
        
        # 移除多余的空白字符
        cleaned = " ".join(text.split())
        
        # 限制文本长度（智谱AI有token限制）
        max_length = 8000  # 保守估计
        if len(cleaned) > max_length:
            cleaned = cleaned[:max_length]
            self.logger.warning(f"文本被截断到 {max_length} 字符")
        
        return cleaned
    
    async def test_connection(self) -> bool:
        """测试API连接
        
        Returns:
            连接是否成功
        """
        try:
            test_embedding = await self.create_single_embedding("测试连接")
            return len(test_embedding) == self.dimension
        except Exception as e:
            self.logger.error(f"连接测试失败: {str(e)}")
            return False
    
    def get_model_info(self) -> dict:
        """获取模型信息
        
        Returns:
            模型信息字典
        """
        return {
            "model": self.model,
            "dimension": self.dimension,
            "provider": "智谱AI",
            "base_url": rag_config.embedding_base_url
        }