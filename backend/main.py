import os
import time
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware

# 导入数据库初始化函数
from models.database import init_db
# 导入日志配置
from utils.logger import setup_logger, log_info, log_error, log_access
# 导入环境变量加载
from utils.env import get_env

# 设置日志
logger = setup_logger()

# 检查必要的环境变量
if not get_env("OPENAI_API_KEY"):
    log_error("OPENAI_API_KEY 环境变量未设置", exc_info=False)

app = FastAPI(title="Readwise API", description="读书辅助软件API服务")

# 添加请求日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 记录请求开始
    logger.info(f"请求开始: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # 计算处理时间
    process_time = time.time() - start_time
    
    # 记录访问日志
    log_access(
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        response_time=process_time
    )
    
    # 记录请求完成
    logger.info(f"请求完成: {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    return response

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 导入路由
from api.books import router as books_router
from api.chat import router as chat_router
from api.logs import router as logs_router

# 注册路由
app.include_router(books_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(logs_router, prefix="/api")

# 添加启动事件处理器
@app.on_event("startup")
async def startup_event():
    # 初始化数据库
    await init_db()
    log_info("应用启动完成，数据库已初始化")

# 添加关闭事件处理器
@app.on_event("shutdown")
async def shutdown_event():
    log_info("应用正在关闭...")

@app.get("/")
async def root():
    return {"message": "欢迎使用Readwise API服务"}

if __name__ == "__main__":
    log_info("启动Readwise API服务器...")
    host = get_env("HOST", "0.0.0.0")
    port = int(get_env("PORT", "8000"))
    debug = get_env("DEBUG", "True").lower() == "true"
    
    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=debug,
        log_config=None  # 使用我们自定义的日志配置
    )