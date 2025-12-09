// React 组件：个人主页

import { Link } from 'react-router-dom';
import PostList from './PostList';

function Profile({ user, handleLogout }) {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      {/* 顶部红色背景区域 */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #ff4d4d, #ff3333)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        padding: '20px',
        position: 'relative',
        width: '100%', 
        boxSizing: 'border-box'
      }}>
        {/* 用户名显示在红色背景底部左侧 */}
        <div style={{
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>{user.username}的个人主页</div>
        
        {/* 退出登录按钮显示在红色背景底部右侧 */}
        <button onClick={handleLogout} style={{ 
          backgroundColor: 'white', 
          color: '#e50914', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '4px', 
          cursor: 'pointer', 
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>退出登录</button>
      </div>
      
      {/* 主要内容区域 */}
      <div> 
        {/* 用户帖子列表 */}
        <PostList user_id={user.id} />
      </div>
      
      {/* 移除底部导航栏占位，因为已经有固定的底部导航栏 */}
    </div>
  );
}

// 未登录状态的个人主页
function UnauthenticatedProfile() {
  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column'
    }}>
      {/* 顶部红色背景区域 */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #ff4d4d, #ff3333)',
        width: '100%',
        boxSizing: 'border-box'
      }}></div>
      
      {/* 主要内容区域 - 登录按钮居中 */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box'
      }}> 
        <Link to="/login" style={{ 
          color: 'black', 
          textDecoration: 'none',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>点击登录</Link> 
      </div>
      {/* 移除底部导航栏占位，因为已经有固定的底部导航栏 */}
    </div>
  );
}

// 导出默认组件，根据登录状态返回不同的组件
function ProfilePage({ user, handleLogout }) {
  if (user) {
    return <Profile user={user} handleLogout={handleLogout} />;
  }
  return <UnauthenticatedProfile />;
}

export default ProfilePage;
