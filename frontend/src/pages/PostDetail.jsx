// frontend/src/pages/PostDetail.jsx

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiGetPost } from '../api';

function PostDetail({ currentUser }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      setError('');
      try {
        const data = await apiGetPost(id);
        setPost(data);
      } catch (e) {
        setError(e.message || '加载失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPost();
  }, [id]);

  if (loading) {
    return <p>加载中...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!post) {
    return <p>未找到内容</p>;
  }

  const isAuthor =
    currentUser && currentUser.id === post.user_id;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        style={{ marginBottom: 12 }}
      >
        ⬅ 返回
      </button>

      <h2>短图文详情</h2>

      <div
        style={{
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

      <p style={{ fontSize: 15, lineHeight: 1.6 }}>{post.content}</p>

      {post.images && post.images.length > 0 && (
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

      {isAuthor && (
        <div style={{ marginTop: 16 }}>
          <Link to={`/post/${post.id}/edit`}>✏️ 编辑这条内容</Link>
        </div>
      )}
    </div>
  );
}

export default PostDetail;
