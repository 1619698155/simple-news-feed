// backend/index.js

const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // 用来生成随机 token
const db = require('./db'); // 数据库

const app = express();

app.use(cors());
app.use(express.json());

// ======== 内存中的 token 存储（简单实现） ========
/**
 * tokens = {
 *   '随机token字符串': { id: 1, username: 'test' }
 * }
 */
const tokens = {};

// ======== 公共接口：测试用 ========
app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// ======== 注册接口 ========
// POST /auth/register
// body: { username, password }
app.post('/auth/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  // 先检查是否已存在同名用户
  const checkSql = 'SELECT id FROM users WHERE username = ?';
  db.get(checkSql, [username], (err, row) => {
    if (err) {
      console.error('检查用户失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (row) {
      return res.status(400).json({ error: '用户名已被注册' });
    }

    // 插入新用户（这里简单存明文密码，正式项目请做加密！）
    const insertSql =
      'INSERT INTO users (username, password) VALUES (?, ?)';
    db.run(insertSql, [username, password], function (err2) {
      if (err2) {
        console.error('注册用户失败:', err2);
        return res.status(500).json({ error: '服务器错误' });
      }

      return res.json({
        message: '注册成功',
        user: {
          id: this.lastID,
          username,
        },
      });
    });
  });
});

// ======== 登录接口 ========
// POST /auth/login
// body: { username, password }
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const sql =
    'SELECT id, username, password FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error('登录查询失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }

    if (user.password !== password) {
      return res.status(400).json({ error: '密码错误' });
    }

    // 生成随机 token，放入内存
    const token = crypto.randomBytes(16).toString('hex');
    const userInfo = { id: user.id, username: user.username };
    tokens[token] = userInfo;

    return res.json({
      message: '登录成功',
      token,
      user: userInfo,
    });
  });
});

// ======== 认证中间件 ========
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: '未登录（缺少 Authorization 头）' });
  }

  // 预期格式：Authorization: Bearer tokenxxx
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Authorization 格式错误' });
  }

  const token = parts[1];
  const user = tokens[token];

  if (!user) {
    return res.status(401).json({ error: '无效或过期的 token，请重新登录' });
  }

  // 把用户信息挂到 req 上，后面接口可以用
  req.user = user;
  next();
}

// ======== 发帖接口（需要登录） ========
// POST /posts
// headers: Authorization: Bearer token
// body: { content, images }  其中 images 是数组，例如 ["url1","url2"]
app.post('/posts', authMiddleware, (req, res) => {
  const { content, images } = req.body || {};

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const imagesJson = images && Array.isArray(images)
    ? JSON.stringify(images)
    : JSON.stringify([]);

  const sql =
    'INSERT INTO posts (user_id, content, images) VALUES (?, ?, ?)';

  db.run(sql, [req.user.id, content, imagesJson], function (err) {
    if (err) {
      console.error('发帖失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    // 返回新建的这条内容
    const selectSql = `
      SELECT 
        id, user_id, content, images, created_at, updated_at
      FROM posts
      WHERE id = ?
    `;

    db.get(selectSql, [this.lastID], (err2, row) => {
      if (err2) {
        console.error('查询新建帖子失败:', err2);
        return res.json({
          message: '发帖成功，但获取详情失败',
          id: this.lastID,
        });
      }

      const result = {
        ...row,
        images: row.images ? JSON.parse(row.images) : [],
      };

      return res.json(result);
    });
  });
});

// ======== 修改帖子接口（需要登录） ========
// PUT /posts/:id
// headers: Authorization: Bearer token
// body: { content, images }
app.put('/posts/:id', authMiddleware, (req, res) => {
  const postId = req.params.id;
  const { content, images } = req.body || {};

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const imagesJson = images && Array.isArray(images)
    ? JSON.stringify(images)
    : JSON.stringify([]);

  // 简单做一个“只能改自己的帖子”
  const findSql = 'SELECT * FROM posts WHERE id = ?';
  db.get(findSql, [postId], (err, row) => {
    if (err) {
      console.error('查询帖子失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!row) {
      return res.status(404).json({ error: '该帖子不存在' });
    }

    if (row.user_id !== req.user.id) {
      return res.status(403).json({ error: '没有权限修改这条内容' });
    }

    const updateSql = `
      UPDATE posts
      SET content = ?, images = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    db.run(updateSql, [content, imagesJson, postId], function (err2) {
      if (err2) {
        console.error('更新帖子失败:', err2);
        return res.status(500).json({ error: '服务器错误' });
      }

      const selectSql = `
        SELECT 
          id, user_id, content, images, created_at, updated_at
        FROM posts
        WHERE id = ?
      `;
      db.get(selectSql, [postId], (err3, updatedRow) => {
        if (err3) {
          console.error('查询更新后的帖子失败:', err3);
          return res.json({ message: '修改成功，但获取详情失败', id: postId });
        }

        const result = {
          ...updatedRow,
          images: updatedRow.images ? JSON.parse(updatedRow.images) : [],
        };

        return res.json(result);
      });
    });
  });
});

// ======== 列表 & 详情接口（保持原样） ========

// GET /posts?offset=0&limit=10
app.get('/posts', (req, res) => {
  const offset = parseInt(req.query.offset || '0', 10);
  const limit = parseInt(req.query.limit || '10', 10);

  const sql = `
    SELECT 
      posts.id,
      posts.user_id,
      users.username AS author_name,
      posts.content,
      posts.images,
      posts.created_at,
      posts.updated_at
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    ORDER BY datetime(posts.created_at) DESC
    LIMIT ? OFFSET ?
  `;

  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      console.error('查询 posts 列表失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    const result = rows.map((row) => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
    }));

    res.json(result);
  });
});


// GET /posts/:id
app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;

  const sql = `
    SELECT 
      posts.id,
      posts.user_id,
      users.username AS author_name,
      posts.content,
      posts.images,
      posts.created_at,
      posts.updated_at
    FROM posts
    LEFT JOIN users ON posts.user_id = users.id
    WHERE posts.id = ?
  `;

  db.get(sql, [postId], (err, row) => {
    if (err) {
      console.error('查询 post 详情失败:', err);
      return res.status(500).json({ error: '查询失败' });
    }

    if (!row) {
      return res.status(404).json({ error: '未找到该内容' });
    }

    const result = {
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
    };

    res.json(result);
  });
});


// ======== 启动服务器 ========
//const PORT = 3000;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
