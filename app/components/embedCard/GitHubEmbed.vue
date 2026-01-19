<script setup lang="ts">
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css';

const props = defineProps<{
    preview: LinkPreviewResponse;
    url: string;
}>();

const highlightedCode = computed(() => {
    if (!props.preview.code) return '';
    // Trim strictly to avoid leading/trailing newlines causing shifts
    const code = props.preview.code.replace(/^\n+/, '').replace(/\n+$/, '');
    try {
        return hljs.highlightAuto(code).value;
    } catch (e) {
        console.warn('Highlight failed:', e);
        return code;
    }
});

const scrollContainer = ref<HTMLElement | null>(null);
const showScrollIndicator = ref(false);
const isInteracted = ref(false);

const checkScroll = () => {
    const el = scrollContainer.value;
    if (el && el.scrollWidth > el.clientWidth) {
        showScrollIndicator.value = true;
    } else {
        showScrollIndicator.value = false;
    }
};

const handleScroll = () => {
    if (showScrollIndicator.value && !isInteracted.value) {
        isInteracted.value = true;
        // Fade out logic handled by CSS classes reacting to isInteracted if we wanted complex state,
        // but simple v-if/CSS transition works.
        // For matching ArticlerRender exactly, we'll use local state to trigger fade.
    }
};

onMounted(() => {
    // Check initial scroll state
    useResizeObserver(scrollContainer, checkScroll);
    nextTick(() => checkScroll());
});
</script>

<template>
    <div v-if="preview.code" class="rounded-2xl border-2 border-secondary/20 bg-gray-50 overflow-hidden w-full">
        <div class="flex items-center gap-2 px-4 py-2 border-b border-secondary/10 bg-white">
            <Icon name="simple-icons:github" class="w-5 h-5" />
            <span class="text-xs font-mono text-muted-foreground truncate">{{ preview.title || 'GitHub' }}</span>
        </div>
        
        <div class="relative w-full">
            <!-- Scroll Indicator -->
             <div
                v-if="showScrollIndicator && !isInteracted"
                class="scroll-indicator"
            >
                スクロール可能です →
            </div>

            <div 
                ref="scrollContainer" 
                class="overflow-x-auto overflow-y-hidden w-full relative"
                @scroll="handleScroll"
            >
                <div class="font-mono flex items-stretch min-w-max">
                    <!-- Line Numbers (Sticky) -->
                    <div 
                        class="sticky left-0 z-10 flex flex-col text-right select-none text-muted-foreground/50 border-r border-secondary/10 pr-4 pl-4 shrink-0 min-w-[3em] text-sm bg-gray-50/90 backdrop-blur-[2px]" 
                        style="line-height: 1.5rem;"
                    >
                        <span v-for="i in ((preview.endLine ?? 1) - (preview.startLine ?? 1) + 1)" :key="i">
                            {{ (preview.startLine ?? 1) + i - 1 }}
                        </span>
                    </div>
                    
                    <!-- Code Content -->
                    <div class="pr-4 pl-4 grow">
                         <pre class="whitespace-pre text-gray-800 m-0 p-0 bg-transparent" style="line-height: 1.5rem;"><code class="hljs !p-0 !bg-transparent !overflow-y-hidden code-content" v-html="highlightedCode"></code></pre>
                    </div>
                </div>
            </div>
        </div>

        <div class="px-4 py-2 bg-white border-t border-secondary/10 flex justify-end">
            <NuxtLink 
                :to="url" 
                target="_blank" 
                rel="noopener noreferrer"
                class="text-xs text-primary hover:underline flex items-center gap-1"
            >
                View on GitHub <Icon name="material-symbols:arrow-outward-rounded" class="w-3 h-3" />
            </NuxtLink>
        </div>
    </div>
</template>

<style scoped>
:deep(.code-content),
:deep(.code-content *) {
    font-family: "fira-code", monospace !important;
    font-weight: 400;
    font-style: normal;
}

/* Scroll Indicator Styles */
.scroll-indicator {
    @apply bg-primary;
    position: absolute;
    top: 10px;
    right: 15px;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    z-index: 20;
    pointer-events: none;
    animation: blink 1.5s infinite;
}

@keyframes blink {
    0% { opacity: 0.4; }
    50% { opacity: 1; }
    100% { opacity: 0.4; }
}
</style>
