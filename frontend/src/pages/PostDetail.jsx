// React 组件：显示单个短图文内容的详情页

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGetPost } from '../api';

// 去掉 HTML 标签，把 <p>您好</p> 变成 “您好”
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ''); // 简单正则清理所有标签
}

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
    <div> {/* 内容详情容器 */}
      <button // 返回按钮
        onClick={() => navigate(-1)} // 点击返回上一页
        style={{ marginBottom: 12 }} // 返回按钮样式
      >
        ⬅ 返回
      </button>

      <h2>短图文详情</h2>

      <div
        style={{ // 作者和发布时间样式
          fontSize: 12,
          color: '#666',
          marginTop: 8,
          marginBottom: 8,
        }}
      >
        <div>
          发布人：
          <strong>{post.author_name || `用户#${post.user_id}`}</strong>
        </div>
        <div>发布时间：{post.created_at}</div>
      </div>

      {/* 清理掉多余的 HTML 标签 */}
      <p style={{ fontSize: 15, lineHeight: 1.6 }}>
        {stripHtml(post.content)}
      </p>

      {post.images && post.images.length > 0 && ( // 显示图片列表
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {post.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`图片${idx + 1}`}
              style={{
                width: '100%',
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
          ))}
        </div>
      )}

      {isAuthor && ( // 如果是作者，显示编辑链接
        <div style={{ marginTop: 16 }}>
          <Link to={`/post/${post.id}/edit`}>✏️ 编辑这条内容</Link>
        </div>
      )}
    </div>
  );
}

export default PostDetail;

