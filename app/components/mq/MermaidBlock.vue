<script setup lang="ts">
const props = defineProps<{
    source: string;
    filename?: string;
}>();

const colorMode = useColorMode();
const diagram = useTemplateRef<HTMLElement>('diagram');
const view = ref<'diagram' | 'code'>('diagram');
const isRendering = ref(true);
const renderFailed = ref(false);
const diagramId = useId().replaceAll(':', '-');

let renderVersion = 0;
let mermaidPromise: Promise<typeof import('mermaid')['default']> | null = null;

const renderDiagram = async () => {
    if (!import.meta.client || !diagram.value) return;

    const currentVersion = ++renderVersion;
    isRendering.value = true;
    renderFailed.value = false;
    diagram.value.textContent = 'Mermaidを読み込んでいます';

    try {
        mermaidPromise ??= import('mermaid').then(({ default: mermaid }) => mermaid);
        const mermaid = await mermaidPromise;
        mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'strict',
            secure: ['securityLevel', 'startOnLoad', 'maxTextSize'],
            suppressErrorRendering: true,
            theme: colorMode.value === 'dark' ? 'dark' : 'default',
        });
        const id = `mermaid-${diagramId}-${currentVersion}`;
        const { svg, bindFunctions } = await mermaid.render(id, props.source);
        if (currentVersion !== renderVersion || !diagram.value) return;
        diagram.value.innerHTML = svg;
        bindFunctions?.(diagram.value);
    } catch {
        if (currentVersion !== renderVersion) return;
        if (diagram.value) {
            diagram.value.textContent = 'Mermaidを表示できませんでした';
        }
        renderFailed.value = true;
        view.value = 'code';
    } finally {
        if (currentVersion === renderVersion) {
            isRendering.value = false;
        }
    }
};

onMounted(renderDiagram);

watch([() => props.source, () => colorMode.value], () => {
    nextTick(renderDiagram);
});
</script>

<template>
    <div class="mermaid-block">
        <div class="mermaid-toolbar">
            <span class="mermaid-label">{{ filename || 'Mermaid' }}</span>
            <div class="mermaid-controls" role="group" aria-label="表示形式">
                <button type="button" :aria-pressed="view === 'diagram'" @click="view = 'diagram'">
                    Mermaid
                </button>
                <button type="button" :aria-pressed="view === 'code'" @click="view = 'code'">
                    Code
                </button>
            </div>
        </div>
        <div
            v-show="view === 'diagram'"
            ref="diagram"
            class="mermaid-diagram"
            role="img"
            aria-label="Mermaid図"
            :aria-busy="isRendering"
        >
            {{ renderFailed ? 'Mermaidを表示できませんでした' : 'Mermaidを読み込んでいます' }}
        </div>
        <div v-show="view === 'code'" class="mermaid-code">
            <MqCodeBlock :source="source" language="mermaid" embedded />
        </div>
    </div>
</template>

<style scoped lang="css">
.mermaid-block {
    @apply mx-6 my-8 overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated;
}

.mermaid-toolbar {
    @apply flex items-center justify-between gap-4 border-b border-border-subtle bg-surface-muted px-4 py-2;
}

.mermaid-label {
    @apply truncate text-xs font-medium text-fg-muted;
    font-family: "fira-code", monospace;
}

.mermaid-controls {
    @apply flex shrink-0 rounded-lg border border-border-subtle bg-surface-elevated p-0.5;
}

.mermaid-controls button {
    @apply cursor-pointer rounded-md border-0 bg-transparent px-3 py-1 text-xs text-fg-muted transition-colors;
}

.mermaid-controls button[aria-pressed="true"] {
    @apply bg-primary text-white;
}

.mermaid-diagram {
    @apply overflow-x-auto p-4 text-center text-sm text-fg-muted md:p-6;
}

.mermaid-diagram :deep(svg) {
    @apply mx-auto h-auto max-w-full;
}

</style>
