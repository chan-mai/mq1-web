// 後方互換性を保つため、tagIdでのルーティングをサポートするmiddleware
export default defineNuxtRouteMiddleware((to, from) => {
  if (!to.path.startsWith('/tag/')) return;

  const tagId = to.params.slug as string;
  if (!tagId) return;

  const tagMap: Record<string, string> = {
    'riqchoqn8lw': 'games',
    'vmhb23sq4': 'misskey',
    'zvbbh2k4o': 'cat-life',
    '1ddfqhefta5p': 'politics',
    'lte0t59xm8sb': 'network',
    'fwj_nwhj1-s': 'server',
    'qfey3yw0z1': 'technology',
    '8q8qyy8sz3': 'programming',
    'wia4slp55q': 'thoughts',
    '4oy2jc8mdg': 'diary',
    'sxrwmir1w': 'introduction',
  };

  const slug = tagMap[tagId];

  // 存在していたtagIdの場合はリダイレクト
  if (slug) {
    return navigateTo(`/tag/${slug}`, {
      redirectCode: 301,
      // tip: external指定なしではコケることがある
      external: true,
    });
  }
});
