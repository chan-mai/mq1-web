<script lang="ts" setup>

type PageHeaderProps = {
    title?: string
    published?: string | null
    updated?: string | null
    author?: {
        name: string
        icon: string
    } | null,
    tags?: Tag[],
    readingTime?: { charCount: number, minutes: number }
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
    title: '',
    published: null,
    updated: null,
    author: null,
    tags: () => [],
})

const publishedDate = computed(() => props.published ? new Date(props.published!).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Tokyo',
}) : null);
const updatedDate = computed(() => (props.updated && props.updated !== props.published) ? new Date(props.updated!).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Tokyo',
}) : null);
</script>

<template>
    <div class="mt-3">
        <Button class="inline-flex items-center gap-x-1 text-sm text-gray-800 hover:text-primary"
            @click="$router.back()">
            <svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <path d="m15 18-6-6 6-6" />
            </svg>
            前のページへ戻る
        </Button>
    </div>
    <div class="flex flex-col gap-5">
        <h1 class="text-3xl font-bold leading-snug text-slate-800 md:text-4xl md:leading-normal">
            {{ title }}
        </h1>
        <div class="flex flex-wrap gap-2">
            <MqTag v-for="tag in tags" :key="tag.id" :tag="tag" transition />
        </div>
        <slot>
            <dl class="flex flex-row flex-wrap gap-3 text-xs sm:gap-4">
                <div v-if="published" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
                    <dt class="text-accent font-bold">投稿した日</dt>
                    <dd class="flex items-center gap-1 font-bold">
                        <Icon name="majesticons:calendar" class="mt-0.5 size-5" />
                        <span class="text-lg">{{ publishedDate }}</span>
                    </dd>
                </div>
                <div v-if="updatedDate" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
                    <dt class="text-accent font-bold">更新した日</dt>
                    <dd class="flex items-center gap-1 font-bold">
                        <Icon name="fluent:arrow-clockwise-24-filled" class="mt-0.5 size-5" />

                        <span class="text-lg">{{ updatedDate }}</span>
                    </dd>
                </div>
                <div v-if="author" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
                    <dt class="text-accent font-bold">書いたひと</dt>
                    <dd class="flex items-center gap-1 font-bold">
                        <div class="size-6 overflow-hidden rounded-full">
                            <img :src="author.icon" alt="icon" class="size-full object-contain" width="24"
                                height="24" />
                        </div>
                        <span class="text-lg">{{ author.name }}</span>
                    </dd>
                </div>
                <div v-if="readingTime" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
                    <dt class="text-accent font-bold">読了まで</dt>
                    <dd class="flex items-center gap-1 font-bold">
                        <Icon name="lucide:timer" class="mt-0.5 size-5" />

                        <span class="text-lg">
                            {{ readingTime.minutes }}分で読み終われます
                            <span v-if="readingTime.charCount" class="text-accent text-sm">({{
                                readingTime.charCount?.toLocaleString() }}文字)</span>
                        </span>

                    </dd>
                </div>
            </dl>
        </slot>
    </div>
</template>
