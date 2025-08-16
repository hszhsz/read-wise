// MongoDB 初始化脚本
// 创建 readwise 数据库和用户

db = db.getSiblingDB('readwise');

// 创建应用用户
db.createUser({
  user: 'readwise_user',
  pwd: 'readwise_password',
  roles: [
    {
      role: 'readWrite',
      db: 'readwise'
    }
  ]
});

// 创建基础集合
db.createCollection('books');
db.createCollection('users');
db.createCollection('chat_sessions');

// 插入示例数据（可选）
db.books.insertOne({
  title: '示例图书',
  author: '示例作者',
  content: '这是一本示例图书的内容...',
  created_at: new Date(),
  updated_at: new Date()
});

print('MongoDB 初始化完成');