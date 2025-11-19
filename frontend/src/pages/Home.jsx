// frontend/src/pages/Home.jsx

import { Link } from 'react-router-dom';
import PostList from './PostList';

function Home({ user }) {
  return (
    <div>
      <h2>首页</h2>
      {user ? (
        <>
          <p>
            当前登录用户：<strong>{user.username}</strong>
          </p>
          <p style={{ marginTop: 12 }}>
            <Link to="/post/new">➕ 去发布一条新的短图文</Link>
          </p>
        </>
      ) : (
        <p>当前未登录，请先登录或注册后再发布内容。</p>
      )}

      <hr style={{ margin: '16px 0' }} />

      {/* 信息流列表 */}
      <PostList />
    </div>
  );
}

export default Home;
