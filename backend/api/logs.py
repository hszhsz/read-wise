from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import json
from pathlib import Path

from utils.logger import get_logger, log_info, log_error

router = APIRouter()
logger = get_logger()

# 前端日志模型
class FrontendLogEntry(BaseModel):
    timestamp: str
    level: int  # 0=DEBUG, 1=INFO, 2=WARN, 3=ERROR
    message: str
    data: Optional[Any] = None
    stack: Optional[str] = None
    url: Optional[str] = None
    userAgent: Optional[str] = None

@router.post("/logs")
async def receive_frontend_log(log_entry: FrontendLogEntry):
    """
    接收前端发送的日志
    """
    try:
        # 将前端日志级别映射到Python日志级别
        level_mapping = {
            0: "DEBUG",
            1: "INFO", 
            2: "WARNING",
            3: "ERROR"
        }
        
        level_name = level_mapping.get(log_entry.level, "INFO")
        
        # 构建日志消息
        log_message = f"[FRONTEND] {log_entry.message}"
        
        # 添加额外信息
        extra_info = {
            "url": log_entry.url,
            "userAgent": log_entry.userAgent,
            "data": log_entry.data,
            "frontend_timestamp": log_entry.timestamp
        }
        
        if log_entry.stack:
            extra_info["stack"] = log_entry.stack
        
        # 根据级别记录日志
        if log_entry.level == 0:  # DEBUG
            logger.debug(f"{log_message} | Extra: {json.dumps(extra_info, ensure_ascii=False)}")
        elif log_entry.level == 1:  # INFO
            logger.info(f"{log_message} | Extra: {json.dumps(extra_info, ensure_ascii=False)}")
        elif log_entry.level == 2:  # WARN
            logger.warning(f"{log_message} | Extra: {json.dumps(extra_info, ensure_ascii=False)}")
        elif log_entry.level == 3:  # ERROR
            logger.error(f"{log_message} | Extra: {json.dumps(extra_info, ensure_ascii=False)}")
        
        # 将前端日志也保存到专门的前端日志文件
        await save_frontend_log(log_entry)
        
        return {"status": "success", "message": "日志已接收"}
        
    except Exception as e:
        log_error(f"处理前端日志时出错: {str(e)}")
        raise HTTPException(status_code=500, detail="处理日志时出错")

async def save_frontend_log(log_entry: FrontendLogEntry):
    """
    将前端日志保存到专门的文件
    """
    try:
        # 获取项目根目录
        backend_dir = Path(__file__).resolve().parent.parent
        root_dir = backend_dir.parent
        frontend_logs_dir = root_dir / "logs" / "frontend"
        
        # 确保目录存在
        frontend_logs_dir.mkdir(parents=True, exist_ok=True)
        
        # 按日期创建日志文件
        today = datetime.now().strftime('%Y-%m-%d')
        log_file = frontend_logs_dir / f"frontend_{today}.log"
        
        # 格式化日志条目
        log_line = {
            "timestamp": datetime.now().isoformat(),
            "frontend_timestamp": log_entry.timestamp,
            "level": log_entry.level,
            "message": log_entry.message,
            "url": log_entry.url,
            "userAgent": log_entry.userAgent,
            "data": log_entry.data,
            "stack": log_entry.stack
        }
        
        # 追加到文件
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(json.dumps(log_line, ensure_ascii=False) + '\n')
            
    except Exception as e:
        log_error(f"保存前端日志到文件时出错: {str(e)}")

@router.get("/logs/frontend")
async def get_frontend_logs(date: Optional[str] = None):
    """
    获取前端日志
    """
    try:
        # 获取项目根目录
        backend_dir = Path(__file__).resolve().parent.parent
        root_dir = backend_dir.parent
        frontend_logs_dir = root_dir / "logs" / "frontend"
        
        # 如果没有指定日期，使用今天
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        log_file = frontend_logs_dir / f"frontend_{date}.log"
        
        if not log_file.exists():
            return {"logs": [], "message": f"没有找到 {date} 的前端日志"}
        
        logs = []
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    log_entry = json.loads(line.strip())
                    logs.append(log_entry)
                except json.JSONDecodeError:
                    continue
        
        return {"logs": logs, "count": len(logs), "date": date}
        
    except Exception as e:
        log_error(f"获取前端日志时出错: {str(e)}")
        raise HTTPException(status_code=500, detail="获取日志时出错")

@router.get("/logs/backend")
async def get_backend_logs(date: Optional[str] = None, log_type: str = "app"):
    """
    获取后端日志
    log_type: app, error, access
    """
    try:
        # 获取项目根目录
        backend_dir = Path(__file__).resolve().parent.parent
        root_dir = backend_dir.parent
        backend_logs_dir = root_dir / "logs" / "backend"
        
        # 如果没有指定日期，使用今天
        if not date:
            date = datetime.now().strftime('%Y-%m-%d')
        
        log_file = backend_logs_dir / f"{log_type}_{date}.log"
        
        if not log_file.exists():
            return {"logs": [], "message": f"没有找到 {date} 的 {log_type} 日志"}
        
        logs = []
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                logs.append(line.strip())
        
        return {"logs": logs, "count": len(logs), "date": date, "type": log_type}
        
    except Exception as e:
        log_error(f"获取后端日志时出错: {str(e)}")
        raise HTTPException(status_code=500, detail="获取日志时出错")