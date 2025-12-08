// 推荐页面组件 - 基于当前用户个性化推荐的帖子

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiGetRecommendedPosts } from '../api';

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

// 把 SQLite 的 UTC 时间字符串转成本地时间字符串（解决差 8 小时）
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

// 提取内容的第一句话
function getFirstSentence(content) {
  if (!content) return '';
  
  // 移除HTML标签
  const plainText = content.replace(/<[^>]+>/g, '');
  
  // 查找第一个句号、问号或感叹号
  const sentenceEndIndex = plainText.search(/[。？！]/);
  
  // 如果找到了句末标点，就返回第一个句子
  if (sentenceEndIndex !== -1) {
    return plainText.substring(0, sentenceEndIndex + 1);
  }
  
  // 如果没有句末标点，就返回第一个词或短语（以空格分隔）
  const firstWordIndex = plainText.search(/\s/);
  if (firstWordIndex !== -1) {
    return plainText.substring(0, firstWordIndex);
  }
  
  // 如果都没有，就返回全部内容
  return plainText;
}

function Recommend({ user }) {
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
  }, []); // 只在组件挂载时执行一次

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
  }, [loading, hasMore, isDragging, dragDistance, refreshing]); // 依赖项确保逻辑正确更新

  // 通用数据加载函数，用于代码复用
  async function fetchRecommendedPosts(currentOffset, isRefresh = false) {
    try {
      console.log(`${isRefresh ? '刷新' : '加载更多'}推荐帖子：offset=${currentOffset}, limit=${PAGE_SIZE}`);
      // 确保userId是字符串类型
      const userId = user && user.id ? String(user.id) : null;
      const data = await apiGetRecommendedPosts({ 
        offset: currentOffset, 
        limit: PAGE_SIZE,
        userId: userId
      });
      console.log(`API返回推荐数据：${data.length}条，ID=${data.map(p => p.id).join(', ')}`);
      
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
      const data = await fetchRecommendedPosts(0, true);
      
      // 更新状态 - 使用函数式更新确保获取最新状态
      setPosts(() => data);
      setOffset(() => data.length);
      setHasMore(() => data.length >= PAGE_SIZE);
      
      console.log(`刷新成功，加载了${data.length}条推荐数据`);
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
      const data = await fetchRecommendedPosts(currentOffset, false);
      
      // 只有当返回空数组时才认为没有更多数据
      if (data.length === 0) {
        setHasMore(false);
        console.log('没有更多推荐数据了');
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
        <h3>为你推荐</h3>
      
      {posts.length === 0 && !loading && <p>暂无推荐内容，稍后再来看看吧～</p>}

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 12,
        width: '50%', // 65% - 15% = 50%
        marginLeft: '15%' // 左端在页面左侧15%处
      }}>
        {posts.map((post) => {
          return (
            <div
              key={post.id}
              className="card"
              style={{
                border: '1px solid #eee',
                borderRadius: 8,
                padding: 12,
                display: 'flex', // 使用flex布局来分离文字和图片
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <Link
                to={post.external_link ? post.external_link : `#`}
                target={post.external_link ? '_blank' : '_self'}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  display: 'flex',
                  width: '100%',
                  marginBottom: '12px', // 与下方元素保持一定距离
                }}
              >
                {/* 文字内容占左侧80% */}
                <div style={{ width: '80%', paddingRight: '8px' }}>
                  {/* 列表页只显示第一句话 */}
                  <div
                    style={{
                      fontSize: 14,
                      marginTop: '4px',
                    }}
                  >
                    {getFirstSentence(post.content || '')}
                  </div>
                </div>

                {/* 图片内容占右侧20% */}
                {post.images && post.images.length > 0 && (
                  <div style={{ width: '20%', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                    <img
                      src={post.images[0]}
                      alt="缩略图"
                      style={{
                        width: '100%',
                        maxHeight: 80,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                  </div>
                )}
              </Link>
              
              {/* 帖子关联话题显示 - 移到下方 */}
              {post.topics && post.topics.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                  {post.topics.map((topic, index) => (
                    <span 
                      key={index} 
                      style={{
                        backgroundColor: '#f0f0f0',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: '#333'
                      }}
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
              
              {/* 发布人信息和时间 - 移到下方，紧挨在话题标签上方 */}
              <div
                style={{
                  fontSize: 12,
                  color: '#666',
                  marginTop: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  发布人：{post.author_name || `用户#${post.user_id || '未知'}`}
                </span>
                <span>{formatDateTime(post.created_at) || '刚刚'}</span>
              </div>
              
              {/* 显示推荐来源 */}
              <div style={{
                fontSize: 10,
                color: '#999',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                来源：今日头条
              </div>
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

export default Recommend;
