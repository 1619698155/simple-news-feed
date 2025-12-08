// React 组件：首页

import { Link } from 'react-router-dom';
import PostList from './PostList';

function Home() {
  return (
    <div>
      {/* 信息流列表 - 直接在导航栏下方显示 */}
      <div style={{ 
        backgroundColor: 'white', 
        minHeight: '95vh' // 确保占据剩余空间
      }}>
        <PostList />
      </div>
    </div>
  );
}

export default Home;
