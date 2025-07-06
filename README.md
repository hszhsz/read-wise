# Readwise 智能读书助手

## 项目概述

Readwise是一款读书辅助软件，借助大语言模型和agent技术，为用户提供电子书智能分析服务。该软件能够上传多种格式的电子书，然后运用DeepSeek大语言模型剖析书籍内容，最终生成包含书籍重点总结、作者背景介绍以及引申阅读推荐等内容的报告。通过直观的用户界面，用户可以轻松管理和查看他们的书籍分析结果。

## 功能特点

- **多格式支持**：支持PDF、EPUB、MOBI、TXT、DOCX等多种电子书格式
- **书籍重点总结**：提取关键论点、核心思想和重要结论
- **作者背景介绍**：生成作者的教育背景、写作风格、代表作品等信息
- **引申阅读推荐**：分析书籍主题和内容，推荐相关领域的其他书籍
- **结果导出**：支持将分析结果导出为Markdown格式
- **书籍管理**：提供书籍列表视图，支持搜索、分页和状态过滤
- **最近查看**：自动记录最近查看的书籍，方便快速访问
- **实时处理状态**：显示书籍上传和处理的实时进度
- **删除功能**：支持删除不再需要的书籍分析

## 技术栈

### 后端

- **语言**：Python
- **框架**：FastAPI
- **大语言模型**：DeepSeek
- **工作流引擎**：LangGraph
- **数据库**：MongoDB
- **文件处理**：PyPDF2, python-docx, ebooklib等

### 前端

- **框架**：React
- **UI库**：Material-UI (MUI)
- **状态管理**：React Hooks + Context API
- **路由**：React Router
- **HTTP客户端**：Axios
- **表单处理**：React Hook Form
- **通知系统**：自定义通知组件
- **组件库**：自定义可复用组件（PageHeader、EmptyState、LoadingState、ConfirmDialog等）

## 安装与运行

### 环境要求

- Python 3.9+
- Node.js 14+
- MongoDB

### 后端设置

1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖：
   ```bash
   pip install -r requirements.txt
   ```

3. 设置环境变量：
   创建`.env`文件，添加以下内容：
   ```
   DEEPSEEK_API_KEY=your_api_key_here
   MONGO_URL=mongodb://localhost:27017
   DATABASE_NAME=readwise
   ```

4. 运行服务器：
   ```bash
   python main.py
   ```
   服务器将在`http://localhost:8000`上运行。

### 前端设置

1. 进入前端目录：
   ```bash
   cd frontend
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 运行开发服务器：
   ```bash
   npm start
   ```
   前端将在`http://localhost:3000`上运行。

## 使用流程

### 上传新书籍

1. **选择文件**：通过拖放或文件选择器选择电子书文件
2. **上传文件**：确认文件后开始上传，可以查看上传进度
3. **处理分析**：系统自动提取文本并进行分析，显示实时处理进度
4. **查看结果**：分析完成后，可以查看书籍摘要、作者背景和阅读推荐

### 管理书籍

1. **浏览书籍**：在书籍列表页面查看所有上传的书籍
2. **搜索过滤**：使用搜索框查找特定书籍
3. **查看详情**：点击书籍卡片进入详情页面
4. **导出报告**：将分析结果导出为Markdown格式
5. **删除书籍**：删除不再需要的书籍分析

## 项目结构

```
readwise/
├── backend/
│   ├── api/                 # API接口
│   ├── models/              # 数据模型
│   ├── services/            # 业务逻辑
│   ├── utils/               # 工具函数
│   ├── main.py              # 入口文件
│   └── requirements.txt     # 依赖文件
└── frontend/
    ├── src/
    │   ├── components/      # 组件
    │   ├── pages/           # 页面
    │   ├── services/        # API服务
    │   ├── utils/           # 工具函数
    │   └── App.js           # 应用入口
    └── package.json         # 依赖和脚本配置
```

## 注意事项

- 需要有效的DeepSeek API密钥才能使用大语言模型功能
- 处理大型文件可能需要较长时间
- 确保MongoDB服务已启动并可访问

## 未来计划

- 添加用户认证系统
- 支持更多电子书格式
- 提供更详细的章节分析
- 添加笔记和标注功能
- 实现多语言支持

## 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

```
MIT License

Copyright (c) 2023 Readwise

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```