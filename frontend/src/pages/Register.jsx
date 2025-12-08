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
        {/* 顶部渐变背景 */}
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
        }}>注册</h1>
        
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
            <input
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
            <input
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
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        
        {error && <p style={{ 
          color: '#ff3333', 
          marginTop: '16px',
          fontSize: '14px',
          textAlign: 'center'
        }}>{error}</p>}
        
        {successMsg && <p style={{ 
          color: '#4CAF50', 
          marginTop: '16px',
          fontSize: '14px',
          textAlign: 'center'
        }}>{successMsg}</p>}
        
        <div style={{ 
          marginTop: '20px',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          已经有账号了？去 <Link to="/login" style={{ 
            color: '#ff3333',
            textDecoration: 'none'
          }}>登录</Link>
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

export default Register;
