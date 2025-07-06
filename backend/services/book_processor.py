import os
import time
import asyncio
from datetime import datetime
from typing import Dict, List, Any, Optional
import traceback

# 文件处理库
import PyPDF2
from docx import Document
import ebooklib
from ebooklib import epub

# LangGraph和大语言模型
from langgraph.graph import StateGraph
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.prompts import PromptTemplate
from langchain.schema import Document as LangchainDocument

# 导入模型和数据库
from models.database import get_database
from models.book import BookMetadata, BookSummary, AuthorInfo, ReadingRecommendation, BookAnalysisResult

# DeepSeek API客户端
from services.deepseek_client import DeepSeekClient

# 获取API密钥
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
deepseek_client = DeepSeekClient(api_key=DEEPSEEK_API_KEY)

# 文本分割器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=4000,
    chunk_overlap=200,
    length_function=len,
)

async def process_book(book_id: str, file_path: str):
    """处理上传的书籍文件"""
    start_time = time.time()
    db = await get_database()
    
    try:
        # 更新书籍状态为处理中
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"status": "processing"}}
        )
        
        # 获取书籍元数据
        book_data = await db.books.find_one({"id": book_id})
        if not book_data:
            raise Exception(f"未找到ID为{book_id}的书籍")
        
        book_metadata = BookMetadata(**book_data)
        
        # 提取文本内容
        text_content = extract_text(file_path, book_metadata.file_type)
        
        # 更新元数据中的字数统计
        word_count = len(text_content.split())
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"word_count": word_count}}
        )
        
        # 创建处理函数并执行
        process_workflow = create_processing_graph()
        result = await process_workflow({
            "book_id": book_id,
            "metadata": book_metadata,
            "text_content": text_content
        })
        
        # 计算处理时间
        processing_time = time.time() - start_time
        
        # 构建最终结果
        analysis_result = BookAnalysisResult(
            book_id=book_id,
            metadata=book_metadata,
            summary=result["summary"],
            author_info=result["author_info"],
            recommendations=result["recommendations"],
            processing_time=processing_time,
            created_at=datetime.now()
        )
        
        # 保存结果到数据库
        await db.book_results.insert_one(analysis_result.dict())
        
        # 更新书籍状态为完成
        await db.books.update_one(
            {"id": book_id},
            {"$set": {"status": "completed"}}
        )
        
        print(f"书籍 {book_metadata.title} 处理完成，耗时 {processing_time:.2f} 秒")
        
    except Exception as e:
        # 记录错误并更新状态
        error_msg = str(e)
        traceback_str = traceback.format_exc()
        print(f"处理书籍 {book_id} 时出错: {error_msg}\n{traceback_str}")
        
        await db.books.update_one(
            {"id": book_id},
            {"$set": {
                "status": "failed",
                "error": error_msg
            }}
        )

def extract_text(file_path: str, file_type: str) -> str:
    """从不同格式的文件中提取文本"""
    if file_type == ".pdf":
        return extract_from_pdf(file_path)
    elif file_type == ".docx":
        return extract_from_docx(file_path)
    elif file_type == ".epub":
        return extract_from_epub(file_path)
    elif file_type == ".txt":
        return extract_from_txt(file_path)
    elif file_type == ".mobi":
        # 注意：处理mobi可能需要额外的库
        return extract_from_txt(file_path)  # 临时使用txt处理
    else:
        raise ValueError(f"不支持的文件类型: {file_type}")

def extract_from_pdf(file_path: str) -> str:
    """从PDF文件中提取文本"""
    text = ""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        num_pages = len(reader.pages)
        
        for page_num in range(num_pages):
            page = reader.pages[page_num]
            text += page.extract_text() + "\n"
    
    return text

def extract_from_docx(file_path: str) -> str:
    """从DOCX文件中提取文本"""
    doc = Document(file_path)
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def extract_from_epub(file_path: str) -> str:
    """从EPUB文件中提取文本"""
    book = epub.read_epub(file_path)
    text = ""
    
    for item in book.get_items():
        if item.get_type() == ebooklib.ITEM_DOCUMENT:
            content = item.get_content().decode('utf-8')
            # 简单去除HTML标签（更复杂的情况可能需要使用BeautifulSoup）
            text += content.replace('<', ' <').replace('>', '> ') + "\n"
    
    return text

def extract_from_txt(file_path: str) -> str:
    """从TXT文件中提取文本"""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
        return file.read()

def create_processing_graph():
    """创建书籍处理工作流图"""
    # 创建状态图
    workflow = {}
    workflow["state"] = {"book_id": "", "metadata": {}, "text_content": ""}
    
    # 定义处理流程
    async def process_workflow(state):
        # 1. 分割文本
        state = await split_text_into_chunks(state)
        
        # 2. 并行处理三个任务
        summary_task = generate_book_summary(state)
        author_task = get_author_information(state)
        recommend_task = recommend_further_reading(state)
        
        # 等待所有任务完成
        results = await asyncio.gather(summary_task, author_task, recommend_task)
        
        # 3. 合并结果
        summary_state = results[0]
        author_state = results[1]
        recommend_state = results[2]
        
        final_state = {
            **state,
            "summary": summary_state["summary"],
            "author_info": author_state["author_info"],
            "recommendations": recommend_state["recommendations"]
        }
        
        # 4. 返回最终结果
        return final_state
    
    # 返回处理函数
    return process_workflow

async def split_text_into_chunks(state):
    """将文本分割成适合模型处理的小块"""
    text_content = state["text_content"]
    
    # 使用LangChain的文本分割器
    docs = text_splitter.create_documents([text_content])
    
    # 更新状态
    return {
        **state,
        "text_chunks": docs
    }

async def generate_book_summary(state):
    """生成书籍摘要"""
    text_chunks = state["text_chunks"]
    metadata = state["metadata"]
    
    # 准备提示模板
    summary_prompt = PromptTemplate.from_template(
        """你是一位专业的文学分析专家。请基于以下书籍内容，提供一份全面的书籍摘要。
        
        书籍标题: {title}
        作者: {author}
        
        书籍内容片段:
        {text_content}
        
        请提供以下内容:
        1. 主要观点（列出5-10个要点）
        2. 关键概念及其解释（列出3-5个）
        3. 总体结论（200-300字）
        
        以JSON格式返回，包含以下字段：main_points（数组）, key_concepts（对象数组，每个对象包含name和description）, conclusion（字符串）
        """
    )
    
    # 合并文本块以获取代表性内容
    combined_text = "\n\n".join([chunk.page_content for chunk in text_chunks[:5]])
    
    # 调用DeepSeek模型
    response = await deepseek_client.generate(
        prompt=summary_prompt.format(
            title=metadata.title,
            author=metadata.author,
            text_content=combined_text
        ),
        max_tokens=2000
    )
    
    # 解析响应（假设返回的是JSON格式）
    summary_data = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    
    # 创建BookSummary对象
    try:
        import json
        summary_json = json.loads(summary_data)
        summary = BookSummary(
            main_points=summary_json.get("main_points", []),
            key_concepts=summary_json.get("key_concepts", []),
            conclusion=summary_json.get("conclusion", "")
        )
    except Exception as e:
        print(f"解析摘要数据时出错: {str(e)}")
        # 创建一个默认的摘要对象
        summary = BookSummary(
            main_points=["无法解析主要观点"],
            key_concepts=[{"name": "错误", "description": "解析摘要数据时出错"}],
            conclusion="无法生成结论"
        )
    
    # 更新状态
    return {
        **state,
        "summary": summary
    }

async def get_author_information(state):
    """获取作者信息"""
    metadata = state["metadata"]
    
    # 准备提示模板
    author_prompt = PromptTemplate.from_template(
        """你是一位文学研究专家。请提供以下作者的详细信息。
        
        作者名称: {author}
        
        请提供以下内容:
        1. 作者背景（教育、职业经历等）
        2. 写作风格特点
        3. 代表作品（列出3-5部）
        4. 在文学界的影响力
        
        以JSON格式返回，包含以下字段：background（字符串）, writing_style（字符串）, notable_works（字符串数组）, influence（字符串）
        """
    )
    
    # 调用DeepSeek模型
    response = await deepseek_client.generate(
        prompt=author_prompt.format(author=metadata.author),
        max_tokens=1000
    )
    
    # 解析响应
    author_data = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    
    # 创建AuthorInfo对象
    try:
        import json
        author_json = json.loads(author_data)
        author_info = AuthorInfo(
            name=metadata.author,
            background=author_json.get("background", "未知"),
            writing_style=author_json.get("writing_style", "未知"),
            notable_works=author_json.get("notable_works", ["未知"]),
            influence=author_json.get("influence", "未知")
        )
    except Exception as e:
        print(f"解析作者数据时出错: {str(e)}")
        # 创建一个默认的作者信息对象
        author_info = AuthorInfo(
            name=metadata.author,
            background="无法获取作者背景信息",
            writing_style="未知",
            notable_works=["未知"],
            influence="未知"
        )
    
    # 更新状态
    return {
        **state,
        "author_info": author_info
    }

async def recommend_further_reading(state):
    """推荐相关阅读"""
    text_chunks = state["text_chunks"]
    metadata = state["metadata"]
    
    # 准备提示模板
    recommendation_prompt = PromptTemplate.from_template(
        """你是一位专业的图书推荐专家。基于以下书籍的内容和主题，推荐5本相关的书籍。
        
        书籍标题: {title}
        作者: {author}
        
        书籍内容片段:
        {text_content}
        
        请提供5本推荐书籍，每本包含以下信息:
        1. 书名
        2. 作者
        3. 推荐理由（为什么与原书相关或互补）
        4. 相似度评分（0.0到1.0之间的数字，表示与原书的相关程度）
        
        以JSON格式返回，包含一个recommendations数组，每个元素包含title, author, reason, similarity字段
        """
    )
    
    # 合并文本块以获取代表性内容
    combined_text = "\n\n".join([chunk.page_content for chunk in text_chunks[:3]])
    
    # 调用DeepSeek模型
    response = await deepseek_client.generate(
        prompt=recommendation_prompt.format(
            title=metadata.title,
            author=metadata.author,
            text_content=combined_text
        ),
        max_tokens=1500
    )
    
    # 解析响应
    recommendation_data = response.get("choices", [{}])[0].get("message", {}).get("content", "{}")
    
    # 创建ReadingRecommendation对象列表
    try:
        import json
        recommendation_json = json.loads(recommendation_data)
        recommendations = [
            ReadingRecommendation(
                title=item.get("title", "未知书名"),
                author=item.get("author", "未知作者"),
                reason=item.get("reason", "未提供推荐理由"),
                similarity=float(item.get("similarity", 0.5))
            )
            for item in recommendation_json.get("recommendations", [])
        ]
    except Exception as e:
        print(f"解析推荐数据时出错: {str(e)}")
        # 创建一个默认的推荐列表
        recommendations = [
            ReadingRecommendation(
                title="无法获取推荐",
                author="未知",
                reason="解析推荐数据时出错",
                similarity=0.0
            )
        ]
    
    # 更新状态
    return {
        **state,
        "recommendations": recommendations
    }

async def combine_analysis_results(state):
    """合并所有分析结果"""
    # 所有必要的结果都已经在状态中，直接返回
    return state