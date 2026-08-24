<script setup lang="ts">
defineProps<{
  preview: LinkPreviewResponse;
}>();
</script>

<template>
  <div
    class="w-full flex justify-start max-w-[500px] border-2 border-border-subtle rounded-2xl overflow-hidden bg-surface-elevated"
  >
    <iframe
      v-if="preview.embedId"
      :src="`https://www.instagram.com/p/${preview.embedId}/embed`"
      :title="preview.title || 'Instagram post ' + preview.embedId"
      class="w-full aspect-[4/5]"
      frameborder="0"
      scrolling="no"
      allowtransparency="true"
    ></iframe>
  </div>
</template>
