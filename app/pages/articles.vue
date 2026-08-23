<script setup lang="ts">
const route = useRoute();
const router = useRouter();
const page = computed(() => Number(route.query.page) || 1);
const limit = 12;

const { data: articlesResponse, status } = await useFetch("/api/articles", {
  key: () => `articles-${page.value}`,
  query: computed(() => ({
    limit,
    offset: (page.value - 1) * limit,
  })),
});

const articles = computed(() => articlesResponse.value?.contents ?? []);
const totalCount = computed(() => articlesResponse.value?.totalCount ?? 0);

const onPageChange = (newPage: number) => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  router.push({ query: { ...route.query, page: newPage } });
};

const config = useWebConfig();
const pageTitle = `記事一覧 - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const ogImageUrl = config.value.baseOgpUrl;
const pageUrl = `${config.value.siteUrl}articles`;

useHead({
  title: pageTitle,
  meta: [
    { property: "og:title", content: pageTitle },
    { property: "og:description", content: pageDescription },
    { property: "og:image", content: ogImageUrl },
    { property: "og:type", content: "website" },
    { property: "og:url", content: pageUrl },
    { property: "og:site_name", content: config.value.siteName },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: pageTitle },
    { name: "twitter:description", content: pageDescription },
    { name: "twitter:image", content: ogImageUrl },
    { name: "description", content: pageDescription },
  ],
});

// 構造化データ (JSON-LD)
useJsonld({
  "@context": "https://schema.org",
  "@type": "Blog",
  name: config.value.siteName,
  description: pageDescription,
  url: pageUrl,
  author: {
    "@type": "Person",
    name: config.value.author.name,
    url: pageUrl,
  },
  blogPost:
    articles.value?.map((article: Article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      url: `${config.value.siteUrl}entry/${article.id}`,
      datePublished: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : undefined,
      image: article.eyecatch?.url || config.value.baseOgpUrl,
      author: {
        "@type": "Person",
        name: config.value.author.name,
        url: pageUrl,
      },
    })) || [],
});
</script>
<template>
  <main class="min-h-screen pt-[120px] md:pt-[160px] px-6">
    <!-- 直近記事 -->
    <section class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-2 md:px-6">
      <div class="flex items-center justify-between">
        <h2 class="font-accent text-3xl text-fg md:text-4xl">記事一覧</h2>

        <span class="text-fg-muted text-sm">全{{ totalCount }}記事</span>
      </div>
      <div class="flex flex-col gap-8">
        <MqLoading v-if="status === 'pending'" />
        <template v-else>
          <div
            v-if="articles?.length"
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <ArticlesCard
              v-for="article in articles"
              :key="article.id"
              :article="article"
              :transition="true"
            />
          </div>
          <div v-else class="flex flex-col items-center justify-center gap-4">
            <p class="text-lg font-bold text-accent">
              記事が見つかりませんでした。
            </p>
            <p class="text-sm text-fg-muted">初めての投稿をお待ちください。</p>
          </div>

          <MqPagination
            v-if="totalCount > limit"
            :total-count="totalCount"
            :current-page="page"
            :limit="limit"
            @change="onPageChange"
          />
        </template>
      </div>
    </section>
  </main>
</template>
