<script setup lang="ts">
import {
  ArticleBodyNodes,
  type ArticleRenderContext,
} from "~/utils/articleBodyRenderer";

const props = defineProps<{
  doc: TiptapDoc | null;
}>();

const route = useRoute();
const config = useWebConfig();
const toast = useToast();

// 走査順のheading id割り当て(既存アンカー互換)
const headingIdMap = computed(() => {
  const map = new Map<TiptapNode, string>();
  if (!props.doc) return map;
  let index = 0;
  const walk = (node: TiptapNode) => {
    if (node.type === "heading") {
      const level = Number(node.attrs?.level ?? 1);
      if (level >= 1 && level <= 4) {
        map.set(node, resolveHeadingId(node, index));
        index += 1;
      }
    }
    node.content?.forEach(walk);
  };
  (props.doc.content ?? []).forEach(walk);
  return map;
});

const copyHeadingPermalink = (headingId: string) => {
  const baseUrl = `${config.value.siteUrl.endsWith("/") ? config.value.siteUrl.slice(0, -1) : config.value.siteUrl}${route.path}`;
  const url = `${baseUrl}#${headingId}`;

  try {
    navigator.clipboard.writeText(url);
    toast.success({ title: "パーマリンクをコピーしました！" });
  } catch (error) {
    console.error("Failed to copy permalink:", error);
    toast.error({ title: "コピーに失敗しました" });
  }
};

const renderContext = computed<ArticleRenderContext>(() => ({
  headingIdFor: (node) => headingIdMap.value.get(node) ?? "",
  onHeadingClick: copyHeadingPermalink,
}));

// コードブロックとリンクカードは.article-bodyの外側に配置
const COMPONENT_NODE_TYPES = new Set(["codeBlock", "linkCard"]);

interface ArticleSegment {
  type: "html" | "component";
  nodes: TiptapNode[];
}

const segments = computed<ArticleSegment[]>(() => {
  const result: ArticleSegment[] = [];
  for (const node of props.doc?.content ?? []) {
    if (COMPONENT_NODE_TYPES.has(node.type)) {
      result.push({ type: "component", nodes: [node] });
      continue;
    }
    const last = result[result.length - 1];
    if (last?.type === "html") {
      last.nodes.push(node);
    } else {
      result.push({ type: "html", nodes: [node] });
    }
  }
  return result;
});
</script>

<template>
  <div>
    <template v-for="(segment, index) in segments" :key="index">
      <div
        v-if="segment.type === 'html'"
        class="article-body article-body-html-segment"
      >
        <ArticleBodyNodes :nodes="segment.nodes" :ctx="renderContext" />
      </div>
      <ArticleBodyNodes v-else :nodes="segment.nodes" :ctx="renderContext" />
    </template>
  </div>
</template>

<style lang="css">
.article-body-html-segment {
  display: contents;
}

.article-body {
  @apply space-y-4;
  overflow-x: hidden;
  overflow-y: hidden;
  overflow-wrap: break-word;
}

.article-body table {
  display: table;
  width: auto;
  max-width: 100%;
}

.article-body img {
  @apply mx-3 md:mx-8 w-auto h-auto max-w-full md:max-w-[80%] lg:max-w-[70%] max-h-[600px] object-contain block bg-surface-elevated rounded-lg;
}

.article-body figure figcaption {
  @apply max-w-full text-sm text-fg-muted text-center mt-2;
}

.article-body figure {
  @apply w-full m-0;
}

.article-body h1 {
  @apply pt-10 mt-10 text-3xl font-semibold;
}

.article-body h2 {
  @apply pt-5 mt-12 text-2xl font-semibold;
}

.article-body h3 {
  @apply mt-8 text-xl font-semibold;
}

/* クリック可能な見出し */
.article-body .clickable-heading {
  @apply cursor-pointer;
  transition: background-color 0.3s ease;
}

.article-body .clickable-heading:hover {
  @apply text-primary/70 rounded-md px-2 -mx-2 transition-colors;
}

.article-body p {
  @apply mx-3 md:mx-8 mb-6 leading-loose tracking-wide text-base;
}

.article-body a {
  @apply text-primary no-underline relative font-medium transition-all duration-200;
}

.article-body .mq-link-card {
  @apply my-8;
}

.article-body .mq-link-card__link {
  color: inherit;
  text-decoration: none;
}

.article-body .mq-link-card img {
  @apply m-0 p-0 w-auto min-w-0 max-w-full rounded-none bg-transparent shadow-none border-none hover:scale-100 hover:shadow-none;
}

.article-body a .link-icon {
  @apply ml-0.5 inline-block text-xs relative text-fg-muted;
  vertical-align: baseline;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.article-body a[href^="http"] .link-icon {
  @apply inline-block;
}

.article-body a:hover .link-icon {
  opacity: 1;
  @apply text-accent;
}

.article-body a:hover {
  @apply underline decoration-accent/30 decoration-2 underline-offset-2;
}

.article-body a u {
  @apply no-underline;
}

.article-body ul {
  @apply list-disc list-inside mx-5 my-6 space-y-2 text-fg leading-relaxed;
}

.article-body ol {
  @apply list-decimal list-inside mx-5 my-6 space-y-2 text-fg leading-relaxed;
}

.article-body blockquote {
  @apply border-l-4 border-primary/50 bg-surface-muted/50 py-4 pr-4 m-8 rounded-r-lg text-fg-muted italic;
}

.article-body blockquote p {
  @apply pl-4 my-0;
}

.article-body li {
  @apply mb-1 pl-1;
}

/* テーブル */
.article-body table {
  @apply w-full;
  display: block;
  width: auto;
  max-width: 100%;
  overflow-x: auto;
}

.article-body th {
  @apply p-2 border border-border-subtle;
}

.article-body td {
  @apply p-2 border border-border-subtle space-y-0;
}

.article-body p code {
  @apply rounded-lg px-1 mx-1 py-0.5 bg-surface-muted text-fg text-sm border border-border-subtle;
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
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.4;
  }
}
</style>
