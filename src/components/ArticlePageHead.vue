<script lang="ts" setup>

type PageHeaderProps = {
    title?: string
    published?: Date | string
    updated?: Date | string
    author?: {
        name: string
        icon: string
    },
    tags?: Tag[],
    readingTime?: { charCount: number, minutes: number }
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
    title: '',
    published: undefined,
    updated: undefined,
    author: () => ({ name: '', icon: '' }),
    tags: () => [],
})

const publishedDate = computed(() => new Date(props.published!).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
}));
const updatedDate = computed(() => new Date(props.updated!).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Tokyo',
}));
</script>

<template>
    <div class="flex flex-col gap-5">
        <h1 class="text-3xl font-bold leading-snug text-slate-800 md:text-4xl md:leading-normal">
            {{ title }}
        </h1>
        <div class="flex flex-wrap gap-2">
            <MqTag v-for="tag in tags" :key="tag.id" :tag="tag" />
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
                <div v-if="updated" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
                    <dt class="text-accent font-bold">更新した日</dt>
                    <dd class="flex items-center gap-1 font-bold">
                        <Icon name="fluent:arrow-clockwise-24-filled" class="mt-0.5 size-5" />

                        <span class="text-lg">{{ updatedDate }}</span>
                    </dd>
                </div>
                <div v-if="author.name" class="flex flex-col gap-1 rounded-lg bg-white px-4 py-2.5">
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
                            <span v-if="readingTime.charCount" class="text-accent text-sm">({{ readingTime.charCount?.toLocaleString() }}文字)</span>
                        </span>

                    </dd>
                </div>
            </dl>
        </slot>
    </div>
</template>