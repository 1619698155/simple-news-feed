// 测试脚本：模拟前端分页加载并检查数据完整性

// 使用正确的node-fetch导入方式
const fetch = require('node-fetch').default;
const API_BASE = 'http://localhost:3000';
const PAGE_SIZE = 5;

async function testPagination() {
  console.log('开始测试分页功能...');
  
  let allPosts = [];
  let offset = 0;
  let hasMore = true;
  let page = 1;
  
  while (hasMore) {
    console.log(`\n获取第 ${page} 页数据，offset=${offset}, limit=${PAGE_SIZE}`);
    
    try {
      const response = await fetch(`${API_BASE}/posts?offset=${offset}&limit=${PAGE_SIZE}`);
      const data = await response.json();
      
      console.log(`返回数据条数: ${data.length}`);
      console.log('返回的帖子ID:', data.map(post => post.id));
      console.log('返回的帖子created_at:', data.map(post => post.created_at));
      
      if (data.length === 0) {
        hasMore = false;
        console.log('没有更多数据了');
      } else {
        // 检查是否有重复数据
        const newIds = new Set(data.map(post => post.id));
        const existingIds = new Set(allPosts.map(post => post.id));
        const intersection = [...newIds].filter(id => existingIds.has(id));
        
        if (intersection.length > 0) {
          console.log('警告：检测到重复数据！重复的ID:', intersection);
        }
        
        allPosts = [...allPosts, ...data];
        offset += data.length;
        page++;
        
        // 防止无限循环
        if (offset > 100) {
          console.log('警告：已获取超过100条数据，停止测试');
          break;
        }
      }
    } catch (error) {
      console.error('获取数据失败:', error.message);
      hasMore = false;
    }
  }
  
  console.log('\n测试完成！');
  console.log(`总共获取到 ${allPosts.length} 条帖子`);
  console.log('所有帖子ID按顺序:', allPosts.map(post => post.id));
  
  // 检查排序是否正确
  const isSorted = allPosts.every((post, index, array) => {
    if (index === 0) return true;
    return post.id < array[index - 1].id; // 降序排列
  });
  
  console.log('帖子ID排序是否正确（降序）:', isSorted);
}

testPagination().catch(console.error);