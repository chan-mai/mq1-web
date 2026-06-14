import { createClient } from "microcms-js-sdk";

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

export const fetchTagById = async (tagId?: string | null) => {
  if (!tagId) return null;

  const client = getMicroCMSClient();
  
  try {
      const response = await client.getList<Tag>({
        endpoint: "tags",
        queries: {
          limit: 1,
          filters: `id[equals]${tagId}`,
        },
      });
      return response?.contents?.[0] ?? null;
  } catch (e) {
      return null;
  }
};

export const tagExists = async (tagId?: string | null) => {
  const tag = await fetchTagById(tagId);
  return Boolean(tag);
};

export const fetchTag = async (tagId?: string | null) => {
  const tag = await fetchTagById(tagId);
  if (!tag) {
    throw createError({
      statusCode: 404,
      statusMessage: `Tag not found: ${tagId}`,
    });
  }
  return tag;
};
