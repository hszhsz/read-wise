#!/bin/bash

# MongoDB 集成测试脚本

echo "🧪 测试 MongoDB 集成..."

# 测试后端API连接
echo "📡 测试后端API连接..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/)
if [ "$response" = "200" ]; then
    echo "✅ 后端API连接正常"
else
    echo "❌ 后端API连接失败 (HTTP $response)"
    exit 1
fi

# 测试书籍列表API
echo "📚 测试书籍列表API..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/books)
if [ "$response" = "200" ]; then
    echo "✅ 书籍列表API正常"
else
    echo "❌ 书籍列表API失败 (HTTP $response)"
    exit 1
fi

# 检查数据库模式
echo "🗄️  检查数据库模式..."
if [ "$USE_MEMORY_DB" = "true" ]; then
    echo "💾 当前使用内存数据库模式"
else
    echo "🐳 当前使用MongoDB模式"
    
    # 如果使用MongoDB，测试容器状态
    if command -v docker &> /dev/null; then
        if docker ps --format "table {{.Names}}" | grep -q "readwise-mongodb"; then
            echo "✅ MongoDB容器运行正常"
            
            # 测试MongoDB连接
            if docker exec readwise-mongodb mongosh --eval "db.adminCommand('ping')" &>/dev/null; then
                echo "✅ MongoDB连接测试成功"
            else
                echo "⚠️  MongoDB连接测试失败"
            fi
        else
            echo "⚠️  MongoDB容器未运行"
        fi
    fi
fi

# 测试前端连接
echo "🌐 测试前端连接..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$response" = "200" ]; then
    echo "✅ 前端连接正常"
else
    echo "❌ 前端连接失败 (HTTP $response)"
fi

echo ""
echo "🎉 测试完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔗 后端API: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"