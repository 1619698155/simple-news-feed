// backend/index.js

const express = require('express'); // 导入 Express 模块
const cors = require('cors'); // 导入 CORS 模块
const crypto = require('crypto'); // 用来生成随机 token
const bcrypt = require('bcrypt'); // 用来哈希密码
const db = require('./db'); // 数据库

// 用于文件上传和路径处理
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const OpenAI = require('openai'); // 导入 OpenAI 模块
require('dotenv').config(); // 加载 .env 文件中的环境变量

// 创建一个 Express 应用实例
const app = express();
// 将 CORS 中间件注册为全局中间件, 注册 Express 内置的中间件
app.use(cors()); // 支持跨域
app.use(express.json({ limit: '50mb' })); // 增加请求体大小限制到50MB，以支持较大文件上传
app.use(express.urlencoded({ limit: '50mb', extended: true })); // 同时增加URL编码请求体的大小限制

// 配置 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.ARK_API_KEY, // 从环境变量获取 API Key
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3', // 火山方舟的 Base URL
});

// 配置上传目录和 Multer
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 静态文件访问：让 /uploads 下的文件可以直接通过 URL 访问
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const base =
      Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, base + ext);
  },
});

// 配置multer，增加文件大小限制到10MB
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 设置文件大小限制为10MB
});

// ======== 内存中的 token 存储（简单实现） ========
/**
 * tokens = {
 *   '随机token字符串': {
 *     user: { id: 1, username: 'test' },
 *     expiresAt: 过期时间戳
 *   }
 * }
 */
const tokens = {};
const TOKEN_EXPIRATION = 24 * 60 * 60 * 1000; // Token过期时间：24小时

// ======== 登录尝试记录（用于安全防护） ========
// loginAttempts = {
//   'ip地址': {
//     attempts: 登录失败次数,
//     lastAttempt: 最后尝试时间,
//     blockedUntil: 被封禁到的时间
//   }
// }
const loginAttempts = {};
const MAX_ATTEMPTS = 5; // 最大失败尝试次数
const BLOCK_DURATION = 300000; // 封禁时间（毫秒）- 5分钟
const ATTEMPT_WINDOW = 60000; // 失败尝试的时间窗口（毫秒）- 1分钟

// 定义路由，测试公共接口 
app.get('/ping', (req, res) => { // 定义路由，指定当服务器收到一个对路径 /ping的 GET 请求时执行后面的箭头函数。req是包含请求信息的对象，res是用于构建和发送响应的对象
  res.json({ message: 'pong' }); // 路由处理函数内部的方法调用，使用 res.json()方法发送一个 JSON 格式的响应给客户端
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

    // 密码哈希
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('密码哈希失败:', err);
        return res.status(500).json({ error: '服务器错误' });
      }
      
      // 插入新用户（存储哈希后的密码）
      const insertSql = 
        'INSERT INTO users (username, password) VALUES (?, ?)';
      db.run(insertSql, [username, hashedPassword], function (err2) {
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
});

// ======== 登录接口 ========
// POST /auth/login
// body: { username, password }
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  // 获取客户端IP地址
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  // 检查登录尝试记录
  const now = Date.now();
  let attempts = loginAttempts[clientIp] || { attempts: 0, lastAttempt: 0, blockedUntil: 0 };

  // 如果IP被封禁且封禁时间未过
  if (attempts.blockedUntil > now) {
    const remainingTime = Math.ceil((attempts.blockedUntil - now) / 1000);
    return res.status(429).json({ 
      error: `登录失败次数过多，请在 ${remainingTime} 秒后重试` 
    });
  }

  // 如果距离上次尝试超过时间窗口，重置尝试次数
  if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
    attempts.attempts = 0;
  }

  // 更新最后尝试时间
  attempts.lastAttempt = now;
  loginAttempts[clientIp] = attempts;

  const sql =
    'SELECT id, username, password FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      console.error('登录查询失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    if (!user) {
      // 登录失败，增加尝试次数
      attempts.attempts++;
      loginAttempts[clientIp] = attempts;
      
      // 检查是否达到最大尝试次数
      if (attempts.attempts >= MAX_ATTEMPTS) {
        attempts.blockedUntil = now + BLOCK_DURATION;
        loginAttempts[clientIp] = attempts;
        return res.status(429).json({ 
          error: `登录失败次数过多，请在 5 分钟后重试` 
        });
      }
      
      return res.status(400).json({ error: '用户不存在' });
    }

    // 验证密码 - 兼容明文密码（过渡方案）
    let isPasswordValid = false;
    
    // 检查密码是否是哈希格式（以 $2b$ 开头）
    const isHashedPassword = user.password.startsWith('$2b$');
    
    if (isHashedPassword) {
      // 如果是哈希密码，使用 bcrypt.compare 验证
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          console.error('bcrypt 密码验证失败:', err);
          // 验证失败，增加尝试次数
          handleLoginFailure();
        } else if (result) {
          // 密码正确，处理登录成功
          handleLoginSuccess();
        } else {
          // 密码错误，增加尝试次数
          handleLoginFailure();
        }
      });
    } else {
      // 如果是明文密码，直接比较
      if (password === user.password) {
        // 密码正确，处理登录成功
        handleLoginSuccess();
      } else {
        // 密码错误，增加尝试次数
        handleLoginFailure();
      }
    }
    
    // 处理登录失败
    function handleLoginFailure() {
      attempts.attempts++;
      loginAttempts[clientIp] = attempts;
      
      // 检查是否达到最大尝试次数
      if (attempts.attempts >= MAX_ATTEMPTS) {
        attempts.blockedUntil = now + BLOCK_DURATION;
        loginAttempts[clientIp] = attempts;
        return res.status(429).json({ 
          error: `登录失败次数过多，请在 5 分钟后重试` 
        });
      }
      
      return res.status(400).json({ error: '密码错误' });
    }
    
    // 处理登录成功
    function handleLoginSuccess() {
      // 登录成功，重置尝试记录
      delete loginAttempts[clientIp];

      // 生成随机 token，放入内存
      const token = crypto.randomBytes(16).toString('hex');
      const userInfo = { id: user.id, username: user.username };
      tokens[token] = {
        user: userInfo,
        expiresAt: Date.now() + TOKEN_EXPIRATION
      };

      return res.json({
        message: '登录成功',
        token,
        user: userInfo,
      });
    }
  });
});

// ======== 推荐话题接口（需要登录） ========
// POST /api/recommend-topics
// headers: Authorization: Bearer token
// body: { content }
app.post('/api/recommend-topics', authMiddleware, async (req, res) => {
  const { content } = req.body || {};

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  // 检查API密钥是否为占位符或无效
  const apiKey = process.env.ARK_API_KEY || '';
  const isApiKeyValid = apiKey.trim() !== '' && 
                        apiKey !== 'YOUR_ARK_API_KEY' &&
                        apiKey !== '"YOUR_ARK_API_KEY"';

  try {
    // 预处理内容：过滤掉图片URL，并限制长度
    let processedContent = content;
    // 移除HTML标签
    processedContent = processedContent.replace(/<[^>]+>/g, '');
    // 移除图片URL
    processedContent = processedContent.replace(/https?:\/\/[^\s"'<>]+/g, '');
    // 移除多余空格和换行
    processedContent = processedContent.replace(/\s+/g, ' ').trim();
    // 限制内容长度，避免token数超过限制
    const maxContentLength = 1000;
    if (processedContent.length > maxContentLength) {
      processedContent = processedContent.slice(0, maxContentLength) + '...';
    }

    // 如果API密钥有效，调用实际API
    if (isApiKeyValid) {
      try {
        // 使用已开通的火山方舟模型进行调用
        const completion = await openai.chat.completions.create({
          model: 'doubao-seed-1-6-251015', // 已开通的火山方舟模型名称（按照示例格式）
          messages: [
            {
              role: 'system',
              content: '你是一个话题推荐助手。根据用户提供的内容，推荐3-5个相关的话题，以JSON数组格式返回，例如：["话题1", "话题2", "话题3"]。',
            },
            {
              role: 'user',
              content: `请根据以下内容推荐相关话题：\n\n${processedContent}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 100,
          reasoning_effort: "medium", // 添加推理参数
        });

        // 获取API返回的内容
        const responseContent = completion.choices[0]?.message?.content;
        
        // 解析API返回的JSON数据
        try {
          const recommendedTopics = JSON.parse(responseContent);
          return res.json({ 
            topics: recommendedTopics, 
            source: 'api',
            reasoning: completion.choices[0]?.message?.reasoning_content || ''
          });
        } catch (jsonError) {
          console.error('解析API返回的JSON数据失败:', jsonError);
          console.log('原始响应内容:', responseContent);
          // JSON解析错误时返回模拟数据
          throw new Error('JSON解析错误');
        }
      } catch (apiError) {
        console.error('调用火山方舟模型失败:', apiError.message || apiError);
        
        // 检查是否是模型不存在或没有访问权限的错误
        if (apiError.error && apiError.error.code === 'InvalidEndpointOrModel.NotFound') {
          console.log('模型不存在或没有访问权限，使用模拟数据');
        } else if (apiError.status === 401) {
          console.log('API密钥认证失败，使用模拟数据');
        }
        
        // API调用失败时抛出错误，进入外层catch处理
        throw apiError;
      }
    } else {
      // 如果API密钥无效，返回模拟数据
      console.log('API密钥无效，返回模拟数据，火山方舟模型：doubao-seed-1-6-251015');
      // 根据内容生成一些简单的模拟话题
      const mockTopics = [
        '人工智能',
        '技术创新',
        '数据分析',
        '用户体验',
        '编程开发'
      ];
      return res.json({ topics: mockTopics, source: 'mock' });
    }
  } catch (error) {
    // 出错时返回模拟数据
    console.log('发生错误，返回模拟数据作为后备方案，火山方舟模型：doubao-seed-1-6-251015');
    const mockTopics = [
      '人工智能',
      '技术创新',
      '数据分析',
      '用户体验',
      '编程开发'
    ];
    return res.json({ topics: mockTopics, source: 'mock_fallback' });
  }
});

// ======== 认证中间件 ========
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res
      .status(401)
      .json({ error: '未登录（缺少 Authorization 头）' });
  }

  // 预期格式：Authorization: Bearer tokenxxx
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Authorization 格式错误' });
  }

  const token = parts[1];
  const tokenData = tokens[token];

  if (!tokenData) {
    return res
      .status(401)
      .json({ error: '无效或过期的 token，请重新登录' });
  }

  // 检查token是否过期
  if (Date.now() > tokenData.expiresAt) {
    // 删除过期的token
    delete tokens[token];
    return res
      .status(401)
      .json({ error: 'token已过期，请重新登录' });
  }

  // 把用户信息挂到 req 上，后面接口可以用
  req.user = tokenData.user;
  next();
}

// 图片上传接口（需要登录）
// POST /upload/image
// headers: Authorization: Bearer token
// body: form-data, field: file
app.post(
  '/upload/image',
  authMiddleware,
  upload.single('file'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: '未收到文件' });
    }

    const url = `${req.protocol}://${req.get('host')}/uploads/${
      req.file.filename
    }`;

    return res.json({ url });
  }
);

// ======== 发帖接口（需要登录） ========
// POST /posts
// headers: Authorization: Bearer token
// body: { content, images, topics }  其中 images 和 topics 是数组，例如 ["url1","url2"] 和 ["话题1","话题2"]
app.post('/posts', authMiddleware, (req, res) => {
  const { content, images, topics } = req.body || {};

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const imagesJson = 
    images && Array.isArray(images)
      ? JSON.stringify(images)
      : JSON.stringify([]);
      
  const topicsJson = 
    topics && Array.isArray(topics)
      ? JSON.stringify(topics)
      : JSON.stringify([]);

  const sql = 
    'INSERT INTO posts (user_id, content, images, topics) VALUES (?, ?, ?, ?)';

  db.run(sql, [req.user.id, content, imagesJson, topicsJson], function (err) {
    if (err) {
      console.error('发帖失败:', err);
      return res.status(500).json({ error: '服务器错误' });
    }

    // 返回新建的这条内容
    const selectSql = `
      SELECT 
        id, user_id, content, images, topics, created_at, updated_at
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
        topics: row.topics ? JSON.parse(row.topics) : [],
      };

      return res.json(result);
    });
  });
});

// ======== 修改帖子接口（需要登录） ========
// PUT /posts/:id
// headers: Authorization: Bearer token
// body: { content, images, topics }
app.put('/posts/:id', authMiddleware, (req, res) => {
  const postId = req.params.id;
  const { content, images, topics } = req.body || {};

  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '内容不能为空' });
  }

  const imagesJson = 
    images && Array.isArray(images)
      ? JSON.stringify(images)
      : JSON.stringify([]);
      
  const topicsJson = 
    topics && Array.isArray(topics)
      ? JSON.stringify(topics)
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
      return res
        .status(403)
        .json({ error: '没有权限修改这条内容' });
    }

    const updateSql = `
      UPDATE posts
    SET content = ?, images = ?, topics = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
    `;

    db.run(updateSql, [content, imagesJson, topicsJson, postId], function (err2) {
      if (err2) {
        console.error('更新帖子失败:', err2);
        return res.status(500).json({ error: '服务器错误' });
      }

      const selectSql = `
        SELECT 
          id, user_id, content, images, topics, created_at, updated_at
        FROM posts
        WHERE id = ?
      `;
      db.get(selectSql, [postId], (err3, updatedRow) => {
        if (err3) {
          console.error('查询更新后的帖子失败:', err3);
          return res.json({
            message: '修改成功，但获取详情失败',
            id: postId,
          });
        }

        const result = {
          ...updatedRow,
          images: updatedRow.images
            ? JSON.parse(updatedRow.images)
            : [],
          topics: updatedRow.topics
            ? JSON.parse(updatedRow.topics)
            : [],
        };

        return res.json(result);
      });
    });
  });
});

// ======== 列表 & 详情接口========
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
        posts.topics,
        posts.created_at,
        posts.updated_at
      FROM posts
      LEFT JOIN users ON posts.user_id = users.id
      ORDER BY posts.created_at DESC, posts.id DESC
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
      topics: row.topics ? JSON.parse(row.topics) : [],
    }));

    res.json(result);
  });
});

// GET /posts/:idnin1
app.get('/posts/:id', (req, res) => {
  const postId = req.params.id;

  const sql = `
    SELECT 
      posts.id,
      posts.user_id,
      users.username AS author_name,
      posts.content,
      posts.images,
      posts.topics,
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
      topics: row.topics ? JSON.parse(row.topics) : [],
    };

    res.json(result);
  });
});

// ======== 404 处理（所有未匹配的路由）=======
app.use((req, res, next) => {
  res
    .status(404)
    .json({ error: `接口 ${req.method} ${req.originalUrl} 不存在` });
});

// ======== 全局错误处理（捕获抛出的异常）=======
app.use((err, req, res, next) => {
  console.error('服务器内部错误:', err);
  res.status(500).json({
    error: '服务器内部错误',
    detail: err.message,
  });
});

// 启动服务器 
//const PORT = 3000;
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { // 调用 app.listen 方法，使服务器开始监听指定的 PORT 端口
  console.log(
    `Backend server is running on http://localhost:${PORT}`
  );
});
