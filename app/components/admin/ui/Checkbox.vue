<script setup lang="ts">
const model = defineModel<boolean>({ required: true });
</script>

<template>
  <label class="flex cursor-pointer select-none items-center gap-2.5">
    <input v-model="model" type="checkbox" class="peer sr-only" />
    <span
      class="flex size-4 shrink-0 items-center justify-center rounded border border-solid transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
      :class="
        model
          ? 'border-fg bg-fg text-surface'
          : 'border-fg-muted/50 bg-transparent'
      "
    >
      <Icon v-if="model" name="lucide:check" class="size-3" />
    </span>
    <slot />
  </label>
</template>
