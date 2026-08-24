<script setup lang="ts">
interface Props {
  text?: string;
}

withDefaults(defineProps<Props>(), {
  text: 'Loading…',
});
</script>

<template>
  <div
    class="flex flex-col justify-center items-center w-full py-20 gap-4"
    aria-label="Loading"
  >
    <div class="relative w-12 h-12">
      <div
        class="absolute top-0 left-0 w-full h-full border-4 border-border-subtle rounded-full"
      ></div>
      <div
        class="absolute top-0 left-0 w-full h-full border-4 border-primary rounded-full border-t-transparent animate-spin"
      ></div>
    </div>
    <p class="text-fg-muted text-sm font-medium animate-pulse">{{ text }}</p>
  </div>
</template>
