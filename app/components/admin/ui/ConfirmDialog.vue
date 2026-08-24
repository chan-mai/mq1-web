<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });

defineProps<{
  title: string;
  description?: string;
  confirmLabel?: string;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const confirm = () => {
  open.value = false;
  emit('confirm');
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="admin-root fixed inset-0 z-50 flex items-center justify-center"
    >
      <div class="absolute inset-0 bg-black/40" @click="open = false" />
      <div
        class="relative w-80 rounded-xl bg-surface p-6 text-fg shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <p class="font-bold">{{ title }}</p>
        <p v-if="description" class="mt-2 text-sm text-fg-muted">
          {{ description }}
        </p>
        <div class="mt-6 flex justify-end gap-2">
          <AdminUiButton variant="ghost" @click="open = false">
            キャンセル
          </AdminUiButton>
          <button
            type="button"
            class="h-9 cursor-pointer rounded-full border-none bg-red-500 px-4 text-sm font-bold text-white transition-opacity hover:opacity-80"
            @click="confirm"
          >
            {{ confirmLabel ?? '削除する' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
