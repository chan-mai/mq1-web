<script setup lang="ts">
import hljs from 'highlight.js';

const props = withDefaults(
  defineProps<{
    source: string;
    language?: string;
    filename?: string;
    embedded?: boolean;
  }>(),
  {
    language: undefined,
    filename: undefined,
    embedded: false,
  },
);

const scrollContainer = useTemplateRef<HTMLElement>('scrollContainer');
const codeElement = useTemplateRef<HTMLElement>('codeElement');
const showScrollIndicator = ref(false);
const scrollIndicatorDismissed = ref(false);

const escapeHtml = (source: string) =>
  source
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const highlightAutomatically = () => {
  try {
    return hljs.highlightAuto(props.source).value;
  } catch {
    return escapeHtml(props.source);
  }
};

const highlightedCode = computed(() => {
  if (!props.language) return highlightAutomatically();

  try {
    return hljs.highlight(props.source, { language: props.language }).value;
  } catch (error) {
    console.warn(`言語'${props.language}'のハイライトに失敗しました:`, error);
    return highlightAutomatically();
  }
});

const languageClass = computed(() => {
  if (!props.language || !/^[\w-]+$/.test(props.language)) return undefined;
  return `language-${props.language}`;
});

const checkOverflow = () => {
  const element = scrollContainer.value;
  showScrollIndicator.value = Boolean(
    element && element.scrollWidth > element.clientWidth + 1,
  );
};

const dismissScrollIndicator = () => {
  scrollIndicatorDismissed.value = true;
};

useResizeObserver(scrollContainer, checkOverflow);
useResizeObserver(codeElement, checkOverflow);

onMounted(() => nextTick(checkOverflow));

watch([() => props.source, () => props.language], () => {
  scrollIndicatorDismissed.value = false;
  nextTick(checkOverflow);
});
</script>

<template>
  <div class="mq-code-block" :class="{ 'mq-code-block--embedded': embedded }">
    <div v-if="filename" class="code-header">
      <div class="mac-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <span class="filename">{{ filename }}</span>
    </div>
    <div class="code-body">
      <div
        v-if="showScrollIndicator && !scrollIndicatorDismissed"
        class="scroll-indicator"
      >
        スクロール可能です→
      </div>
      <pre
        ref="scrollContainer"
        tabindex="0"
        @scroll="dismissScrollIndicator"
      ><code
                    ref="codeElement"
                    class="hljs"
                    :class="languageClass"
                    v-html="highlightedCode"
                ></code></pre>
    </div>
  </div>
</template>

<style scoped lang="css">
.mq-code-block {
  @apply mx-6 my-8 overflow-hidden rounded-xl border border-border-subtle bg-surface-muted text-fg;
}

.mq-code-block--embedded {
  @apply m-0 rounded-none border-0;
}

.code-header {
  @apply flex items-center gap-4 border-b border-border-subtle bg-surface-muted px-4 py-3 text-sm text-fg;
}

.mac-dots {
  @apply flex gap-1.5;
}

.mac-dots span {
  @apply block h-3 w-3 rounded-full;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.mac-dots span:nth-child(1) {
  background-color: #ff5f56;
}

.mac-dots span:nth-child(2) {
  background-color: #ffbd2e;
}

.mac-dots span:nth-child(3) {
  background-color: #27c93f;
}

.filename {
  @apply truncate text-xs font-medium tracking-wide text-fg-muted;
  font-family: 'fira-code', monospace;
}

.code-body {
  @apply relative;
}

pre {
  @apply m-0 max-w-full overflow-x-auto px-6 py-4;
}

code {
  @apply block min-w-max bg-transparent p-0;
  font-family: 'fira-code', monospace;
  font-weight: 400;
  font-style: normal;
}

.mq-code-block pre code.hljs {
  overflow: visible;
  padding: 0;
}

code :deep(*) {
  font-family: inherit;
}

.scroll-indicator {
  @apply absolute right-2.5 top-1.5 z-10 rounded bg-primary px-2 py-0.5 text-xs text-white;
  pointer-events: none;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.4;
  }

  50% {
    opacity: 1;
  }
}
</style>
