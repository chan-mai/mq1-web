<script setup lang="ts">
const props = defineProps<{
  variant?: 'header' | 'menu'
}>()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

const toggle = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <ClientOnly>
    <template v-if="variant === 'menu'">
      <button
        type="button"
        class="flex items-center gap-3 text-white cursor-react"
        :aria-label="isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
        @click="toggle"
      >
        <Icon
          :name="isDark ? 'material-symbols:light-mode-outline' : 'material-symbols:dark-mode-outline'"
          class="size-5"
        />
        <span class="text-[14px] font-[300]">{{ isDark ? 'LIGHT MODE' : 'DARK MODE' }}</span>
      </button>
    </template>
    <template v-else>
      <button
        type="button"
        class="relative flex size-8 border-none items-center justify-center rounded before:absolute before:-z-10 before:size-full before:rounded before:bg-slate-200/50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
        :aria-label="isDark ? 'ライトモードに切り替え' : 'ダークモードに切り替え'"
        @click="toggle"
      >
        <Icon
          :name="isDark ? 'material-symbols:light-mode-outline' : 'material-symbols:dark-mode-outline'"
          class="size-5"
        />
      </button>
    </template>
    <template #fallback>
      <span class="size-8 inline-block" />
    </template>
  </ClientOnly>
</template>
