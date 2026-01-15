import { openDB } from 'idb';

export const useCommentStorage = () => {
  const VERSION = 3;
  const DB_NAME = 'comment-secrets-db';
  const STORE_NAME = 'comment_secrets';
  const LIKE_STORE_NAME = 'comment_like_secrets';

  const getDB = async () => {
    if (!import.meta.client) return null;
    return openDB(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
        if (oldVersion < VERSION && !db.objectStoreNames.contains(LIKE_STORE_NAME)) {
          db.createObjectStore(LIKE_STORE_NAME);
        }
      },
    });
  };

  const saveCommentSecret = async (commentId: string, secret: string) => {
    const db = await getDB();
    if (!db) return;
    await db.put(STORE_NAME, secret, commentId);
  };

  const getCommentSecret = async (commentId: string): Promise<string | undefined> => {
    const db = await getDB();
    if (!db) return undefined;
    return db.get(STORE_NAME, commentId);
  };

  const removeCommentSecret = async (commentId: string) => {
    const db = await getDB();
    if (!db) return;
    await db.delete(STORE_NAME, commentId);
  };
  
  // いいねシークレット管理
  // key: commentId, value: { secret: string, likeId: string }
  interface LikeSecretData {
    secret: string;
    likeId: string;
  }

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

  return {
    saveCommentSecret,
    getCommentSecret,
    removeCommentSecret,
    saveCommentLikeSecret,
    getCommentLikeSecret,
    removeCommentLikeSecret,
  };
};
