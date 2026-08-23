<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import MqLinkCard from "~/components/mq/LinkCard.vue";

const props = defineProps(nodeViewProps);
const url = computed(() => props.node.attrs.url as string);
</script>

<template>
  <NodeViewWrapper
    contenteditable="false"
    class="my-5"
    data-drag-handle
    :class="{ 'ring-2 ring-primary rounded-2xl': selected }"
  >
    <Suspense>
      <MqLinkCard :url="url" />
      <template #fallback>
        <div
          class="flex h-[140px] items-center justify-center rounded-2xl border-2 border-border-subtle text-xs text-fg-muted"
        >
          {{ url }}
        </div>
      </template>
    </Suspense>
  </NodeViewWrapper>
</template>
