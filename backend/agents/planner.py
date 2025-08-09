import uuid
from typing import Dict, Any, List
from datetime import datetime
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

from services.deepseek_client import DeepSeekClient
from agents.state import AgentState, BookAnalysisTask, ExecutionStep

class PlanStep(BaseModel):
    """计划步骤"""
    task_type: str = Field(description="任务类型: summary, author_research, recommendation")
    description: str = Field(description="任务描述")
    priority: int = Field(description="优先级 (1-10)")
    dependencies: List[str] = Field(default=[], description="依赖的任务类型")

class AnalysisPlan(BaseModel):
    """分析计划"""
    steps: List[PlanStep] = Field(description="执行步骤列表")
    reasoning: str = Field(description="规划理由")

class PlannerAgent:
    """规划器智能体 - 负责分析用户需求并制定执行计划"""
    
    def __init__(self, deepseek_client: DeepSeekClient):
        self.client = deepseek_client
        self.parser = JsonOutputParser(pydantic_object=AnalysisPlan)
        
        # 规划提示模板
        self.planning_prompt = ChatPromptTemplate.from_messages([
            ("system", self._get_system_prompt()),
            ("human", "用户请求: {user_input}\n\n书籍信息:\n标题: {book_title}\n作者: {book_author}\n\n请制定详细的分析计划。")
        ])
    
    def _get_system_prompt(self) -> str:
        return """你是一个专业的书籍分析规划师。你的任务是根据用户的需求和书籍信息，制定一个详细的分析计划。

可用的分析任务类型：
1. summary - 书籍内容总结和要点提取
2. author_research - 作者背景调查和研究
3. recommendation - 相关书籍推荐

规划原则：
- 根据用户需求确定需要执行的任务
- 考虑任务之间的依赖关系（如推荐通常依赖于总结）
- 设置合理的优先级
- 提供清晰的任务描述

请以JSON格式返回分析计划，包含steps数组和reasoning字段。

{format_instructions}"""
    
    async def create_plan(self, state: AgentState) -> AgentState:
        """创建分析计划"""
        try:
            # 记录执行步骤
            step = ExecutionStep(
                step_id=str(uuid.uuid4()),
                step_name="create_analysis_plan",
                agent_name="planner",
                input_data={
                    "user_input": state["user_input"],
                    "book_title": state["book_info"].title if state["book_info"] else "未知",
                    "book_author": state["book_info"].author if state["book_info"] else "未知"
                },
                status="running"
            )
            
            # 构建提示
            prompt = self.planning_prompt.format_messages(
                user_input=state["user_input"],
                book_title=state["book_info"].title if state["book_info"] else "未知",
                book_author=state["book_info"].author if state["book_info"] else "未知",
                format_instructions=self.parser.get_format_instructions()
            )
            
            # 调用LLM生成计划
            response = await self.client.generate(
                prompt=prompt[0].content,
                system_message=prompt[0].content if len(prompt) > 1 else None,
                max_tokens=1500,
                temperature=0.3
            )
            
            # 解析响应
            plan_data = self.parser.parse(response["choices"][0]["message"]["content"])
            
            # 创建任务列表
            tasks = []
            for i, step in enumerate(plan_data.steps):
                task = BookAnalysisTask(
                    task_id=str(uuid.uuid4()),
                    task_type=step.task_type,
                    description=step.description,
                    status="pending"
                )
                tasks.append(task)
            
            # 更新状态
            step.output_data = {
                "plan": plan_data.dict(),
                "tasks_created": len(tasks)
            }
            step.status = "completed"
            step.end_time = datetime.now()
            step.duration = (step.end_time - step.start_time).total_seconds()
            
            # 添加AI消息
            ai_message = AIMessage(
                content=f"我已经为您制定了分析计划：\n\n{plan_data.reasoning}\n\n将执行以下任务：\n" + 
                        "\n".join([f"{i+1}. {task.description}" for i, task in enumerate(tasks)])
            )
            
            return {
                **state,
                "plan": tasks,
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [ai_message],
                "current_step": "planning_complete"
            }
            
        except Exception as e:
            # 错误处理
            step.status = "failed"
            step.error = str(e)
            step.end_time = datetime.now()
            
            error_message = AIMessage(
                content=f"抱歉，制定分析计划时出现错误：{str(e)}"
            )
            
            return {
                **state,
                "errors": state["errors"] + [str(e)],
                "execution_steps": state["execution_steps"] + [step],
                "messages": state["messages"] + [error_message],
                "current_step": "planning_failed"
            }
    
    async def should_replan(self, state: AgentState) -> bool:
        """判断是否需要重新规划"""
        # 检查是否有失败的任务需要重新规划
        failed_tasks = [task for task in state["plan"] if task.status == "failed"]
        return len(failed_tasks) > 0
    
    async def update_plan(self, state: AgentState) -> AgentState:
        """更新计划（处理失败的任务）"""
        # 重置失败的任务
        updated_plan = []
        for task in state["plan"]:
            if task.status == "failed":
                task.status = "pending"
                task.error = None
            updated_plan.append(task)
        
        return {
            **state,
            "plan": updated_plan,
            "current_step": "plan_updated"
        }