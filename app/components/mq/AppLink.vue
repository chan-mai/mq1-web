<script lang="ts" setup>
type AppLinkProps = {
  to: string;
  rel?: string;
  // ホバー塗り色 未指定時はprimary
  fill?: string;
};

const props = defineProps<AppLinkProps>();

const isExternal = computed(
  () => !props.to.startsWith('/') && !props.to.startsWith('#'),
);
const computedRel = computed(
  () => props.rel ?? (isExternal.value ? 'noopener noreferrer' : undefined),
);
</script>

<template>
  <!-- 外部リンクの場合は別タブ -->
  <NuxtLink v-if="to" :to="to" :target="to.startsWith('/') || to.startsWith('#') ? '_self' : '_blank'"
    :rel="computedRel" :style="fill ? { '--applink-fill': fill } : undefined"
    class="relative z-0 mt-0.5 flex items-center gap-2 rounded-3xl px-5 py-1.5 transition-colors before:absolute before:inset-0 before:-z-10 before:m-auto before:scale-0 before:rounded-full before:bg-[color:var(--applink-fill,theme(colors.primary))] before:transition-transform after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-current after:transition-colors hover:text-surface-elevated hover:before:scale-100 hover:after:border-transparent md:px-6 md:py-2">
    <slot />
    <slot name="icon">
      <Icon name="material-symbols:arrow-circle-right-outline" class="mt-0.5 size-4" />
    </slot>
  </NuxtLink>
</template>
