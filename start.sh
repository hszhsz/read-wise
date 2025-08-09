#!/bin/bash

# Readwise 项目启动脚本
# 使用 uv 管理 Python 依赖，npm 管理前端依赖

set -e

echo "🚀 启动 Readwise 项目..."

# 检查 uv 是否安装
if ! command -v uv &> /dev/null; then
    echo "❌ uv 未安装，请先安装 uv: curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 Node.js 和 npm"
    exit 1
fi

echo "📦 安装后端依赖..."
cd backend
# 使用 uv 安装 Python 依赖
uv sync

echo "📦 安装前端依赖..."
cd ../frontend
npm install

echo "🔧 启动服务..."

# 启动后端服务（后台运行）
echo "🐍 启动后端服务 (端口 8000)..."
cd ../backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 启动前端服务（后台运行）
echo "⚛️  启动前端服务 (端口 3000)..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔗 后端API: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获 Ctrl+C 信号，优雅关闭服务
trap 'echo "\n🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 等待进程结束
wait