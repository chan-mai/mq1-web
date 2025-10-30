<script setup lang="ts">
import * as cheerio from 'cheerio';
import type { MicroCMSQueries } from 'microcms-js-sdk';
import type { MicroCMSObject } from '~/types/microccms';

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
    const ogImageUrl = useOgGenerator(article.value?.title || '');
    const pageUrl = `${config.value.siteUrl}/entry/${contentId}`;
    const publishedTime = article.value?.publishedAt || article.value?.createdAt;
    const modifiedTime = article.value?.updatedAt;
    const isNoIndex = article.value?.is_no_index || false;

    const metaTags = [
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:image', content: article.value?.eyecatch?.url || ogImageUrl },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: config.value.siteName },
        { name: 'twitter:card', content: 'summary_large_image' },
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
</script>
<template>
    <div v-if="draftKeyParam" class="fixed top-0 left-0 z-50 bg-sky-200 text-black px-4 py-2 shadow-md flex items-center m-2 rounded-md opacity-70">
        <Icon name="iconoir:warning-window" class="size-5 mr-2" />
        <span class="font-bold">下書きを表示しています</span>
    </div>
    <ScrollProgressBar />
    <main
        class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20">

        <MqHero :url="article?.eyecatch?.url" :title="article?.title" text-hidden article-page
            :style="`view-transition-name: article-${contentId};`" />

        <article class="mt-5 md:mt-16 mx-auto flex w-full max-w-6xl flex-col px-2 md:px-6 mb-16">
            <ArticlePageHead :title="article?.title" :published="article?.publishedAt ?? article?.createdAt"
                :updated="article?.updatedAt" :tags="article?.tags"
                :readingTime :style="`view-transition-name: article-title-${contentId};`" :contentId />

            <MqCollapsibleToc :items="tableOfContents" :title="article?.title"
                class="mt-5" />

            <div class="content prose">
                <MqArticlerRender :target="article?.content!" class="micro-cms mt-6 md:mt-10" />
            </div>
        </article>
        <!-- 共有ボタン -->
        <div class="mt-6 mb-4 max-w-6xl mx-auto w-full px-2 md:px-6">
            <MqShareButtons 
                :title="article?.title || ''" 
                :url="`/entry/${contentId}`"
            />
        </div>

        <!-- いいねボタン -->
        <div class="mt-6 mb-4 max-w-6xl mx-auto w-full px-2 md:px-6">
            <MqFavoriteButton :content-id="contentId" class="px-5 py-3" />
        </div>
        <!-- コメントセクション -->
        <div class="mt-8 mb-8 max-w-6xl mx-auto w-full px-2 md:px-6">
            <MqCommentSection :content-id="contentId" />
        </div>
    </main>
    <ArticlePageFooter :current-article="article!" />
    <MqTocSidebar
        :items="tableOfContents"
        :article-content="article?.content!"
        :page-title="article?.title || ''"
        :updated-at="article?.updatedAt || article?.publishedAt || ''"
        :char-count="readingTime.charCount"
    />
</template>
