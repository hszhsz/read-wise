#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试OpenAI客户端功能
"""

import asyncio
import os
from pathlib import Path

# 添加backend目录到Python路径
import sys
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from services.openai_client import OpenAIClient
from utils.env import load_env_vars

async def test_openai_client():
    """测试OpenAI客户端基本功能"""
    print("开始测试OpenAI客户端...")
    
    # 加载环境变量
    load_env_vars()
    
    # 检查环境变量
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL")
    model = os.getenv("DEFAULT_MODEL")
    
    print(f"API Key: {api_key[:10]}..." if api_key else "API Key: 未设置")
    print(f"Base URL: {base_url}")
    print(f"Model: {model}")
    
    if not api_key:
        print("❌ OPENAI_API_KEY 未设置，无法进行测试")
        return False
    
    try:
        # 创建客户端
        client = OpenAIClient()
        print("✅ OpenAI客户端创建成功")
        
        # 测试简单的文本生成
        print("\n测试文本生成...")
        response = await client.generate(
            prompt="请用一句话介绍什么是人工智能",
            max_tokens=100,
            temperature=0.7
        )
        
        if response and "choices" in response:
            content = client.extract_text_from_response(response)
            print(f"✅ 文本生成成功: {content[:100]}...")
            return True
        else:
            print(f"❌ 文本生成失败: {response}")
            return False
            
    except Exception as e:
        print(f"❌ 测试失败: {str(e)}")
        return False

async def test_book_analysis():
    """测试书籍分析相关功能"""
    print("\n测试书籍分析功能...")
    
    try:
        client = OpenAIClient()
        
        # 模拟书籍内容
        book_content = """
        《人工智能简史》是一本介绍人工智能发展历程的书籍。
        本书从图灵测试开始，讲述了人工智能从诞生到现在的发展历程。
        书中详细介绍了机器学习、深度学习、神经网络等核心技术。
        """
        
        # 测试书籍摘要生成
        summary_prompt = """
        请为以下书籍内容生成一个简洁的摘要，包括主要观点和核心内容：
        
        {content}
        
        请以JSON格式返回，包含以下字段：
        - title: 书籍标题
        - main_points: 主要观点列表
        - summary: 简要总结
        """
        
        response = await client.generate(
            prompt=summary_prompt.format(content=book_content),
            max_tokens=500,
            temperature=0.3,
            system_message="你是一个专业的书籍分析师，擅长提取书籍的核心内容和要点。"
        )
        
        if response and "choices" in response:
            content = client.extract_text_from_response(response)
            print(f"✅ 书籍摘要生成成功: {content[:200]}...")
            return True
        else:
            print(f"❌ 书籍摘要生成失败: {response}")
            return False
            
    except Exception as e:
        print(f"❌ 书籍分析测试失败: {str(e)}")
        return False

async def main():
    """主测试函数"""
    print("=" * 50)
    print("OpenAI客户端功能测试")
    print("=" * 50)
    
    # 基本功能测试
    basic_test = await test_openai_client()
    
    # 书籍分析功能测试
    analysis_test = await test_book_analysis()
    
    print("\n" + "=" * 50)
    print("测试结果汇总:")
    print(f"基本功能测试: {'✅ 通过' if basic_test else '❌ 失败'}")
    print(f"书籍分析测试: {'✅ 通过' if analysis_test else '❌ 失败'}")
    
    if basic_test and analysis_test:
        print("\n🎉 所有测试通过！OpenAI客户端配置正确，功能正常。")
    else:
        print("\n⚠️  部分测试失败，请检查配置和网络连接。")
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())