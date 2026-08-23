<script setup lang="ts">
defineProps<{
  src: string;
  alt?: string;
  caption?: string;
  width?: number | string;
  height?: number | string;
}>();
</script>

<template>
  <figure>
    <img
      :src="src"
      :alt="alt || caption || ''"
      :width="width"
      :height="height"
      loading="lazy"
      decoding="async"
    />
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>
