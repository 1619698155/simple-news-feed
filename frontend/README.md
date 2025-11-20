1. 项目简介
    项目名称：简易资讯移动端（HTML5 形式）
    技术栈：React + Vite（前端）、Node.js + Express + SQLite（后端）
    主要功能：
        用户注册 / 登录 / 退出登录
        短图文发布、编辑
        内容详情页展示
        信息流列表（按时间倒序、加载更多）
    目标：完成一个可用的简易资讯产品 Demo，并部署上线可扫码访问。

2. 技术选型
2.1 前端
    框架：React 18 + Vite
    路由：react-router-dom
    状态管理：React 内置 useState / useEffect
    样式：原生 CSS + 少量内联样式，针对移动端优化（meta viewport、自适应宽度）
    选择原因：
        React 生态成熟、资料丰富，适合入门学习。
        Vite 开发体验快、配置简单，适合小项目。
        原生 CSS 足够满足本项目的简易 UI 需求。
2.2 后端
    运行时：Node.js
    框架：Express
    数据库：SQLite（文件型数据库）
    鉴权：自定义 token，内存存储（Demo 级别）
    选择原因：
        Express 足够轻量，易上手。
        SQLite 免安装、跨平台，适合个人练习项目。
        简单 token 便于在有限时间内完成登录功能。

3. 系统架构
    前端（H5 页面）：调用 HTTP 接口
    后端（Node.js + Express）：读写
    SQLite 数据库文件（database.sqlite）：存储用户和短图文数据

4. 数据库设计
4.1 users表
字段名	     类型	     说明
id	        INTEGER	    主键，自增
username	TEXT	    用户名，唯一
password	TEXT	    密码（明文存储，仅 Demo 使用）
created_at	DATETIME    注册时间

4.2 posts表
字段名	     类型	     说明
id	        INTEGER	    主键，自增
user_id	    INTEGER	    发布人 id（关联 users.id）
content	    TEXT	    文本内容
images	    TEXT	    图片 URL 数组的 JSON 字符串
created_at	DATETIME	创建时间
updated_at	DATETIME	最后更新时间

5. 接口设计
主要接口示例：
5.1 用户注册
    URL：POST /auth/register
    请求体：
    {
        "username": "test",
        "password": "123456"
    }
    响应（成功）：
    {
        "message": "注册成功",
         "user": {
            "id": 1,
            "username": "test"
        }
    }
5.2 用户登录
    URL：POST /auth/login
    请求体：
    {
        "username": "test",
        "password": "123456"
    }
    响应（成功）：
    {
        "message": "登录成功",
        "token": "xxxxxx",
        "user": {
            "id": 1,
            "username": "test"
        }
    }
    前端将 token 存在 localStorage，后续接口通过 Authorization: Bearer token 传递。
5.3 获取信息流列表
    URL：GET /posts?offset=0&limit=10
    响应（成功）：
    [
        {
            "id": 1,
            "user_id": 1,
            "author_name": "test",
            "content": "内容示例",
            "images": ["https://..."],
            "created_at": "2025-11-19 10:00:00",
            "updated_at": "2025-11-19 10:00:00"
        }
    ]
5.4 获取内容详情
    URL：GET /posts/:id
5.5 发布短图文
    URL：POST /posts
    请求头：Authorization: Bearer <token>
    请求体：
    {
        "content": "今天写了一个简易资讯系统",
        "images": ["https://..."]
    }

6. 前端主要页面说明
    首页 /：显示当前登录用户信息 + 信息流列表（PostList）。
    登录 /login：输入用户名密码，调用 /auth/login，保存 token。
    注册 /register：调用 /auth/register。
    发帖 /post/new：需要登录；文本 + 图片 URL（每行一条）。
    详情 /post/:id：展示全文和所有图片；如果是作者，提供“编辑”入口。
    编辑 /post/:id/edit：加载原内容后编辑并保存。

7. 后续优化方向（对应“挑战”部分）
    富文本编辑器
    AI 自动打标签与相关推荐
    下拉刷新、性能优化（LCP、FPS）
    真正的文件上传与 CDN 存储
    使用 JWT、密码哈希、安全加固等
    
。。。未完待续
