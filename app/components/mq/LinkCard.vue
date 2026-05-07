<script setup lang="ts">
import MisskeyEmbed from '~/components/embedCard/MisskeyEmbed.vue';
import GitHubEmbed from '~/components/embedCard/GitHubEmbed.vue';
import YouTubeEmbed from '~/components/embedCard/YouTubeEmbed.vue';
import TwitterEmbed from '~/components/embedCard/TwitterEmbed.vue';
import InstagramEmbed from '~/components/embedCard/InstagramEmbed.vue';
import StandardEmbed from '~/components/embedCard/StandardEmbed.vue';

const props = defineProps<{
    url: string;
    target?: string | null;
    rel?: string | null;
}>();

const { data: preview, status, error } = await useFetch<LinkPreviewResponse>('/api/link-preview', {
    query: { url: props.url },
});

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
             <div class="flex items-stretch overflow-hidden rounded-2xl bg-surface-elevated border-2 border-secondary/20 h-[140px] animate-pulse">
                <!-- Image Skeleton -->
                <div class="flex-shrink-0 bg-surface-muted self-stretch basis-32 sm:basis-48 lg:basis-56"></div>
                <!-- Content Skeleton -->
                <div class="flex flex-1 flex-col justify-between gap-3 p-5">
                    <div class="flex items-center gap-2">
                        <div class="h-4 w-4 bg-surface-muted rounded-sm"></div>
                        <div class="h-3 w-24 bg-surface-muted rounded"></div>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="h-5 w-3/4 bg-surface-muted rounded"></div>
                        <div class="h-4 w-full bg-surface-muted rounded"></div>
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

        <!-- Success -->
        <template v-else>
            <MisskeyEmbed 
                v-if="['MISSKEY_NOTE', 'MISSKEY_HASHTAG', 'MISSKEY_USER', 'MISSKEY_CLIP'].includes(preview.type)" 
                :preview="preview" 
            />
            
            <GitHubEmbed 
                v-else-if="preview.type === 'GITHUB_PERMALINK'" 
                :preview="preview" 
                :url="url" 
            />

            <YouTubeEmbed 
                v-else-if="preview.type === 'YOUTUBE'" 
                :preview="preview" 
            />

            <TwitterEmbed 
                v-else-if="preview.type === 'TWITTER'" 
                :preview="preview" 
            />

            <InstagramEmbed 
                v-else-if="preview.type === 'INSTAGRAM'" 
                :preview="preview" 
            />
            
            <StandardEmbed 
                v-else 
                :preview="preview" 
                :url="url" 
                :target="target" 
                :rel="rel" 
            />
        </template>
    </div>
</template>
