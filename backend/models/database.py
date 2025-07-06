import os
import json
from typing import Dict, List, Any, Callable
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取MongoDB连接字符串
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "readwise")
USE_MEMORY_DB = os.getenv("USE_MEMORY_DB", "false").lower() == "true"

# 内存数据库游标模拟
class MemoryCursor:
    def __init__(self, data):
        self.data = data
        self.sort_fields = []
        self.skip_count = 0
        self.limit_count = None
    
    def sort(self, criteria):
        # 支持 MongoDB 风格的排序
        # criteria 是一个元组列表，如 [("field", 1), ("field2", -1)]
        self.sort_fields = criteria
        return self
    
    def skip(self, count):
        self.skip_count = count
        return self
    
    def limit(self, count):
        self.limit_count = count
        return self
    
    async def to_list(self, length=None):
        # 应用排序
        result = self.data.copy()
        
        if self.sort_fields:
            for field, direction in reversed(self.sort_fields):
                result.sort(key=lambda x: x.get(field, None) if x.get(field, None) is not None else "", reverse=direction == -1)
        
        # 应用跳过
        if self.skip_count > 0:
            result = result[self.skip_count:]
        
        # 应用限制
        if self.limit_count is not None:
            result = result[:self.limit_count]
        elif length is not None:
            result = result[:length]
        
        return result

# 内存数据库模拟
class MemoryCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
        self.indexes = []
    
    async def insert_one(self, document):
        if isinstance(document, dict):
            self.data.append(document)
            return True
        return False
    
    async def find_one(self, query):
        for item in self.data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                return item
        return None
    
    def find(self, query=None):
        if query is None:
            return MemoryCursor(self.data)
        
        results = []
        for item in self.data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                results.append(item)
        return MemoryCursor(results)
    
    async def update_one(self, query, update):
        for i, item in enumerate(self.data):
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                # 处理$set操作符
                if "$set" in update:
                    for k, v in update["$set"].items():
                        self.data[i][k] = v
                return True
        return False
    
    async def create_index(self, field, unique=False):
        self.indexes.append({"field": field, "unique": unique})
        return True
        
    async def count_documents(self, query=None):
        if query is None:
            return len(self.data)
        
        count = 0
        for item in self.data:
            match = True
            for key, value in query.items():
                if key not in item or item[key] != value:
                    match = False
                    break
            if match:
                count += 1
        return count

class MemoryDatabase:
    def __init__(self):
        self.collections = {}
        # 预先创建books和book_results集合
        self.collections['books'] = MemoryCollection('books')
        self.collections['book_results'] = MemoryCollection('book_results')
        
        # 添加直接访问属性
        self.books = self.collections['books']
        self.book_results = self.collections['book_results']
    
    def __getitem__(self, name):
        if name not in self.collections:
            self.collections[name] = MemoryCollection(name)
        return self.collections[name]

# 创建数据库客户端
if USE_MEMORY_DB:
    print("使用内存数据库模式")
    database = MemoryDatabase()
else:
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        database = client[DATABASE_NAME]
        print(f"已连接到MongoDB: {MONGO_URL}")
    except Exception as e:
        print(f"MongoDB连接失败: {str(e)}，切换到内存数据库模式")
        database = MemoryDatabase()

# 获取数据库连接的依赖函数
async def get_database():
    return database

# 初始化数据库索引
async def init_db():
    # 为books集合创建索引
    if isinstance(database, MemoryDatabase):
        # 内存数据库已经在初始化时创建了集合，不需要再创建索引
        print("内存数据库模式，跳过索引创建")
        return
    
    # MongoDB需要创建索引
    await database.books.create_index("id", unique=True)
    await database.book_results.create_index("book_id", unique=True)
    
    print("数据库索引初始化完成")