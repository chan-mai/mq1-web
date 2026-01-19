<script setup lang="ts">
defineProps<{
    preview: LinkPreviewResponse;
    url: string;
}>();
</script>

<template>
    <div v-if="preview.code" class="rounded-2xl border-2 border-secondary/20 bg-gray-50 overflow-hidden w-full">
        <div class="flex items-center gap-2 px-4 py-2 border-b border-secondary/10 bg-white">
            <Icon name="simple-icons:github" class="w-5 h-5" />
            <span class="text-xs font-mono text-muted-foreground truncate">{{ preview.title || 'GitHub' }}</span>
        </div>
        <div class="p-4 overflow-x-auto">
            <div class="flex gap-4 text-xs font-mono leading-relaxed">
                <div class="flex flex-col text-right select-none text-muted-foreground/50 border-r border-secondary/10 pr-4">
                    <span v-for="i in ((preview.endLine ?? 1) - (preview.startLine ?? 1) + 1)" :key="i">
                        {{ (preview.startLine ?? 1) + i - 1 }}
                    </span>
                </div>
                <pre class="whitespace-pre text-gray-800"><code>{{ preview.code }}</code></pre>
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
