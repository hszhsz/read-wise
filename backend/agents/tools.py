import asyncio
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from ..services.deepseek_client import DeepSeekClient
from .state import BookInfo

class ToolResult(BaseModel):
    """工具执行结果基类"""
    success: bool = Field(description="是否成功")
    data: Dict[str, Any] = Field(description="结果数据")
    reasoning: str = Field(description="执行过程说明")
    confidence: float = Field(description="结果置信度 (0-1)", ge=0, le=1)

class BaseTool(ABC):
    """工具基类"""
    
    def __init__(self, deepseek_client: DeepSeekClient):
        self.client = deepseek_client
    
    @abstractmethod
    async def execute(self, book_info: BookInfo, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行工具"""
        pass

class BookSummaryResult(BaseModel):
    """书籍总结结果"""
    main_points: List[str] = Field(description="主要观点列表")
    key_concepts: List[Dict[str, str]] = Field(description="关键概念及解释")
    themes: List[str] = Field(description="主要主题")
    conclusion: str = Field(description="总体结论")
    word_count: int = Field(description="原文字数")
    reading_time: int = Field(description="预估阅读时间（分钟）")

class BookSummaryTool(BaseTool):
    """书籍总结工具"""
    
    def __init__(self, deepseek_client: DeepSeekClient):
        super().__init__(deepseek_client)
        self.parser = JsonOutputParser(pydantic_object=BookSummaryResult)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "请分析以下书籍内容：\n\n标题：{title}\n作者：{author}\n\n内容：\n{content}")
        ])
    
    def _get_system_prompt(self) -> str:
        return """你是一位专业的书籍分析师，擅长提取书籍的核心内容和要点。

你的任务是：
1. 识别并提取书籍的主要观点（3-8个）
2. 解释关键概念和术语
3. 总结主要主题
4. 提供整体结论
5. 估算字数和阅读时间

分析要求：
- 保持客观和准确
- 突出最重要的内容
- 使用清晰简洁的语言
- 确保逻辑结构清晰

请以JSON格式返回分析结果。

{format_instructions}"""
    
    async def execute(self, book_info: BookInfo, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行书籍总结"""
        try:
            # 处理长文本 - 如果内容太长，进行分块处理
            content = book_info.content
            if len(content) > 8000:  # 限制输入长度
                content = content[:8000] + "...[内容已截断]"
            
            # 构建提示
            messages = self.prompt.format_messages(
                title=book_info.title,
                author=book_info.author,
                content=content,
                format_instructions=self.parser.get_format_instructions()
            )
            
            # 调用LLM
            response = await self.client.generate(
                prompt=messages[1].content,
                system_message=messages[0].content,
                max_tokens=2000,
                temperature=0.3
            )
            
            # 解析结果
            result = self.parser.parse(response["choices"][0]["message"]["content"])
            
            return {
                "success": True,
                "data": result.dict(),
                "reasoning": "通过深度分析书籍内容，提取了主要观点、关键概念和核心主题",
                "confidence": 0.85
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "reasoning": f"书籍总结过程中出现错误：{str(e)}",
                "confidence": 0.0
            }

class AuthorResearchResult(BaseModel):
    """作者研究结果"""
    name: str = Field(description="作者姓名")
    background: str = Field(description="教育和职业背景")
    writing_style: str = Field(description="写作风格特点")
    notable_works: List[str] = Field(description="代表作品列表")
    achievements: List[str] = Field(description="主要成就")
    influence: str = Field(description="影响力和地位")
    birth_year: Optional[int] = Field(description="出生年份")
    nationality: str = Field(description="国籍")

class AuthorResearchTool(BaseTool):
    """作者研究工具"""
    
    def __init__(self, deepseek_client: DeepSeekClient):
        super().__init__(deepseek_client)
        self.parser = JsonOutputParser(pydantic_object=AuthorResearchResult)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "请研究作者：{author}\n\n书籍信息：\n标题：{title}\n内容摘要：{summary}")
        ])
    
    def _get_system_prompt(self) -> str:
        return """你是一位专业的文学研究者，擅长作者背景调查和分析。

你的任务是：
1. 收集作者的基本信息（姓名、国籍、出生年份等）
2. 分析作者的教育和职业背景
3. 总结作者的写作风格特点
4. 列出作者的代表作品
5. 描述作者的主要成就和影响力

研究要求：
- 基于已知信息进行合理推断
- 保持客观和准确
- 突出作者的独特之处
- 如果信息不足，请明确说明

请以JSON格式返回研究结果。

{format_instructions}"""
    
    async def execute(self, book_info: BookInfo, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行作者研究"""
        try:
            # 获取书籍总结作为上下文
            summary = ""
            if "summary" in context and "data" in context["summary"]:
                summary_data = context["summary"]["data"]
                summary = f"主要观点：{'; '.join(summary_data.get('main_points', []))}\n"
                summary += f"核心主题：{'; '.join(summary_data.get('themes', []))}"
            
            # 构建提示
            messages = self.prompt.format_messages(
                author=book_info.author,
                title=book_info.title,
                summary=summary or "暂无总结信息",
                format_instructions=self.parser.get_format_instructions()
            )
            
            # 调用LLM
            response = await self.client.generate(
                prompt=messages[1].content,
                system_message=messages[0].content,
                max_tokens=1500,
                temperature=0.4
            )
            
            # 解析结果
            result = self.parser.parse(response["choices"][0]["message"]["content"])
            
            return {
                "success": True,
                "data": result.dict(),
                "reasoning": "基于作者姓名和书籍内容，研究了作者的背景、风格和影响力",
                "confidence": 0.75  # 作者信息可能需要外部验证
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "reasoning": f"作者研究过程中出现错误：{str(e)}",
                "confidence": 0.0
            }

class BookRecommendation(BaseModel):
    """书籍推荐"""
    title: str = Field(description="书名")
    author: str = Field(description="作者")
    reason: str = Field(description="推荐理由")
    similarity_score: float = Field(description="相似度评分 (0-1)", ge=0, le=1)
    category: str = Field(description="推荐类别")

class RecommendationResult(BaseModel):
    """推荐结果"""
    recommendations: List[BookRecommendation] = Field(description="推荐书籍列表")
    reasoning: str = Field(description="推荐逻辑说明")
    categories: List[str] = Field(description="推荐类别")

class RecommendationTool(BaseTool):
    """书籍推荐工具"""
    
    def __init__(self, deepseek_client: DeepSeekClient):
        super().__init__(deepseek_client)
        self.parser = JsonOutputParser(pydantic_object=RecommendationResult)
        
        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "基于以下书籍信息，请推荐相关书籍：\n\n原书信息：\n标题：{title}\n作者：{author}\n\n书籍分析：\n{analysis}")
        ])
    
    def _get_system_prompt(self) -> str:
        return """你是一位资深的图书推荐专家，拥有丰富的阅读经验和广博的知识。

你的任务是：
1. 基于原书的主题、风格和内容，推荐5-8本相关书籍
2. 为每本推荐书籍提供详细的推荐理由
3. 计算与原书的相似度评分
4. 对推荐书籍进行分类

推荐原则：
- 主题相关性：内容主题相似或互补
- 风格匹配：写作风格或表达方式相近
- 深度递进：从入门到进阶的阅读路径
- 视角多元：不同角度探讨相同主题
- 经典与现代：兼顾经典著作和现代作品

请以JSON格式返回推荐结果。

{format_instructions}"""
    
    async def execute(self, book_info: BookInfo, context: Dict[str, Any]) -> Dict[str, Any]:
        """执行书籍推荐"""
        try:
            # 整合分析信息
            analysis = self._build_analysis_context(context)
            
            # 构建提示
            messages = self.prompt.format_messages(
                title=book_info.title,
                author=book_info.author,
                analysis=analysis,
                format_instructions=self.parser.get_format_instructions()
            )
            
            # 调用LLM
            response = await self.client.generate(
                prompt=messages[1].content,
                system_message=messages[0].content,
                max_tokens=2000,
                temperature=0.6  # 稍高的温度以增加推荐多样性
            )
            
            # 解析结果
            result = self.parser.parse(response["choices"][0]["message"]["content"])
            
            return {
                "success": True,
                "data": result.dict(),
                "reasoning": "基于书籍主题、风格和内容特点，推荐了相关的优质书籍",
                "confidence": 0.80
            }
            
        except Exception as e:
            return {
                "success": False,
                "data": {},
                "reasoning": f"书籍推荐过程中出现错误：{str(e)}",
                "confidence": 0.0
            }
    
    def _build_analysis_context(self, context: Dict[str, Any]) -> str:
        """构建分析上下文"""
        analysis_parts = []
        
        # 添加书籍总结信息
        if "summary" in context and "data" in context["summary"]:
            summary_data = context["summary"]["data"]
            if "main_points" in summary_data:
                analysis_parts.append(f"主要观点：{'; '.join(summary_data['main_points'])}")
            if "themes" in summary_data:
                analysis_parts.append(f"核心主题：{'; '.join(summary_data['themes'])}")
            if "conclusion" in summary_data:
                analysis_parts.append(f"总体结论：{summary_data['conclusion']}")
        
        # 添加作者信息
        if "author_research" in context and "data" in context["author_research"]:
            author_data = context["author_research"]["data"]
            if "writing_style" in author_data:
                analysis_parts.append(f"写作风格：{author_data['writing_style']}")
            if "notable_works" in author_data:
                analysis_parts.append(f"作者其他作品：{'; '.join(author_data['notable_works'])}")
        
        return "\n".join(analysis_parts) if analysis_parts else "暂无详细分析信息"