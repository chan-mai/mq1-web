import { createClient } from "microcms-js-sdk";
import type { MicroCMSObject } from "~/types/microccms";

const getMicroCMSClient = () => {
  const config = useRuntimeConfig();

  const serviceDomain = config.public.microcms.serviceDomain;
  const apiKey = config.public.microcms.apiKey;

  if (!serviceDomain || !apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "MicroCMS configuration is missing",
    });
  }

  return createClient({
    serviceDomain,
    apiKey,
  });
};

export const fetchArticleByContentId = async (contentId?: string | null) => {
  if (!contentId) return null;

  const client = getMicroCMSClient();
  const response = await client.getList<MicroCMSObject<Article>>({
    endpoint: "articles",
    queries: {
      limit: 1,
      filters: `id[equals]${contentId}`,
    },
  });

  return response?.contents?.[0] ?? null;
};

export const articleExists = async (contentId?: string | null) => {
  const article = await fetchArticleByContentId(contentId);
  return Boolean(article);
};

export const ensureArticleExists = async (contentId?: string | null) => {
  const article = await fetchArticleByContentId(contentId);
  if (!article) {
    throw createError({
      statusCode: 404,
      statusMessage: `Article not found: ${contentId}`,
    });
  }
  return article;
};
