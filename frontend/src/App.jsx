// frontend/src/App.jsx

import { useState } from 'react'; // 从 React 中导入 useStateHook，用于在函数组件内管理状态
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

// 导航栏组件
function NavBar({ user, onLogout }) { // 接受两个属性：user 和 onLogout
  const location = useLocation(); // 使用 useLocationHook 获取当前的路由位置信息

  const linkStyle = (path) => ({ // 内联样式函数，用于确定传入的路径是否与当前路径匹配
    marginRight: 12,
    textDecoration: location.pathname === path ? 'underline' : 'none',
  });
  // 返回导航栏的UI结构
  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <div>
        <Link to="/" style={linkStyle('/')}>
          首页
        </Link>
        {!user && (
          <>
            <Link to="/login" style={linkStyle('/login')}>
              登录
            </Link>
            <Link to="/register" style={linkStyle('/register')}>
              注册
            </Link>
          </>
        )}
      </div>
      <div>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>你好，{user.username}</span>
            <button onClick={onLogout}>退出登录</button>
          </>
        ) : (
          <span style={{ fontSize: 12, color: '#666' }}>未登录</span>
        )}
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
    setAuth({ user: authData.user, token: authData.token });
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
      }}
    >
      <NavBar user={auth.user} onLogout={handleLogout} />

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
