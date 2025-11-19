// backend/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件放在 backend 目录下，文件名叫 database.sqlite
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// 初始化表结构
db.serialize(() => {
  // 用户表
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 文章表（短图文）
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT NOT NULL,
      images TEXT, -- 存 JSON 字符串，如 ["url1","url2"]
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // 可选：插入一点测试数据（只在表为空时插入）
  db.get('SELECT COUNT(*) AS count FROM posts', (err, row) => {
    if (err) {
      console.error('检查 posts 数量失败:', err);
      return;
    }
    if (row.count === 0) {
      console.log('posts 表为空，插入一些测试数据...');
      const stmt = db.prepare(
        'INSERT INTO posts (user_id, content, images) VALUES (?, ?, ?)'
      );

      const samplePosts = [
        {
          user_id: 1,
          content: '这是第一条测试短图文内容，欢迎使用简易资讯系统！',
          images: JSON.stringify([
            'https://picsum.photos/seed/news1/400/300',
          ]),
        },
        {
          user_id: 1,
          content: '第二条测试内容：今天的天气很好，适合写代码。',
          images: JSON.stringify([
            'https://picsum.photos/seed/news2/400/300',
          ]),
        },
      ];

      samplePosts.forEach((p) => {
        stmt.run(p.user_id, p.content, p.images);
      });

      stmt.finalize();
    }
  });
});

module.exports = db;
