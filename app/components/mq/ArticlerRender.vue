<script setup lang="ts">
import * as cheerio from 'cheerio';
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css';

defineOptions({ inheritAttrs: false });

const props = defineProps({
    target: {
        type: String,
        required: true,
    },
});

const route = useRoute();
const config = useWebConfig();

type LinkCardEntry = {
    url: string;
    target?: string;
    rel?: string;
};

type ArticleSegment = { type: 'html'; content: string } | { type: 'link-card'; data: LinkCardEntry };

const attrs = useAttrs();

const normalizeClass = (classValue: unknown): string[] => {
    if (!classValue) return [];
    if (typeof classValue === 'string') {
        return classValue.split(/\s+/).filter(Boolean);
    }
    if (Array.isArray(classValue)) {
        return classValue.flatMap(normalizeClass);
    }
    if (typeof classValue === 'object') {
        return Object.entries(classValue)
            .filter(([, applied]) => Boolean(applied))
            .map(([className]) => className);
    }
    return [];
};

const containerAttrs = computed(() => {
    const { class: _incomingClass, ...rest } = attrs;
    return rest;
});

const rootClass = computed(() => {
    const classList = normalizeClass(attrs.class);
    return classList.filter((className) => className !== 'micro-cms');
});

const applyMicroCms = computed(() => normalizeClass(attrs.class).includes('micro-cms'));
const htmlSegmentClass = computed(() =>
    applyMicroCms.value ? ['micro-cms', 'micro-cms-html-segment'] : ['micro-cms-html-segment']
);


const buildSegments = (markup: string, linkCards: LinkCardEntry[]): ArticleSegment[] => {
    const placeholderRegex = /\[\[MQ_LINK_CARD:(\d+)]]/g;
    const segments: ArticleSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = placeholderRegex.exec(markup)) !== null) {
        const preceding = markup.slice(lastIndex, match.index);
        if (preceding.trim().length > 0) {
            segments.push({ type: 'html', content: preceding });
        }
        const placeholderIdx = Number(match[1]);
        const linkCard = linkCards[placeholderIdx];
        if (linkCard) {
            segments.push({ type: 'link-card', data: linkCard });
        }
        lastIndex = match.index + match[0].length;
    }

    const trailing = markup.slice(lastIndex);
    if (trailing.trim().length > 0) {
        segments.push({ type: 'html', content: trailing });
    }

    if (segments.length === 0) {
        segments.push({ type: 'html', content: markup });
    }

    return segments;
};

const articleSegments = ref<ArticleSegment[]>([]);
const isLoading = ref(true);

const processContent = () => {
    // コードハイライトとリンクアイコンの追加, リンクカードの置き換え
    if (props.target) {
        const $ = cheerio.load(props.target);
        const linkCardEntries: LinkCardEntry[] = [];

        // コードハイライト
        $('pre code').each((_, elem) => {
            const className = $(elem).attr('class');
            const $pre = $(elem).parent('pre');
            const $div = $pre.parent('div');

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

            // data-filename属性がある場合、ファイル名を表示
            // div要素またはpre要素のどちらかにdata-filename属性があるかをチェック
            const filename = $div.attr('data-filename') || $pre.attr('data-filename');
            if (filename) {
                // ファイル名表示用のヘッダーを作成
                const header = $(`
                    <div class="code-header">
                        <div class="mac-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <span class="filename">${filename}</span>
                    </div>
                `);
                
                // div要素にdata-filenameがある場合は、div要素の中にヘッダーを挿入
                if ($div.attr('data-filename')) {
                    $div.prepend(header);
                    $div.addClass('has-filename');
                } else {
                    // pre要素にdata-filenameがある場合は、pre要素の前にヘッダーを挿入
                    $pre.before(header);
                    $pre.addClass('has-filename');
                }
            }
        });

        // リンクにアイコンを追加
        $('a').each((_, elem) => {
            const $link = $(elem);
            const href = $link.attr('href')?.trim();
            const textContent = $link.text().trim();

            // hrefとテキストが一致するもの
            if (href && href === textContent) {
                // aタグ属性を構造体として保持
                const placeholderIndex = linkCardEntries.push({
                    url: href,
                    // フォールバックはコンポーネント側で行うので、とりまundefinedにする
                    target: $link.attr('target') ?? undefined,
                    rel: $link.attr('rel') ?? undefined,
                }) - 1;
                // コンポーネント置き換えのために一旦プレースホルダを追加
                $link.replaceWith(`[[MQ_LINK_CARD:${placeholderIndex}]]`);
            } else {
                // リンクが既にアイコンを持っていないか、imgタグを含んでいない場合のみ追加
                if (!$link.find('.link-icon').length && !$link.find('img').length) {
                    $link.addClass('link-with-icon');
                    $link.append('<span class="link-icon">&#128279;</span>');
                }
            }
            
        });

        // 見出しの先頭にタグレベルに応じた#を追加
        for (let level = 1; level <= 6; level++) {
            const selector = `h${level}`;
            $(selector).each((_, elem) => {
                const $el = $(elem);
                const existingText = $el.text().trimStart();
                // すでに # で始まる見出しは重複追加しない
                if (/^#{1,6}\s/.test(existingText)) {
                    return;
                }
                $el.prepend(`<span class="heading-level-${level} text-primary/60">${'#'.repeat(level)}</span>&nbsp;`);
                
                // クリック可能なクラスを追加
                $el.addClass('clickable-heading');
            });
        }

    // ... (rest of processContent logic) ...
        const htmlOutput = $.html();
        articleSegments.value = buildSegments(htmlOutput, linkCardEntries);
    } else {
        articleSegments.value = [];
    }
    isLoading.value = false;

    // DOM要素が更新された後にインタラクティブ要素を初期化
    nextTick(() => {
        initInteractiveElements();
    });
};

// 見出しをクリックしたときにパーマリンクをコピー
const copyHeadingPermalink = (headingId: string) => {
    const baseUrl = `${config.value.siteUrl.endsWith('/') ? config.value.siteUrl.slice(0, -1) : config.value.siteUrl}${route.path}`;
    const url = `${baseUrl}#${headingId}`;
    
    try {
        navigator.clipboard.writeText(url);
        useToast().success({
            title: 'パーマリンクをコピーしました！',
        });
    } catch (err) {
        console.error('クリップボードへのコピーに失敗しました:', err);
        useToast().error({
            title: 'コピーに失敗しました',
        });
    }
};

const initInteractiveElements = () => {
    const tables = document.querySelectorAll('.micro-cms table');
    const codeBlocks = document.querySelectorAll('code');
    
    // スクロール可能な要素にインジケーターを追加
    function addScrollIndicator(elements: any) {
        elements.forEach((element: any) => {
            if (element.scrollWidth > element.clientWidth) {
                // スクロール可能な場合、インジケーターを追加
                const indicator = document.createElement('div');
                indicator.className = 'scroll-indicator';
                indicator.innerHTML = 'スクロール可能です →';
                
                // 要素をラップする
                const wrapper = document.createElement('div');
                wrapper.className = 'scrollable-wrapper';
                element.parentNode.insertBefore(wrapper, element);
                wrapper.appendChild(element);
                wrapper.appendChild(indicator);
                
                // スクロールイベントを検知したら点滅を止める
                element.addEventListener('scroll', () => {
                    indicator.classList.remove('blink');
                    indicator.classList.add('fade-out');
                    
                    // 少し時間を置いてから非表示に
                    setTimeout(() => {
                        indicator.style.display = 'none';
                    }, 1000);
                });
            }
        });
    }
    
    addScrollIndicator(tables);
    addScrollIndicator(codeBlocks);
    
    // 見出しにクリックイベントを追加
    const headings = document.querySelectorAll('.micro-cms .clickable-heading');
    headings.forEach((heading) => {
        heading.addEventListener('click', () => {
            const id = heading.getAttribute('id');
            if (id) {
                copyHeadingPermalink(id);
            }
        });
    });
};

onMounted(() => {
    // メインスレッドをブロックしないように非同期で処理を実行
    setTimeout(() => {
        processContent();
    }, 500);
});

watch(() => props.target, () => {
    isLoading.value = true;
    setTimeout(() => {
        processContent();
    }, 500);
});
</script>

<template>
    <div v-bind="containerAttrs" :class="rootClass">
        <MqLoading text="Loading article..." v-if="isLoading" />
        <template v-else>
            <template v-for="(segment, index) in articleSegments" :key="index">
                <div
                    v-if="segment.type === 'html'"
                    :class="htmlSegmentClass"
                    v-html="segment.content"
                />
                <MqLinkCard
                    v-else
                    class="px-8 pt-2"
                    :url="segment.data.url"
                    :target="segment.data.target"
                    :rel="segment.data.rel"
                />
            </template>
        </template>
    </div>
</template>

<style lang="css">
.micro-cms-html-segment {
    display: contents;
}

.micro-cms {
    @apply space-y-4;
    overflow-x: hidden;
    overflow-y: hidden;
    overflow-wrap: break-word;
}

.micro-cms table {
    display: table;
    width: auto;
    max-width: 100%;
}

.micro-cms img {
    @apply mx-3 md:mx-8 w-auto h-auto max-w-full md:max-w-[80%] lg:max-w-[70%] max-h-[600px] object-contain block bg-white rounded-lg;
}

.micro-cms figure figcaption {
    @apply max-w-full text-sm text-gray-400 text-center mt-2;
}

.micro-cms figure {
    @apply w-full m-0;
}


.micro-cms h1 {
    @apply pt-10 mt-10 text-3xl font-semibold;
}

.micro-cms h2 {
    @apply pt-5 mt-12 text-2xl font-semibold;
}

.micro-cms h3 {
    @apply mt-8 text-xl  font-semibold;
}

/* クリック可能な見出し */
.micro-cms .clickable-heading {
    @apply cursor-pointer;
    transition: background-color 0.3s ease;
}

.micro-cms .clickable-heading:hover {
    @apply text-primary/70 rounded-md px-2 -mx-2 transition-colors;
}

.micro-cms p {
    @apply mx-3 md:mx-8 mb-6 leading-loose tracking-wide text-base;
}

.micro-cms a {
    @apply text-primary no-underline relative font-medium transition-all duration-200;
}

.micro-cms .mq-link-card {
    @apply my-8;
}

.micro-cms .mq-link-card__link {
    color: inherit;
    text-decoration: none;
}

.micro-cms .mq-link-card img {
    @apply m-0 p-0 w-auto min-w-0 max-w-full rounded-none bg-transparent shadow-none border-none hover:scale-100 hover:shadow-none;
}

.micro-cms a .link-icon {
    @apply ml-0.5 inline-block text-xs relative text-gray-400;
    vertical-align: baseline;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.micro-cms a[href^="http"] .link-icon {
    @apply inline-block;
}

.micro-cms a:hover .link-icon {
    opacity: 1;
    @apply text-accent;
}

.micro-cms a:hover {
    @apply underline decoration-accent/30 decoration-2 underline-offset-2;
}

.micro-cms a u {
    @apply no-underline;
}

.micro-cms ul {
    @apply list-disc list-inside mx-5 my-6 space-y-2 text-gray-800 leading-relaxed;
}

.micro-cms ol {
    @apply list-decimal list-inside mx-5 my-6 space-y-2 text-gray-800 leading-relaxed;
}

.micro-cms blockquote {
    @apply border-l-4 border-primary/50 bg-gray-50/50 py-4 pr-4 m-8 rounded-r-lg text-gray-600 italic;
}

.micro-cms blockquote p {
    @apply pl-4 my-0;
}

.micro-cms pre {
    @apply px-6 my-8;
    overflow-x: auto;
    max-width: 100%;
}

.micro-cms li {
    @apply mb-1 pl-1;
}

/* テーブル */
.micro-cms table {
    @apply w-full;
    display: block;
    width: auto;
    max-width: 100%;
    overflow-x: auto;
}

.micro-cms th {
    @apply p-2 border border-gray-300;
}

.micro-cms td {
    @apply p-2 border border-gray-300 space-y-0;
}

.micro-cms pre code {
    @apply rounded-lg;
}

.micro-cms pre code span {
    font-family: "fira-code", monospace;
    font-weight: 400;
    font-style: normal;
}

/* コードブロックのファイル名表示 (Mac-Light Theme) */
.code-header {
    @apply bg-gray-100 text-gray-700 px-4 py-3 rounded-t-xl text-sm font-mono mb-0 mx-6 flex items-center gap-4;
    border: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
}

.code-header .mac-dots {
    @apply flex gap-1.5;
}

.code-header .mac-dots span {
    @apply w-3 h-3 rounded-full block;
    border: 1px solid rgba(0,0,0,0.1);
}

.code-header .mac-dots span:nth-child(1) {
    background-color: #ff5f56;
}

.code-header .mac-dots span:nth-child(2) {
    background-color: #ffbd2e;
}

.code-header .mac-dots span:nth-child(3) {
    background-color: #27c93f;
}

.code-header .filename {
    @apply text-gray-600 text-xs font-medium tracking-wide;
    font-family: "fira-code", monospace;
}

.micro-cms pre.has-filename {
    @apply rounded-t-none border-t-0 mt-0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.micro-cms div.has-filename pre {
    @apply rounded-t-none border-t-0 mt-0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.micro-cms pre.has-filename code {
    @apply rounded-t-none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.micro-cms div.has-filename pre code {
    @apply rounded-t-none;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
}

.micro-cms pre {
    @apply mx-6 my-8 bg-gray-50 border border-gray-200 rounded-xl text-gray-800;
    overflow-x: auto;
    max-width: 100%;
}

.micro-cms p code {
    @apply rounded-lg px-1 mx-1 py-0.5 bg-gray-100 text-gray-800 text-sm border border-gray-300;
    font-family: "fira-code", monospace;
    font-weight: 400;
    font-style: normal;
}

/* スクロール可能な要素のラッパー */
.scrollable-wrapper {
    position: relative;
    width: 100%;
}

/* スクロールインジケーター */
.scroll-indicator {
    @apply bg-primary;
    position: absolute;
    top: 5px;
    right: 10px;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.8rem;
    z-index: 10;
}

/* 点滅アニメーション */
.scroll-indicator {
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
}

/* フェードアウトアニメーション */
.fade-out {
    animation: none;
    opacity: 1;
    transition: opacity 1s ease-out;
    opacity: 0;
}
</style>
