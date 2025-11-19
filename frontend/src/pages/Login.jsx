// frontend/src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiLogin } from '../api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await apiLogin(username, password);
      // 保存到 localStorage
      const authData = {
        token: data.token,
        user: data.user,
      };
      localStorage.setItem('auth', JSON.stringify(authData));

      // 通知父组件（App）更新状态
      onLoginSuccess(authData);

      // 跳转到首页
      navigate('/');
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>登录</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      <p style={{ marginTop: 12 }}>
        还没有账号？去 <Link to="/register">注册</Link>
      </p>
    </div>
  );
}

export default Login;
