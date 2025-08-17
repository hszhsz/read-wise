import asyncio
import logging
from typing import List, Optional, Dict, Any
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance, VectorParams, CreateCollection, PointStruct,
    Filter, FieldCondition, MatchValue, SearchRequest
)
from config.rag_config import rag_config
from models.rag_models import DocumentChunk, DocumentSearchResult


class VectorService:
    """向量服务 - 使用Qdrant向量数据库"""
    
    def __init__(self):
        self.client = AsyncQdrantClient(
            host=rag_config.qdrant_host,
            port=rag_config.qdrant_port
        )
        self.collection_name = rag_config.qdrant_collection_name
        self.vector_size = rag_config.embedding_dimension
        self.logger = logging.getLogger(__name__)
    
    async def initialize_collection(self) -> bool:
        """初始化向量集合
        
        Returns:
            初始化是否成功
        """
        try:
            # 检查集合是否存在
            collections = await self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                # 创建新集合
                await self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                self.logger.info(f"创建向量集合: {self.collection_name}")
            else:
                self.logger.info(f"向量集合已存在: {self.collection_name}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"初始化向量集合失败: {str(e)}")
            return False
    
    async def add_documents(self, chunks: List[DocumentChunk]) -> bool:
        """添加文档块到向量数据库
        
        Args:
            chunks: 文档块列表
            
        Returns:
            添加是否成功
        """
        if not chunks:
            return True
        
        try:
            points = []
            
            for chunk in chunks:
                if not chunk.vector or len(chunk.vector) != self.vector_size:
                    self.logger.warning(f"跳过无效向量的文档块: {chunk.id}")
                    continue
                
                point = PointStruct(
                    id=chunk.id,
                    vector=chunk.vector,
                    payload={
                        "book_id": chunk.book_id,
                        "chunk_index": chunk.chunk_index,
                        "content": chunk.content,
                        "metadata": chunk.metadata or {},
                        "created_at": chunk.created_at.isoformat() if chunk.created_at else None
                    }
                )
                points.append(point)
            
            if not points:
                self.logger.warning("没有有效的文档块可添加")
                return True
            
            # 批量插入
            await self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            self.logger.info(f"成功添加 {len(points)} 个文档块到向量数据库")
            return True
            
        except Exception as e:
            self.logger.error(f"添加文档块失败: {str(e)}")
            return False
    
    async def search_similar(self, 
                           query_vector: List[float], 
                           limit: int = None,
                           book_id: Optional[str] = None,
                           score_threshold: float = None) -> List[DocumentSearchResult]:
        """搜索相似文档
        
        Args:
            query_vector: 查询向量
            limit: 返回结果数量限制
            book_id: 可选的书籍ID过滤
            score_threshold: 相似度阈值
            
        Returns:
            搜索结果列表
        """
        try:
            if len(query_vector) != self.vector_size:
                raise ValueError(f"查询向量维度不匹配: 期望 {self.vector_size}, 实际 {len(query_vector)}")
            
            # 构建过滤条件
            query_filter = None
            if book_id:
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="book_id",
                            match=MatchValue(value=book_id)
                        )
                    ]
                )
            
            # 执行搜索
            search_params = {
                "collection_name": self.collection_name,
                "query_vector": query_vector,
                "query_filter": query_filter,
                "limit": limit or rag_config.retrieval_top_k
            }
            
            # 只有当score_threshold不为None时才添加阈值过滤
            if score_threshold is not None:
                search_params["score_threshold"] = score_threshold
            
            search_result = await self.client.search(**search_params)
            
            # 转换结果
            results = []
            for point in search_result:
                result = DocumentSearchResult(
                    chunk_id=str(point.id),
                    book_id=point.payload.get("book_id"),
                    chapter_id=point.payload.get("chapter_id"),
                    content=point.payload.get("content", ""),
                    score=point.score,
                    metadata=point.payload.get("metadata", {})
                )
                results.append(result)
            
            self.logger.info(f"搜索到 {len(results)} 个相似文档")
            return results
            
        except Exception as e:
            self.logger.error(f"搜索相似文档失败: {str(e)}")
            return []
    
    async def delete_by_book(self, book_id: str) -> bool:
        """删除指定书籍的所有文档块
        
        Args:
            book_id: 书籍ID
            
        Returns:
            删除是否成功
        """
        try:
            # 构建删除过滤条件
            delete_filter = Filter(
                must=[
                    FieldCondition(
                        key="book_id",
                        match=MatchValue(value=book_id)
                    )
                ]
            )
            
            # 执行删除
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=delete_filter
            )
            
            self.logger.info(f"删除书籍 {book_id} 的所有文档块")
            return True
            
        except Exception as e:
            self.logger.error(f"删除书籍文档块失败: {str(e)}")
            return False
    
    async def delete_by_chunk_ids(self, chunk_ids: List[str]) -> bool:
        """删除指定的文档块
        
        Args:
            chunk_ids: 文档块ID列表
            
        Returns:
            删除是否成功
        """
        try:
            if not chunk_ids:
                return True
            
            # 执行删除
            await self.client.delete(
                collection_name=self.collection_name,
                points_selector=chunk_ids
            )
            
            self.logger.info(f"删除 {len(chunk_ids)} 个文档块")
            return True
            
        except Exception as e:
            self.logger.error(f"删除文档块失败: {str(e)}")
            return False
    
    async def get_collection_info(self) -> Dict[str, Any]:
        """获取集合信息
        
        Returns:
            集合信息字典
        """
        try:
            info = await self.client.get_collection(self.collection_name)
            return {
                "name": info.config.params.vectors.size,
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "segments_count": info.segments_count,
                "status": info.status
            }
        except Exception as e:
            self.logger.error(f"获取集合信息失败: {str(e)}")
            return {}
    
    async def count_documents(self, book_id: Optional[str] = None) -> int:
        """统计文档数量
        
        Args:
            book_id: 可选的书籍ID过滤
            
        Returns:
            文档数量
        """
        try:
            if book_id:
                # 使用过滤条件统计
                query_filter = Filter(
                    must=[
                        FieldCondition(
                            key="book_id",
                            match=MatchValue(value=book_id)
                        )
                    ]
                )
                
                # 通过搜索来统计（Qdrant没有直接的count API）
                result = await self.client.search(
                    collection_name=self.collection_name,
                    query_vector=[0.0] * self.vector_size,  # 虚拟向量
                    query_filter=query_filter,
                    limit=10000  # 设置一个较大的限制
                )
                return len(result)
            else:
                # 获取总数
                info = await self.client.get_collection(self.collection_name)
                return info.points_count or 0
                
        except Exception as e:
            self.logger.error(f"统计文档数量失败: {str(e)}")
            return 0
    
    async def test_connection(self) -> bool:
        """测试数据库连接
        
        Returns:
            连接是否成功
        """
        try:
            collections = await self.client.get_collections()
            return True
        except Exception as e:
            self.logger.error(f"连接测试失败: {str(e)}")
            return False
    
    async def close(self):
        """关闭客户端连接"""
        try:
            await self.client.close()
        except Exception as e:
            self.logger.error(f"关闭连接失败: {str(e)}")