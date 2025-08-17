#!/usr/bin/env python3
"""
测试书籍上传功能
"""

import requests
import os
from pathlib import Path

# API基础URL
BASE_URL = "http://localhost:8000"

def test_upload_book():
    """测试书籍上传"""
    # 创建一个测试文本文件
    test_content = """
这是一本测试书籍的内容。

第一章：引言
这是一本关于人工智能的书籍。人工智能是计算机科学的一个分支，它试图理解智能的实质，并生产出一种新的能以人类智能相似的方式做出反应的智能机器。

第二章：机器学习
机器学习是人工智能的一个重要分支。它是一种通过算法使计算机系统能够自动学习和改进的方法，而无需明确编程。

第三章：深度学习
深度学习是机器学习的一个子集，它模仿人脑的工作方式来处理数据并创建用于决策的模式。

结论
人工智能技术正在快速发展，将对我们的生活产生深远影响。
    """.strip()
    
    # 创建测试文件
    test_file_path = "/tmp/test_book.txt"
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write(test_content)
    
    print(f"创建测试文件: {test_file_path}")
    print(f"文件大小: {os.path.getsize(test_file_path)} 字节")
    
    # 上传文件
    upload_url = f"{BASE_URL}/api/books/upload"
    
    with open(test_file_path, "rb") as f:
        files = {
            "file": ("test_book.txt", f, "text/plain")
        }
        data = {
            "title": "人工智能入门",
            "author": "测试作者"
        }
        
        print(f"正在上传到: {upload_url}")
        response = requests.post(upload_url, files=files, data=data)
    
    print(f"响应状态码: {response.status_code}")
    print(f"响应内容: {response.json()}")
    
    if response.status_code == 200:
        result = response.json()
        book_id = result.get("book_id")
        print(f"\n上传成功！书籍ID: {book_id}")
        
        # 检查书籍状态
        check_status(book_id)
        
        return book_id
    else:
        print(f"上传失败: {response.text}")
        return None
    
    # 清理测试文件
    os.remove(test_file_path)
    print(f"已删除测试文件: {test_file_path}")

def check_status(book_id):
    """检查书籍处理状态"""
    status_url = f"{BASE_URL}/api/books/{book_id}/info"
    
    print(f"\n检查书籍状态: {status_url}")
    response = requests.get(status_url)
    
    if response.status_code == 200:
        book_info = response.json()
        print(f"书籍状态: {book_info.get('status')}")
        print(f"书籍标题: {book_info.get('title')}")
        print(f"上传时间: {book_info.get('upload_date')}")
    else:
        print(f"获取状态失败: {response.text}")

def list_books():
    """列出所有书籍"""
    list_url = f"{BASE_URL}/api/books"
    
    print(f"\n获取书籍列表: {list_url}")
    response = requests.get(list_url)
    
    if response.status_code == 200:
        result = response.json()
        books = result.get("books", [])
        print(f"总共 {len(books)} 本书籍:")
        for book in books:
            print(f"  - {book.get('title')} ({book.get('status')}) - {book.get('id')}")
    else:
        print(f"获取列表失败: {response.text}")

if __name__ == "__main__":
    print("=== 测试书籍上传功能 ===")
    
    # 测试上传
    book_id = test_upload_book()
    
    # 列出所有书籍
    list_books()
    
    print("\n=== 测试完成 ===")
    print("请检查后端日志以查看处理过程")