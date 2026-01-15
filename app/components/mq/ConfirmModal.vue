<script setup lang="ts">
const props = withDefaults(defineProps<{
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}>(), {
  title: '確認',
  confirmText: '実行する',
  cancelText: 'キャンセル',
  isDanger: false,
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm'): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

// isOpenの変更を監視して開閉
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    dialogRef.value?.showModal();
  } else {
    dialogRef.value?.close();
  }
});

const closeModal = () => {
  emit('close');
};

const handleConfirm = () => {
  emit('confirm');
  closeModal(); // close emit will handle the prop update in parent
};

// Click outside to close (optional improvement)
const handleBackdropClick = (event: MouseEvent) => {
  const dialog = dialogRef.value;
  if (dialog && event.target === dialog) {
    closeModal();
  }
};
</script>

<template>
  <dialog
    ref="dialogRef"
    class="backdrop:bg-black/25 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto fixed inset-0 w-full h-full max-w-full max-h-full flex items-center justify-center pointer-events-none"
    @cancel="closeModal"
    @click="handleBackdropClick"
  >
    <!-- Content Wrapper -->
    <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl text-left pointer-events-auto mx-4">
      <h3 class="text-lg font-bold leading-6 text-gray-900 mb-2">
        {{ title }}
      </h3>
      
      <div class="mt-2">
        <p class="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
          {{ message }}
        </p>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button
          type="button"
          class="inline-flex justify-center rounded-lg border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none transition-colors"
          @click="closeModal"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          class="inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none transition-colors"
          :class="isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style scoped>
dialog::backdrop {
  background-color: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(2px);
}
</style>
