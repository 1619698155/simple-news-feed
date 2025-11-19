// frontend/src/App.jsx

import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostEditor from './pages/PostEditor';
import PostDetail from './pages/PostDetail';

// 导航栏
function NavBar({ user, onLogout }) {
  const location = useLocation();

  const linkStyle = (path) => ({
    marginRight: 12,
    textDecoration: location.pathname === path ? 'underline' : 'none',
  });

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

// 需要登录的路由包装
function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppInner() {
  // 从 localStorage 初始化登录信息
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

  function handleLoginSuccess(authData) {
    setAuth({ user: authData.user, token: authData.token });
  }

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
