# 项目部署说明

本项目采用前后端分离架构，前端部署在Vercel，后端部署在Render。

## 一、后端部署（Render）

### 1. 创建Render账户
如果还没有Render账户，先注册一个：https://render.com/

### 2. 部署后端

1. 登录Render后，点击"New"按钮，选择"Web Service"
2. 选择连接GitHub仓库，找到你的项目仓库
3. 配置部署参数：
   - **Name**: 输入一个名称，如 "simple-news-backend"
   - **Region**: 选择一个合适的区域
   - **Branch**: 选择主分支（main/master）
   - **Root Directory**: 输入 `backend`
   - **Environment**: 选择 "Node"
   - **Build Command**: 留空（Render会自动运行 `npm install`）
   - **Start Command**: 输入 `npm start`
4. 点击"Advanced"按钮，添加环境变量：
   - 点击"Add Environment Variable"
   - 添加 `ARK_API_KEY`，值为你的API密钥
   - 添加 `PORT`，值为 `3000`
5. 点击"Create Web Service"开始部署

6. 部署完成后，你会获得一个后端URL，如 `https://simple-news-backend.onrender.com`

## 二、前端部署（Vercel）

### 1. 创建Vercel账户
如果还没有Vercel账户，先注册一个：https://vercel.com/

### 2. 部署前端

1. 登录Vercel后，点击"Add New"按钮，选择"Project"
2. 选择连接GitHub仓库，找到你的项目仓库
3. 配置部署参数：
   - **Framework**: 选择 "Vite"
   - **Root Directory**: 输入 `frontend`
4. 点击"Environment Variables"按钮，添加环境变量：
   - 点击"Add"按钮
   - 添加 `VITE_API_BASE`，值为你在Render上获得的后端URL（如 `https://simple-news-backend.onrender.com`）
5. 点击"Deploy"开始部署

6. 部署完成后，你会获得一个前端URL，如 `https://simple-news-feed.vercel.app`

## 三、测试部署

部署完成后，访问前端URL（如 `https://simple-news-feed.vercel.app`），测试应用是否正常工作：

1. 测试注册/登录功能
2. 测试发布帖子功能
3. 测试查看帖子列表功能
4. 测试查看帖子详情功能
5. 测试上传图片功能

## 四、注意事项

1. **后端数据库**：当前使用SQLite数据库，数据存储在Render服务器的文件系统中。在生产环境中，建议使用外部数据库服务（如PostgreSQL）以提高可靠性。

2. **环境变量**：确保在Render和Vercel上正确配置了所有必要的环境变量。

3. **CORS**：后端已经配置了CORS中间件，允许所有来源的请求。如果需要更严格的控制，可以修改 `backend/index.js` 中的CORS配置。

4. **文件上传**：文件上传功能使用了本地文件系统存储。在生产环境中，建议使用云存储服务（如AWS S3、Cloudinary）。

5. **部署更新**：当代码更新并推送到GitHub后，Render和Vercel会自动触发重新部署。

## 五、故障排除

1. **前端无法连接后端**：检查Vercel上的 `VITE_API_BASE` 环境变量是否正确设置为Render后端URL。

2. **后端服务无法启动**：检查Render上的环境变量是否正确配置，特别是 `ARK_API_KEY` 和 `PORT`。

3. **数据库连接问题**：检查SQLite数据库文件是否能正常创建和访问。

4. **文件上传失败**：检查上传目录权限是否正确，文件大小是否超过限制。

如果遇到其他问题，可以查看Render和Vercel的日志文件获取更多信息。