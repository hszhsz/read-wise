import uuid
import asyncio
from typing import Dict, Any, List, Optional, Literal
from datetime import datetime
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from services.openai_client import OpenAIClient
from agents.state import AgentState, BookInfo, ChatMessage, AnalysisResult, ExecutionStep
from agents.planner import PlannerAgent
from agents.executor import ExecutorAgent
from utils.file_utils import extract_text_from_file
from utils.logger import get_logger

logger = get_logger("agent_workflow")

class BookAnalysisWorkflow:
    """书籍分析工作流 - 基于LangGraph的plan-and-execute智能体"""
    
    def __init__(self, openai_client: OpenAIClient):
        self.client = openai_client
        self.planner = PlannerAgent(openai_client)
        self.executor = ExecutorAgent(openai_client)
        
        # 构建工作流图
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """构建LangGraph工作流"""
        workflow = StateGraph(AgentState)
        
        # 添加节点
        workflow.add_node("start", self.start_analysis)
        workflow.add_node("load_book", self.load_book_content)
        workflow.add_node("plan", self.planner.create_plan)
        workflow.add_node("execute", self.executor.execute_next_task)
        workflow.add_node("check_completion", self.check_completion)
        workflow.add_node("finalize", self.finalize_analysis)
        workflow.add_node("handle_error", self.handle_error)
        
        # 设置入口点
        workflow.set_entry_point("start")
        
        # 添加边
        workflow.add_edge("start", "load_book")
        workflow.add_edge("load_book", "plan")
        workflow.add_edge("plan", "execute")
        
        # 条件边：检查是否完成
        workflow.add_conditional_edges(
            "execute",
            self.should_continue,
            {
                "continue": "execute",
                "complete": "check_completion",
                "error": "handle_error"
            }
        )
        
        workflow.add_edge("check_completion", "finalize")
        workflow.add_edge("finalize", END)
        workflow.add_edge("handle_error", "finalize")
        
        return workflow.compile()
    
    async def start_analysis(self, state: AgentState) -> AgentState:
        """开始分析流程"""
        session_id = state.get("session_id", str(uuid.uuid4()))
        
        logger.info(f"开始书籍分析流程，会话ID: {session_id}")
        logger.info(f"用户输入: {state.get('user_input', 'none')}")
        
        # 初始化状态
        welcome_message = AIMessage(
            content="📚 欢迎使用智能书籍分析助手！我将为您深度分析这本书籍，包括内容总结、作者背景调查和相关推荐。让我们开始吧！"
        )
        
        return {
            **state,
            "session_id": session_id,
            "current_step": "starting",
            "is_complete": False,
            "results": {},
            "execution_steps": [],
            "errors": [],
            "messages": state.get("messages", []) + [welcome_message]
        }
    
    async def load_book_content(self, state: AgentState) -> AgentState:
        """加载书籍内容"""
        logger.info("开始加载书籍内容")
        
        try:
            step = ExecutionStep(
                step_id=str(uuid.uuid4()),
                step_name="load_book_content",
                agent_name="workflow",
                input_data={"book_info": state.get("book_info", {})},
                status="running"
            )
            
            book_info = state.get("book_info")
            if not book_info:
                logger.error("未提供书籍信息")
                raise ValueError("未提供书籍信息")
            
            logger.info(f"书籍信息 - 标题: {book_info.title}, 作者: {book_info.author}")
            logger.info(f"文件路径: {book_info.file_path}")
            
            # 如果内容为空，尝试从文件加载
            if not book_info.content and book_info.file_path:
                logger.info("从文件加载书籍内容...")
                content = extract_text_from_file(book_info.file_path)
                book_info.content = content
                logger.info(f"成功加载内容，长度: {len(content)} 字符")
            
            step.output_data = {"content_length": len(book_info.content)}
            step.status = "completed"
            step.end_time = datetime.now()
            step.duration = (step.end_time - step.start_time).total_seconds()
            
            loading_message = AIMessage(
                content=f"📖 已成功加载书籍《{book_info.title}》，内容长度：{len(book_info.content)} 字符。正在制定分析计划..."
            )
            
            return {
                **state,
                "book_info": book_info,
                "current_step": "book_loaded",
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [loading_message]
            }
            
        except Exception as e:
            logger.error(f"加载书籍内容失败: {str(e)}", exc_info=True)
            
            step.status = "failed"
            step.error = str(e)
            step.end_time = datetime.now()
            step.duration = (step.end_time - step.start_time).total_seconds()
            
            logger.warning(f"内容加载失败，耗时: {step.duration:.2f}秒")
            
            error_message = AIMessage(
                content=f"❌ 加载书籍内容时出现错误：{str(e)}"
            )
            
            return {
                **state,
                "current_step": "load_failed",
                "errors": state["errors"] + [str(e)],
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [error_message]
            }
    
    def should_continue(self, state: AgentState) -> Literal["continue", "complete", "error"]:
        """判断是否继续执行"""
        # 检查是否有错误
        if state.get("current_step", "").endswith("_failed"):
            return "error"
        
        # 检查是否所有任务都已完成
        plan = state.get("plan", [])
        if not plan:
            return "complete"
        
        completed_tasks = [task for task in plan if task.status == "completed"]
        failed_tasks = [task for task in plan if task.status == "failed"]
        
        # 如果所有任务都完成或失败，则结束
        if len(completed_tasks) + len(failed_tasks) == len(plan):
            return "complete"
        
        return "continue"
    
    async def check_completion(self, state: AgentState) -> AgentState:
        """检查完成状态"""
        plan = state.get("plan", [])
        completed_tasks = [task for task in plan if task.status == "completed"]
        failed_tasks = [task for task in plan if task.status == "failed"]
        
        completion_message = AIMessage(
            content=f"✅ 分析完成！成功执行了 {len(completed_tasks)} 个任务" + 
                   (f"，{len(failed_tasks)} 个任务失败" if failed_tasks else "") + 
                   "。正在整理最终结果..."
        )
        
        return {
            **state,
            "current_step": "completion_checked",
            "messages": state["messages"] + [completion_message]
        }
    
    async def finalize_analysis(self, state: AgentState) -> AgentState:
        """完成分析并生成最终结果"""
        logger.info("开始最终化分析结果")
        
        try:
            # 计算总执行时间
            execution_steps = state.get("execution_steps", [])
            total_duration = sum(step.duration or 0 for step in execution_steps)
            
            logger.info(f"分析完成 - 总步骤数: {len(execution_steps)}, 总耗时: {total_duration:.2f}秒")
            
            # 构建分析结果
            analysis_result = AnalysisResult(
                book_summary=state["results"].get("summary"),
                author_info=state["results"].get("author_research"),
                recommendations=state["results"].get("recommendation"),
                execution_log=execution_steps,
                total_duration=total_duration,
                status="completed" if not state.get("errors") else "completed_with_errors"
            )
            
            logger.info(f"分析状态: {analysis_result.status}")
            
            # 生成最终消息
            final_message = self._generate_final_message(state, analysis_result)
            
            logger.info("分析结果最终化完成")
            
            return {
                **state,
                "current_step": "finalized",
                "is_complete": True,
                "results": {
                    **state["results"],
                    "analysis_result": analysis_result.dict()
                },
                "messages": state["messages"] + [AIMessage(content=final_message)]
            }
            
        except Exception as e:
            error_message = AIMessage(
                content=f"❌ 完成分析时出现错误：{str(e)}"
            )
            
            return {
                **state,
                "current_step": "finalize_failed",
                "errors": state["errors"] + [str(e)],
                "messages": state["messages"] + [error_message]
            }
    
    async def handle_error(self, state: AgentState) -> AgentState:
        """处理错误"""
        errors = state.get("errors", [])
        latest_error = errors[-1] if errors else "未知错误"
        
        logger.error(f"工作流错误处理 - 最新错误: {latest_error}")
        logger.error(f"总错误数: {len(errors)}")
        
        error_message = AIMessage(
            content=f"⚠️ 分析过程中遇到问题：{latest_error}\n\n我会尽力完成其他可执行的任务。"
        )
        
        logger.info("错误处理完成，继续执行其他任务")
        
        return {
            **state,
            "current_step": "error_handled",
            "messages": state["messages"] + [error_message]
        }
    
    def _generate_final_message(self, state: AgentState, analysis_result: AnalysisResult) -> str:
        """生成最终完成消息"""
        book_info = state.get("book_info")
        book_title = book_info.title if book_info else "未知书籍"
        
        message_parts = [
            f"🎉 《{book_title}》的智能分析已完成！",
            "",
            "📊 分析结果概览："
        ]
        
        # 添加各项分析结果的概述
        if analysis_result.book_summary:
            message_parts.append("✅ 书籍内容总结 - 已完成")
        
        if analysis_result.author_info:
            message_parts.append("✅ 作者背景调查 - 已完成")
        
        if analysis_result.recommendations:
            rec_count = len(analysis_result.recommendations.get("data", {}).get("recommendations", []))
            message_parts.append(f"✅ 相关书籍推荐 - 已完成（{rec_count}本推荐）")
        
        message_parts.extend([
            "",
            f"⏱️ 总执行时间：{analysis_result.total_duration:.2f} 秒",
            "",
            "💡 您可以：",
            "• 查看详细的分析结果",
            "• 询问关于书籍内容的问题",
            "• 获取更多相关推荐",
            "• 开始分析新的书籍"
        ])
        
        return "\n".join(message_parts)
    
    async def run_analysis(self, book_info: BookInfo, user_input: str = "") -> Dict[str, Any]:
        """运行完整的书籍分析流程"""
        session_id = str(uuid.uuid4())
        logger.info(f"开始运行书籍分析流程 - 会话ID: {session_id}")
        logger.info(f"书籍: 《{book_info.title}》 作者: {book_info.author}")
        logger.info(f"用户输入: {user_input or '默认分析请求'}")
        
        # 初始化状态
        initial_state = AgentState(
            messages=[HumanMessage(content=user_input or f"请分析书籍《{book_info.title}》")],
            book_info=book_info,
            plan=[],
            current_task=None,
            results={},
            execution_steps=[],
            errors=[],
            session_id=session_id,
            user_input=user_input or f"请分析书籍《{book_info.title}》",
            needs_human_input=False,
            current_step="initialized",
            is_complete=False
        )
        
        logger.info("初始状态创建完成，开始执行工作流")
        
        # 运行工作流
        final_state = await self.workflow.ainvoke(initial_state)
        
        logger.info(f"工作流执行完成 - 最终状态: {final_state.get('current_step', 'unknown')}")
        logger.info(f"是否完成: {final_state.get('is_complete', False)}")
        logger.info(f"错误数量: {len(final_state.get('errors', []))}")
        
        return final_state
    
    async def continue_conversation(self, state: AgentState, user_message: str) -> AgentState:
        """继续对话"""
        # 添加用户消息
        user_msg = HumanMessage(content=user_message)
        updated_messages = state["messages"] + [user_msg]
        
        # 生成回复
        response = await self._generate_conversational_response(state, user_message)
        ai_msg = AIMessage(content=response)
        
        return {
            **state,
            "messages": updated_messages + [ai_msg],
            "user_input": user_message
        }
    
    async def _generate_conversational_response(self, state: AgentState, user_message: str) -> str:
        """生成对话回复"""
        try:
            # 构建上下文
            context = self._build_conversation_context(state)
            
            prompt = f"""基于以下书籍分析结果，回答用户的问题：

{context}

用户问题：{user_message}

请提供有帮助的、准确的回答。如果问题超出了分析范围，请礼貌地说明。"""
            
            response = await self.client.generate(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.7
            )
            
            return response["choices"][0]["message"]["content"]
            
        except Exception as e:
            return f"抱歉，回答您的问题时出现了错误：{str(e)}"
    
    def _build_conversation_context(self, state: AgentState) -> str:
        """构建对话上下文"""
        context_parts = []
        
        # 书籍基本信息
        if state.get("book_info"):
            book_info = state["book_info"]
            context_parts.append(f"书籍：《{book_info.title}》，作者：{book_info.author}")
        
        # 分析结果
        results = state.get("results", {})
        
        if "summary" in results:
            summary_data = results["summary"].get("data", {})
            if "main_points" in summary_data:
                context_parts.append(f"主要观点：{'; '.join(summary_data['main_points'])}")
        
        if "author_research" in results:
            author_data = results["author_research"].get("data", {})
            if "background" in author_data:
                context_parts.append(f"作者背景：{author_data['background']}")
        
        if "recommendation" in results:
            rec_data = results["recommendation"].get("data", {})
            if "recommendations" in rec_data:
                rec_titles = [rec.get("title", "") for rec in rec_data["recommendations"]]
                context_parts.append(f"推荐书籍：{'; '.join(rec_titles)}")
        
        return "\n\n".join(context_parts) if context_parts else "暂无分析结果"


class BookAnalysisAgent:
    """书籍分析智能体 - BookAnalysisWorkflow的包装器，提供简化的接口"""
    
    def __init__(self):
        from services.openai_client import OpenAIClient
        self.client = OpenAIClient()
        self.workflow = BookAnalysisWorkflow(self.client)
        self.state = AgentState(
            messages=[],
            book_info=None,
            plan=[],
            current_task=None,
            results={},
            execution_steps=[],
            errors=[],
            session_id=str(uuid.uuid4()),
            user_input="",
            needs_human_input=False,
            current_step="initialized",
            is_complete=False
        )
    
    async def handle_user_message(self, message: str) -> Dict[str, Any]:
        """处理用户消息"""
        # 更新状态
        self.state["user_input"] = message
        
        # 如果有书籍信息，继续对话
        if self.state.get("book_info"):
            updated_state = await self.workflow.continue_conversation(self.state, message)
            self.state.update(updated_state)
            
            # 获取最新的AI消息
            ai_messages = [msg for msg in self.state["messages"] if hasattr(msg, 'content')]
            latest_message = ai_messages[-1].content if ai_messages else "我正在处理您的请求..."
            
            return {
                "message": latest_message,
                "state": self.get_state_dict(),
                "is_processing": not self.state.get("is_complete", False)
            }
        else:
            return {
                "message": "请先上传一本书籍进行分析，然后我们可以开始对话。",
                "state": self.get_state_dict(),
                "is_processing": False
            }
    
    async def start_book_analysis(self, book_info: BookInfo) -> Dict[str, Any]:
        """开始书籍分析"""
        self.state["book_info"] = book_info
        result = await self.workflow.run_analysis(book_info, "请分析这本书籍")
        self.state.update(result)
        
        # 获取分析完成消息
        ai_messages = [msg for msg in self.state["messages"] if hasattr(msg, 'content')]
        latest_message = ai_messages[-1].content if ai_messages else "书籍分析已开始..."
        
        return {
            "message": latest_message,
            "state": self.get_state_dict(),
            "is_processing": not self.state.get("is_complete", False)
        }
    
    def get_state_dict(self) -> Dict[str, Any]:
        """获取状态字典"""
        return {
            "session_id": self.state.get("session_id"),
            "current_step": self.state.get("current_step"),
            "is_complete": self.state.get("is_complete", False),
            "book_info": self.state.get("book_info").dict() if self.state.get("book_info") else None,
            "results": self.state.get("results", {}),
            "errors": self.state.get("errors", [])
        }


# 独立函数供API调用
async def run_analysis(book_content: str, user_input: str = "") -> Dict[str, Any]:
    """运行书籍分析的独立函数"""
    logger.info(f"开始分析书籍内容，内容长度: {len(book_content)} 字符")
    logger.info(f"用户输入: {user_input}")
    
    try:
        # 创建OpenAI客户端
        client = OpenAIClient()
        
        # 创建工作流实例
        workflow = BookAnalysisWorkflow(client)
        
        # 创建书籍信息
        book_info = BookInfo(
            id=str(uuid.uuid4()),
            title="上传的书籍",
            author="未知作者",
            content=book_content
        )
        
        # 运行分析
        result = await workflow.run_analysis(book_info, user_input)
        logger.info(f"分析完成，结果: {result}")
        
        return result
        
    except Exception as e:
        logger.error(f"分析过程中发生错误: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "final_output": {
                "summary": "分析失败",
                "key_points": []
            }
        }