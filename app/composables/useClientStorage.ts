import { openDB } from 'idb';

export const useClientStorage = () => {
  interface ArticleLikeSecretData {
    secret: string;
    likeId: string;
  }

  const VERSION = 5;
  const DB_NAME = 'secrets-db';
  const ARTICLE_LIKE_STORE_NAME = 'article_like_secrets';

  const getDB = async () => {
    if (!import.meta.client) return null;
    return openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ARTICLE_LIKE_STORE_NAME)) {
          db.createObjectStore(ARTICLE_LIKE_STORE_NAME);
        }
      },
    });
  };

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
    saveArticleLikeSecret,
    getArticleLikeSecret,
    removeArticleLikeSecret,
  };
};
