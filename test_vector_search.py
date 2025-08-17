import asyncio
import sys
sys.path.append('backend')

from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from config.rag_config import rag_config

async def test_search():
    # 初始化服务
    embedding_service = EmbeddingService()
    vector_service = VectorService()
    
    # 测试查询
    query = "什么是机器学习？"
    print(f"查询: {query}")
    
    # 生成查询向量
    query_vector = await embedding_service.create_single_embedding(query)
    print(f"查询向量维度: {len(query_vector)}")
    
    # 搜索相似文档（不使用阈值）
    print("\n=== 不使用相似度阈值的搜索 ===")
    results_no_threshold = await vector_service.search_similar(
        query_vector=query_vector,
        book_id="8b8b0ff5-18ac-4d8d-bb86-4a7ef48a6936",
        limit=5,
        score_threshold=None  # 不使用阈值
    )
    print(f"找到 {len(results_no_threshold)} 个结果")
    for i, result in enumerate(results_no_threshold):
        print(f"结果 {i+1}: 相似度={result.score:.4f}, 内容前100字符={result.content[:100]}...")
    
    # 搜索相似文档（使用当前阈值）
    print(f"\n=== 使用相似度阈值 {rag_config.similarity_threshold} 的搜索 ===")
    results_with_threshold = await vector_service.search_similar(
        query_vector=query_vector,
        book_id="8b8b0ff5-18ac-4d8d-bb86-4a7ef48a6936",
        limit=5,
        score_threshold=rag_config.similarity_threshold
    )
    print(f"找到 {len(results_with_threshold)} 个结果")
    for i, result in enumerate(results_with_threshold):
        print(f"结果 {i+1}: 相似度={result.score:.4f}, 内容前100字符={result.content[:100]}...")

if __name__ == "__main__":
    asyncio.run(test_search())