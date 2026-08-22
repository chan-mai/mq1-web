const OG_IMAGE_RENDERER_VERSION = "2";

export function useArticleOgGenerator(contentId: string) {
  const config = useWebConfig();
  return `${config.value.siteUrl}api/og/article/${contentId}?v=${OG_IMAGE_RENDERER_VERSION}`;
}

export function useTagOgGenerator(tagId: string) {
  const config = useWebConfig();
  return `${config.value.siteUrl}api/og/tag/${tagId}?v=${OG_IMAGE_RENDERER_VERSION}`;
}
