// frontend/src/pages/Register.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRegister } from '../api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      await apiRegister(username, password);
      setSuccessMsg('注册成功，自动跳转到登录页...');
      // 1 秒后跳转登录
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>注册</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input
          type="text"
          placeholder="用户名（请记住）"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码（简单也可以，练习用）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      {successMsg && <p style={{ color: 'green', marginTop: 8 }}>{successMsg}</p>}
      <p style={{ marginTop: 12 }}>
        已经有账号了？去 <Link to="/login">登录</Link>
      </p>
    </div>
  );
}

export default Register;
