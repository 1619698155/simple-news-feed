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
           React 是目前前端领域最主流的视图框架之一，React Router功能强大且易于使用。<br>
           Vite 开发体验快、配置简单。<br>
           原生 CSS 能够满足本项目的 UI 需求。<br>
2.2 后端<br>
    运行时：Node.js<br>
    框架：Express<br>
    数据库：SQLite（文件型数据库）<br>
    选择原因：<br>
            Node.js 允许你使用 JavaScript 编写后端代码，便于实现全栈操作。<br>
            Express 提供强大的路由，中间件等功能，避免引入过多抽象，能快速构建后端API。<br>
            SQLite 免安装、跨平台，作为暂定的数据库方案。<br>

3. 软件配置方式<br>
3.1 软件平台配置：VS Code 或 Trae AI<br>
3.2 安装 Node.js 和 Git<br>
（1）去官网上下载并安装软件<br>
（2）安装完成后打开终端输入：<br>
      node -v<br>
      npm -v<br>
      git --version<br>
   若能显示版本号则说明安装成功。后续可通过git上传文件至github中。<br>
（3）创建项目根目录 + Git 仓库：<br>
      mkdir simple-news-feed<br>
      cd simple-news-feed<br>
      git init<br>
   此时有一个空目录 simple-news-feed，已经初始化了 Git 仓库。<br>
（3）初始化后端 backend：（Node.js + Express）<br>
      mkdir backend<br>
      cd backend<br>
      npm init -y<br>
      npm install express cors sqlite3<br>
（4）初始化前端 frontend：（Vite + React）<br>
   回到之前的simple-news-feed文件夹，之后运行：<br>
      npm create vite@latest frontend -- --template react<br>
   之后按提示输入：<br>
      Project name: frontend（默认回车即可）<br>
      其他选项直接回车。<br>
   然后进入前端目录安装依赖：<br>
      cd frontend<br>
      npm install<br>   

4. 网站进入方式<br>
4.1 当前调试方法：<br>
（1）在其中一个terminal：（在simple-news-feed目录）<br>
      cd backend<br>
      npm run dev<br>
   此时终端应该会出现Backend server is running on http://localhost:3000，说明后端部分调试成功。<br>
（2）在另一个terminal：（在simple-news-feed目录）<br>
      cd frontend<br>
      npm run dev<br>
   此时终端会出现Local:http://localhost:5173/，点击ctrl+鼠标单击会直接弹出网站，如果网页显示正常说明前端部分调试成功。<br>
4.2 当前效果实例：<br>
<img width="2217" height="1317" alt="ef09adb483988c41f7c6bce55a411b2f" src="https://github.com/user-attachments/assets/f4edcd54-cc26-4f24-a5f2-7e60182e5698" /><br>

5. 数据库设计<br>
   5.1 用户表<br>
   字段名	      类型	      说明<br>
   id	         INTEGER	   主键，自增<br>
   username	   TEXT	      用户名，唯一<br>
   password	   TEXT	      密码（明文存储，仅 Demo 使用）<br>
   created_at	DATETIME    注册时间<br>

   5.2 文章表<br>
   字段名	      类型	      说明<br>
   id	         INTEGER	   主键，自增<br>
   user_id	   INTEGER	   发布人 id（关联 users.id）<br>
   content	   TEXT	      文本内容<br>
   images	   TEXT	      图片 URL 数组的 JSON 字符串<br>
   created_at	DATETIME	   创建时间<br>
   updated_at	DATETIME	   最后更新时间<br>

6. 接口设计<br>
主要接口示例：<br>
   6.1 用户注册<br>
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
   6.2 用户登录<br>
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
   6.3 获取信息流列表<br>
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
   6.4 获取内容详情<br>
       URL：GET /posts/:id<br>
   6.5 发布短图文<br>
       URL：POST /posts<br>
       请求头：Authorization: Bearer <token><br>
       请求体：<br>
       {<br>
           "content": "今天写了一个简易资讯系统",<br>
           "images": ["https://..."]<br>
       }<br>
未来接口拓展：（计划）<br>
   POST /posts/:id/tags/ai-generate：调用 AI 模型对内容打标签<br>
   GET /posts?tag=xxx：根据标签筛选信息流<br>
   GET /topics/recommend?postId=xxx：根据内容推荐话题<br>

7. 前端主要页面说明<br>
    首页 /：显示当前登录用户信息 + 信息流列表（PostList）。<br>
    登录 /login：输入用户名密码，调用 /auth/login，保存 token。<br>
    注册 /register：调用 /auth/register。<br>
    发帖 /post/new：需要登录；文本 + 图片 URL（每行一条）。<br>
    详情 /post/:id：展示全文和所有图片；如果是作者，提供“编辑”入口。<br>
    编辑 /post/:id/edit：加载原内容后编辑并保存。<br>

8. 当前还存在的部分问题，准备继续完成的内容以及后续优化方向（大致对应“挑战”部分）<br>
    富文本编辑器（已完成）<br>
    AI 自动打标签与相关推荐<br>
    下拉刷新、性能优化（LCP、FPS）<br>
    真正的文件上传与 CDN 存储：可能需要借助时尚现有的云服务如七牛云？<br>
    使用 JWT、密码哈希、安全加固等<br>
    目前得依赖代码调试才能进入前端网页，后续需要想办法自己生成一个网址就能直接进入<br>
    进一步挖掘项目深度与技术难点<br>
    

PS：问题（bug）记录与解决<br>
1. react-quill 组件安装出错<br>
   解决方法：确认 React 版本问题，必须是 16/17/18 版本之一，最好是 React18。版本设置可以在 package.json 里修改。<br>
            或者 react 版本过高了，可以降到 18 版本（在fontend目录输入npm install react@18 react-dom@18指令）再重新进行安装（npm install react-quill）。<br>
2. 发布的文字前后带有<p>和</p>，比如说我发的是您好，却显示成了<p>您好</p>。<br>
   原因：列表页直接显示 {post.content} ， 所以页面就真的把 "<p>您好</p>" 当成普通文字输出了<br>
   解决方法：<br>
      首页显示卡片：剥离 HTML 标签，如在 PostList.jsx 文件中<br>
         // 去掉 HTML 标签，把 <p>您好</p> 变成 “您好”<br>
         function stripHtml(html) {<br>
           if (!html) return '';<br>
           return html.replace(/<[^>]+>/g, ''); // 简单正则清理所有标签<br>
         }<br>
      详情页：可以保留富文本效果（粗体、列表），用 dangerouslySetInnerHTML 显示 HTML，如在 PostDetail.jsx文件中<br>
         {/* 清理掉多余的 HTML 标签 */}<br>
         <p style={{ fontSize: 15, lineHeight: 1.6 }}><br>
           {stripHtml(post.content)}<br>
         </p><br>
3. 首页显示时间与实际时间差8小时<br>
   原因：SQLite 里的 时间默认 UTC 时间（0 时区），而上海是在东八区，所以差 8 小时。<br>
   解决方法：把数据库里的 UTC 时间字符串转成本地时间字符串，如在 PostList.jsx 文件中<br>
      function formatDateTime(utcString) {<br>
         if (!utcString) return '';<br>
         // SQLite 默认返回 "YYYY-MM-DD HH:MM:SS"（没有时区信息）<br>
         // 人为加一个 'Z'，告诉 JS 这是 UTC 时间<br>
         const iso = utcString.replace(' ', 'T') + 'Z';<br>
         const date = new Date(iso);<br>
         // 按本地习惯显示，可传入 zh-CN 自定义格式<br>
         return date.toLocaleString('zh-CN', {<br>
            year: 'numeric',<br>
            month: '2-digit',<br>
            day: '2-digit',<br>
            hour: '2-digit',<br>
            minute: '2-digit',<br>
            });<br>
         }<br>
4. 首页帖子同时实现了两次<br>
   原因：可能是由于 PostList.jsx 组件的 loadMore() 函数存在问题，导致每次加载时，会把已有的帖子数据重新加载一次，造成重复渲染。<br>
   解决方法：初次加载数据时，设置 posts 为一个空数组。每次加载更多数据时，不要重新加载和设置已加载过的数据。如在 PostList.jsx 文件中，<br>
      // 避免重复加载内容<br>
       if (data.length < PAGE_SIZE) {<br>
         setHasMore(false);<br>
       }<br>
       // 如果之前已加载过的帖子和这次加载的新帖子重复，则不再设置<br>
       setPosts((prev) => {<br>
         const newPosts = data.filter(<br>
           (newPost) => !prev.some((post) => post.id === newPost.id)<br>
         );<br>
         return [...prev, ...newPosts]; // 新的帖子加到列表中<br>
       });   <br>

   。。。未完待续<br>
