<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";

const props = defineProps(nodeViewProps);

const caption = computed({
  get: () => (props.node.attrs.caption as string | null) ?? "",
  set: (value: string) => props.updateAttributes({ caption: value || null }),
});
</script>

<template>
  <NodeViewWrapper class="my-5" data-drag-handle>
    <figure>
      <img
        :src="node.attrs.src"
        :alt="node.attrs.alt ?? node.attrs.caption ?? ''"
        :width="node.attrs.width ?? undefined"
        :height="node.attrs.height ?? undefined"
        class="mx-auto rounded-lg"
        :class="{ 'ring-2 ring-primary': selected }"
      />
      <input
        v-model="caption"
        contenteditable="false"
        placeholder="キャプションを追加"
        class="mt-2 w-full border-none bg-transparent p-0 text-center text-xs text-fg-muted outline-none placeholder:text-fg-muted/50"
      />
    </figure>
  </NodeViewWrapper>
</template>
