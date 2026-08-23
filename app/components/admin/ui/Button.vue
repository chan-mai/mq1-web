<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "ghost" | "icon";
    type?: "button" | "submit";
    to?: string;
    target?: string;
    disabled?: boolean;
    title?: string;
  }>(),
  {
    variant: "ghost",
    type: "button",
    to: undefined,
    target: undefined,
    disabled: false,
    title: undefined,
  },
);

const classes = computed(() => [
  "inline-flex shrink-0 cursor-pointer select-none items-center justify-center border-none outline-none transition",
  "disabled:cursor-default disabled:opacity-50",
  {
    primary:
      "h-9 rounded-full bg-fg px-4 text-sm font-bold text-surface hover:opacity-80",
    ghost:
      "h-9 rounded-full bg-transparent px-4 text-sm text-fg-muted hover:bg-surface-muted hover:text-fg",
    icon: "size-9 aspect-square rounded-full bg-transparent text-fg-muted hover:bg-surface-muted hover:text-fg",
  }[props.variant],
]);
</script>

<template>
  <NuxtLink v-if="to" :to="to" :target="target" :title="title" :class="classes">
    <slot />
  </NuxtLink>
  <button
    v-else
    :type="type"
    :disabled="disabled"
    :title="title"
    :class="classes"
  >
    <slot />
  </button>
</template>
