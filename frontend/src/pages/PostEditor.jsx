// React 组件：发帖 / 编辑页

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  apiCreatePost,
  apiUpdatePost,
  apiGetPost,
  apiUploadImage,
  apiRecommendTopics, // 导入推荐话题 API
} from '../api';

// 引入 ReactQuill 及样式，用于富文本编辑器
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// 添加全局样式确保图片适应移动端宽度并移除编辑器边框
const quillStyles = `
  /* 确保ReactQuill编辑器中的所有图片都适应容器宽度 */
  .ql-editor img {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 0 auto;
  }
  
  /* 移除编辑器的所有边框 */
  .ql-container.ql-snow {
    border: none !important;
    box-shadow: none !important;
  }
  
  /* 确保工具栏和编辑器之间没有分隔线 */
  .ql-toolbar.ql-snow + .ql-container.ql-snow {
    border-top: none !important;
  }
  
  /* 确保编辑器内容区域没有多余的边框 */
  .ql-editor {
    border: none !important;
    outline: none !important;
  }
  
  /* 确保工具栏没有边框 */
  .ql-toolbar.ql-snow {
    border: none !important;
    box-shadow: none !important;
  }
  
  /* 针对不同设备宽度进一步优化 */
  @media (max-width: 768px) {
    .ql-editor img {
      max-width: 100% !important;
    }
  }
`;

// 创建并插入样式元素到文档头部
if (typeof document !== 'undefined' && !document.getElementById('quill-custom-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'quill-custom-styles';
  styleElement.innerHTML = quillStyles;
  document.head.appendChild(styleElement);
}

/**
 * 发帖 / 编辑页
 * - /post/new       => 新建
 * - /post/:id/edit  => 编辑
 */
function PostEditor({ token }) {
  const { id } = useParams(); // 如果有 id，则是编辑模式
  const isEditMode = !!id;

  // 核心内容状态
  const [content, setContent] = useState('');
  const [imageText, setImageText] = useState(''); // 多个图片 URL，用换行分隔
  
  // 加载状态
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [loadingRecommend, setLoadingRecommend] = useState(false); // 推荐话题加载状态
  
  // 推荐话题相关
  const [recommendedTopics, setRecommendedTopics] = useState([]);
  
  // 错误和成功信息
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();

  // 编辑模式：进入页面时先加载原有内容
  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    async function fetchPost() {
      setLoadingPost(true);
      setError('');
      try {
        const data = await apiGetPost(id);
        let contentWithImages = data.content || '';
        const imgs = Array.isArray(data.images) ? data.images : [];
        setImageText(imgs.join('\n'));
        
        // 如果有图片URL，将它们转换为HTML格式并添加到content中
        if (imgs.length > 0) {
          // 检查内容中是否已包含任何图片URL
          const hasImagesInContent = imgs.some(imgUrl => contentWithImages.includes(imgUrl));
          
          if (!hasImagesInContent) {
            // 为每个图片URL创建img标签，设置max-width:100%和height:auto以保持宽高比
            const imageHtml = imgs.map(imgUrl => `<img src="${imgUrl}" style="max-width:100%; height:auto;" />`).join('<br />');
            // 将图片添加到内容末尾
            contentWithImages = contentWithImages + (contentWithImages ? '<br /><br />' : '') + imageHtml;
          }
        }
        
        setContent(contentWithImages);
      } catch (e) {
        setError(e.message || '加载原内容失败');
      } finally {
        setLoadingPost(false);
      }
    }

    fetchPost();
  }, [id, isEditMode, setContent, setError, setImageText, setLoadingPost]);
  // 从多行文本中解析出图片 URL 数组
  function parseImagesFromText(text) {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean); // 过滤空行
  }

  // 创建Quill引用
  const quillRef = useRef(null);
  
  // 处理文件选择并上传图片，上传成功后直接插入到富文本编辑器
  const handleImageUpload = useCallback(async (file) => {
    if (!file) return;

    try {
      if (!token) { // 检查用户是否已登录
        setError('请先登录后再上传图片');
        return;
      }

      setLoading(true);
      const result = await apiUploadImage(file, token);
      
      // 保存到imageText以备提交
      setImageText((prev) =>
        prev ? `${prev}\n${result.url}` : result.url
      );
      
      // 获取Quill实例并插入图片
      const quill = quillRef.current;
      if (quill) {
        const range = quill.getSelection(true);
        // 使用result.url参数，并设置图片样式以保持宽高比
        const imageNode = document.createElement('img');
        imageNode.setAttribute('src', result.url);
        imageNode.setAttribute('style', 'max-width:100%; height:auto;');
        quill.insertEmbed(range.index, 'image', result.url);
        quill.setSelection(range.index + 1, 0);
      } else {
        // 如果Quill实例不可用，使用备用方法
        setContent((prev) => `${prev}<img src="${result.url}" style="max-width:100%; height:auto;" />`);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message || '上传图片失败');
      setLoading(false);
    }
  }, [token, setError, setLoading, setImageText, quillRef, setContent]);
  
  // 自定义图片上传处理函数，使用useCallback包装以避免在每次渲染时创建新实例
  const imageHandler = useCallback(() => {
    // 检查是否登录
    if (!token) {
      setError('请先登录后再上传图片');
      return;
    }
    
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();
    
    input.onchange = async () => {
      const file = input.files[0];
      if (file) {
        // 显示上传提示
        setSuccessMsg('正在上传图片，请稍候...');
        await handleImageUpload(file);
        // 清除上传提示
        setTimeout(() => setSuccessMsg(''), 1500);
      }
    };
  }, [token, setError, setSuccessMsg, handleImageUpload]);
  
  // 初始化时为Quill编辑器添加图片处理事件
  useEffect(() => {
    if (quillRef.current && quillRef.current.getModule) {
      const toolbar = quillRef.current.getModule('toolbar');
      if (toolbar) {
        toolbar.addHandler('image', imageHandler);
      }
    }
  }, [quillRef, imageHandler]);

  // 处理推荐话题
  async function handleRecommendTopics() {
    setError('');
    setRecommendedTopics([]);
    if (!content || content.trim() === '') {
      setError('请先填写文章内容再推荐话题');
      return;
    }
    if (!token) {
      setError('请先登录后再推荐话题');
      return;
    }

    setLoadingRecommend(true);
    try {
      const { topics } = await apiRecommendTopics({ content, token });
      setRecommendedTopics(topics);
    } catch (e) {
      setError(e.message || '推荐话题失败');
    } finally {
      setLoadingRecommend(false);
    }
  }

  // 提交表单，创建或更新帖子
  async function handleSubmit(e) {
    e.preventDefault(); // 阻止默认表单提交行为（页面刷新）
    setLoading(true); // 提交时禁用按钮，重置状态：设置加载中，清空错误和成功信息
    setError('');
    setSuccessMsg('');

    console.log('imageText内容:', imageText);
    const imagesFromText = parseImagesFromText(imageText); // 将文本框中的图片URL字符串转换为数组
    console.log('从imageText解析的images数组:', imagesFromText);
    
    // 从富文本内容中提取所有图片URL，确保不丢失任何图片
    const imagesFromContent = content.match(/https?:\/\/[^\s"'<>]+/g) || [];
    console.log('从富文本内容提取的图片URL:', imagesFromContent);
    
    // 合并两个来源的图片URL，并去重
    const allImages = [...new Set([...imagesFromText, ...imagesFromContent])];
    console.log('合并去重后的images数组:', allImages);

    try {
      let result;
      if (isEditMode) {
        result = await apiUpdatePost({ // 编辑模式，提交数据，调用更新接口
          id,
          content,
          images: allImages,
          topics: recommendedTopics, // 提交推荐话题
          token,
        });
        setSuccessMsg('修改成功！即将返回首页...');
      } else {
        result = await apiCreatePost({
          content,
          images: allImages,
          topics: recommendedTopics, // 提交推荐话题
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

            {/* 自定义工具栏配置的 ReactQuill */}
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="写点什么吧，支持加粗、标题、列表等..."
              style={{ height: '40vh', marginBottom: 32, border: 'none' }}
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                  ['bold', 'italic', 'underline'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['link'],
                  ['image'],  // 添加图片按钮
                  ['clean']
                ]
              }}
              formats={[
                'header',
                'bold', 'italic', 'underline',
                'list', 'bullet',
                'link',
                'image'
              ]}
              ref={quillRef}
            />
          </div>
          
          {/* 隐藏图片URL输入框，保留状态以支持表单提交 */}
          <input
            type="hidden"
            value={imageText}
            onChange={(e) => setImageText(e.target.value)}
          />
          

          {/* 推荐话题功能 */}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleRecommendTopics}
              disabled={loadingRecommend || !content.trim()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {loadingRecommend ? '正在推荐...' : '推荐话题'}
            </button>
            {recommendedTopics.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <p style={{ marginBottom: 4 }}>推荐话题：</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recommendedTopics.map((topic, index) => (
                    <span
                      key={index}
                      onClick={() => setContent((prev) => `${prev} #${topic}`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: '#333',
                        border: '1px solid #ced4da',
                      }}
                    >
                      #{topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%',
            backgroundColor: '#ff3333',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'all 0.3s ease'
          }}>
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
