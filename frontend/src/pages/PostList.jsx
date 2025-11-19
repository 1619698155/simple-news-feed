// frontend/src/pages/PostList.jsx

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetPosts } from '../api';

const PAGE_SIZE = 5; // 每次加载 5 条

function PostList() {
  const [posts, setPosts] = useState([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // 首屏加载
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMore() {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      const data = await apiGetPosts({ offset, limit: PAGE_SIZE });
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
      setPosts((prev) => [...prev, ...data]);
      setOffset((prev) => prev + data.length);
    } catch (e) {
      setError(e.message || '加载失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h3>最新短图文</h3>

      {posts.length === 0 && !loading && <p>暂无内容，快去发布一条吧～</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map((post) => (
          <div
            key={post.id}
            className="card"
            style={{
              border: '1px solid #eee',
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: '#666',
                marginBottom: 4,
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>
                发布人：{post.author_name || `用户#${post.user_id}`}
              </span>
              <span>{post.created_at}</span>
            </div>

            <Link
              to={`/post/${post.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <p
                style={{
                  fontSize: 14,
                  margin: '4px 0 8px',
                }}
              >
                {post.content.length > 60
                  ? post.content.slice(0, 60) + '...'
                  : post.content}
              </p>

              {post.images && post.images.length > 0 && (
                <img
                  src={post.images[0]}
                  alt="缩略图"
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 6,
                  }}
                />
              )}
            </Link>
          </div>
        ))}
      </div>

      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          style={{ marginTop: 12, width: '100%' }}
        >
          {loading ? '加载中...' : '加载更多'}
        </button>
      )}

      {!hasMore && posts.length > 0 && (
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12 }}>
          已经到底啦～
        </p>
      )}
    </div>
  );
}

export default PostList;
