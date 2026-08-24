<script setup lang="ts">
const props = defineProps<{
  preview: LinkPreviewResponse;
  url: string;
  target?: string | null;
  rel?: string | null;
}>();

const FALLBACK_TITLE = 'リンク';

const resolvedTarget = computed(() => props.target ?? '_blank');
const resolvedRel = computed(() => {
  if (typeof props.rel === 'string' && props.rel.length > 0) {
    return props.rel;
  }
  return resolvedTarget.value === '_blank' ? 'noopener noreferrer' : undefined;
});
const isExternalLink = computed(() => /^https?:\/\//.test(props.url));
</script>

<template>
  <NuxtLink
    :to="preview.url"
    :external="isExternalLink"
    :target="resolvedTarget"
    :rel="resolvedRel"
    class="mq-link-card__link group block w-full transition-colors duration-200"
  >
    <div
      class="flex items-stretch overflow-hidden rounded-2xl bg-surface-elevated border-2 border-border-subtle transition-colors duration-200 hover:bg-primary/5 hover:border-primary/50"
    >
      <div
        v-if="preview.image"
        class="flex flex-shrink-0 overflow-hidden bg-surface-muted self-stretch basis-32 sm:basis-48 lg:basis-56"
      >
        <NuxtImg
          :src="preview.image"
          :alt="preview.title"
          :width="640"
          :height="360"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 35vw, 45vw"
          class="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="flex flex-1 flex-col justify-between gap-3 p-5">
        <div class="flex items-center gap-2 min-w-0">
          <NuxtImg
            v-if="preview.favicon"
            :src="preview.favicon"
            alt=""
            class="flex-shrink-0 rounded-sm size-4"
            loading="lazy"
            decoding="async"
          />
          <p class="text-xs font-medium text-fg-muted truncate">
            {{ preview.domain }}
          </p>
        </div>

        <div class="flex-1 min-w-0">
          <h3
            class="font-semibold text-fg line-clamp-2 text-base transition-colors duration-200 group-hover:text-primary"
          >
            {{ preview.title || FALLBACK_TITLE }}
          </h3>
          <p
            v-if="preview.description"
            class="text-sm text-fg-muted line-clamp-2 mt-1.5 transition-colors duration-200 group-hover:text-primary/80"
          >
            {{ preview.description }}
          </p>
        </div>

        <div class="flex items-center justify-end">
          <div
            class="flex items-center gap-1 text-fg-muted transition-colors duration-200 group-hover:text-primary"
          >
            <Icon
              name="material-symbols:arrow-outward-rounded"
              class="h-5 w-5"
            />
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
