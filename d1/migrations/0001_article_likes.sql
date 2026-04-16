CREATE TABLE IF NOT EXISTS article_likes (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  user_ip TEXT NOT NULL,
  secret TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_article_likes_content_id
ON article_likes(content_id);

CREATE INDEX IF NOT EXISTS idx_article_likes_user_ip
ON article_likes(user_ip);

CREATE INDEX IF NOT EXISTS idx_article_likes_created_at
ON article_likes(created_at);
