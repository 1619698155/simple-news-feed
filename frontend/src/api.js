// 封装后端请求

//const API_BASE = 'http://localhost:3000';
const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// 上传图片接口
export async function apiUploadImage(file, token) {
  const formData = new FormData();
  formData.append('file', file);
  // 发送网络请求
  const res = await fetch(`${API_BASE}/upload/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  // 判断服务器返回的是不是有效的 JSON 格式
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `服务器返回的不是 JSON，开头内容是：${text.slice(0, 100)}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || '上传失败');
  }

  return data; // { url: 'xxxx' }
}

// 注册
export async function apiRegister(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  // 判断服务器返回的是不是有效的 JSON 格式
  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // 不是 JSON，直接把返回内容开头展示出来
    throw new Error(
      `服务器返回的不是 JSON，开头内容是：${text.slice(0, 100)}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || '注册失败');
  }

  return data;
}

// 登录
export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, { // 发送登录请求
    method: 'POST', // 使用 Fetch API 进行 POST 请求
    headers: { 'Content-Type': 'application/json' }, // 设置请求头，指定内容类型为 JSON
    body: JSON.stringify({ username, password }), // 将用户名和密码转换为 JSON 字符串作为请求体
  });

  // 判断服务器返回的是不是有效的 JSON 格式
  const text = await res.text();

  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // 不是 JSON，直接把返回内容开头展示出来
    throw new Error(
      `服务器返回的不是 JSON，开头内容是：${text.slice(0, 100)}`
    );
  }

  if (!res.ok) {
    throw new Error(data.error || '登录失败');
  }

  return data;
}

// 获取单条帖子详情
export async function apiGetPost(id) {
  const res = await fetch(`${API_BASE}/posts/${id}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '获取内容失败');
  }
  return data;
}

// 创建帖子
export async function apiCreatePost({ content, images, topics, token }) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, images, topics }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '发布失败');
  }
  return data;
}

// 更新帖子
export async function apiUpdatePost({ id, content, images, topics, token }) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, images, topics }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '更新失败');
  }
  return data;
}

// 推荐话题接口
export async function apiRecommendTopics({ content, token }) {
  const res = await fetch(`${API_BASE}/api/recommend-topics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '推荐话题失败');
  }
  return data;
}

// 获取帖子列表，制定分页策略
export async function apiGetPosts({ offset = 0, limit = 10 } = {}) {
  const res = await fetch(
    `${API_BASE}/posts?offset=${offset}&limit=${limit}`
  );
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '获取列表失败');
  }
  return data;
}

// 获取今日头条推荐数据
export async function apiGetRecommendedPosts({ offset = 0, limit = 5, userId = null } = {}) {
  try {
    // 尝试调用今日头条热点新闻API
    try {
      const apiUrl = 'https://tenapi.cn/v2/toutiaohotnew';
      
      // 发送请求获取热点新闻数据
      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        // 添加CORS相关配置
        mode: 'cors',
        cache: 'no-cache'
      });
      
      const result = await res.json();
      
      // 检查API返回状态
      if (result.code === 200 && result.data) {
        // 转换API返回的数据格式为应用所需的格式
        const hotNewsList = result.data;
        
        // 根据标题内容提取可能的主题标签
        function extractTopics(title) {
          const topicKeywords = [
            { keywords: ['中国', '北京', '上海', '国家'], topic: '国内' },
            { keywords: ['美国', '国际', '全球'], topic: '国际' },
            { keywords: ['电影', '娱乐', '明星'], topic: '娱乐' },
            { keywords: ['健康', '病毒', '新冠'], topic: '健康' },
            { keywords: ['科技', '人工智能', 'AI'], topic: '科技' },
            { keywords: ['经济', '股市', '金融'], topic: '财经' },
            { keywords: ['体育', '比赛', '篮球'], topic: '体育' }
          ];
          
          const topics = [];
          for (const { keywords, topic } of topicKeywords) {
            if (keywords.some(keyword => title.includes(keyword))) {
              topics.push(topic);
            }
          }
          
          // 如果没有匹配的主题，默认添加'头条'
          if (topics.length === 0) {
            topics.push('头条');
          }
          
          return topics;
        }
        
        // 转换数据格式
        const formattedPosts = hotNewsList.map((item, index) => {
          // 清理URL中的额外空格
          const cleanUrl = item.url ? item.url.trim() : '#';
          
          return {
            id: `toutiao-${Date.now()}-${index}`,  // 生成唯一ID
            title: item.name || '无标题',
            content: `这是来自今日头条的热点新闻：${item.name}...`,  // 生成简单内容
            author_name: '今日头条',
            created_at: new Date(Date.now() - index * 3600000).toISOString().slice(0, 19).replace('T', ' '),  // 生成递减的时间
            images: [`https://picsum.photos/600/400?random=${index + 1}`],  // 生成随机图片
            topics: extractTopics(item.name),  // 提取主题标签
            external_link: cleanUrl  // 使用原始链接
          };
        });
        
        // 保持简单的个性化逻辑：如果有用户ID，就打乱推荐顺序以模拟个性化
        let finalPosts = [...formattedPosts];
        if (userId && typeof userId === 'string') {
          // 使用用户ID作为种子进行简单的乱序
          const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          finalPosts = formattedPosts.sort(() => 0.5 - ((seed * 9301 + 49297) % 233280) / 233280);
        }
        
        // 应用分页
        return finalPosts.slice(offset, offset + limit);
      }
    } catch (apiError) {
      console.warn('今日头条API调用失败，使用模拟数据:', apiError.message);
    }
    
    // API调用失败时，使用模拟数据作为备选
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟基于用户ID的个性化推荐数据
    const mockRecommendedPosts = [
      {
        id: 'toutiao-1',
        title: '人工智能如何改变我们的未来生活',
        content: '人工智能技术正在迅速发展，从自动驾驶汽车到智能家居系统，AI正在改变我们的生活方式...',
        author_name: '科技前沿',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=1'],
        topics: ['人工智能', '科技'],
        external_link: '#'
      },
      {
        id: 'toutiao-2',
        title: '健康饮食：这些食物你应该多吃',
        content: '均衡的饮食对健康至关重要。以下几种食物富含营养，有助于维持身体健康...',
        author_name: '健康生活',
        created_at: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=2'],
        topics: ['健康', '饮食'],
        external_link: '#'
      },
      {
        id: 'toutiao-3',
        title: '全球气候变化最新研究进展',
        content: '最新的气候变化研究表明，温室气体排放持续增加导致全球平均温度上升...',
        author_name: '环境科学',
        created_at: new Date(Date.now() - 7200000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=3'],
        topics: ['气候变化', '环境'],
        external_link: '#'
      },
      {
        id: 'toutiao-4',
        title: '旅行攻略：这些小众景点值得一去',
        content: '厌倦了人山人海的热门景点？这里有几个小众但风景绝佳的旅行目的地...',
        author_name: '旅行达人',
        created_at: new Date(Date.now() - 10800000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=4'],
        topics: ['旅行', '攻略'],
        external_link: '#'
      },
      {
        id: 'toutiao-5',
        title: '高效工作：提高生产力的五个技巧',
        content: '在当今快节奏的工作环境中，如何提高工作效率成为许多人关注的问题...',
        author_name: '职场指南',
        created_at: new Date(Date.now() - 14400000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=5'],
        topics: ['职场', '效率'],
        external_link: '#'
      },
      {
        id: 'toutiao-6',
        title: '最新电影推荐：本周不可错过的大片',
        content: '本周有多部备受期待的电影上映，从科幻巨制到温情剧情片，总有一部适合你...',
        author_name: '电影评论家',
        created_at: new Date(Date.now() - 18000000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=6'],
        topics: ['电影', '娱乐'],
        external_link: '#'
      },
      {
        id: 'toutiao-7',
        title: '学习编程：零基础如何入门',
        content: '对于编程初学者来说，选择合适的编程语言和学习路径至关重要...',
        author_name: '编程课堂',
        created_at: new Date(Date.now() - 21600000).toISOString().slice(0, 19).replace('T', ' '),
        images: ['https://picsum.photos/600/400?random=7'],
        topics: ['编程', '学习'],
        external_link: '#'
      }
    ];
    
    // 简单的个性化逻辑：如果有用户ID，就打乱推荐顺序以模拟个性化
    let finalPosts = [...mockRecommendedPosts];
    if (userId && typeof userId === 'string') {
      // 使用用户ID作为种子进行简单的乱序
      const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      finalPosts = finalPosts.sort(() => 0.5 - ((seed * 9301 + 49297) % 233280) / 233280);
    }
    
    // 返回分页后的数据
    return finalPosts.slice(offset, offset + limit);
    
    /*
    // 实际项目中，这里应该调用后端API，由后端处理今日头条API的调用
    const res = await fetch(
      `${API_BASE}/api/recommended-posts?offset=${offset}&limit=${limit}${userId ? `&userId=${userId}` : ''}`
    );
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || '获取推荐内容失败');
    }
    return data;
    */
  } catch (error) {
    console.error('获取推荐内容失败:', error);
    throw error;
  }
}
