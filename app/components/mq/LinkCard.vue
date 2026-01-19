<script setup lang="ts">
import { Note, Clip, Hashtag, UserTimeline } from '@misskey-dev/vue-misskey-embed';

const props = defineProps<{
    url: string;
    target?: string | null;
    rel?: string | null;
}>();

const { data: preview, status, error } = await useFetch<LinkPreviewResponse>('/api/link-preview', {
    query: { url: props.url },
    lazy: true,
    server: false,
});

const FALLBACK_TITLE = 'リンク';

// 各属性がundefinedの場合、target="_blank" rel="noopener noreferrer"にフォールバック
const resolvedTarget = computed(() => props.target ?? '_blank');
const resolvedRel = computed(() => {
    if (typeof props.rel === 'string' && props.rel.length > 0) {
        return props.rel;
    }
    return resolvedTarget.value === '_blank' ? 'noopener noreferrer' : undefined;
});
const isExternalLink = computed(() => /^https?:\/\//.test(props.url));
</script>

<template>
    <div class="mq-link-card">
        <!-- Loading State (Skeleton) -->
        <div v-if="status === 'pending'" class="block w-full">
             <div class="flex items-stretch overflow-hidden rounded-2xl bg-white border-2 border-secondary/20 h-[140px] animate-pulse">
                <!-- Image Skeleton -->
                <div class="flex-shrink-0 bg-gray-200 self-stretch basis-32 sm:basis-48 lg:basis-56"></div>
                <!-- Content Skeleton -->
                <div class="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div class="flex items-center gap-2">
                        <div class="h-4 w-4 bg-gray-200 rounded-sm"></div>
                        <div class="h-3 w-24 bg-gray-200 rounded"></div>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="h-5 w-3/4 bg-gray-200 rounded"></div>
                        <div class="h-4 w-full bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Error State or Fallback -->
        <div v-else-if="error || !preview" class="block w-full">
             <NuxtLink
                :to="url"
                :external="isExternalLink"
                :target="resolvedTarget"
                :rel="resolvedRel"
                class="text-primary underline hover:text-primary/80 transition-colors"
            >
                {{ url }}
            </NuxtLink>
        </div>

        <!-- Misskey系埋め込みリンク -->
        <template v-else-if="preview.isMisskey && preview.type">
            <Note
                v-if="preview.type === 'MISSKEY_NOTE'"
                :url="preview.url"
                class="w-full"
            />
            <Hashtag
                v-else-if="preview.type === 'MISSKEY_HASHTAG'"
                :url="preview.url"
                class="w-full"
            />
            <UserTimeline
                v-else-if="preview.type === 'MISSKEY_USER'"
                :url="preview.url"
                class="w-full"
            />
            <Clip
                v-else-if="preview.type === 'MISSKEY_CLIP'"
                :url="preview.url"
                class="w-full"
            />
        </template>

        <!-- GitHub Permalink Code Preview -->
        <template v-else-if="preview.type === 'GITHUB_PERMALINK' && preview.code">
            <div class="rounded-2xl border-2 border-secondary/20 bg-gray-50 overflow-hidden w-full">
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

        <!-- 他リンク -->
        <NuxtLink
            v-else
            :to="preview.url"
            :external="isExternalLink"
            :target="resolvedTarget"
            :rel="resolvedRel"
            class="mq-link-card__link group block w-full transition-colors duration-200"
        >
            <div
                class="flex items-stretch overflow-hidden rounded-2xl bg-white border-2 border-secondary/40 transition-colors duration-200 hover:bg-primary/5 hover:border-primary/50"
            >
                <div
                    v-if="preview.image"
                    class="flex flex-shrink-0 overflow-hidden bg-secondary/20 self-stretch basis-32 sm:basis-48 lg:basis-56"
                >
                    <NuxtImg
                        :src="preview.image"
                        :alt="preview.title"
                        :width="640"
                        :height="360"
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 35vw, 45vw"
                        class="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                    />
                </div>

                <div class="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div class="flex items-center gap-2 min-w-0">
                        <NuxtImg
                            v-if="preview.favicon"
                            :src="preview.favicon"
                            alt=""
                            class="flex-shrink-0 rounded-sm size-4"
                            loading="lazy"
                            decoding="async"
                        />
                        <p class="text-xs font-medium text-muted-foreground truncate">{{ preview.domain }}</p>
                    </div>

                    <div class="flex-1 min-w-0">
                        <h3 class="font-semibold text-foreground line-clamp-2 text-base transition-colors duration-200 group-hover:text-primary">
                            {{ preview.title || FALLBACK_TITLE }}
                        </h3>
                        <p
                            v-if="preview.description"
                            class="text-sm text-muted-foreground line-clamp-2 mt-1.5 transition-colors duration-200 group-hover:text-primary/80"
                        >
                            {{ preview.description }}
                        </p>
                    </div>

                    <div class="flex items-center justify-end">
                        <div
                            class="flex items-center gap-1 text-secondary/60 transition-colors duration-200 group-hover:text-primary"
                        >
                            <Icon name="material-symbols:arrow-outward-rounded" class="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </NuxtLink>
    </div>
</template>
