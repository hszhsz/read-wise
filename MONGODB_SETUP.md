# MongoDB 设置指南

## 概述

本项目支持两种数据库模式：
1. **MongoDB 模式**：使用 Docker 运行的 MongoDB 数据库（推荐，数据持久化）
2. **内存数据库模式**：临时存储，重启后数据丢失

## 自动启动 MongoDB

项目的 `start.sh` 脚本已经集成了 MongoDB 的自动启动功能：

```bash
# 直接运行启动脚本
sh start.sh
```

脚本会自动：
1. 检查 Docker 是否安装和运行
2. 如果 Docker 可用，自动启动 MongoDB 容器
3. 如果 Docker 不可用，切换到内存数据库模式

## 手动启动 MongoDB（可选）

如果需要手动管理 MongoDB 容器：

### 启动 MongoDB
```bash
# 创建并启动 MongoDB 容器
docker run -d \
  --name readwise-mongodb \
  -p 27017:27017 \
  -v readwise-mongodb-data:/data/db \
  --restart unless-stopped \
  mongo:latest
```

### 管理 MongoDB 容器
```bash
# 查看容器状态
docker ps -a | grep readwise-mongodb

# 启动已存在的容器
docker start readwise-mongodb

# 停止容器
docker stop readwise-mongodb

# 删除容器（注意：会保留数据卷）
docker rm readwise-mongodb

# 查看日志
docker logs readwise-mongodb
```

### 数据管理
```bash
# 查看数据卷
docker volume ls | grep readwise-mongodb-data

# 备份数据
docker exec readwise-mongodb mongodump --out /data/backup

# 连接到 MongoDB
docker exec -it readwise-mongodb mongosh
```

## 环境变量配置

在项目根目录创建 `.env` 文件：

```env
# MongoDB 配置
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=readwise

# 强制使用内存数据库（可选）
# USE_MEMORY_DB=true

# DeepSeek API 配置
DEEPSEEK_API_KEY=your_api_key_here
```

## 故障排除

### Docker 相关问题

1. **Docker 守护进程未运行**
   ```bash
   # macOS: 启动 Docker Desktop
   # Linux: 启动 Docker 服务
   sudo systemctl start docker
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :27017
   
   # 停止占用端口的进程
   sudo kill -9 <PID>
   ```

3. **容器启动失败**
   ```bash
   # 查看详细错误信息
   docker logs readwise-mongodb
   
   # 删除有问题的容器重新创建
   docker rm readwise-mongodb
   ```

### 数据库连接问题

1. **连接超时**
   - 确保 MongoDB 容器正在运行
   - 检查防火墙设置
   - 验证端口映射是否正确

2. **权限问题**
   ```bash
   # 检查数据卷权限
   docker exec readwise-mongodb ls -la /data/db
   ```

## 数据迁移

### 从内存数据库迁移到 MongoDB

由于内存数据库的数据在重启后会丢失，建议：
1. 在有重要数据时，先导出数据
2. 启动 MongoDB
3. 重新上传和处理书籍

### 数据备份

```bash
# 创建备份
docker exec readwise-mongodb mongodump --db readwise --out /data/backup

# 恢复备份
docker exec readwise-mongodb mongorestore /data/backup
```

## 性能优化

1. **调整 MongoDB 内存使用**
   ```bash
   # 限制容器内存使用
   docker run -d \
     --name readwise-mongodb \
     --memory=1g \
     -p 27017:27017 \
     -v readwise-mongodb-data:/data/db \
     mongo:latest
   ```

2. **监控资源使用**
   ```bash
   # 查看容器资源使用情况
   docker stats readwise-mongodb
   ```

## 注意事项

- MongoDB 数据存储在 Docker 数据卷中，即使删除容器数据也会保留
- 首次启动可能需要较长时间来下载 MongoDB 镜像
- 确保有足够的磁盘空间存储数据
- 定期备份重要数据