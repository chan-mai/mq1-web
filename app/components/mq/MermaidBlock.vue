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

const getThemeVariables = () => {
    const styles = getComputedStyle(diagram.value!);
    const color = (name: string) => styles.getPropertyValue(`--mermaid-${name}`).trim();

    return {
        darkMode: colorMode.value === 'dark',
        background: color('background'),
        primaryColor: color('primary'),
        primaryBorderColor: color('primary-border'),
        primaryTextColor: color('text'),
        secondaryColor: color('secondary'),
        secondaryBorderColor: color('secondary-border'),
        secondaryTextColor: color('text'),
        tertiaryColor: color('tertiary'),
        tertiaryBorderColor: color('tertiary-border'),
        tertiaryTextColor: color('text'),
        lineColor: color('line'),
        textColor: color('text'),
        noteBkgColor: color('note'),
        noteBorderColor: color('note-border'),
        noteTextColor: color('text'),
        clusterBkg: color('cluster'),
        clusterBorder: color('cluster-border'),
        edgeLabelBackground: color('background'),
        cScale0: color('primary'),
        cScale1: color('secondary'),
        cScale2: color('tertiary'),
        cScale3: color('quaternary'),
        cScale4: color('note'),
        pie1: color('primary'),
        pie2: color('secondary'),
        pie3: color('tertiary'),
        pie4: color('quaternary'),
        pie5: color('note'),
        pieTitleTextColor: color('text'),
        pieLegendTextColor: color('text'),
        fontFamily: '"futura-pt", "Noto Sans JP", sans-serif',
    };
};

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
            theme: 'base',
            themeVariables: getThemeVariables(),
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
    <div class="mermaid-block" :class="{ 'mermaid-block--dark': colorMode.value === 'dark' }">
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
    --mermaid-background: #ffffff;
    --mermaid-primary: #fde7ea;
    --mermaid-primary-border: #fc9fa8;
    --mermaid-secondary: #eeeafa;
    --mermaid-secondary-border: #b9a7e8;
    --mermaid-tertiary: #e5f4ee;
    --mermaid-tertiary-border: #82c4a6;
    --mermaid-quaternary: #e7f1fb;
    --mermaid-line: #b8798a;
    --mermaid-text: #475569;
    --mermaid-note: #fff4d6;
    --mermaid-note-border: #dfc46e;
    --mermaid-cluster: #f9fafb;
    --mermaid-cluster-border: #e5e7eb;
}

.mermaid-block--dark {
    --mermaid-background: #1a1d24;
    --mermaid-primary: #4a3038;
    --mermaid-primary-border: #fc9fa8;
    --mermaid-secondary: #38334c;
    --mermaid-secondary-border: #b9a7e8;
    --mermaid-tertiary: #263f38;
    --mermaid-tertiary-border: #82c4a6;
    --mermaid-quaternary: #293b50;
    --mermaid-line: #d294a3;
    --mermaid-text: #e2e8f0;
    --mermaid-note: #4a4128;
    --mermaid-note-border: #dfc46e;
    --mermaid-cluster: #22252e;
    --mermaid-cluster-border: #334155;
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
