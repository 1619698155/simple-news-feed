// React 组件：帖子列表页，支持分页加载

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGetPosts } from '../api';

const PAGE_SIZE = 5; // 每次加载 5 条

// 去掉 HTML 标签，把 <p>您好</p> 变成 “您好”
function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]+>/g, ''); // 简单正则清理所有标签
}

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

      // 修改：避免重复加载内容
      setPosts((prev) => {
        const newPosts = data.filter(
          (newPost) => !prev.some((post) => post.id === newPost.id)
        );
        return [...prev, ...newPosts]; // 新的帖子加到列表中
      });

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
        {posts.map((post) => {
          // 从富文本 HTML 中抽取纯文本，用作列表摘要
          const plainText = stripHtml(post.content || '');
          const preview =
            plainText.length > 60
              ? plainText.slice(0, 60) + '...'
              : plainText;

          return (
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
                {/* 修改：用 formatDateTime 显示本地时间，解决差 8 小时问题 */}
                <span>{formatDateTime(post.created_at)}</span>
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
                  {/* 修改：用预处理好的 plainText 摘要，而不是直接 post.content */}
                  {preview}
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
          );
        })}
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


