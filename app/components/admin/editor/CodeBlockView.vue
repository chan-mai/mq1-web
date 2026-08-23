<script setup lang="ts">
import { NodeViewWrapper, nodeViewProps } from "@tiptap/vue-3";
import MqCodeBlock from "~/components/mq/CodeBlock.vue";
import MqMermaidBlock from "~/components/mq/MermaidBlock.vue";

const props = defineProps(nodeViewProps);

const editing = ref(false);
const textarea = useTemplateRef<HTMLTextAreaElement>("textarea");

const code = computed(() => props.node.textContent);
const rows = computed(() => Math.max(code.value.split("\n").length, 3));

const language = computed({
  get: () => (props.node.attrs.language as string | null) ?? "",
  set: (value: string) => props.updateAttributes({ language: value || null }),
});

const filename = computed({
  get: () => (props.node.attrs.filename as string | null) ?? "",
  set: (value: string) => props.updateAttributes({ filename: value || null }),
});

const setCode = (value: string) => {
  const pos = props.getPos();
  if (typeof pos !== "number") return;
  const { state, view } = props.editor;
  const from = pos + 1;
  const to = pos + props.node.nodeSize - 1;
  const tr = value
    ? state.tr.replaceWith(from, to, state.schema.text(value))
    : state.tr.delete(from, to);
  view.dispatch(tr);
};

const onInput = (event: Event) => {
  setCode((event.target as HTMLTextAreaElement).value);
};

const startEditing = async () => {
  editing.value = true;
  await nextTick();
  textarea.value?.focus();
};

const stopEditing = () => {
  editing.value = false;
};

onMounted(() => {
  if (!props.node.textContent) startEditing();
});
</script>

<template>
  <NodeViewWrapper contenteditable="false" data-drag-handle>
    <!-- 記事側コンポーネントを再利用 -->
    <div v-if="!editing" class="cursor-text [&_.mermaid-block]:!m-0 [&_.mq-code-block]:!m-0" title="クリックで編集"
      @click="startEditing">
      <MqMermaidBlock v-if="language === 'mermaid'" :source="code" :filename="filename || undefined" />
      <MqCodeBlock v-else :source="code" :language="language || undefined" :filename="filename || undefined" />
    </div>
    <div v-else class="overflow-hidden rounded-xl border border-solid border-border-subtle bg-surface-muted">
      <div class="flex items-center gap-2 border-0 border-b border-solid border-border-subtle px-4 py-2">
        <input v-model="language" placeholder="言語"
          class="w-28 border-none bg-transparent p-0 font-mono text-xs text-fg-muted outline-none placeholder:text-fg-muted/50" />
        <input v-model="filename" placeholder="ファイル名"
          class="w-0 flex-1 border-none bg-transparent p-0 font-mono text-xs text-fg-muted outline-none placeholder:text-fg-muted/50" />
        <button type="button"
          class="shrink-0 cursor-pointer border-none bg-transparent p-0 text-xs text-fg-muted transition-colors hover:text-fg"
          @click="stopEditing">
          完了
        </button>
      </div>
      <textarea ref="textarea" :value="code" :rows="rows" spellcheck="false"
        class="block w-full resize-none border-none bg-transparent px-6 py-4 font-mono text-sm leading-relaxed text-fg outline-none"
        @input="onInput" @keydown.esc.prevent="stopEditing" />
    </div>
  </NodeViewWrapper>
</template>
