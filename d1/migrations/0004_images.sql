CREATE TABLE IF NOT EXISTS images (
  key TEXT PRIMARY KEY,
  size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  content_type TEXT,
  uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_images_uploaded_at
ON images(uploaded_at DESC);
