<script setup lang="ts">
import * as cheerio from 'cheerio';
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css';

const isLoaded: Ref<boolean> = ref(false);
const route = useRoute();
const { contentId } = route.params as { contentId: string };

let article: Ref<Article | null> = ref(null);

// /api/get-article/:contentIdから取得
try {
    const { data, status, error } = await useFetch(() => `/api/article/${contentId}`);

    if (error.value) {
        console.error('Error fetching article:', error.value);
        // 404
        if (error.value.statusCode === 404) {
            showError({
                statusCode: 404,
                message: 'Article not found',
                fatal: true,
            });
        } else {
            showError({
                statusCode: 500,
                message: 'Internal Server Error',
                fatal: true,
            });
        }
    }

    if (status.value === "success") {
        isLoaded.value = true;
        article.value = data.value?.body as unknown as Article;
    } else {
        showError({
            statusCode: 404,
            message: 'Article not found',
            fatal: true,
        });
    }
} catch (error) {
    console.error('Error fetching article:', error);
}

// コードハイライトとリンクアイコンの追加
if (article.value && article.value.content) {
    const $ = cheerio.load(article.value.content);

    // コードハイライト
    $('pre code').each((_, elem) => {
        const className = $(elem).attr('class');

        // 言語部分を正確に抽出するように改善
        let language = null;
        if (className) {
            const match = className.match(/language-(\w+)/);
            language = match ? match[1] : null;
        }

        let result;
        if (language) {
            try {
                result = hljs.highlight($(elem).text(), { language });
            } catch (error) {
                console.warn(`言語'${language}'のハイライトに失敗しました:`, error);
                result = hljs.highlightAuto($(elem).text());
            }
        } else {
            result = hljs.highlightAuto($(elem).text());
        }
        $(elem).html(result.value);
        $(elem).addClass('hljs');
    });

    // リンクにアイコンを追加
    $('a').each((_, elem) => {
        const $link = $(elem);
        // リンクが既にアイコンを持っていないか、imgタグを含んでいない場合のみ追加
        if (!$link.find('.link-icon').length && !$link.find('img').length) {
            $link.addClass('link-with-icon');
            $link.append('<span class="link-icon">&#128279;</span>');
        }
    });

    article.value = {
        ...article.value,
        content: $.html()
    };
}

// --- OGP Setup ---
const config = useWebConfig();

if (article.value && article.value.content) {
    const pageTitle = `${article.value?.title || ''} - ${config.value.siteName}`;
    const pageDescription = article.value?.summary || config.value.siteDescription;
    const ogImageUrl = useOgGenerator(article.value?.title || '');
    const pageUrl = `${config.value.siteUrl}/entry/${contentId}`;
    const publishedTime = article.value?.publishedAt || article.value?.createdAt;
    const modifiedTime = article.value?.updatedAt;

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
    const minutes: number = Math.ceil(charCount / 600);

    return { charCount: charCount, minutes: minutes, };
};

const readingTime = computed(() => {
    if (isLoaded.value && article.value && article.value.content) {
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

// 過去に更新された記事か
const isUpdate = ref(article.value && (article.value.createdAt || article.value.publishedAt) !== article.value.updatedAt);


</script>
<template>
    <main v-if="isLoaded"
        class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20">

        <MqHero :url="article?.eyecatch?.url || ''" :title="article?.title ?? ''" text-hidden article-page
            :style="`view-transition-name: article-${contentId};`" />

        <article class="mt-16 mx-auto flex w-full max-w-6xl flex-col px-2 md:px-6 mb-16">
            <ArticlePageHead :title="article?.title ?? ''" :published="article?.publishedAt ?? article?.createdAt ?? ''"
                :updated="isUpdate && article?.updatedAt ? article?.updatedAt : ''" :tags="article?.tags || []"
                :readingTime :style="`view-transition-name: article-title-${contentId};`" />

            <MqCollapsibleToc :items="tableOfContents" :title="article?.title ? `${article?.title}の目次` : '目次'"
                class="mt-5" />

            <div class="content prose">
                <div v-if="article?.content" v-html="article?.content" class="micro-cms mt-6 md:mt-10"></div>
            </div>
        </article>
    </main>

    <ArticlePageFooter v-if="isLoaded" :current-article="article!" />
</template>
<style lang="css">
.micro-cms {
    overflow-x: auto;
}

.micro-cms table {
    @apply w-full border-collapse border-2 border-gray-200;
}

.micro-cms img {
    @apply w-full min-w-[30vw] bg-white pl-0 pr-0 ml-0 mr-0 rounded-lg;
}

/* タブレット */
@media (min-width: 640px) {
    .micro-cms img {
        @apply max-w-[50vw];
    }
}

/* PC */
@media (min-width: 1024px) {
    .micro-cms img {
        @apply max-w-[50vw];
    }
}

/* 画像を左寄せ */
.micro-cms figure {
    @apply text-left;
}

.micro-cms h1 {
    @apply mt-5 mb-5 block text-2xl;
}

.micro-cms h2 {
    @apply mt-5 mb-5 font-bold md:text-2xl;
}

.micro-cms h3 {
    @apply mt-5 mb-5 text-accent font-semibold;
}

.micro-cms p {
    @apply text-lg ml-5 pb-3;
}

.micro-cms a {
    @apply text-accent no-underline relative;
}

.micro-cms a .link-icon {
    @apply ml-0.5 inline-block text-xs relative;
    vertical-align: baseline;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.micro-cms a[href^="http"] .link-icon {
    @apply inline-block;
}

.micro-cms a:hover .link-icon {
    opacity: 1;
}

.micro-cms a:hover {
    @apply underline;
}

.micro-cms a u {
    @apply no-underline;
}

.micro-cms ul {
    @apply list-disc list-inside;
}

.micro-cms ol {
    @apply list-decimal list-inside;
}

.micro-cms blockquote {
    @apply border-l-4 border-primary text-gray-500;
}

.micro-cms blockquote p {
    @apply pl-2;
}

.micro-cms pre {
    @apply p-4 bg-gray-100;
}

.micro-cms li {
    @apply mb-1;
}

/* テーブル */
.micro-cms table {
    @apply text-left border-collapse border border-gray-400;
}

.micro-cms th {
    @apply p-2 border border-gray-300;
}

.micro-cms td {
    @apply p-2 border border-gray-300;
}

.micro-cms pre code {
    @apply rounded-lg;
}
</style>
