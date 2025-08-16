# 环境变量配置指南

本项目使用环境变量来管理配置，支持开发和生产环境的不同配置需求。

## 配置文件说明

### 1. 根目录 `.env` 文件

项目根目录的 `.env` 文件包含后端服务的配置：

```bash
# DeepSeek API密钥
DEEPSEEK_API_KEY=your_api_key_here

# MongoDB配置
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=readwise

# 服务器配置
PORT=8000
HOST=0.0.0.0
DEBUG=True

# 文件上传配置
MAX_UPLOAD_SIZE=52428800  # 50MB in bytes
UPLOAD_DIR=uploads
```

### 2. 前端 `.env.local` 文件

前端目录的 `.env.local` 文件包含前端应用的配置：

```bash
# 前端环境变量配置
# Next.js 环境变量必须以 NEXT_PUBLIC_ 开头才能在客户端使用

# API 服务器配置
NEXT_PUBLIC_API_HOST=localhost
NEXT_PUBLIC_API_PORT=8000
# NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 日志配置
LOG_LEVEL=info
ENABLE_LOGGING=true

# 开发环境配置
NODE_ENV=development
```

## 配置步骤

### 1. 后端配置

1. 复制 `.env.example` 文件为 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件，设置你的配置值：
   - `DEEPSEEK_API_KEY`: 设置你的 DeepSeek API 密钥
   - `MONGO_URL`: MongoDB 连接地址（默认本地）
   - `PORT`: 后端服务端口（默认 8000）
   - 其他配置根据需要调整

### 2. 前端配置

前端的 `.env.local` 文件已经创建，包含默认配置。如需修改：

1. 编辑 `frontend/.env.local` 文件
2. 修改 API 服务器地址（如果后端不在默认端口）
3. 调整日志级别等其他配置

## 环境变量优先级

### 后端（Python）
1. 系统环境变量
2. 项目根目录 `.env` 文件
3. 后端目录 `.env` 文件（如果存在）
4. 代码中的默认值

### 前端（Next.js）
1. 系统环境变量
2. `.env.local` 文件
3. `.env.development` 文件（开发环境）
4. `.env.production` 文件（生产环境）
5. `.env` 文件
6. 代码中的默认值

## 生产环境部署

### 后端
- 设置 `DEBUG=False`
- 配置正确的 `MONGO_URL`
- 设置安全的 `DEEPSEEK_API_KEY`
- 根据需要调整 `HOST` 和 `PORT`

### 前端
- 设置 `NODE_ENV=production`
- 配置正确的 `NEXT_PUBLIC_API_URL`
- 关闭开发环境日志

## 安全注意事项

1. **永远不要提交包含敏感信息的 `.env` 文件到版本控制**
2. `.env` 文件已在 `.gitignore` 中被忽略
3. 生产环境中使用环境变量或安全的配置管理服务
4. 定期轮换 API 密钥

## 故障排除

### 后端无法启动
- 检查 `.env` 文件是否存在
- 验证 MongoDB 连接
- 确认端口未被占用

### 前端无法连接后端
- 检查 `NEXT_PUBLIC_API_HOST` 和 `NEXT_PUBLIC_API_PORT` 配置
- 确认后端服务正在运行
- 查看浏览器控制台的网络请求

### 环境变量未生效
- 重启开发服务器
- 检查变量名拼写
- 确认 Next.js 变量以 `NEXT_PUBLIC_` 开头（客户端使用）