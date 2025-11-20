1. 项目简介<br>
   项目名称：简易资讯移动端（HTML5 形式）<br>
   技术栈：React + Vite（前端）、Node.js + Express + SQLite（后端）<br>
   主要功能：<br>
       用户注册 / 登录 / 退出登录<br>
       短图文发布、编辑<br>
       内容详情页展示<br>
       信息流列表（按时间倒序、加载更多）<br>
    目标：完成一个可用的简易资讯产品 Demo，并部署上线可扫码访问。<br>

2. 技术选型<br>
2.1 前端<br>
    框架：React 18 + Vite<br>
    路由：react-router-dom<br>
    状态管理：React 内置 useState / useEffect<br>
    样式：原生 CSS + 少量内联样式，针对移动端优化（meta viewport、自适应宽度）<br>
    选择原因：<br>
        React 生态成熟、资料丰富。<br>
        Vite 开发体验快、配置简单。<br>
        原生 CSS 足够满足本项目的 UI 需求。<br>
2.2 后端<br>
    运行时：Node.js<br>
    框架：Express<br>
    数据库：SQLite（文件型数据库）<br>
    鉴权：自定义 token，内存存储（Demo 级别）<br>
    选择原因：<br>
        Express 足够轻量，易上手。<br>
        SQLite 免安装、跨平台，适合个人练习项目。<br>
        简单 token 便于在有限时间内完成登录功能。<br>

3. 系统架构<br>
    前端（H5 页面）：调用 HTTP 接口<br>
    后端（Node.js + Express）：读写<br>
    SQLite 数据库文件（database.sqlite）：存储用户和短图文数据<br>

4. 数据库设计<br>
   4.1 users表<br>
   字段名	      类型	      说明<br>
   id	        INTEGER	    主键，自增<br>
   username	  TEXT	      用户名，唯一<br>
   password	  TEXT	      密码（明文存储，仅 Demo 使用）<br>
   created_at	DATETIME    注册时间<br>

   4.2 posts表<br>
   字段名	      类型	      说明<br>
   id	        INTEGER	    主键，自增<br>
   user_id	    INTEGER	    发布人 id（关联 users.id）<br>
   content	    TEXT	      文本内容<br>
   images	    TEXT	      图片 URL 数组的 JSON 字符串<br>
   created_at	DATETIME	  创建时间<br>
   updated_at	DATETIME	  最后更新时间<br>

5. 接口设计<br>
主要接口示例：<br>
   5.1 用户注册<br>
       URL：POST /auth/register<br>
       请求体：<br>
       {<br>
           "username": "test",<br>
           "password": "123456"<br>
       }<br>
       响应（成功）：<br>
       {<br>
           "message": "注册成功",<br>
            "user": {<br>
               "id": 1,<br>
               "username": "test"<br>
           }<br>
       }<br>
   5.2 用户登录<br>
       URL：POST /auth/login<br>
       请求体：<br>
       {<br>
           "username": "test",<br>
           "password": "123456"<br>
       }<br>
       响应（成功）：<br>
       {<br>
           "message": "登录成功",<br>
           "token": "xxxxxx",<br>
           "user": {<br>
               "id": 1,<br>
               "username": "test"<br>
           }<br>
       }<br>
       前端将 token 存在 localStorage，后续接口通过 Authorization: Bearer token 传递。<br>
   5.3 获取信息流列表<br>
       URL：GET /posts?offset=0&limit=10<br>
       响应（成功）：<br>
       [<br>
           {<br>
               "id": 1,<br>
               "user_id": 1,<br>
               "author_name": "test",<br>
               "content": "内容示例",<br>
               "images": ["https://..."],<br>
               "created_at": "2025-11-19 10:00:00",<br>
               "updated_at": "2025-11-19 10:00:00"<br>
           }<br>
       ]<br>
   5.4 获取内容详情<br>
       URL：GET /posts/:id<br>
   5.5 发布短图文<br>
       URL：POST /posts<br>
       请求头：Authorization: Bearer <token><br>
       请求体：<br>
       {<br>
           "content": "今天写了一个简易资讯系统",<br>
           "images": ["https://..."]<br>
       }<br>

6. 前端主要页面说明<br>
    首页 /：显示当前登录用户信息 + 信息流列表（PostList）。<br>
    登录 /login：输入用户名密码，调用 /auth/login，保存 token。<br>
    注册 /register：调用 /auth/register。<br>
    发帖 /post/new：需要登录；文本 + 图片 URL（每行一条）。<br>
    详情 /post/:id：展示全文和所有图片；如果是作者，提供“编辑”入口。<br>
    编辑 /post/:id/edit：加载原内容后编辑并保存。<br>

7. 后续优化方向（对应“挑战”部分）<br>
    富文本编辑器<br>
    AI 自动打标签与相关推荐<br>
    下拉刷新、性能优化（LCP、FPS）<br>
    真正的文件上传与 CDN 存储<br>
    使用 JWT、密码哈希、安全加固等<br>
    
。。。未完待续<br>
