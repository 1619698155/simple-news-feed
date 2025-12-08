// frontend/src/App.jsx

import React, { useState } from 'react'; // 从 React 中导入 useStateHook，用于在函数组件内管理状态
import './responsive.css'; // 导入响应式样式
import { // 从 react-router-dom 库中导入路由相关的组件和 Hook
  BrowserRouter, // 使用HTML5 History API来管理路由
  Routes, // 用于定义路径和要渲染的组件之间的映射关系。Routes 包裹多个 Route，确保只渲染第一个匹配的路由
  Route,
  Link, // 声明式的导航链接，点击后不会刷新整个页面
  useLocation, // 一个 Hook，返回当前页面的位置信息，用于判断当前所在路径
  Navigate, // 用于编程式地重定向到其他路由
} from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostEditor from './pages/PostEditor';
import PostDetail from './pages/PostDetail';
import Recommend from './pages/Recommend';

// 导航栏组件
function NavBar({ user }) { // 接受一个属性：user
  const location = useLocation(); // 使用 useLocationHook 获取当前的路由位置信息
  
  // 处理搜索功能
  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      const inputElement = e.target.tagName === 'BUTTON' ? e.target.previousElementSibling : e.target;
      const searchTerm = inputElement.value;
      console.log('搜索:', searchTerm);
      // 实际应用中这里会调用API进行搜索
    }
  };

  const linkStyle = (path) => ({ // 内联样式函数，用于确定传入的路径是否与当前路径匹配
    marginRight: 12,
    textDecoration: location.pathname === path ? 'underline' : 'none',
    color: location.pathname === path ? '#e50914' : 'black', // 活动链接为红色，非活动链接为黑色
    backgroundColor: 'transparent', // 明确指定无背景颜色
  });
  // 返回导航栏的UI结构
  return (
    <nav
      style={{
        position: 'sticky',                    // 固定在页面顶部
        top: 0,                                // 顶部对齐
        zIndex: 1,                            // 降低层级，确保图片在底层
        backdropFilter: 'blur(6px)',           // 背景模糊效果
        minHeight: '10vh',                     // 最小高度为浏览器高度的10%
        display: 'flex',                       // 使用flex布局
        flexDirection: 'column',               // 垂直排列
        border: 'none',                        // 确保无边框
        outline: 'none',                       // 确保无轮廓
        boxShadow: 'none'                      // 确保无阴影效果
      }}
    >
      {/* 第一行：Logo、搜索框、发布、用户信息 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          width: '100%',
          backgroundColor: '#e50914',           // 第一行背景颜色为红色
          padding: '10px 20px',                 // 内边距，与底部导航栏保持一致的左右间距
          color: 'white', // 设置文字颜色为白色，确保在红色背景上的可读性
          boxSizing: 'border-box'               // 确保padding不影响宽度
        }}>
        <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e50914' }}>
          <Link to="/" style={{ ...linkStyle('/'), textDecoration: 'none' }}>
          </Link>
        </div>
        
        {/* 始终显示的搜索框 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: '500px', marginLeft: '15px' }}>
          <input 
            type="text" 
            placeholder="搜索" 
            style={{
              padding: '10px 15px', 
              borderRadius: '22px', 
              border: '1px solid #ddd',
              fontSize: '14px',
              width: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            onKeyPress={handleSearch}
          />
          <img 
            src="/assets/搜索框.png" 
            alt="搜索" 
            style={{
              cursor: 'pointer',
              height: '40px', // 设置合适的高度
              width: 'auto',
              border: 'none',
              background: 'none'
            }}
            onClick={(e) => {
              // 阻止冒泡
              e.stopPropagation();
              // 这里可以添加搜索逻辑
              const inputElement = e.target.previousElementSibling;
              const searchTerm = inputElement.value;
              console.log('搜索:', searchTerm);
              // 实际应用中这里会调用API进行搜索
            }}
          />
        </div>

        {/* 移除了发布功能 */}
        
        {/* 用户信息 */}
        <div style={{ marginLeft: '15px' }}>
          {!user && (
            <>
              <Link to="/login" style={{ ...linkStyle('/login'), color: 'white' }}>
                登录
              </Link>
            </>
          )}
        </div>
      </div>
      
      {/* 第二行：关注、推荐、更多，与上一行间距为网页高度的5% */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', // 两端对齐
          width: '100%',
          backgroundColor: 'white', // 第二行背景颜色为白色
          padding: '10px 20px', // 内边距，与底部导航栏保持一致的左右间距
          marginTop: '0', // 去掉顶部间距
          border: 'none', // 确保无边框
          outline: 'none', // 确保无轮廓
          boxShadow: 'none', // 确保无阴影效果
          boxSizing: 'border-box' // 确保padding不影响宽度
        }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: '20px' }}>  
          <Link to="/follow" style={{...linkStyle('/follow'), textAlign: 'center', color: 'black'}}>关注</Link>
          <Link to="/recommend" style={{...linkStyle('/recommend'), textAlign: 'center', color: 'black'}}>推荐</Link>
          <Link to="/more" style={{...linkStyle('/more'), textAlign: 'center', color: 'black'}}>更多</Link>
        </div>
      </div>
    </nav>
  );
}

// 需要登录的路由包装，用于保护需要登录才能访问的路由
function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppInner() {
  const location = useLocation(); // 使用useLocation获取当前路由位置
  
  // 底部导航栏链接样式函数
  const bottomNavLinkStyle = (path) => ({
    textDecoration: 'none', // 去掉下划线
    color: location.pathname === path ? 'red' : 'black', // 当前页面为红色，其他为黑色
    flex: 1, // 等分空间
    textAlign: 'center', // 居中显示
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  });
  
  // 使用 useState 初始化认证状态 auth，尝试从浏览器的 localStorage 读取之前的登录信息
  const [auth, setAuth] = useState(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token && parsed.user) {
          return { user: parsed.user, token: parsed.token };
        }
      } catch (e) {
        console.error('解析本地登录信息失败：', e);
      }
    }
    return { user: null, token: null };
  });
// 处理登录成功的函数:接收认证数据，更新 auth 状态
  function handleLoginSuccess(authData) {
    setAuth(authData);
    // 将登录信息保存在本地存储中，实现记住登录状态
    localStorage.setItem('auth', JSON.stringify(authData));
  }
// 处理退出登录的函数：将 auth状态重置，清除 localStorage 中的登录数据
  function handleLogout() {
    setAuth({ user: null, token: null });
    localStorage.removeItem('auth');
  }

  return (
    <div
      className="app-container"
      style={{
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        paddingBottom: '60px' // 添加底部内边距避免内容被底部导航栏遮挡
      }}
    >
      {/* 只在指定页面显示顶部导航栏 */}
      {(location.pathname === '/' || location.pathname === '/home' || location.pathname === '/follow' || location.pathname === '/recommend' || location.pathname === '/more') && <NavBar user={auth.user} />}
      
      {/* 底部导航栏：首页、+、我的，固定在页面最底部 */}
      <div className="bottom-nav" style={{ 
        position: 'fixed',
        bottom: '0%',
        left: 0,
        right: 0,
        display: 'flex',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px 20px',
        borderTop: '1px solid #e5e7eb',
        zIndex: 100,
        boxSizing: 'border-box', // 确保padding不会使宽度超过100%
        height: '5vh', // 高度为网页高度的5%
        alignItems: 'center'
      }}>
        <Link to="/" style={bottomNavLinkStyle('/')}>首页</Link>
        <Link to="/post/new" style={{ ...bottomNavLinkStyle('/post/new'), fontSize: '2em', fontWeight: 'bold' }}>+</Link>
        <Link to="/user/profile" style={bottomNavLinkStyle('/user/profile')}>我的</Link>
      </div>

      <Routes>
        <Route path="/" element={<Home user={auth.user} />} />
        <Route
          path="/login"
          element={<Login onLoginSuccess={handleLoginSuccess} />}
        />
        <Route path="/register" element={<Register />} />

        {/* 详情页（不要求必须登录） */}
        <Route
          path="/post/:id"
          element={<PostDetail currentUser={auth.user} />}
        />

        {/* 新建短图文（需要登录） */}
        <Route
          path="/post/new"
          element={
            <RequireAuth user={auth.user}>
              <PostEditor token={auth.token} />
            </RequireAuth>
          }
        />

        {/* 编辑短图文（需要登录） */}
        <Route
          path="/post/:id/edit"
          element={
            <RequireAuth user={auth.user}>
              <PostEditor token={auth.token} />
            </RequireAuth>
          }
        />
        
        {/* 推荐页面 */}
        <Route
          path="/recommend"
          element={<Recommend user={auth.user} />}
        />
        
        {/* 底部导航栏相关路由 */}
        <Route path="/user/profile" element={auth.user ? 
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            fontSize: '18px' 
          }}> 
            <div>{auth.user.username}的个人主页</div> 
            <div style={{ marginTop: '15px' }}> 
              <button onClick={handleLogout} style={{ 
                backgroundColor: '#e50914', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer', 
                fontSize: '16px' 
              }}>退出登录</button> 
            </div> 
          </div> : 
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            fontSize: '18px' 
          }}> 
            <Link to="/login" style={{ 
              color: '#e50914', 
              textDecoration: 'none' 
            }}>点击登录</Link> 
          </div> 
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;
