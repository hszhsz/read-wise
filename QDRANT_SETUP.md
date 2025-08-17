# Qdrant 向量数据库设置指南

## 概述

本项目已集成 Qdrant 向量数据库支持，用于 RAG（检索增强生成）功能。`start.sh` 脚本现在会自动启动 Qdrant 向量数据库。

## 自动启动

运行项目启动脚本时，会自动处理 Qdrant 的启动：

```bash
sh start.sh
```

脚本会自动：
1. 检查 Docker 是否安装和运行
2. 检测是否已有 Qdrant 容器在运行
3. 如果没有，创建新的 Qdrant 容器
4. 验证 Qdrant 服务是否可访问

## Qdrant 容器配置

- **容器名称**: `readwise-qdrant`
- **HTTP 端口**: 6333
- **gRPC 端口**: 6334
- **数据卷**: `readwise-qdrant-data`
- **镜像版本**: `qdrant/qdrant:v1.7.0`

## 访问地址

- **Qdrant API**: http://localhost:6333
- **Qdrant Web UI**: http://localhost:6333/dashboard
- **集合管理**: http://localhost:6333/collections

## 手动管理 Qdrant 容器

### 启动容器
```bash
docker start readwise-qdrant
```

### 停止容器
```bash
docker stop readwise-qdrant
```

### 查看容器状态
```bash
docker ps | grep qdrant
```

### 查看容器日志
```bash
docker logs readwise-qdrant
```

### 删除容器（保留数据）
```bash
docker rm readwise-qdrant
```

### 删除数据卷（谨慎操作）
```bash
docker volume rm readwise-qdrant-data
```

## 环境变量配置

在 `.env` 文件中可以配置 Qdrant 相关参数：

```env
# 向量数据库配置
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_NAME=readwise_documents
```

## 故障排除

### 端口冲突
如果遇到端口 6333 被占用的错误：

1. 检查是否已有 Qdrant 实例在运行：
   ```bash
   docker ps | grep qdrant
   ```

2. 如果有其他服务占用端口：
   ```bash
   lsof -i :6333
   sudo kill -9 <PID>
   ```

### 连接失败
如果 Qdrant 连接失败：

1. 确认容器正在运行：
   ```bash
   docker ps | grep qdrant
   ```

2. 检查容器日志：
   ```bash
   docker logs readwise-qdrant
   ```

3. 测试连接：
   ```bash
   curl http://localhost:6333/collections
   ```

### Docker 相关问题

1. **Docker 未安装**：
   - macOS: 安装 Docker Desktop
   - Linux: 安装 Docker Engine

2. **Docker 守护进程未运行**：
   - macOS: 启动 Docker Desktop
   - Linux: `sudo systemctl start docker`

## RAG 功能说明

Qdrant 向量数据库用于存储文档的向量表示，支持：

- 文档向量化存储
- 语义相似度搜索
- 基于书籍的文档检索
- RAG 聊天功能的上下文检索

## 数据备份

### 备份向量数据
```bash
# 创建数据卷备份
docker run --rm -v readwise-qdrant-data:/data -v $(pwd):/backup alpine tar czf /backup/qdrant-backup.tar.gz -C /data .
```

### 恢复向量数据
```bash
# 恢复数据卷
docker run --rm -v readwise-qdrant-data:/data -v $(pwd):/backup alpine tar xzf /backup/qdrant-backup.tar.gz -C /data
```

## 性能优化

对于生产环境，可以考虑：

1. **调整内存限制**：
   ```bash
   docker run -d --memory="2g" --name readwise-qdrant ...
   ```

2. **使用 SSD 存储**：确保数据卷位于 SSD 上以提高性能

3. **监控资源使用**：定期检查 CPU 和内存使用情况

## 更多信息

- [Qdrant 官方文档](https://qdrant.tech/documentation/)
- [Qdrant Docker 镜像](https://hub.docker.com/r/qdrant/qdrant)
- [RAG 系统设计文档](./RAG_SYSTEM_DESIGN.md)