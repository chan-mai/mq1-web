<template>
  <Teleport v-if="isMounted" to="body">
    <div
      class="fixed bottom-8 right-8 z-[9999] max-w-xs pointer-events-none max-sm:bottom-4 max-sm:right-4 max-sm:left-4 max-sm:max-w-none"
    >
      <TransitionGroup name="toast" tag="div" class="flex flex-col gap-4">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="group pointer-events-auto relative cursor-pointer"
          @click="removeToast(toast.id)"
        >
          <!-- オフセット枠 -->
          <div
            class="toast-clip absolute inset-0 translate-x-[3px] translate-y-[3px] border"
            :class="typeStyles[toast.type]?.layer"
            aria-hidden="true"
          ></div>

          <!-- 本体 -->
          <div
            class="toast-clip relative flex min-h-[60px] items-start gap-3 border border-border-subtle bg-surface-elevated/95 p-4 backdrop-blur-[10px] transition-transform duration-200 group-hover:-translate-y-0.5"
          >
            <div
              class="flex w-6 h-6 flex-shrink-0 items-center justify-center text-[22px]"
              :class="typeStyles[toast.type]?.text"
            >
              <Icon v-if="toast.type === 'success'" name="mdi:check-circle" />
              <Icon
                v-else-if="toast.type === 'error'"
                name="mdi:alert-circle"
              />
              <Icon v-else-if="toast.type === 'warning'" name="mdi:alert" />
              <Icon v-else name="mdi:information" />
            </div>

            <div class="min-w-0 flex-1 overflow-hidden">
              <!-- 種別ラベル+結び罫 -->
              <div class="flex items-center gap-1.5" aria-hidden="true">
                <span
                  class="font-futura text-[8px] tracking-[0.25em]"
                  :class="typeStyles[toast.type]?.text"
                >
                  {{ toast.type.toUpperCase() }}
                </span>
                <span class="h-px flex-1 bg-border-subtle"></span>
                <!-- 対角線入り四角 -->
                <svg
                  class="size-1.5"
                  :class="typeStyles[toast.type]?.text"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.4"
                >
                  <rect x="0.5" y="0.5" width="11" height="11" />
                  <line x1="0.5" y1="11.5" x2="11.5" y2="0.5" />
                </svg>
              </div>

              <div
                class="mt-1 break-words text-[0.9375rem] font-semibold leading-[1.4] text-fg"
              >
                {{ toast.title }}
              </div>
              <div
                v-if="toast.message"
                class="mt-1 break-words text-sm leading-[1.4] text-fg-muted"
              >
                {{ toast.message }}
              </div>
            </div>

            <button
              class="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-[20px] text-fg-muted transition-colors duration-200 hover:text-fg"
              @click.stop="removeToast(toast.id)"
            >
              <Icon name="mdi:close" />
            </button>
          </div>

          <!-- トンボ+コーナードット -->
          <span class="toast-frame" aria-hidden="true"></span>
          <span
            class="absolute -right-1 -top-1 size-1 rounded-full bg-accent/70"
            aria-hidden="true"
          ></span>
          <span
            class="absolute -bottom-1 -left-1 size-1 rounded-full bg-accent/70"
            aria-hidden="true"
          ></span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// NOTE: body teleportのhydration不整合回避
const isMounted = useMounted();
const toasts = useState<ToastMessage[]>('toasts', () => []);

// 種別ごとの配色
const typeStyles: Record<string, { text: string; layer: string }> = {
  success: {
    text: 'text-green-500',
    layer: 'border-green-500/40 bg-green-500/15',
  },
  error: { text: 'text-red-500', layer: 'border-red-500/40 bg-red-500/15' },
  warning: {
    text: 'text-amber-500',
    layer: 'border-amber-500/40 bg-amber-500/15',
  },
  info: { text: 'text-blue-500', layer: 'border-blue-500/40 bg-blue-500/15' },
};

const removeToast = (id: string) => {
  toasts.value = toasts.value.filter((t) => t.id !== id);
};
</script>

<style scoped>
/* 切り欠きクリップ 右上/左下 */
.toast-clip {
  clip-path: polygon(
    0 0,
    calc(100% - 10px) 0,
    100% 10px,
    100% 100%,
    10px 100%,
    0 calc(100% - 10px)
  );
}

/* トンボ 左上/右下 */
.toast-frame {
  position: absolute;
  inset: -5px;
  pointer-events: none;
}

.toast-frame::before,
.toast-frame::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
}

.toast-frame::before {
  left: 0;
  top: 0;
  border-left: 1px solid rgba(224, 86, 127, 0.4);
  border-top: 1px solid rgba(224, 86, 127, 0.4);
}

.toast-frame::after {
  right: 0;
  bottom: 0;
  border-right: 1px solid rgba(224, 86, 127, 0.4);
  border-bottom: 1px solid rgba(224, 86, 127, 0.4);
}

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
