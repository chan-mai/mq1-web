<script setup lang="ts">
import * as cheerio from 'cheerio';
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css';

const props = defineProps({
    target: {
        type: String,
        required: true,
    },
});

const articleHtml = computed(() => {
    // コードハイライトとリンクアイコンの追加
    if (props.target) {
        const $ = cheerio.load(props.target);

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

        return $.html();
    } else {
        return '';
    }
});

// スクロール可能な要素を検出し、インジケーターを追加する
onMounted(() => {
    nextTick(() => {
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
    });
});
</script>

<template>
    <div v-html="articleHtml" />
</template>

<style lang="css">
.micro-cms {
    @apply space-y-4;
    overflow-x: auto;
}

.micro-cms table {
    display: table;
    width: auto;
    max-width: 100%;
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
    @apply mt-5 mb-5 text-3xl;
}

.micro-cms h2 {
    @apply mt-5 mb-5 text-2xl;
}

.micro-cms h3 {
    @apply mt-5 mb-5 text-xl;
}

.micro-cms p {
    @apply ml-5 pb-3;
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
    overflow-x: auto;
    max-width: 100%;
}

.micro-cms li {
    @apply mb-1;
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
    @apply p-2 border border-gray-300;
}

.micro-cms pre code {
    @apply rounded-lg;
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