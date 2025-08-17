#!/bin/bash

# Readwise 项目启动脚本
# 使用 uv 管理 Python 依赖，npm 管理前端依赖

set -e

echo "🚀 启动 Readwise 项目..."

# 启动向量数据库 Qdrant
echo "🔍 启动 Qdrant 向量数据库..."
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker 未安装，无法启动 Qdrant 向量数据库"
    echo "💡 RAG 功能需要 Qdrant 支持，请安装 Docker 后重新运行"
else
    # 检查 Docker 守护进程是否运行
    if ! docker info &>/dev/null; then
        echo "⚠️  Docker 守护进程未运行，无法启动 Qdrant"
        echo "💡 请启动 Docker Desktop 或运行 'sudo systemctl start docker' 后重新运行"
    else
        # 检查是否有 Qdrant 容器在运行
        if docker ps --format "table {{.Names}}" | grep -q "qdrant"; then
            echo "✅ 检测到 Qdrant 容器已在运行"
        elif docker ps -a --format "table {{.Names}}" | grep -q "readwise-qdrant"; then
            echo "📦 Qdrant 容器已存在，检查状态..."
            echo "🔄 启动现有的 Qdrant 容器..."
            docker start readwise-qdrant
        else
            echo "🆕 创建新的 Qdrant 容器..."
            docker run -d \
              --name readwise-qdrant \
              -p 6333:6333 \
              -p 6334:6334 \
              -v readwise-qdrant-data:/qdrant/storage \
              --restart unless-stopped \
              qdrant/qdrant:v1.7.0
        fi
        
        # 等待 Qdrant 启动
        echo "⏳ 等待 Qdrant 启动..."
        sleep 3
        
        # 验证 Qdrant 是否可访问
        echo "🔍 验证 Qdrant 连接..."
        QDRANT_READY=false
        for i in {1..10}; do
            if curl -s http://localhost:6333/collections &>/dev/null; then
                echo "✅ Qdrant 连接成功"
                QDRANT_READY=true
                break
            elif [ $i -eq 10 ]; then
                echo "⚠️  Qdrant 连接失败，RAG 功能可能无法正常工作"
                break
            else
                echo "⏳ 等待 Qdrant 响应... ($i/10)"
                sleep 2
            fi
        done
        
        if [ "$QDRANT_READY" = true ]; then
            echo "🎯 Qdrant 向量数据库已就绪"
        fi
    fi
fi

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker 未安装，将使用内存数据库模式"
    echo "💡 如需持久化数据，请安装 Docker 并重新运行"
    export USE_MEMORY_DB=true
else
    # 检查 Docker 守护进程是否运行
    if ! docker info &>/dev/null; then
        echo "⚠️  Docker 守护进程未运行，将使用内存数据库模式"
        echo "💡 请启动 Docker Desktop 或运行 'sudo systemctl start docker' 后重新运行以使用 MongoDB"
        export USE_MEMORY_DB=true
    else
        echo "🗄️  启动 MongoDB 数据库..."
        
        # 检查容器是否已经存在
        if docker ps -a --format "table {{.Names}}" | grep -q "readwise-mongodb"; then
            echo "📦 MongoDB 容器已存在，检查状态..."
            if ! docker ps --format "table {{.Names}}" | grep -q "readwise-mongodb"; then
                echo "🔄 启动现有的 MongoDB 容器..."
                docker start readwise-mongodb
            else
                echo "✅ MongoDB 容器已在运行"
            fi
        else
            echo "🆕 创建新的 MongoDB 容器..."
            docker run -d \
              --name readwise-mongodb \
              -p 27017:27017 \
              -v readwise-mongodb-data:/data/db \
              --restart unless-stopped \
              mongo:7.0 --noauth
        fi
        
        # 等待 MongoDB 启动
        echo "⏳ 等待 MongoDB 启动..."
        sleep 5
        
        # 验证 MongoDB 是否可访问
        echo "🔍 验证 MongoDB 连接..."
        MONGODB_READY=false
        for i in {1..10}; do
            if docker exec readwise-mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
                echo "✅ MongoDB 连接成功"
                MONGODB_READY=true
                break
            elif [ $i -eq 10 ]; then
                echo "⚠️  MongoDB 连接失败，切换到内存数据库模式"
                export USE_MEMORY_DB=true
                break
            else
                echo "⏳ 等待 MongoDB 响应... ($i/10)"
                sleep 2
            fi
        done
        
        if [ "$MONGODB_READY" = true ]; then
            echo "🎯 使用 MongoDB 数据库"
        fi
    fi
fi

if [ "$USE_MEMORY_DB" = true ]; then
    echo "💾 使用内存数据库模式（数据不会持久化）"
fi

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
npm run dev &
FRONTEND_PID=$!

echo "✅ 服务启动完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔗 后端API: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 捕获 Ctrl+C 信号，优雅关闭服务
trap 'echo "\n🛑 正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker stop readwise-mongodb readwise-qdrant 2>/dev/null; exit 0' INT

# 等待进程结束
wait