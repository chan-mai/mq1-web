<script lang="ts" setup>
type AppLinkProps = {
  to: string
};

const props = defineProps<AppLinkProps>();


// 内部リンクかの判定
const isInternalLink = computed(() => {
  return props.to.startsWith('/') || props.to.startsWith('#');
});
</script>

<template>
  <!-- 内部リンク -->
  <NuxtLink v-if="isInternalLink" :to="props.to"
    class="relative mt-0.5 flex items-center gap-2 rounded-3xl px-5 py-1.5 transition-colors before:absolute before:inset-0 before:-z-10 before:m-auto before:scale-0 before:rounded-full before:bg-primary before:transition-transform after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-current after:transition-colors hover:text-white hover:before:scale-100 hover:after:border-transparent md:px-6 md:py-2">
    <slot />
    <slot name="icon">
      <Icon name="material-symbols:arrow-circle-right-outline" class="mt-0.5 size-4" />
    </slot>
  </NuxtLink>
  <!-- 外部リンク -->
  <a v-else :href="props.to" target="_blank"
    class="relative mt-0.5 flex items-center gap-2 rounded-3xl px-5 py-1.5 transition-colors before:absolute before:inset-0 before:-z-10 before:m-auto before:scale-0 before:rounded-full before:bg-primary before:transition-transform after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-current after:transition-colors hover:text-white hover:before:scale-100 hover:after:border-transparent md:px-6 md:py-2">
    <slot />
    <slot name="icon">
      <Icon name="material-symbols:arrow-circle-right-outline" class="mt-0.5 size-4" />
    </slot>
  </a>
</template>