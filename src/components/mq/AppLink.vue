<script lang="ts" setup>
type AppLinkProps = {
  to: string
};

defineProps<AppLinkProps>();

</script>

<template>
  <!-- 外部リンクの場合は別タブ -->
  <NuxtLink v-if="to" :to="to"
   :target="(to.startsWith('/') || to.startsWith('#'))? '_self' : '_blank'"
    class="relative mt-0.5 flex items-center gap-2 rounded-3xl px-5 py-1.5 transition-colors before:absolute before:inset-0 before:-z-10 before:m-auto before:scale-0 before:rounded-full before:bg-primary before:transition-transform after:absolute after:inset-0 after:rounded-3xl after:border-2 after:border-current after:transition-colors hover:text-white hover:before:scale-100 hover:after:border-transparent md:px-6 md:py-2">
    <slot />
    <slot name="icon">
      <Icon name="material-symbols:arrow-circle-right-outline" class="mt-0.5 size-4" />
    </slot>
  </NuxtLink>
</template>