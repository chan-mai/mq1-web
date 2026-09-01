// swrキャッシュ全削除
export const purgeContentCache = async () => {
  try {
    const storage = useStorage('cache');
    const keys = await storage.getKeys('nitro');
    await Promise.all(keys.map((key) => storage.removeItem(key)));
  } catch (error) {
    console.error('[cache] Failed to purge content cache:', error);
  }
};
