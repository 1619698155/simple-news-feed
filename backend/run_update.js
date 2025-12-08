const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'database.sqlite');
// SQL脚本路径
const sqlFilePath = path.join(__dirname, 'update_db.sql');

// 读取SQL脚本内容
fs.readFile(sqlFilePath, 'utf8', (err, sql) => {
  if (err) {
    console.error('读取SQL脚本失败:', err);
    return;
  }

  // 连接数据库并执行SQL
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('连接数据库失败:', err);
      return;
    }
    console.log('成功连接到数据库');

    // 执行SQL脚本
    db.exec(sql, (err) => {
      if (err) {
        console.error('执行SQL脚本失败:', err);
      } else {
        console.log('数据库更新成功！已为posts表添加topics字段');
      }
      
      // 关闭数据库连接
      db.close((err) => {
        if (err) {
          console.error('关闭数据库连接失败:', err);
        } else {
          console.log('数据库连接已关闭');
        }
      });
    });
  });
});