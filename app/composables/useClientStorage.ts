import { openDB } from 'idb';

export const useClientStorage = () => {
  interface SecretData {
    secret: string;
    likeId: string;
  }
  type LikeSecretData = SecretData;
  type ArticleLikeSecretData = SecretData;


  const VERSION = 4;
  const DB_NAME = 'secrets-db';
  const COMMENT_STORE_NAME = 'comment_secrets';
  const LIKE_STORE_NAME = 'comment_like_secrets';
  const ARTICLE_LIKE_STORE_NAME = 'article_like_secrets';

  const getDB = async () => {
    if (!import.meta.client) return null;
    return openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(COMMENT_STORE_NAME)) {
          db.createObjectStore(COMMENT_STORE_NAME);
        }
        if (oldVersion < 3 && !db.objectStoreNames.contains(LIKE_STORE_NAME)) {
          db.createObjectStore(LIKE_STORE_NAME);
        }
        if (oldVersion < 4 && !db.objectStoreNames.contains(ARTICLE_LIKE_STORE_NAME)) {
          db.createObjectStore(ARTICLE_LIKE_STORE_NAME);
        }
      },
    });
  };

  const saveCommentSecret = async (commentId: string, secret: string) => {
    const db = await getDB();
    if (!db) return;
    await db.put(COMMENT_STORE_NAME, secret, commentId);
  };

  const getCommentSecret = async (commentId: string): Promise<string | undefined> => {
    const db = await getDB();
    if (!db) return undefined;
    return db.get(COMMENT_STORE_NAME, commentId);
  };

  const removeCommentSecret = async (commentId: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete(COMMENT_STORE_NAME, commentId);
  };
  
  // コメントいいねシークレット管理
  const saveCommentLikeSecret = async (commentId: string, data: LikeSecretData) => {
    const db = await getDB();
    if (!db) return;
    await db.put(LIKE_STORE_NAME, data, commentId);
  };

  const getCommentLikeSecret = async (commentId: string): Promise<LikeSecretData | undefined> => {
    const db = await getDB();
    if (!db) return undefined;
    return db.get(LIKE_STORE_NAME, commentId);
  };

  const removeCommentLikeSecret = async (commentId: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete(LIKE_STORE_NAME, commentId);
  };

  // 記事いいねシークレット管理
  const saveArticleLikeSecret = async (contentId: string, data: ArticleLikeSecretData) => {
    const db = await getDB();
    if (!db) return;
    await db.put(ARTICLE_LIKE_STORE_NAME, data, contentId);
  };

  const getArticleLikeSecret = async (contentId: string): Promise<ArticleLikeSecretData | undefined> => {
    const db = await getDB();
    if (!db) return undefined;
    return db.get(ARTICLE_LIKE_STORE_NAME, contentId);
  };

  const removeArticleLikeSecret = async (contentId: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete(ARTICLE_LIKE_STORE_NAME, contentId);
  };

  return {
    saveCommentSecret,
    getCommentSecret,
    removeCommentSecret,
    saveCommentLikeSecret,
    getCommentLikeSecret,
    removeCommentLikeSecret,
    saveArticleLikeSecret,
    getArticleLikeSecret,
    removeArticleLikeSecret,
  };
};
