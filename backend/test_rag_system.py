#!/usr/bin/env python3
"""
RAG系统测试脚本
用于验证嵌入服务、向量服务和RAG服务的功能
"""

import asyncio
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent))

from config.rag_config import RAGConfig
from services.embedding_service import EmbeddingService
from services.vector_service import VectorService
from services.rag_service import RAGService
from models.rag_models import DocumentChunk
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class RAGSystemTester:
    def __init__(self):
        self.config = RAGConfig()
        self.embedding_service = None
        self.vector_service = None
        self.rag_service = None
        
    async def setup_services(self):
        """初始化所有服务"""
        print("🔧 初始化RAG系统服务...")
        
        try:
            # 初始化嵌入服务
            self.embedding_service = EmbeddingService(self.config)
            print("✅ 嵌入服务初始化成功")
            
            # 初始化向量服务
            self.vector_service = VectorService(self.config)
            await self.vector_service.initialize_collection()
            print("✅ 向量服务初始化成功")
            
            # 初始化RAG服务
            self.rag_service = RAGService(self.config)
            await self.rag_service.initialize()
            print("✅ RAG服务初始化成功")
            
        except Exception as e:
            print(f"❌ 服务初始化失败: {e}")
            raise
    
    async def test_embedding_service(self):
        """测试嵌入服务"""
        print("\n🧪 测试嵌入服务...")
        
        try:
            # 测试连接
            is_connected = await self.embedding_service.test_connection()
            if not is_connected:
                print("❌ 嵌入服务连接失败")
                return False
            print("✅ 嵌入服务连接成功")
            
            # 测试单个文本嵌入
            test_text = "这是一个测试文本，用于验证嵌入服务的功能。"
            embedding = await self.embedding_service.create_embedding(test_text)
            
            if embedding and len(embedding) == self.config.embedding_dimension:
                print(f"✅ 单个文本嵌入成功，维度: {len(embedding)}")
            else:
                print(f"❌ 单个文本嵌入失败，期望维度: {self.config.embedding_dimension}, 实际维度: {len(embedding) if embedding else 0}")
                return False
            
            # 测试批量文本嵌入
            test_texts = [
                "第一个测试文本",
                "第二个测试文本",
                "第三个测试文本"
            ]
            embeddings = await self.embedding_service.create_embeddings(test_texts)
            
            if embeddings and len(embeddings) == len(test_texts):
                print(f"✅ 批量文本嵌入成功，数量: {len(embeddings)}")
            else:
                print(f"❌ 批量文本嵌入失败")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ 嵌入服务测试失败: {e}")
            return False
    
    async def test_vector_service(self):
        """测试向量服务"""
        print("\n🧪 测试向量服务...")
        
        try:
            # 测试连接
            is_connected = await self.vector_service.test_connection()
            if not is_connected:
                print("❌ 向量服务连接失败")
                return False
            print("✅ 向量服务连接成功")
            
            # 创建测试文档块
            test_book_id = "test_book_001"
            test_chunks = [
                DocumentChunk(
                    id="chunk_001",
                    book_id=test_book_id,
                    content="这是第一个测试文档块，包含一些示例内容。",
                    chunk_index=0,
                    metadata={"title": "测试书籍", "chapter": "第一章"}
                ),
                DocumentChunk(
                    id="chunk_002",
                    book_id=test_book_id,
                    content="这是第二个测试文档块，用于验证向量存储功能。",
                    chunk_index=1,
                    metadata={"title": "测试书籍", "chapter": "第二章"}
                )
            ]
            
            # 为文档块生成嵌入向量
            for chunk in test_chunks:
                embedding = await self.embedding_service.create_embedding(chunk.content)
                chunk.embedding = embedding
            
            # 添加文档块到向量数据库
            success = await self.vector_service.add_documents(test_chunks)
            if success:
                print(f"✅ 成功添加 {len(test_chunks)} 个文档块")
            else:
                print("❌ 添加文档块失败")
                return False
            
            # 测试搜索功能
            query = "测试文档内容"
            query_embedding = await self.embedding_service.create_embedding(query)
            
            search_results = await self.vector_service.search_similar(
                query_embedding=query_embedding,
                top_k=2,
                score_threshold=0.0
            )
            
            if search_results:
                print(f"✅ 搜索成功，找到 {len(search_results)} 个相似文档")
                for i, result in enumerate(search_results):
                    print(f"  结果 {i+1}: 相似度 {result.score:.3f}, 内容: {result.content[:50]}...")
            else:
                print("❌ 搜索失败")
                return False
            
            # 测试删除功能
            delete_success = await self.vector_service.delete_by_book(test_book_id)
            if delete_success:
                print("✅ 成功删除测试文档")
            else:
                print("❌ 删除测试文档失败")
            
            return True
            
        except Exception as e:
            print(f"❌ 向量服务测试失败: {e}")
            return False
    
    async def test_rag_service(self):
        """测试RAG服务"""
        print("\n🧪 测试RAG服务...")
        
        try:
            # 测试服务状态
            status = await self.rag_service.get_service_status()
            print(f"✅ RAG服务状态: {status}")
            
            # 测试书籍向量化
            test_book_id = "test_book_002"
            test_content = """
            人工智能是计算机科学的一个分支，它企图了解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。
            
            机器学习是人工智能的一个重要分支，它使计算机能够在没有明确编程的情况下学习。机器学习算法通过分析数据来识别模式，并使用这些模式来做出预测或决策。
            
            深度学习是机器学习的一个子集，它使用人工神经网络来模拟人脑的工作方式。深度学习在图像识别、自然语言处理和语音识别等领域取得了显著的成果。
            """
            
            metadata = {
                "title": "人工智能基础",
                "author": "测试作者",
                "upload_time": "2024-01-01"
            }
            
            vectorize_success = await self.rag_service.vectorize_book_content(
                book_id=test_book_id,
                content=test_content,
                metadata=metadata
            )
            
            if vectorize_success:
                print("✅ 书籍向量化成功")
            else:
                print("❌ 书籍向量化失败")
                return False
            
            # 测试RAG问答
            test_questions = [
                "什么是人工智能？",
                "机器学习和深度学习有什么区别？",
                "深度学习在哪些领域有应用？"
            ]
            
            for question in test_questions:
                print(f"\n❓ 问题: {question}")
                
                response = await self.rag_service.generate_rag_response(
                    query=question,
                    book_id=test_book_id,
                    top_k=3
                )
                
                if response:
                    print(f"💬 回答: {response.answer}")
                    print(f"📊 置信度: {response.confidence:.3f}")
                    print(f"📚 使用了 {len(response.context_chunks)} 个上下文块")
                else:
                    print("❌ RAG回答生成失败")
            
            # 清理测试数据
            await self.vector_service.delete_by_book(test_book_id)
            print("\n🧹 清理测试数据完成")
            
            return True
            
        except Exception as e:
            print(f"❌ RAG服务测试失败: {e}")
            return False
    
    async def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始RAG系统测试")
        print("=" * 50)
        
        try:
            # 初始化服务
            await self.setup_services()
            
            # 运行测试
            tests = [
                ("嵌入服务", self.test_embedding_service),
                ("向量服务", self.test_vector_service),
                ("RAG服务", self.test_rag_service)
            ]
            
            results = []
            for test_name, test_func in tests:
                try:
                    result = await test_func()
                    results.append((test_name, result))
                except Exception as e:
                    print(f"❌ {test_name}测试异常: {e}")
                    results.append((test_name, False))
            
            # 输出测试结果
            print("\n" + "=" * 50)
            print("📊 测试结果汇总:")
            
            all_passed = True
            for test_name, passed in results:
                status = "✅ 通过" if passed else "❌ 失败"
                print(f"  {test_name}: {status}")
                if not passed:
                    all_passed = False
            
            if all_passed:
                print("\n🎉 所有测试通过！RAG系统运行正常。")
            else:
                print("\n⚠️  部分测试失败，请检查配置和服务状态。")
            
            return all_passed
            
        except Exception as e:
            print(f"❌ 测试运行失败: {e}")
            return False

async def main():
    """主函数"""
    # 检查环境变量
    required_env_vars = [
        "ZHIPU_API_KEY",
        "QDRANT_HOST",
        "QDRANT_PORT"
    ]
    
    missing_vars = [var for var in required_env_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ 缺少必要的环境变量: {', '.join(missing_vars)}")
        print("请检查 .env 文件配置")
        return
    
    # 运行测试
    tester = RAGSystemTester()
    success = await tester.run_all_tests()
    
    if success:
        print("\n✅ RAG系统测试完成，系统可以正常使用！")
    else:
        print("\n❌ RAG系统测试失败，请检查配置和依赖。")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())