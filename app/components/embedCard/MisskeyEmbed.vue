<script setup lang="ts">
import { Note, Clip, Hashtag, UserTimeline } from '@misskey-dev/vue-misskey-embed';

defineProps<{
    preview: LinkPreviewResponse;
}>();
</script>

<template>
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
