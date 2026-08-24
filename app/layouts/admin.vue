<script setup lang="ts">
const route = useRoute();
const { data: me } = await useFetch('/api/auth/me');

watchEffect(() => {
  if (me.value && !me.value.authenticated) {
    navigateTo(
      `/api/auth/login?returnTo=${encodeURIComponent(route.fullPath)}`,
      {
        external: true,
      },
    );
  }
});
</script>

<template>
  <main class="admin-root min-h-screen bg-surface text-fg">
    <slot />
  </main>
</template>

<style>
/* ライトテーマで上書き */
.admin-root {
  --color-surface: 255 255 255;
  --color-surface-elevated: 255 255 255;
  --color-surface-muted: 249 250 251;
  --color-fg: 71 85 105;
  --color-fg-muted: 107 114 128;
  --color-border-subtle: 229 231 235;
}
</style>
