# Readwise 项目规则

## 依赖管理

### 后端依赖管理

- **使用 uv 管理 Python 依赖**
- 配置文件：`backend/pyproject.toml`
- 安装依赖：`uv sync`
- 运行命令：`uv run <command>`
- 添加依赖：`uv add <package>`
- 移除依赖：`uv remove <package>`

### 前端依赖管理

- **使用 npm 管理 JavaScript 依赖**
- 配置文件：`frontend/package.json`
- 安装依赖：`npm install`
- 添加依赖：`npm install <package>`
- 移除依赖：`npm uninstall <package>`

## 项目启动

### 快速启动（推荐）

使用项目启动脚本一键启动所有服务：

```bash
./start.sh
```

该脚本会自动：
- 检查并启动 MongoDB Docker 容器
- 安装后端和前端依赖
- 启动后端服务（端口 8000）
- 启动前端服务（端口 3000）

### 手动启动

如果需要分别启动各个服务：

#### 数据库启动

**推荐使用项目启动脚本**：

```bash
# 使用项目启动脚本（推荐）
./start.sh
```

**或手动启动 MongoDB**：

```bash
# 使用 Docker 启动 MongoDB（手动方式）
docker run -d --name readwise-mongodb -p 27017:27017 -v readwise-mongodb-data:/data/db mongo:latest

# 检查容器状态
docker ps

# 停止 MongoDB
docker stop readwise-mongodb

# 重新启动 MongoDB
docker start readwise-mongodb
```

### 快速启动

使用根目录的启动脚本：

```bash
./start.sh
```

该脚本会：
1. 检查 uv 和 npm 是否安装
2. 自动安装后端和前端依赖
3. 启动后端服务（端口 8000）
4. 启动前端服务（端口 3000）
5. 提供优雅的服务停止机制（Ctrl+C）

**注意：启动前端和后端服务前，必须确保 MongoDB 已经启动！**

#### 后端服务

```bash
cd backend
uv sync  # 安装依赖
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 前端服务

```bash
cd frontend
npm install  # 安装依赖
npm start
```

## 服务地址

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000
- **API文档**: http://localhost:8000/docs
- **API交互式文档**: http://localhost:8000/redoc

## 开发规范

### 代码风格

- Python: 使用 Black 格式化，Flake8 检查
- JavaScript: 使用 ESLint 和 Prettier

### 环境变量

- 复制 `.env.example` 为 `.env`
- 配置必要的环境变量（如 DEEPSEEK_API_KEY）

### 项目结构

```
readwise/
├── backend/           # Python FastAPI 后端
│   ├── agents/        # LangGraph 智能代理
│   ├── api/           # API 路由
│   ├── models/        # 数据模型
│   ├── services/      # 业务服务
│   ├── utils/         # 工具函数
│   └── pyproject.toml # Python 依赖配置
├── frontend/          # React 前端
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json   # JavaScript 依赖配置
├── start.sh           # 项目启动脚本
└── project_rules.md   # 项目规则文档
```

## 技术栈

### 后端

- **框架**: FastAPI
- **AI**: LangChain + LangGraph
- **数据库**: MongoDB
- **文件处理**: PyPDF2, python-docx, ebooklib
- **依赖管理**: uv

### 前端

- **框架**: React 18
- **UI库**: Material-UI (MUI)
- **路由**: React Router
- **HTTP客户端**: Axios
- **依赖管理**: npm

## 注意事项

1. **首次运行前**，确保已安装 uv 和 Node.js
2. **环境变量**必须正确配置，特别是 DEEPSEEK_API_KEY
3. **端口冲突**时，可修改启动脚本中的端口配置
4. **生产部署**时，需要修改 CORS 配置和其他安全设置