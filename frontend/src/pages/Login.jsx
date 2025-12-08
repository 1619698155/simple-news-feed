// React 组件：登录页面

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
      // 登录成功后保存登录信息至浏览器本地存储
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* 顶部渐变背景 */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #ff4d4d, #ff3333)',
        position: 'relative',
        overflow: 'hidden'
      }}>
      </div>
      
      {/* 主要内容区域 */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        marginTop: '-80px'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '30px',
          textAlign: 'center'
        }}>登录</h1>
        
        <form onSubmit={handleSubmit} style={{
          width: '100%',
          maxWidth: '400px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* 输入框容器 */}
          <div style={{
            width: '100%',
            borderBottom: '1px solid #ddd',
            paddingBottom: '8px'
          }}>
            <input // 输入框用于用户名
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 0',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                backgroundColor: 'transparent'
              }}
            />
          </div>
          
          <div style={{
            width: '100%',
            borderBottom: '1px solid #ddd',
            paddingBottom: '8px'
          }}>
            <input // 输入框用于密码
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 0',
                border: 'none',
                outline: 'none',
                fontSize: '16px',
                backgroundColor: 'transparent'
              }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              backgroundColor: '#ff3333',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              padding: '14px 20px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.3s'
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        {error && <p style={{ 
          color: '#ff3333', 
          marginTop: '16px',
          fontSize: '14px',
          textAlign: 'center'
        }}>{error}</p>}
        
        <div style={{ 
          marginTop: '20px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          还没有账号？去 <Link to="/register" style={{ 
            color: '#ff3333',
            textDecoration: 'none'
          }}>注册</Link>
        </div>
      </div>
      
      {/* 底部导航栏占位 */}
      <div style={{
        height: '60px',
        borderTop: '1px solid #eee'
      }}></div>
    </div>
  );
}

export default Login;
