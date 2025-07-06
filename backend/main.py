import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 导入数据库初始化函数
from models.database import init_db

# 加载环境变量
load_dotenv()

# 检查必要的环境变量
if not os.getenv("DEEPSEEK_API_KEY"):
    print("警告: DEEPSEEK_API_KEY 环境变量未设置")

app = FastAPI(title="Readwise API", description="读书辅助软件API服务")

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

# 注册路由
app.include_router(books_router, prefix="/api")

# 添加启动事件处理器
@app.on_event("startup")
async def startup_event():
    # 初始化数据库
    await init_db()
    print("应用启动完成，数据库已初始化")

@app.get("/")
async def root():
    return {"message": "欢迎使用Readwise API服务"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)