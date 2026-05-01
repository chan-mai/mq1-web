<script setup lang="ts">
import * as cheerio from 'cheerio';
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '#shared/types/microccms';

const route = useRoute();
const { contentId } = route.params as { contentId: string };
// クエリパラメータにdraft_keyがあれば取得
const draftKeyParam: string | null = route.query.draft_key as string | null;

const article: Ref<MicroCMSObject<Article> | null> = ref(null);

// 記事を取得
const client = useMicroCMSClient();
const { data: articleResponse } = await useAsyncData<MicroCMSObject<Article>>(`article-${contentId}`, async () => {
    return await client.getList<MicroCMSObject<Article>>({
        endpoint: 'articles',
        queries: {
            limit: 1,
            filters: `id[equals]${contentId}`,
            draftKey: draftKeyParam ?? undefined,
        } satisfies MicroCMSQueries,
    });
}, {
    server: true,
});

// 記事が存在しない場合は404エラーを投げる
if (!articleResponse.value || articleResponse.value.contents.length === 0) {
    throw createError({
        statusCode: 404,
        statusMessage: `Article not found: ${contentId}`,
        fatal: true
    });
}

article.value = articleResponse.value.contents[0];

// --- OGP Setup ---
const config = useWebConfig();

if (article.value && article.value.content) {
    const pageTitle = `${article.value?.title || ''} - ${config.value.siteName}`;
    const pageDescription = useSummaryTextGenerator(article.value?.content ) || config.value.siteDescription;
    const ogImageUrl = article.value?.eyecatch?.url || useArticleOgGenerator(contentId);
    const pageUrl = `${config.value.siteUrl}entry/${contentId}`;
    const publishedTime = article.value?.publishedAt || article.value?.createdAt;
    const modifiedTime = article.value?.updatedAt;
    const isNoIndex = article.value?.is_no_index || false;

    const metaTags = [
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: config.value.siteName },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDescription },
        { name: 'twitter:image', content: ogImageUrl },
        { name: 'description', content: pageDescription },
    ];

    if (publishedTime) {
        metaTags.push({ property: 'article:published_time', content: new Date(publishedTime).toISOString() });
    }
    if (modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: new Date(modifiedTime).toISOString() });
    }
    if (article.value && article.value.tags && Array.isArray(article.value.tags)) {
        article.value.tags.forEach((tag: Tag) => {
            if (tag && typeof tag === 'object' && tag.name) {
                metaTags.push({ property: 'article:tag', content: tag.name });
            }
        });
    } else if (article.value && article.value.tags && typeof article.value.tags === 'object' && article.value.tags !== null) {
        const tagObj = article.value.tags as { name?: string };
        if (tagObj.name) {
            metaTags.push({ property: 'article:tag', content: tagObj.name });
        }
    }

    // noindex指定
    if (isNoIndex) metaTags.push({ name: 'robots', content: 'noindex' });

    useHead({
        title: pageTitle,
        meta: metaTags,
    });

    // 構造化データ (JSON-LD)
    useJsonld({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: article.value?.title || '',
        description: pageDescription,
        image: ogImageUrl,
        datePublished: publishedTime ? new Date(publishedTime).toISOString() : undefined,
        dateModified: modifiedTime ? new Date(modifiedTime).toISOString() : publishedTime ? new Date(publishedTime).toISOString() : undefined,
        author: {
            '@type': 'Person',
            name: config.value.author.name,
            url: config.value.siteUrl,
        },
        publisher: {
            '@type': 'Organization',
            name: config.value.siteName,
            url: config.value.siteUrl,
            logo: {
                '@type': 'ImageObject',
                url: config.value.baseOgpUrl,
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': pageUrl,
        },
        keywords: article.value?.tags?.map((tag: Tag) => tag.name).join(', ') || '',
    });
}


// 目次を生成する関数
const generateTableOfContents = (content: string) => {
    if (!content) return [];

    const $ = cheerio.load(content);
    const headings = $('h1, h2, h3, h4').toArray();
    const toc: { id: string; text: string; level: number }[] = [];

    // 各見出しに一意のIDを付与し、目次データを構築
    headings.forEach((heading, index) => {
        if (!heading) return;

        const $heading = $(heading);
        const text = $heading.text().trim();

        // headingとnodeNameの安全性確認を強化
        if (!heading || !heading.name) return;

        const level = parseInt(heading.name.substring(1)); // h1 -> 1, h2 -> 2, ...

        // IDを設定（なければ生成）
        let id = $heading.attr('id');
        if (!id) {
            id = `heading-${index}`;
            $heading.attr('id', id);
        }

        toc.push({ id, text, level });
    });

    // 記事のコンテンツをIDが付与された状態で更新
    if (article.value) {
        article.value = {
            ...article.value,
            content: $.html()
        };
    }

    return toc;
};


const calculateReadingTime = (htmlContent: string): { charCount: number, minutes: number } => {
    if (!htmlContent) return { charCount: 0, minutes: 0 };

    // テキストを抽出
    const $ = cheerio.load(htmlContent);
    const textContent: string = $.text().trim();

    const charCount: number = textContent.length;

    // 読了時間を計算 600文字/分
    const minutes: number = charCount / 600;

    return { charCount: charCount, minutes: minutes, };
};

const readingTime = computed(() => {
    if (article.value && article.value.content) {
        const { charCount, minutes } = calculateReadingTime(article.value?.content!);
        return {
            charCount,
            minutes,
        };
    }
    return {
        charCount: 0,
        minutes: 0,
    };
});

const tableOfContents: Ref<{ id: string; text: string; level: number }[]> = ref(article.value ? generateTableOfContents(article.value?.content!) : []);

// 人気記事取得 
const { data: popularData } = await useFetch('/api/popular-articles', {
    query: { excludeId: contentId },
});
const popularArticles = computed(() => popularData.value?.status === 'success' ? popularData.value.articles : []);
</script>
<template>
    <div v-if="draftKeyParam" class="fixed top-0 left-0 z-50 bg-sky-200 text-black px-4 py-2 shadow-md flex items-center m-2 rounded-md opacity-70">
        <Icon name="iconoir:warning-window" class="size-5 mr-2" />
        <span class="font-bold">下書きを表示しています</span>
    </div>
    <ScrollProgressBar />
    <main
        class="min-h-screen pt-[120px] md:pt-[160px] px-4 sm:px-6">
        <div class="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start mb-10">
            <!-- Left Sidebar (Social Actions) -->
            <aside class="hidden lg:flex lg:col-span-1 sticky top-32 flex-col gap-6 items-center z-20 pt-8">
                 <MqLikeButton :content-id="contentId" variant="icon-only" />
                 <div class="h-px w-10 bg-gray-200"></div>
                 <MqShareButtons 
                    :title="article?.title || ''" 
                    :url="`/entry/${contentId}`"
                    orientation="vertical"
                />
            </aside>

            <!-- Main Content -->
            <article class="lg:col-span-8 w-full min-w-0">
                <ArticlePageHead :title="article?.title" :published="article?.publishedAt ?? article?.createdAt"
                    :updated="article?.updatedAt" :tags="article?.tags"
                    :readingTime :contentId />

                <!-- Mobile 目次 -->
                <MqCollapsibleToc :items="tableOfContents" :title="article?.title"
                    class="mt-8 lg:hidden" />

                <div class="content prose max-w-none">
                    <MqArticlerRender :target="article?.content!" class="micro-cms mt-8 md:mt-12" />
                </div>
                
                <!-- いいねボタン -->
                <div class="mt-12 mb-8 w-full">
                    <MqLikeButton :content-id="contentId" class="px-5 py-3" />
                </div>

                <!-- 共有ボタン -->
                <div class="mt-6 mb-8 w-full">
                    <MqShareButtons 
                        :title="article?.title || ''" 
                        :url="`/entry/${contentId}`"
                    />
                </div>
                
                <!-- 人気の記事 -->
                <div v-if="popularArticles.length" class="mt-6 w-full">
                    <PopularArticles :articles="popularArticles" />
                </div>
            </article>

            <!-- PC, サイド目次 -->
            <aside class="hidden lg:block lg:col-span-3 sticky top-32 pt-8">
                 <MqCollapsibleToc class="max-h-[calc(100vh-9rem)] overflow-y-auto custom-scrollbar" :items="tableOfContents" :title="article?.title" />
            </aside>
        </div>
    </main>
    <ArticlePageFooter :current-article="article!" />
</template>
