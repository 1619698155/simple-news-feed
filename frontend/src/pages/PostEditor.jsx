// React 组件：发帖 / 编辑页

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiCreatePost, apiUpdatePost, apiGetPost, apiUploadImage } from '../api'; // apiUploadImage

// 引入 ReactQuill 及样式，用于富文本编辑器
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
        const imgs = Array.isArray(data.images) ? data.images : []; // 将图片数组转换为文本框可显示的格式
        setImageText(imgs.join('\n'));
      } catch (e) {
        setError(e.message || '加载原内容失败');
      } finally {
        setLoadingPost(false);
      }
    }

    fetchPost();
  }, [id, isEditMode]);
  // 从多行文本中解析出图片 URL 数组
  function parseImagesFromText(text) {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean); // 过滤空行
  }

  // 处理文件选择并上传图片，拿到 URL 后填入图片 URL 文本框
  async function handleFileChange(e) {
    const file = e.target.files[0]; // 获取用户选择的文件
    if (!file) return;

    try {
      if (!token) { // 检查用户是否已登录
        setError('请先登录后再上传图片');
        return;
      }

      const result = await apiUploadImage(file, token);
      // 将返回的图片地址追加到 imageText，每行一个
      setImageText((prev) =>
        prev ? `${prev}\n${result.url}` : result.url
      );
    } catch (err) {
      setError(err.message || '上传图片失败');
    } finally {
      // 最后清空文件输入框的值，允许再次选择同一个文件
      e.target.value = '';
    }
  }
  // 提交表单，创建或更新帖子
  async function handleSubmit(e) {
    e.preventDefault(); // 阻止默认表单提交行为（页面刷新）
    setLoading(true); // 提交时禁用按钮，重置状态：设置加载中，清空错误和成功信息
    setError(''); 
    setSuccessMsg('');

    const images = parseImagesFromText(imageText); // 将文本框中的图片URL字符串转换为数组

    try {
      let result;
      if (isEditMode) {
        result = await apiUpdatePost({ // 编辑模式，提交数据，调用更新接口
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

      // 简化：先跳转回首页；等后续实现详情页后可以跳 /post/:id
      // 成功提交后，显示成功消息，并设置一个定时器，在800毫秒后跳转回首页
      setTimeout(() => {
        navigate('/');
      }, 800);

      console.log('提交结果:', result);
    } catch (e) {
      setError(e.message || '提交失败');
    } finally {
      setLoading(false); // 重置加载状态：最后无论成功与否，都取消加载状态
    }
  }

  return (
    <div>
      <h2>{isEditMode ? '编辑短图文' : '发布短图文'}</h2> {/* 根据模式显示标题 */}

      {loadingPost ? (
        <p>正在加载原内容...</p>
      ) : ( // 显示表单
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
              文本内容（支持富文本）：
            </label>

            {/* 用 ReactQuill 替代原来的 textarea */}
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="写点什么吧，支持加粗、标题、列表等..."
              style={{ height: 220, marginBottom: 32 }}
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
              placeholder={
                '例如：\nhttps://example.com/image1.jpg\nhttps://example.com/image2.jpg'
              }
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              你可以直接填写网络图片地址，或者下方上传本地图片，系统会自动生成图片 URL 填入这里。
            </p>

            {/* 选择图片文件并上传 */}
            <div style={{ marginTop: 8 }}>
              <label style={{ fontSize: 14 }}>上传图片文件：</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'block', marginTop: 4 }}
              />
              <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                上传成功后会自动把图片地址追加到上方的“图片 URL”文本框中。
              </p>
            </div>
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

