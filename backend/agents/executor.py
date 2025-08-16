import uuid
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime
from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from services.openai_client import OpenAIClient
from agents.state import AgentState, BookAnalysisTask, ExecutionStep, ChatMessage
from agents.tools import BookSummaryTool, AuthorResearchTool, RecommendationTool

class TaskResult(BaseModel):
    """任务执行结果"""
    success: bool = Field(description="是否成功")
    data: Dict[str, Any] = Field(description="结果数据")
    reasoning: str = Field(description="执行过程说明")
    confidence: float = Field(description="结果置信度 (0-1)", ge=0, le=1)

class ExecutorAgent:
    """执行器智能体 - 负责执行具体的分析任务"""
    
    def __init__(self, openai_client: OpenAIClient):
        self.client = openai_client
        self.parser = JsonOutputParser(pydantic_object=TaskResult)
        
        # 初始化工具
        self.tools = {
            "summary": BookSummaryTool(openai_client),
            "author_research": AuthorResearchTool(openai_client),
            "recommendation": RecommendationTool(openai_client)
        }
    
    async def execute_next_task(self, state: AgentState) -> AgentState:
        """执行下一个待处理的任务"""
        # 找到下一个待执行的任务
        next_task = self._get_next_task(state["plan"])
        
        if not next_task:
            # 所有任务已完成
            return {
                **state,
                "current_step": "all_tasks_completed",
                "is_complete": True
            }
        
        # 执行任务
        return await self._execute_task(state, next_task)
    
    def _get_next_task(self, plan: List[BookAnalysisTask]) -> Optional[BookAnalysisTask]:
        """获取下一个待执行的任务"""
        for task in plan:
            if task.status == "pending":
                return task
        return None
    
    async def _execute_task(self, state: AgentState, task: BookAnalysisTask) -> AgentState:
        """执行具体任务"""
        try:
            # 记录执行步骤
            step = ExecutionStep(
                step_id=str(uuid.uuid4()),
                step_name=f"execute_{task.task_type}",
                agent_name="executor",
                input_data={
                    "task_id": task.task_id,
                    "task_type": task.task_type,
                    "description": task.description
                },
                status="running"
            )
            
            # 更新任务状态
            task.status = "in_progress"
            
            # 获取对应的工具
            tool = self.tools.get(task.task_type)
            if not tool:
                raise ValueError(f"未找到任务类型 {task.task_type} 对应的工具")
            
            # 执行工具
            result = await tool.execute(state["book_info"], state.get("results", {}))
            
            # 更新任务结果
            task.status = "completed"
            task.result = result
            task.completed_at = datetime.now()
            
            # 更新执行步骤
            step.output_data = result
            step.status = "completed"
            step.end_time = datetime.now()
            step.duration = (step.end_time - step.start_time).total_seconds()
            
            # 更新结果
            updated_results = state.get("results", {})
            updated_results[task.task_type] = result
            
            # 生成用户友好的消息
            message_content = self._generate_task_completion_message(task, result)
            ai_message = AIMessage(content=message_content)
            
            return {
                **state,
                "current_task": task,
                "results": updated_results,
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [ai_message],
                "current_step": f"{task.task_type}_completed"
            }
            
        except Exception as e:
            # 错误处理
            task.status = "failed"
            task.error = str(e)
            
            step.status = "failed"
            step.error = str(e)
            step.end_time = datetime.now()
            
            error_message = AIMessage(
                content=f"执行任务 '{task.description}' 时出现错误：{str(e)}"
            )
            
            return {
                **state,
                "current_task": task,
                "errors": state["errors"] + [str(e)],
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [error_message],
                "current_step": f"{task.task_type}_failed"
            }
    
    def _generate_task_completion_message(self, task: BookAnalysisTask, result: Dict[str, Any]) -> str:
        """生成任务完成的用户友好消息"""
        task_messages = {
            "summary": "📚 书籍总结分析完成！",
            "author_research": "👤 作者背景调查完成！", 
            "recommendation": "📖 相关书籍推荐生成完成！"
        }
        
        base_message = task_messages.get(task.task_type, f"任务 '{task.description}' 完成！")
        
        # 添加简要结果描述
        if task.task_type == "summary" and "main_points" in result:
            points_count = len(result["main_points"])
            base_message += f"\n\n提取了 {points_count} 个主要观点。"
        elif task.task_type == "author_research" and "background" in result:
            base_message += f"\n\n已获取作者详细背景信息。"
        elif task.task_type == "recommendation" and "recommendations" in result:
            rec_count = len(result["recommendations"])
            base_message += f"\n\n为您推荐了 {rec_count} 本相关书籍。"
        
        return base_message
    
    async def check_task_dependencies(self, state: AgentState, task: BookAnalysisTask) -> bool:
        """检查任务依赖是否满足"""
        # 简单的依赖检查逻辑
        if task.task_type == "recommendation":
            # 推荐任务依赖于总结任务
            summary_completed = any(
                t.task_type == "summary" and t.status == "completed" 
                for t in state["plan"]
            )
            return summary_completed
        
        return True  # 其他任务暂无依赖
    
    async def retry_failed_task(self, state: AgentState, task_id: str) -> AgentState:
        """重试失败的任务"""
        # 找到失败的任务
        task_to_retry = None
        for task in state["plan"]:
            if task.task_id == task_id and task.status == "failed":
                task_to_retry = task
                break
        
        if not task_to_retry:
            return state
        
        # 重置任务状态
        task_to_retry.status = "pending"
        task_to_retry.error = None
        
        # 执行任务
        return await self._execute_task(state, task_to_retry)