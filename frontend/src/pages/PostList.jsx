// React 组件：帖子列表页，支持分页加载和下拉刷新

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGetPosts } from '../api';

// 添加CSS样式以支持旋转动画
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

const PAGE_SIZE = 5; // 每次加载 5 条

// 时间格式处理
function formatDateTime(utcString) {
  if (!utcString) return '';

  // SQLite 默认格式 "YYYY-MM-DD HH:MM:SS"，没有时区信息
  // 加一个 'Z' 告诉 JS 这是 UTC，再转换成本地时间
  const iso = utcString.replace(' ', 'T') + 'Z';
  const date = new Date(iso);

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PostList({ user_id = null }) {
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  // 下拉刷新相关状态
  const [refreshing, setRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDistance, setDragDistance] = useState(0);
  // 下拉刷新阈值
  const REFRESH_THRESHOLD = 80;
  // 用于跟踪起始触摸/鼠标位置
  const startYRef = useRef(0);
  // 容器引用
  const containerRef = useRef(null);

  useEffect(() => {
    // 首屏加载 - 重置状态
    setPosts([]);
    setOffset(0);
    setHasMore(true);
    loadMore();
  }, [user_id]); // 当user_id变化时重新加载帖子

  // 下拉刷新事件处理函数
  const handleMouseDown = (e) => {
    // 只有当页面滚动到顶部且不在刷新状态时才允许下拉
    if (window.scrollY === 0 && !refreshing) {
      startYRef.current = e.clientY;
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && !refreshing) {
      const currentY = e.clientY;
      const distance = currentY - startYRef.current;
      
      // 只允许向下拉动且有一定距离才触发
      if (distance > 0) {
        // 限制最大下拉距离
        const limitedDistance = Math.min(distance * 0.5, REFRESH_THRESHOLD * 1.5);
        setDragDistance(limitedDistance);
        e.preventDefault(); // 防止页面滚动
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      // 检查是否达到刷新阈值
      if (dragDistance >= REFRESH_THRESHOLD && !refreshing) {
        // 触发刷新
        refreshPosts();
      }
      // 重置状态
      setIsDragging(false);
      setDragDistance(0);
    }
  };

  useEffect(() => {
    // 添加滚动监听事件
    const handleScroll = () => {
      // 当滚动到页面底部附近时触发加载
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 200) {
        if (hasMore && !loading) {
          loadMore();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // 添加鼠标事件监听器用于下拉刷新
    if (containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      // 确保鼠标离开容器时也能结束拖动
      container.addEventListener('mouseleave', handleMouseUp);
    }

    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (containerRef.current) {
        const container = containerRef.current;
        container.removeEventListener('mousedown', handleMouseDown);
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('mouseleave', handleMouseUp);
      }
    };
  }, [loading, hasMore, isDragging, dragDistance, refreshing, user_id]); // 依赖项确保逻辑正确更新

  // 通用数据加载函数，用于代码复用
  async function fetchPosts(currentOffset, isRefresh = false) {
    try {
      console.log(`${isRefresh ? '刷新' : '加载更多'}帖子：offset=${currentOffset}, limit=${PAGE_SIZE}, user_id=${user_id}`);
      const data = await apiGetPosts({ offset: currentOffset, limit: PAGE_SIZE, user_id });
      console.log(`API返回数据：${data.length}条，ID=${data.map(p => p.id).join(', ')}`);
      console.log('API返回数据详情：', data);
      
      // 前端额外过滤，确保只显示当前用户的帖子
      if (user_id) {
        const filteredData = data.filter(post => post.user_id === user_id);
        console.log(`前端过滤后数据：${filteredData.length}条，ID=${filteredData.map(p => p.id).join(', ')}`);
        return filteredData;
      }
      
      return data;
    } catch (e) {
      throw new Error(e.message || (isRefresh ? '刷新失败' : '加载失败'));
    }
  }

  // 刷新帖子列表函数
  async function refreshPosts() {
    if (refreshing) return;
    setRefreshing(true);
    setError('');
    
    try {
      // 重新加载第一页数据
      const data = await fetchPosts(0, true);
      
      // 更新状态 - 使用函数式更新确保获取最新状态
      setPosts(() => data);
      setOffset(() => data.length);
      setHasMore(() => data.length >= PAGE_SIZE);
      
      console.log(`刷新成功，加载了${data.length}条新数据`);
    } catch (e) {
      setError(e.message);
      console.error('刷新失败:', e);
    } finally {
      // 无论如何都要重置refreshing状态
      setRefreshing(false);
    }
  }

  // 加载更多帖子函数
  async function loadMore() {
    // 三重检查，防止重复加载或在刷新时加载
    if (loading || !hasMore || refreshing) return;
    
    // 保存当前offset值，避免闭包问题
    const currentOffset = offset;
    setLoading(true);
    setError('');

    try {
      const data = await fetchPosts(currentOffset, false);
      
      // 只有当返回空数组时才认为没有更多数据
      if (data.length === 0) {
        setHasMore(false);
        console.log('没有更多数据了');
      } else {
        // 使用函数式更新确保获取最新状态
        setPosts((prevPosts) => {
          // 确保只添加新数据，避免重复
          const newPosts = data.filter(newPost => 
            !prevPosts.some(existingPost => existingPost.id === newPost.id)
          );
          return [...prevPosts, ...newPosts];
        });
        
        // 更新offset - 使用当前保存的值加上新数据长度
        setOffset(currentOffset + data.length);
        
        // 如果返回的数据少于请求的数量，说明已经没有更多数据了
        setHasMore(data.length >= PAGE_SIZE);
      }
    } catch (e) {
      setError(e.message);
      console.error('加载更多失败:', e);
    } finally {
      // 无论如何都要重置loading状态
      setLoading(false);
    }
  }

  // 计算刷新指示器的样式
  const refreshIndicatorStyle = {
    height: dragDistance,
    display: isDragging || refreshing ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: 14,
    transition: 'height 0.3s ease',
    overflow: 'hidden'
  };

  // 根据状态确定显示文本
  const getRefreshText = () => {
    if (refreshing) {
      return '刷新中...';
    } else if (dragDistance >= REFRESH_THRESHOLD) {
      return '释放刷新';
    } else {
      return '下拉刷新';
    }
  };

  return (
    <div ref={containerRef} style={{ overflow: 'visible', userSelect: isDragging ? 'none' : 'auto' }}>
      {/* 下拉刷新指示器 */}
      <div style={refreshIndicatorStyle}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transform: `translateY(${(dragDistance - 40) / 2}px)`,
          transition: 'transform 0.1s ease'
        }}>
          {/* 刷新图标 */}
          <div style={{
            width: 20,
            height: 20,
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            animation: refreshing ? 'spin 1s linear infinite' : 'none',
            transform: refreshing ? 'rotate(0deg)' : `rotate(${dragDistance * 0.45}deg)`
          }}></div>
          <span>{getRefreshText()}</span>
        </div>
      </div>
      
      <div style={{ marginTop: refreshing || isDragging ? -10 : 0, transition: 'margin-top 0.3s ease' }}>
        <h3 className="post-title"></h3>

      {posts.length === 0 && !loading && <p className="empty-post-message">暂无内容，快去发布一条吧～</p>}

      <div className="post-container" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12,
        width: '100%', 
        padding: '0', 
        boxSizing: 'border-box' 
      }}>
        {posts.map((post) => {
          // 现在直接使用dangerouslySetInnerHTML渲染富文本内容
          return (
            <div
              key={post.id}
              className="card"
              style={{
                height: '18vh', 
                padding: 12,
                display: 'flex', 
                position: 'relative',
                width: '100%', 
                boxSizing: 'border-box', 
                border: 'none', 
                backgroundColor: 'transparent', 
                boxShadow: 'none', 
              }}
            >
              <Link
                to={`/post/${post.id}`}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  width: '100%',
                }}
              >
                {/* 文字内容占左侧78% */}
                <div style={{ width: '78%', paddingRight: '8px', display: 'flex', flexDirection: 'column' }}>
                  {/* 标题或第一句话提取函数 */}
                  {(() => {
                    if (post.title) return post.title;
                    if (!post.content) return '';
                    
                    // 处理HTML内容，提取第一行文字
                    let firstLine = '';
                    
                    // 1. 先按HTML标签分割，找到第一个有效内容
                    const contentWithoutHtml = post.content.replace(/<[^>]*>/g, '\n');
                    // 2. 按换行符分割，过滤空行，取第一个非空行
                    const lines = contentWithoutHtml.split('\n').filter(line => line.trim() !== '');
                    if (lines.length > 0) {
                      firstLine = lines[0].trim();
                    }
                    
                    // 3. 如果没有有效内容，使用默认值
                    if (!firstLine) {
                      firstLine = '无标题';
                    }
                    
                    return firstLine.slice(0, 50).trim();
                  })()}
                  
                  {/* 空行 - 与上方文字保持距离 */}
                  <div style={{ marginBottom: '8px' }}></div>
                  
                  {/* 帖子关联话题已移至详情页显示，此处不再显示 */}
                  
                  {/* 发布人和发布时间 */}
                  <div style={{ fontSize: 12, color: '#999', marginTop: 'auto' }}>
                    {post.author_name || `用户#${post.user_id}`}{'     '}{formatDateTime(post.created_at)}
                  </div>
                </div>

                {/* 图片内容占右侧22%，上下对齐模块边缘 */}
                {(() => {
                  // 首先尝试从images数组获取图片
                  if (post.images && post.images.length > 0) {
                    return (
                      <div style={{ width: '22%', height: '100%', display: 'flex', alignItems: 'stretch' }}>
                        <img
                          src={post.images[0]}
                          alt="缩略图"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: 6,
                          }}
                        />
                      </div>
                    );
                  }
                  
                  // 如果images数组为空，尝试从content中提取图片
                  if (post.content) {
                    // 支持双引号、单引号和无引号的src属性
                    const imgRegex = /<img[^>]+src=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/g;
                    const match = imgRegex.exec(post.content);
                    if (match) {
                      const imgUrl = match[1] || match[2] || match[3];
                      if (imgUrl) {
                        return (
                          <div style={{ width: '20%', height: '100%', display: 'flex', alignItems: 'stretch' }}>
                            <img
                              src={imgUrl}
                              alt="缩略图"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 6,
                              }}
                            />
                          </div>
                        );
                      }
                    }
                  }
                  
                  // 没有图片时显示空白占位
                  return <div style={{ width: '20%' }}></div>;
                })()}
              </Link>
            </div>
          );
        })}
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}

      {loading && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: 12, 
          marginBottom: 12,
          padding: 16,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8
        }}>
          {/* 简单的加载指示器 */}
          <div style={{
            width: 16,
            height: 16,
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <span style={{ fontSize: 14, color: '#666' }}>加载中...</span>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          已经到底啦～
        </p>
      )}
      </div>
    </div>
  );
}

export default PostList;