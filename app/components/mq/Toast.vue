<template>
  <Teleport to="body">
    <div class="fixed bottom-8 right-8 z-[9999] max-w-xs pointer-events-none max-sm:bottom-4 max-sm:right-4 max-sm:left-4 max-sm:max-w-none">
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-3">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto flex items-start gap-3 p-4 rounded-xl bg-surface-elevated shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] border border-black/5 cursor-pointer transition-all duration-200 backdrop-blur-[10px] min-h-[60px] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15),0_10px_15px_-6px_rgba(0,0,0,0.15)]',
            {
              'border-l-4 border-l-green-500': toast.type === 'success',
              'border-l-4 border-l-red-500': toast.type === 'error',
              'border-l-4 border-l-amber-500': toast.type === 'warning',
              'border-l-4 border-l-blue-500': toast.type === 'info',
            }
          ]"
          @click="removeToast(toast.id)"
        >
          <div 
            :class="[
              'flex-shrink-0 w-6 h-6 flex items-center justify-center text-[24px]',
              {
                'text-green-500': toast.type === 'success',
                'text-red-500': toast.type === 'error',
                'text-amber-500': toast.type === 'warning',
                'text-blue-500': toast.type === 'info',
              }
            ]"
          >
            <Icon v-if="toast.type === 'success'" name="mdi:check-circle" />
            <Icon v-else-if="toast.type === 'error'" name="mdi:alert-circle" />
            <Icon v-else-if="toast.type === 'warning'" name="mdi:alert" />
            <Icon v-else name="mdi:information" />
          </div>
          <div class="flex-1 min-w-0 overflow-hidden">
            <div class="font-semibold text-[0.9375rem] leading-[1.4] text-fg mb-0.5 break-words">{{ toast.title }}</div>
            <div v-if="toast.message" class="text-sm leading-[1.4] text-fg-muted mt-1 break-words">{{ toast.message }}</div>
          </div>
          <button 
            class="flex-shrink-0 w-5 h-5 flex items-center justify-center border-none bg-transparent text-fg-muted cursor-pointer transition-colors duration-200 p-0 text-[20px] hover:text-fg" 
            @click.stop="removeToast(toast.id)"
          >
            <Icon name="mdi:close" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const toasts = useState<ToastMessage[]>('toasts', () => []);

const removeToast = (id: string) => {
  toasts.value = toasts.value.filter(t => t.id !== id);
};
</script>

<style scoped>
/* トランジションアニメーション */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.9);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>

