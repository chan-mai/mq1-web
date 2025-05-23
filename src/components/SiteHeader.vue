<script setup lang="ts">
const config = useWebConfig();
const [isVisibleOverlay, toggleOverlay] = useToggle();


const isVisibleRssFeedCopyTooltip = ref<boolean>(false);


const rssFeedCopy = () => {
  // RSSフィードのURLをクリップボードにコピー
  navigator.clipboard.writeText(config.value.rss.url).then(() => {
    //alert('RSSフィードのURLをコピーしました');
  }).catch((err) => {
    //console.error('coppy error', err);
  });
  isVisibleRssFeedCopyTooltip.value = true
};

// 一定時間経過でツールチップを非表示にする
whenever(
  () => isVisibleRssFeedCopyTooltip.value,
  () =>
    useTimeoutFn(() => {
      isVisibleRssFeedCopyTooltip.value = false
    }, 3000),
);
</script>

<template>
  <header
    class="relative z-10 mx-auto box-content flex h-11 max-w-7xl justify-between px-4 pt-6 text-primary md:h-14 md:px-6 md:pt-8">
    <NuxtLink :title="`トップページ`" to="/"
      class="flex w-40  md:w-56 items-center justify-center transition-opacity hover:opacity-70">
      <img :alt="`サイトロゴ まいの雑記帳`" src="@/assets/images/web-logo.webp""
        class=" block" width="315" height="91" loading="eager" decoding="async" />
    </NuxtLink>

    <button
      class="relative z-50 aspect-square rounded-full transition-colors before:absolute before:inset-0 before:m-auto before:scale-0 before:rounded-full before:bg-primary before:transition-transform after:absolute after:inset-0 after:rounded-full after:border-2 after:border-primary hover:text-white hover:before:scale-100 md:hidden [&>span]:absolute [&>span]:inset-x-0 [&>span]:m-auto [&>span]:h-0.5 [&>span]:bg-current [&>span]:duration-200 [&>span]:ease-in-out"
      @click="() => toggleOverlay()">
      <span class="sr-only">
        ナビゲーションメニューを{{ isVisibleOverlay ? '閉じる' : '開く' }}
      </span>
      <span :class="[isVisibleOverlay ? 'w-0' : 'top-[35%] w-1/2']" />
      <span :class="[isVisibleOverlay && 'rotate-[30deg]']" class="top-1/2 w-1/2" />
      <span :class="[isVisibleOverlay && '-rotate-[30deg]']" class="top-1/2 w-1/2" />
      <span :class="[isVisibleOverlay ? 'w-0' : 'top-[65%] w-1/2']" />
    </button>

    <div :class="[
      isVisibleOverlay
        ? 'pointer-events-auto text-primary opacity-100'
        : 'pointer-events-none opacity-0',
    ]"
      class="fixed inset-0 z-40 bg-white px-8 pt-20 transition-opacity before:absolute before:inset-0 before:bg-white md:pointer-events-auto md:relative md:inset-auto md:flex md:items-center md:gap-4 md:rounded-[2rem] md:border-2 md:border-primary md:py-0 md:pl-6 md:pr-9 md:text-inherit md:opacity-100 md:shadow-xl md:transition-none md:before:hidden">
      <nav>
        <ul class="flex flex-col items-start gap-2 md:flex-row md:items-stretch md:gap-0">
          <li v-for="item in config.headerMenu" :key="item.url">
            <!-- 外部リンクの場合は別タブ -->
            <NuxtLink v-if="item.url" :to="item.url"
              :target="(item.url.startsWith('/') || item.url.startsWith('#')) ? '_self' : '_blank'"
              class="relative flex items-center justify-center px-4 py-2 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:scale-y-100 after:bg-primary after:transition-transform hover:after:origin-left hover:after:scale-x-100"
              @click="() => toggleOverlay(false)">
              <span class="text-sm font-bold md:text-xs">{{ item.title }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="flex items-center gap-1 px-2.5 py-6 md:px-0 md:py-0">
        <NuxtLink :title="config.socials.misskey.name" :to="config.socials.misskey.url" aria-label="Misskeyのプロフィールを開く"
          class="relative flex size-8 items-center justify-center rounded before:absolute before:-z-10 before:size-full before:rounded before:bg-slate-200/50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
          target="_blank">
          <Icon :name="config.socials.misskey.icon" class="size-5" />
        </NuxtLink>
        <MqPopupRssGuide type="header" />
      </div>
    </div>
  </header>
</template>
