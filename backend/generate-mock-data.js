// backend/generate-mock-data.js
const db = require('./db');

// 生成随机图片URL
function getRandomImages() {
  const numImages = Math.floor(Math.random() * 3) + 1; // 1-3张图片
  const images = [];
  for (let i = 0; i < numImages; i++) {
    const width = 400;
    const height = 300;
    const randomId = Math.floor(Math.random() * 1000);
    images.push(`https://picsum.photos/seed/news${randomId}/400/300`);
  }
  return JSON.stringify(images);
}

// 生成随机话题
function getRandomTopics() {
  const allTopics = [
    ['技术分享', '编程学习'],
    ['生活日常', '美食分享'],
    ['旅行日记', '风景摄影'],
    ['健身打卡', '健康生活'],
    ['读书感悟', '知识分享'],
    ['电影推荐', '影视评论'],
    ['音乐分享', '耳机党'],
    ['数码产品', '科技前沿'],
    ['职场经验', '职业发展'],
    ['学习方法', '自我提升']
  ];
  return JSON.stringify(allTopics[Math.floor(Math.random() * allTopics.length)]);
}

// 生成随机内容
function getRandomContent() {
  const contents = [
    '今天学习了新的技术，感觉收获很大！',
    '分享一下我的学习笔记，希望对大家有帮助。',
    '周末去了一个很美的地方，拍了一些照片。',
    '尝试了新的食谱，味道还不错。',
    '最近看了一部好电影，推荐给大家。',
    '健身坚持了一个月，感觉身体有了明显变化。',
    '买了新的数码产品，使用体验很好。',
    '分享一些职场经验，希望能帮助到刚入职的朋友。',
    '读了一本好书，写下了一些感悟。',
    '今天的天气很好，心情也跟着变好。'
  ];
  return contents[Math.floor(Math.random() * contents.length)];
}

// 生成随机时间（过去30天内），格式为YYYY-MM-DD HH:MM:SS
function getRandomDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const randomTime = thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime());
  const date = new Date(randomTime);
  
  // 格式化为YYYY-MM-DD HH:MM:SS
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 生成mock数据
function generateMockData() {
  console.log('开始生成mock数据...');
  
  const totalPosts = 50; // 生成50条mock数据
  const stmt = db.prepare(
    'INSERT INTO posts (user_id, content, images, topics, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  
  let count = 0;
  
  for (let i = 0; i < totalPosts; i++) {
    const user_id = Math.floor(Math.random() * 3) + 1; // 随机分配给用户1-3
    const content = getRandomContent();
    const images = getRandomImages();
    const topics = getRandomTopics();
    const created_at = getRandomDate();
    const updated_at = created_at;
    
    stmt.run(user_id, content, images, topics, created_at, updated_at, function(err) {
      if (err) {
        console.error('插入数据失败:', err);
      } else {
        count++;
        console.log(`已插入 ${count}/${totalPosts} 条数据`);
      }
      
      if (count === totalPosts) {
        stmt.finalize();
        console.log('所有mock数据生成完成！');
        db.close();
      }
    });
  }
}

// 执行生成数据
if (require.main === module) {
  generateMockData();
}

module.exports = generateMockData;
