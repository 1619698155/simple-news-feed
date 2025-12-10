flowchart LR
    %% ========== 前端 ==========
    subgraph FE[Frontend（React 应用 /frontend/src）]
        Home[Home.jsx<br/>首页 / Feed 入口]
        Login[Login.jsx<br/>登录页]
        Register[Register.jsx<br/>注册页]
        Profile[Profile.jsx<br/>个人主页]
        PostList[PostList.jsx<br/>短图文列表]
        PostDetail[PostDetail.jsx<br/>内容详情页]
        PostEditor[PostEditor.jsx<br/>发布/编辑器页]
        API[api.js<br/>封装所有 HTTP 请求]
    end

    %% ========== 后端 ==========
    subgraph BE[Backend（Node.js /backend）]
        Router[index.js<br/>路由入口]
        AuthCtrl[Auth Controller<br/>登录/注册/退出登录]
        PostCtrl[Post Controller<br/>发布/编辑/查询图文]
        FeedCtrl[Feed Controller<br/>时间排序/分页加载]
        TagCtrl[Tag/AI 模块<br/>内容打标签（可选）]
        DB[(database.sqlite<br/>db.js 数据访问)]
        Uploads[[uploads/ 图片文件存储]]
    end

    %% ========== 角色 ==========
    User((用户浏览器))

    %% 用户与各页面
    User --> Home
    User --> Login
    User --> Register
    User --> Profile

    %% 前端内部导航关系（React Router）
    Home -->|查看列表| PostList
    PostList -->|点击某条内容| PostDetail
    PostDetail -->|编辑按钮| PostEditor
    Profile -->|查看自己发布的| PostList
    Home -->|发布按钮| PostEditor
    Login -->|登录成功后跳转| Home
    Register -->|注册成功后跳转| Login

    %% 所有页面统一通过 api.js 调用后端
    Login -->|登录/退出| API
    Register -->|注册| API
    PostList -->|获取列表/分页| API
    PostDetail -->|获取详情| API
    PostEditor -->|发布/更新内容<br/>上传图片| API
    Profile -->|获取个人信息/内容| API

    %% api.js 与后端
    API -->|HTTP /auth/*, /posts/*, /feed/*| Router

    %% 路由到各业务模块
    Router --> AuthCtrl
    Router --> PostCtrl
    Router --> FeedCtrl
    Router --> TagCtrl

    %% 业务模块访问数据库 & 文件
    AuthCtrl --> DB
    PostCtrl --> DB
    FeedCtrl --> DB
    PostCtrl --> Uploads
    TagCtrl --> DB

    %% 发布后调用打标签逻辑
    PostCtrl -->|新内容发布后调用| TagCtrl
