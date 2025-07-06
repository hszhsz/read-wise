#!/bin/bash

# 设置颜色
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${GREEN}开始设置Readwise项目环境...${NC}\n"

# 检查Python版本
echo -e "${YELLOW}检查Python版本...${NC}"
if command -v python3 &>/dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}Python版本: $PYTHON_VERSION${NC}"
    if [[ "$PYTHON_VERSION" < "3.9" ]]; then
        echo -e "${RED}警告: 推荐使用Python 3.9或更高版本${NC}"
    fi
else
    echo -e "${RED}错误: 未找到Python 3，请安装Python 3.9或更高版本${NC}"
    exit 1
fi

# 检查Node.js版本
echo -e "\n${YELLOW}检查Node.js版本...${NC}"
if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}Node.js版本: $NODE_VERSION${NC}"
    # 移除v前缀并检查版本
    NODE_VERSION_NUM=${NODE_VERSION#v}
    if [[ "$NODE_VERSION_NUM" < "14" ]]; then
        echo -e "${RED}警告: 推荐使用Node.js 14或更高版本${NC}"
    fi
else
    echo -e "${RED}错误: 未找到Node.js，请安装Node.js 14或更高版本${NC}"
    exit 1
fi

# 检查MongoDB
echo -e "\n${YELLOW}检查MongoDB...${NC}"
if command -v mongod &>/dev/null; then
    MONGO_VERSION=$(mongod --version | grep "db version" | cut -d' ' -f3)
    echo -e "${GREEN}MongoDB版本: $MONGO_VERSION${NC}"
else
    echo -e "${RED}警告: 未找到MongoDB，请确保MongoDB已安装并运行${NC}"
fi

# 创建虚拟环境
echo -e "\n${YELLOW}创建Python虚拟环境...${NC}"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}虚拟环境已创建${NC}"
else
    echo -e "${GREEN}虚拟环境已存在${NC}"
fi

# 激活虚拟环境并安装依赖
echo -e "\n${YELLOW}安装后端依赖...${NC}"
source venv/bin/activate
pip install -r backend/requirements.txt

# 创建上传目录
echo -e "\n${YELLOW}创建上传目录...${NC}"
mkdir -p backend/uploads
echo -e "${GREEN}上传目录已创建${NC}"

# 创建.env文件
echo -e "\n${YELLOW}创建环境变量文件...${NC}"
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}.env文件已创建，请编辑填入您的API密钥${NC}"
else
    echo -e "${GREEN}.env文件已存在${NC}"
fi

# 安装前端依赖
echo -e "\n${YELLOW}安装前端依赖...${NC}"
cd frontend
npm install
cd ..

echo -e "\n${GREEN}设置完成!${NC}"
echo -e "\n${YELLOW}使用以下命令启动服务:${NC}"
echo -e "后端: ${GREEN}source venv/bin/activate && cd backend && python main.py${NC}"
echo -e "前端: ${GREEN}cd frontend && npm start${NC}"

echo -e "\n${YELLOW}重要提示:${NC}"
echo -e "1. 请确保编辑.env文件，填入您的DeepSeek API密钥"
echo -e "2. 确保MongoDB服务已启动"
echo -e "3. 访问http://localhost:3000使用应用"