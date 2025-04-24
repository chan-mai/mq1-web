<script lang="ts" setup>
const config = useWebConfig()
const year = useDateFormat(new Date(), 'YYYY')

const name = config.value.siteName
const socials = config.value.socials
const menu = config.value.footer.menu


const isVisibleRssFeedCopyTooltip = ref<boolean>(false)
    const rssFeedCopy = () => {
  // RSSフィードのURLをクリップボードにコピー
  navigator.clipboard.writeText(config.value.socials.rss.url).then(() => {
    alert('RSSフィードのURLをコピーしました');
  }).catch((err) => {
    //console.error('coppy error', err);
  });
  isVisibleRssFeedCopyTooltip.value = true
};

whenever(
  () => isVisibleRssFeedCopyTooltip.value,
  () =>
    useTimeoutFn(() => {
      isVisibleRssFeedCopyTooltip.value = false
    }, 3000),
)
</script>

<template>
  <footer class="mt-20 rounded-t-3xl bg-white py-20">
    <div
      class="mx-auto box-content flex max-w-7xl flex-col items-start justify-between gap-8 px-4 md:flex-row md:items-center md:px-6"
    >
      <div class="flex flex-col gap-5">
        <nav>
          <ul class="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1">
            <li v-for="item in menu" :key="item.url">
              <NuxtLink :to="item.url">
                <span class="text-xs font-bold no-underline hover:no-underline hover:text-primary">
                  {{ item.title }}
                </span>
              </NuxtLink>
            </li>
          </ul>
        </nav>
        <div class="flex items-center gap-2">
          <NuxtLink
            :title="socials.misskey.name"
            :to="socials.misskey.url"
            aria-label="Misskeyでフォローする"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            target="_blank"
          >
          <Icon name="simple-icons:misskey" class="size-5"/>
          </NuxtLink>
          <NuxtLink
            :title="socials.github.name"
            :to="socials.github.url"
            aria-label="GitHubでフォローする"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            target="_blank"
          >
          <Icon name="simple-icons:github" class="size-5"/>
          </NuxtLink>
          <NuxtLink
            :title="socials.twitter.name"
            :to="socials.twitter.url"
            aria-label="Twitterでフォローする"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            target="_blank"
          >
          <Icon name="simple-icons:twitter" class="size-5"/>
          </NuxtLink>
          <NuxtLink
            :title="socials.qiita.name"
            :to="socials.qiita.url"
            aria-label="Qiitaでフォローする"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            target="_blank"
          >
          <Icon name="simple-icons:qiita" class="size-5"/>
          </NuxtLink>
          <button
            :title="socials.rss.name"
            aria-label="RSSフィードのURLをコピーする"
            class="relative flex size-8 items-center justify-center rounded before:absolute before:size-full before:rounded before:bg-current before:opacity-0 before:transition-opacity hover:before:opacity-20 hover:text-primary"
            @click="() => rssFeedCopy()"
          >
          <Icon name="line-md:rss" class="size-5"/>
            <span
              :class="[
                isVisibleRssFeedCopyTooltip ? 'opacity-100' : 'opacity-0',
              ]"
              class="pointer-events-none absolute -top-5 whitespace-nowrap rounded bg-black/70 px-2 py-1 text-xs text-white transition-opacity"
            >
              URLをコピーしました
            </span>
          </button>
        </div>
      </div>
      <div class="text-xs">&copy; 2025-{{ year }} {{ name }}</div>
    </div>
  </footer>
</template>
