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
export async function apiCreatePost({ content, images, token }) {
  const res = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, images }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '发布失败');
  }
  return data;
}

// 更新帖子
export async function apiUpdatePost({ id, content, images, token }) {
  const res = await fetch(`${API_BASE}/posts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content, images }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '更新失败');
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

