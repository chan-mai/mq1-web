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

            <div class="flex flex-wrap gap-2">
                <MqTag v-for="tag in limitedTags" :key="tag.id" :tag="tag"/>
            </div>
        </div>
    </div>
</template>