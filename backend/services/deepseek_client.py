import os
import json
import time
import aiohttp
import random
from typing import Dict, Any, Optional, List
from tenacity import retry, stop_after_attempt, wait_exponential

class DeepSeekClient:
    """DeepSeek API客户端"""
    
    def __init__(self, api_key: Optional[str] = None):
        """初始化DeepSeek客户端
        
        Args:
            api_key: DeepSeek API密钥，如果为None，则从环境变量获取
        """
        # 检查是否使用模拟模式
        self.use_mock = os.getenv("USE_MOCK_API", "").lower() in ["true", "1", "yes"]
        
        self.api_key = api_key or os.getenv("DEEPSEEK_API_KEY")
        if not self.api_key and not self.use_mock:
            raise ValueError("DeepSeek API密钥未提供，请设置DEEPSEEK_API_KEY环境变量或启用USE_MOCK_API=true")
        
        if self.use_mock:
            print("警告: 使用模拟API模式，生成的内容为模拟数据")
            
        self.api_base = "https://api.deepseek.com/v1"
        self.model = "deepseek-chat"  # 默认模型
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def generate(self, 
                       prompt: str, 
                       model: Optional[str] = None,
                       max_tokens: int = 1000,
                       temperature: float = 0.7,
                       top_p: float = 0.95,
                       system_message: Optional[str] = None) -> Dict[str, Any]:
        """生成文本
        
        Args:
            prompt: 提示文本
            model: 使用的模型，默认为deepseek-chat
            max_tokens: 生成的最大token数
            temperature: 温度参数，控制随机性
            top_p: 控制输出多样性
            system_message: 系统消息
            
        Returns:
            API响应
        """
        # 如果使用模拟模式，返回模拟数据
        if self.use_mock:
            return self._generate_mock_response(prompt)
            
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # 构建消息列表
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        # 构建请求体
        data = {
            "model": model or self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": top_p
        }
        
        # 发送请求
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_base}/chat/completions", 
                                   headers=headers, 
                                   json=data) as response:
                if response.status != 200:
                    error_text = await response.text()
                    raise Exception(f"DeepSeek API请求失败: {response.status} - {error_text}")
                
                return await response.json()
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def batch_generate(self, 
                            prompts: List[str], 
                            model: Optional[str] = None,
                            max_tokens: int = 1000,
                            temperature: float = 0.7,
                            system_message: Optional[str] = None) -> List[Dict[str, Any]]:
        """批量生成文本
        
        Args:
            prompts: 提示文本列表
            model: 使用的模型
            max_tokens: 生成的最大token数
            temperature: 温度参数
            system_message: 系统消息
            
        Returns:
            API响应列表
        """
        results = []
        for prompt in prompts:
            result = await self.generate(
                prompt=prompt,
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                system_message=system_message
            )
            results.append(result)
        
        return results
    
    def _generate_mock_response(self, prompt: str) -> Dict[str, Any]:
        """生成模拟的API响应
        
        Args:
            prompt: 提示文本
            
        Returns:
            模拟的API响应
        """
        # 根据提示内容生成不同的模拟响应
        mock_content = ""
        
        # 检查提示中的关键词，生成相应的模拟内容
        if "summary" in prompt.lower() or "摘要" in prompt:
            mock_content = json.dumps({
                "title": "模拟书籍标题",
                "main_points": ["这是第一个要点", "这是第二个要点", "这是第三个要点"],
                "overview": "这是一本关于模拟数据的书籍，主要讨论了如何在没有真实API的情况下进行开发和测试。",
                "chapters": ["第一章：介绍", "第二章：方法", "第三章：结果", "第四章：讨论"],
                "conclusion": "模拟数据对于开发和测试非常重要，可以提高开发效率和质量。"
            })
        elif "author" in prompt.lower() or "作者" in prompt:
            mock_content = json.dumps({
                "name": "模拟作者",
                "background": "模拟作者是一位经验丰富的技术作家，专注于软件开发和人工智能领域。",
                "other_works": ["模拟作品1", "模拟作品2", "模拟作品3"],
                "writing_style": "清晰、简洁、易懂",
                "expertise": ["软件开发", "人工智能", "数据科学"]
            })
        elif "recommend" in prompt.lower() or "推荐" in prompt:
            mock_content = json.dumps({
                "similar_books": [
                    {"title": "模拟推荐书籍1", "author": "模拟作者1", "reason": "主题相似"},
                    {"title": "模拟推荐书籍2", "author": "模拟作者2", "reason": "风格相似"},
                    {"title": "模拟推荐书籍3", "author": "模拟作者3", "reason": "内容互补"}
                ],
                "related_topics": ["模拟主题1", "模拟主题2", "模拟主题3"],
                "reading_order": ["先读这本", "再读那本", "最后读另一本"]
            })
        else:
            # 默认响应
            mock_content = "这是一个模拟的API响应内容。"
        
        # 构建完整的模拟响应
        return {
            "id": f"mock-{random.randint(1000, 9999)}",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": self.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": mock_content
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": len(prompt),
                "completion_tokens": len(mock_content),
                "total_tokens": len(prompt) + len(mock_content)
            }
        }
    
    def extract_text_from_response(self, response: Dict[str, Any]) -> str:
        """从API响应中提取生成的文本
        
        Args:
            response: API响应
            
        Returns:
            生成的文本
        """
        try:
            return response.get("choices", [{}])[0].get("message", {}).get("content", "")
        except (IndexError, KeyError):
            return ""