// frontend/src/api.js

//const API_BASE = 'http://localhost:3000';
const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:3000';

// 注册
export async function apiRegister(username, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || '注册失败');
  }
  return data;
}

// 登录
export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
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

// 获取帖子列表
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
