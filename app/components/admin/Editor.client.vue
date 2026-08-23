<script setup lang="ts">
import { Placeholder } from "@tiptap/extensions";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import { EditorContent, VueNodeViewRenderer, useEditor } from "@tiptap/vue-3";
import { BubbleMenu } from "@tiptap/vue-3/menus";
import { diffChars } from "diff";
import { marked } from "marked";
import {
  CmsCodeBlock,
  CmsHeading,
  CmsImage,
  LinkCard,
  cmsStarterKit,
  cmsTableKit,
} from "~~/shared/tiptap/extensions";
import CodeBlockView from "./editor/CodeBlockView.vue";
import ImageView from "./editor/ImageView.vue";
import LinkCardView from "./editor/LinkCardView.vue";
import { LinkCardPaste } from "~/utils/linkCardPaste";

const props = defineProps<{
  modelValue: TiptapDoc;
}>();

const emit = defineEmits<{
  "update:modelValue": [doc: TiptapDoc];
}>();

const toast = useToast();

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    cmsStarterKit,
    CmsHeading,
    CmsCodeBlock.extend({
      addNodeView: () => VueNodeViewRenderer(CodeBlockView),
    }),
    CmsImage.extend({
      addNodeView: () => VueNodeViewRenderer(ImageView),
    }),
    LinkCard.extend({
      addNodeView: () => VueNodeViewRenderer(LinkCardView),
    }),
    cmsTableKit,
    Placeholder.configure({ placeholder: "本文を書く…" }),
    LinkCardPaste,
  ],
  editorProps: {
    attributes: {
      class: "cms-editor-content focus:outline-none",
    },
    handlePaste: (_view, event) => {
      const files = collectImageFiles(event.clipboardData?.files);
      if (files.length === 0) return false;
      files.forEach((file) => uploadAndInsert(file));
      return true;
    },
    // プレーンテキストのペーストはMarkdownとして解釈
    clipboardTextParser: (text, $context, _plain, view) => {
      const html = marked.parse(text, {
        async: false,
        gfm: true,
        breaks: true,
      }) as string;
      const dom = new window.DOMParser().parseFromString(
        `<body>${html}</body>`,
        "text/html",
      );
      return ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(
        dom.body,
        { preserveWhitespace: true, context: $context },
      );
    },
    handleDrop: (_view, event, _slice, moved) => {
      if (moved) return false;
      const files = collectImageFiles(event.dataTransfer?.files);
      if (files.length === 0) return false;
      event.preventDefault();
      files.forEach((file) => uploadAndInsert(file));
      return true;
    },
    handleDOMEvents: {
      contextmenu: (_view, event) => {
        event.preventDefault();
        openContextMenu(event.clientX, event.clientY);
        return true;
      },
      // iOS Safariはcontextmenu非発火のため長押しを自前検出
      touchstart: (_view, event) => {
        const touch = event.touches[0];
        if (!touch || event.touches.length > 1) return false;
        const startX = touch.clientX;
        const startY = touch.clientY;
        const cancel = () => {
          if (longPressTimer !== null) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
          }
          window.removeEventListener("touchmove", onMove);
          window.removeEventListener("touchend", cancel);
        };
        const onMove = (moveEvent: TouchEvent) => {
          const current = moveEvent.touches[0];
          if (
            !current ||
            Math.hypot(current.clientX - startX, current.clientY - startY) > 10
          ) {
            cancel();
          }
        };
        longPressTimer = window.setTimeout(() => {
          cancel();
          openContextMenu(startX, startY);
        }, 550);
        window.addEventListener("touchmove", onMove, { passive: true });
        window.addEventListener("touchend", cancel, { passive: true });
        return false;
      },
    },
  },
  onUpdate: ({ editor: instance }) => {
    emit("update:modelValue", instance.getJSON() as TiptapDoc);
  },
  onSelectionUpdate: () => {
    if (aiState.value !== "loading") resetAi();
  },
});

const shouldShowBubble = ({ editor: instance, state }: any) => {
  if (state.selection.empty) return false;
  if (
    instance.isActive("codeBlock") ||
    instance.isActive("image") ||
    instance.isActive("linkCard")
  ) {
    return false;
  }
  return true;
};

// リンク入力
const linkInputOpen = ref(false);
const linkUrl = ref("");
const linkNofollow = ref(false);
const openLinkInput = () => {
  const attrs = editor.value?.getAttributes("link") ?? {};
  linkUrl.value = attrs.href ?? "";
  linkNofollow.value = /\bnofollow\b/.test(String(attrs.rel ?? ""));
  linkInputOpen.value = true;
};
const applyLink = () => {
  const url = linkUrl.value.trim();
  if (!editor.value) return;
  if (!url) {
    editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
  } else {
    editor.value
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: url,
        rel: linkNofollow.value ? "noopener noreferrer nofollow" : null,
      })
      .run();
  }
  linkInputOpen.value = false;
};

// 挿入contextmenu
const contextMenuOpen = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextLinkCardInput = ref(false);
const contextLinkCardUrl = ref("");
const contextMenu = useTemplateRef<HTMLElement>("contextMenu");
let longPressTimer: number | null = null;

const openContextMenu = (x: number, y: number) => {
  contextMenuPos.value = {
    x: Math.min(x, window.innerWidth - 200),
    y: Math.min(y, window.innerHeight - 240),
  };
  contextLinkCardInput.value = false;
  contextLinkCardUrl.value = "";
  contextTablePicker.value = false;
  tablePickerHover.value = null;
  contextMenuOpen.value = true;

  // 挿入位置をポイント位置に設定
  const pos = editor.value?.view.posAtCoords({ left: x, top: y });
  if (pos) {
    editor.value?.chain().setTextSelection(pos.pos).run();
  }
};

const closeContextMenu = () => {
  contextMenuOpen.value = false;
};

onClickOutside(contextMenu, closeContextMenu);
useEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape") closeContextMenu();
});

const runContextInsert = (action: () => void) => {
  action();
  closeContextMenu();
};

// 表サイズピッカー
const TABLE_PICKER_MAX = 6;
const contextTablePicker = ref(false);
const tablePickerHover = ref<{ rows: number; cols: number } | null>(null);

const tablePickerCellFor = (index: number) => ({
  rows: Math.floor((index - 1) / TABLE_PICKER_MAX) + 1,
  cols: ((index - 1) % TABLE_PICKER_MAX) + 1,
});

const isTablePickerCellActive = (index: number) => {
  if (!tablePickerHover.value) return false;
  const cell = tablePickerCellFor(index);
  return (
    cell.rows <= tablePickerHover.value.rows &&
    cell.cols <= tablePickerHover.value.cols
  );
};

const insertTableFromMenu = (index: number) => {
  const cell = tablePickerCellFor(index);
  editor.value
    ?.chain()
    .focus()
    .insertTable({ rows: cell.rows, cols: cell.cols, withHeaderRow: true })
    .run();
  closeContextMenu();
};

const insertLinkCardFromMenu = () => {
  const url = contextLinkCardUrl.value.trim();
  if (!url || !/^https?:\/\//.test(url)) return;
  editor.value
    ?.chain()
    .focus()
    .insertContent({ type: "linkCard", attrs: { url } })
    .run();
  closeContextMenu();
};

// AI校正
const aiState = ref<"idle" | "loading" | "done">("idle");
const aiOriginal = ref("");
const aiResult = ref("");
const aiRange = ref<{ from: number; to: number } | null>(null);

// 修正箇所の文字単位diff
const aiDiffParts = computed(() =>
  aiState.value === "done" ? diffChars(aiOriginal.value, aiResult.value) : [],
);

const resetAi = () => {
  aiState.value = "idle";
  aiOriginal.value = "";
  aiResult.value = "";
  aiRange.value = null;
};

const runProofread = async () => {
  if (!editor.value || aiState.value === "loading") return;
  const { from, to } = editor.value.state.selection;
  const text = editor.value.state.doc.textBetween(from, to, "\n");
  if (!text.trim()) return;

  aiState.value = "loading";
  aiOriginal.value = text;
  aiRange.value = { from, to };
  try {
    const response = await $fetch("/api/admin/llm/proofread", {
      method: "POST",
      body: { text },
    });
    aiResult.value = response.corrected;
    aiState.value = "done";
  } catch {
    toast.error({ title: "校正に失敗しました" });
    resetAi();
  }
};

const applyProofread = () => {
  if (!editor.value || !aiRange.value || !aiResult.value) return;
  editor.value
    .chain()
    .focus()
    .insertContentAt(aiRange.value, aiResult.value)
    .run();
  resetAi();
};

// 画像アップロード
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const uploadingCount = ref(0);
const { upload: uploadImage } = useImageUpload();

const collectImageFiles = (list?: FileList | null) =>
  Array.from(list ?? []).filter((file) => file.type.startsWith("image/"));

const uploadAndInsert = async (file: File) => {
  uploadingCount.value += 1;
  try {
    const uploaded = await uploadImage(file);
    editor.value
      ?.chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: uploaded.url,
          width: uploaded.width,
          height: uploaded.height,
        },
      })
      .run();
  } catch {
    toast.error({ title: "画像のアップロードに失敗しました" });
  } finally {
    uploadingCount.value -= 1;
  }
};

const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement;
  collectImageFiles(input.files).forEach((file) => uploadAndInsert(file));
  input.value = "";
};

defineExpose({
  focus: () => editor.value?.chain().focus().run(),
  openImagePicker: () => fileInput.value?.click(),
  setContent: (doc: TiptapDoc) => {
    editor.value?.commands.setContent(doc);
  },
  insertHardBreak: () => {
    editor.value?.chain().focus().setHardBreak().run();
  },
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="cms-editor relative">
    <template v-if="editor">
      <BubbleMenu :editor="editor" :should-show="shouldShowBubble" :options="{ placement: 'top', offset: 8 }">
        <div
          class="flex items-center gap-0.5 border border-solid border-border-subtle bg-surface-elevated px-1.5 py-1 shadow-lg"
          :class="aiState !== 'idle' ? 'rounded-xl' : 'rounded-full'">
          <!-- AI校正の結果表示 -->
          <div v-if="aiState !== 'idle'" class="max-w-md px-2 py-1.5">
            <p v-if="aiState === 'loading'" class="text-xs text-fg-muted">
              校正中…
            </p>
            <template v-else>
              <p class="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-fg">
                <span v-for="(part, index) in aiDiffParts" :key="index" :class="part.added
                  ? 'rounded bg-green-500/15 text-green-800'
                  : part.removed
                    ? 'rounded bg-red-500/15 text-red-600 line-through'
                    : ''
                  ">{{ part.value }}</span>
              </p>
              <div class="mt-1.5 flex justify-end gap-1">
                <button type="button"
                  class="cursor-pointer rounded-full border-none bg-fg px-3 py-1 text-xs font-bold text-surface transition-opacity hover:opacity-80"
                  @click="applyProofread">
                  置き換える
                </button>
                <button type="button"
                  class="cursor-pointer rounded-full border-none bg-transparent px-3 py-1 text-xs text-fg-muted transition-colors hover:text-fg"
                  @click="resetAi">
                  閉じる
                </button>
              </div>
            </template>
          </div>
          <template v-else-if="!linkInputOpen">
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              title="AI校正" @click="runProofread">
              <Icon name="lucide:wand-sparkles" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              :class="{ 'text-primary': editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()">
              <Icon name="lucide:bold" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              :class="{ 'text-primary': editor.isActive('italic') }"
              @click="editor.chain().focus().toggleItalic().run()">
              <Icon name="lucide:italic" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              :class="{ 'text-primary': editor.isActive('strike') }"
              @click="editor.chain().focus().toggleStrike().run()">
              <Icon name="lucide:strikethrough" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              :class="{ 'text-primary': editor.isActive('code') }" @click="editor.chain().focus().toggleCode().run()">
              <Icon name="lucide:code" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              :class="{ 'text-primary': editor.isActive('link') }" @click="openLinkInput">
              <Icon name="lucide:link" class="size-4" />
            </button>
          </template>
          <form v-else class="flex items-center gap-1" @submit.prevent="applyLink">
            <input v-model="linkUrl" placeholder="https://"
              class="w-52 border-none bg-transparent px-2 py-1 text-sm outline-none" />
            <label class="flex shrink-0 cursor-pointer select-none items-center gap-1 px-1 text-xs text-fg-muted">
              <input v-model="linkNofollow" type="checkbox" class="cursor-pointer accent-current" />
              nofollow
            </label>
            <button type="submit"
              class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted">
              <Icon name="lucide:check" class="size-4" />
            </button>
            <button type="button" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted"
              @click="linkInputOpen = false">
              <Icon name="lucide:x" class="size-4" />
            </button>
          </form>
        </div>
      </BubbleMenu>
    </template>

    <EditorContent :editor="editor" />

    <!-- 挿入contextmenu -->
    <div v-if="contextMenuOpen" ref="contextMenu"
      class="fixed z-50 w-48 overflow-hidden rounded-xl border border-solid border-border-subtle bg-surface-elevated py-1 shadow-lg"
      :style="{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }" @contextmenu.prevent>
      <template v-if="!contextLinkCardInput && !contextTablePicker">
        <button type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
          @click="runContextInsert(() => fileInput?.click())">
          <Icon name="lucide:image" class="size-4 text-fg-muted" />
          画像
        </button>
        <button type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
          @click="contextTablePicker = true">
          <Icon name="lucide:table" class="size-4 text-fg-muted" />
          表
        </button>
        <button type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
          @click="
            runContextInsert(() =>
              editor!.chain().focus().toggleCodeBlock().run(),
            )
            ">
          <Icon name="lucide:code-xml" class="size-4 text-fg-muted" />
          コードブロック
        </button>
        <button type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
          @click="
            runContextInsert(() =>
              editor!.chain().focus().setHorizontalRule().run(),
            )
            ">
          <Icon name="lucide:minus" class="size-4 text-fg-muted" />
          区切り線
        </button>
        <button type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-3.5 py-2 text-left text-sm text-fg transition-colors hover:bg-surface-muted"
          @click="contextLinkCardInput = true">
          <Icon name="lucide:panel-top" class="size-4 text-fg-muted" />
          リンクカード
        </button>
      </template>
      <div v-else-if="contextTablePicker" class="px-3 py-2" @mouseleave="tablePickerHover = null">
        <div class="grid gap-1" :style="{
          gridTemplateColumns: `repeat(${TABLE_PICKER_MAX}, 1fr)`,
        }">
          <button v-for="index in TABLE_PICKER_MAX * TABLE_PICKER_MAX" :key="index" type="button"
            class="aspect-square w-full cursor-pointer rounded-sm border border-solid p-0 transition-colors" :class="isTablePickerCellActive(index)
              ? 'border-primary bg-primary/20'
              : 'border-border-subtle bg-surface-muted'
              " @mouseenter="tablePickerHover = tablePickerCellFor(index)" @click="insertTableFromMenu(index)" />
        </div>
        <p class="mb-0 mt-2 text-center text-xs text-fg-muted">
          {{
            tablePickerHover
              ? `${tablePickerHover.rows}行×${tablePickerHover.cols}列`
              : "サイズを選択"
          }}
        </p>
      </div>
      <form v-else class="flex items-center gap-1 px-2 py-1.5" @submit.prevent="insertLinkCardFromMenu">
        <input v-model="contextLinkCardUrl" placeholder="https://"
          class="w-0 flex-1 border-none bg-transparent px-1 py-1 text-sm outline-none" />
        <button type="submit" class="cursor-pointer rounded border-none bg-transparent p-1.5 hover:bg-surface-muted">
          <Icon name="lucide:check" class="size-4" />
        </button>
      </form>
    </div>

    <p v-if="uploadingCount > 0" class="fixed bottom-4 right-4 rounded-md bg-fg px-3 py-1.5 text-xs text-surface">
      画像をアップロード中…
    </p>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/avif" multiple
      class="hidden" @change="onFileSelected" />
  </div>
</template>

<style>
.cms-editor .cms-editor-content {
  min-height: 60vh;
  line-height: 1.9;
  padding-bottom: 30vh;
}

.cms-editor .cms-editor-content p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
  color: rgb(var(--color-fg-muted) / 0.5);
}

.cms-editor .cms-editor-content>*+* {
  margin-top: 0.75em;
}

.cms-editor .cms-editor-content h1,
.cms-editor .cms-editor-content h2 {
  margin-top: 2em;
  font-size: 1.5rem;
  font-weight: 700;
}

.cms-editor .cms-editor-content h3 {
  margin-top: 1.6em;
  font-size: 1.25rem;
  font-weight: 700;
}

.cms-editor .cms-editor-content h4 {
  margin-top: 1.4em;
  font-size: 1.1rem;
  font-weight: 700;
}

.cms-editor .cms-editor-content ul {
  list-style: disc;
  padding-left: 1.5em;
}

.cms-editor .cms-editor-content ol {
  list-style: decimal;
  padding-left: 1.5em;
}

.cms-editor .cms-editor-content blockquote {
  border-left: 3px solid rgb(var(--color-border-subtle));
  padding-left: 1em;
  color: rgb(var(--color-fg-muted));
}

.cms-editor .cms-editor-content code {
  background: rgb(var(--color-surface-muted));
  border-radius: 0.25rem;
  padding: 0.15em 0.35em;
  font-size: 0.875em;
}

.cms-editor .cms-editor-content pre code {
  background: transparent;
  padding: 0;
  font-size: inherit;
}

.cms-editor .cms-editor-content hr {
  margin: 2em auto;
  border-color: rgb(var(--color-border-subtle));
}

.cms-editor .cms-editor-content a {
  color: #f57aa5;
  text-decoration: underline;
}

/* リンクカード内部のリンクは本文リンク装飾の対象外 */
.cms-editor .cms-editor-content .mq-link-card a {
  color: inherit;
  text-decoration: none;
}

.cms-editor .cms-editor-content table {
  border-collapse: collapse;
  width: 100%;
}

.cms-editor .cms-editor-content th,
.cms-editor .cms-editor-content td {
  border: 1px solid rgb(var(--color-border-subtle));
  padding: 0.4em 0.75em;
}

.cms-editor .cms-editor-content th {
  background: rgb(var(--color-surface-muted));
  font-weight: 700;
}

.cms-editor .cms-editor-content .ProseMirror-selectednode {
  outline: 2px solid #fc9fa8;
  outline-offset: 2px;
  border-radius: 0.25rem;
}
</style>
