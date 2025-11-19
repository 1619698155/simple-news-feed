// frontend/src/pages/PostEditor.jsx

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCreatePost, apiUpdatePost, apiGetPost } from '../api';

/**
 * 发帖 / 编辑页
 * - /post/new       => 新建
 * - /post/:id/edit  => 编辑
 */
function PostEditor({ token }) {
  const { id } = useParams(); // 如果有 id，则是编辑模式
  const isEditMode = !!id;

  const [content, setContent] = useState('');
  const [imageText, setImageText] = useState(''); // 多个图片 URL，用换行分隔
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // 编辑模式：进入页面时先加载原有内容
  useEffect(() => {
    if (!isEditMode) return;

    async function fetchPost() {
      setLoadingPost(true);
      setError('');
      try {
        const data = await apiGetPost(id);
        setContent(data.content || '');
        const imgs = Array.isArray(data.images) ? data.images : [];
        setImageText(imgs.join('\n'));
      } catch (e) {
        setError(e.message || '加载原内容失败');
      } finally {
        setLoadingPost(false);
      }
    }

    fetchPost();
  }, [id, isEditMode]);

  function parseImagesFromText(text) {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean); // 过滤空行
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const images = parseImagesFromText(imageText);

    try {
      let result;
      if (isEditMode) {
        result = await apiUpdatePost({
          id,
          content,
          images,
          token,
        });
        setSuccessMsg('修改成功！即将返回首页...');
      } else {
        result = await apiCreatePost({
          content,
          images,
          token,
        });
        setSuccessMsg('发布成功！即将返回首页...');
      }

      // 简化：先跳转回首页；等第六天实现详情页后可以跳 /post/:id
      setTimeout(() => {
        navigate('/');
      }, 800);

      console.log('提交结果:', result);
    } catch (e) {
      setError(e.message || '提交失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2>{isEditMode ? '编辑短图文' : '发布短图文'}</h2>

      {loadingPost ? (
        <p>正在加载原内容...</p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 12,
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>
              文本内容：
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写点什么吧..."
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>
              图片 URL（每行一条，可不填）：
            </label>
            <textarea
              rows={4}
              value={imageText}
              onChange={(e) => setImageText(e.target.value)}
              placeholder={'例如：\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg'}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              暂时用图片地址来模拟上传；之后有时间可以再做真正的文件上传功能。
            </p>
          </div>

          <button type="submit" disabled={loading}>
            {loading
              ? isEditMode
                ? '正在保存...'
                : '正在发布...'
              : isEditMode
              ? '保存修改'
              : '发布'}
          </button>
        </form>
      )}

      {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}
      {successMsg && (
        <p style={{ color: 'green', marginTop: 8 }}>{successMsg}</p>
      )}
    </div>
  );
}

export default PostEditor;
