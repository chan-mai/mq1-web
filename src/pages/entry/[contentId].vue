<script setup lang="ts">
import * as cheerio from 'cheerio';
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css';

const route = useRoute();
const { contentId } = route.params as { contentId: string };

const { data: articleData } = await useAsyncData(`article-${contentId}`, async () => {
    try {
        const response = await useMicroCMSGetObject<Article>({
            endpoint: 'articles',
            queries: {
                limit: 1,
                orders: '-publishedAt',
                filters: `id[equals]${contentId}`,
            },
        });

        const data = response.data.value;
        if (!data.contents || data.contents.length === 0) {
            return null;
        }

        let article = data.contents[0];

        // タグが存在しない場合は未分類扱い
        if (!article.tags) {
            article.tags = {
                name: '未分類',
                slug: 'uncategorized',
            };
        }

        // コードハイライト
        if (article && article.content) {
            const $ = cheerio.load(article.content);
            $('pre code').each((_, elem) => {
                const className = $(elem).attr('class');
                const language = className?.replace('language-', '');

                let result;
                if (language) {
                    try {
                        result = hljs.highlight($(elem).text(), { language });
                    } catch (error) {
                        result = hljs.highlightAuto($(elem).text());
                    }
                } else {
                    result = hljs.highlightAuto($(elem).text());
                }
                $(elem).html(result.value);
                $(elem).addClass('hljs');
            });
            article = {
                ...article,
                content: $.html()
            };
        }

        return article;
    } catch (error) {
        console.error('Error fetching article:', error);
        return null;
    }
});


// 目次を生成する関数
const generateTableOfContents = (content: string) => {
  const $ = cheerio.load(content);
  const headings = $('h1, h2, h3, h4').toArray();
  const toc: { id: string; text: string; level: number }[] = [];
  
  // 各見出しに一意のIDを付与し、目次データを構築
  headings.forEach((heading, index) => {
    const $heading = $(heading);
    const text = $heading.text().trim();
    const level = parseInt(heading.tagName.substring(1)); // h1 -> 1, h2 -> 2, ...
    
    // IDを設定（なければ生成）
    let id = $heading.attr('id');
    if (!id) {
      id = `heading-${index}`;
      $heading.attr('id', id);
    }
    
    toc.push({ id, text, level });
  });
  
  // 記事のコンテンツをIDが付与された状態で更新
  if (articleData.value) {
    articleData.value = {
      ...articleData.value,
      content: $.html()
    };
  }
  
  return toc;
};


const calculateReadingTime = (htmlContent: string): {charCount: number, minutes: number} => {
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
    if (article.value) {
        const { charCount, minutes } = calculateReadingTime(article.value.content);
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

const article = computed(() => articleData.value);
const tableOfContents = computed<{ id: string; text: string; level: number }[]>(() => {
    return articleData.value ? generateTableOfContents(articleData.value.content) : [];
});


const isUpdate = computed(() => {
    return article.value && (article.value.createdAt || article.value.publishedAt) !== article.value.updatedAt;
});
</script>
<template>
    <main
        class="max-w-none text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0 max-w-7xl gap-16 md:gap-20">

        <MqHero :url="article.eyecatch?.url" :title="article.title" text-hidden article-page :style="`view-transition-name: article-${contentId};`"/>

        <article class="mt-16 mx-auto flex w-full max-w-6xl flex-col px-2 md:px-6 mb-16">
            <ArticlePageHead :title="article?.title" :published="article?.publishedAt ?? article?.createdAt ?? ''"
                :updated="isUpdate && article?.updatedAt ? article.updatedAt : ''" :tags="article?.tags" :readingTime/>
            
            <MqCollapsibleToc :items="tableOfContents" :title="`${article.title}の目次`" class="mt-5"/>
            
            <div class="content prose">
                <div v-if="article?.content" v-html="article?.content" class="micro-cms mt-6 md:mt-10"></div>
            </div>
        </article>
    </main>

    <ArticlePageFooter :current-article="article" />
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
    @apply text-accent no-underline;
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
