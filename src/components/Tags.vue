<script setup lang="ts">
const props = defineProps({
    limit: {
        type: String,
        default: "0",
    },
    tags: {
        type: Array as () => Tag[],
        default: () => [],
    },
    loading: {
        type: Boolean,
        default: false
    }
});
const limit = props.limit as unknown as number;


const limitedTags = computed(() => {
    return limit > 0 ? props.tags.slice(0, limit) : props.tags;
});
</script>

<template>
    <div class="max-w-6xl mx-auto p-4 w-full">
        <div class="bg-white rounded-lg p-5 w-full">
            <h3 class="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <span class="inline-block w-3 h-3 bg-primary rounded-full mr-2"></span>
                タグ一覧
            </h3>

            <template v-if="loading">
                <div class="flex flex-wrap gap-2">
                    <div v-for="i in ( limit > 0 ? limit : 3 )" :key="`skeleton-${i}`" class="w-36 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-wrap gap-2">
                    <MqTag v-for="tag in limitedTags" :key="tag.id" :tag="tag" />
                </div>
            </template>


        </div>
    </div>
</template>