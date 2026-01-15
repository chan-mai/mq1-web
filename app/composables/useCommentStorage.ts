import { openDB } from 'idb';

export const useCommentStorage = () => {
  const DB_NAME = 'comment-secrets-db';
  const STORE_NAME = 'secrets';

  const getDB = async () => {
    if (!import.meta.client) return null;
    return openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
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

  return {
    saveCommentSecret,
    getCommentSecret,
    removeCommentSecret,
  };
};
