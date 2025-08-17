import asyncio
import sys
sys.path.append('backend')

from models.database import get_database

async def update_book_content():
    # 读取文件内容
    with open('uploads/d4cd8852-67f6-4806-8ada-004b3fdc9d5d.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 连接数据库
    db = await get_database()
    
    # 更新书籍内容
    book_id = '8b8b0ff5-18ac-4d8d-bb86-4a7ef48a6936'
    result = await db.books.update_one(
        {"id": book_id},
        {"$set": {
            "content": content,
            "file_path": "uploads/d4cd8852-67f6-4806-8ada-004b3fdc9d5d.txt"
        }}
    )
    
    print(f"Updated {result.modified_count} document(s)")
    
    # 验证更新
    book = await db.books.find_one({"id": book_id})
    if book:
        print(f"Content length: {len(book.get('content', ''))}")
        print(f"File path: {book.get('file_path')}")
    else:
        print("Book not found")

if __name__ == "__main__":
    asyncio.run(update_book_content())