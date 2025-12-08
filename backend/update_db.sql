-- 为posts表添加topics字段，用于存储JSON格式的话题数组
ALTER TABLE posts ADD COLUMN topics TEXT;