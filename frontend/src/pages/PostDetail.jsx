// React 组件：显示单个短图文内容的详情页

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGetPost } from '../api';

function PostDetail({ currentUser }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { // 组件加载时获取内容详情
    async function fetchPost() { // 定义异步函数获取内容
      setLoading(true); // 设置加载状态
      setError(''); // 清除之前的错误信息
      try { // 尝试获取内容数据
        const data = await apiGetPost(id);
        setPost(data); // 设置内容数据
      } catch (e) {
        setError(e.message || '加载失败'); // 设置错误信息
      } finally {
        setLoading(false); // 结束加载状态
      }
    }

    fetchPost(); // 调用获取内容函数
  }, [id]);

  if (loading) {
    return <p>加载中...</p>; // 显示加载状态
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>; // 显示错误信息
  }

  if (!post) {
    return <p>未找到内容</p>; // 显示未找到内容信息
  }

  const isAuthor =
    currentUser && currentUser.id === post.user_id; // 判断当前用户是否为内容作者

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh' }}> {/* 内容详情容器 */}
      {/* 作者信息区域 - 类似图一的发布者信息栏 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        {/* 返回按钮 - 移动到原头像占位的圆形位置 */}
        <button 
          onClick={() => navigate(-1)} 
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            border: 'none',
            marginRight: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ←
        </button>
        
        {/* 作者信息 */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            marginBottom: '2px'
          }}>
            {post.author_name || `用户#${post.user_id}`}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {post.created_at}
          </div>
        </div>
        
        {/* 关注按钮 */}
        <button style={{
          backgroundColor: '#ff3333',
          color: 'white',
          border: 'none',
          borderRadius: '16px',
          padding: '6px 16px',
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}>
          关注
        </button>
      </div>

      {/* 内容层 - 同时包含文字和图片，保持富文本的原始结构 */}
      <div style={{ padding: '16px' }}>
        {/* 使用dangerouslySetInnerHTML渲染完整的富文本内容，包括文字 */}
        <div
          style={{ 
            fontSize: '16px', 
            lineHeight: 1.8,
            color: '#333'
          }}
          dangerouslySetInnerHTML={{
            __html: (post.content || '') + '<style>img{max-width:100%;height:auto;display:block;margin:12px 0;}</style>'
          }}
        />
        
        {/* 渲染图片数组中未在content中显示的图片 */}
        {post.images && post.images.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            {post.images.map((imageUrl, index) => {
              // 检查图片是否已经在content中显示
              if (!(post.content || '').includes(imageUrl)) {
                return (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`图片${index + 1}`}
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      display: 'block',
                      marginBottom: '12px',
                      borderRadius: '8px'
                    }}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      {/* 推荐词条区域 - 在内容层下方显示已获取的推荐词条 */}
      {post?.topics && post.topics.length > 0 && (
        <div style={{ 
          padding: '16px',
          borderTop: '1px solid #f0f0f0'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {post.topics.map((topic, index) => {
              // 确保话题标签以#开头，如果没有则添加
              const formattedTopic = topic.startsWith('#') ? topic : `#${topic}`;
              return (
                <span 
                  key={index} 
                  style={{
                    backgroundColor: '#f0f0f0',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    color: '#666'
                  }}
                >
                  {formattedTopic}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {isAuthor && ( // 如果是作者，显示编辑链接
        <div style={{ 
          margin: '16px',
          padding: '12px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <Link to={`/post/${post.id}/edit`} style={{
            color: '#1890ff',
            textDecoration: 'none'
          }}>
            ✏️ 编辑这条内容
          </Link>
        </div>
      )}
    </div>
  );
}

export default PostDetail;

