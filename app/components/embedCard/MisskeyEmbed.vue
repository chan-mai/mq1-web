<script setup lang="ts">
// 各 Misskey 埋め込みコンポーネントへのディスパッチャ
// preview.type によって適切なサブコンポーネントに委譲する
import Note from './Misskey/Note.vue';
import Hashtag from './Misskey/Hashtag.vue';
import UserTimeline from './Misskey/UserTimeline.vue';
import Clip from './Misskey/Clip.vue';

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
