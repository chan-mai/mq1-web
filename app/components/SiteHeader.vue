<script setup lang="ts">
const config = useWebConfig();
const route = useRoute();
const [isVisibleOverlay, toggleOverlay] = useToggle();

const isActivePage = (url: string) => {
  // 末尾の/を除去して比較
  const currentPath = route.path.replace(/\/$/, '');
  const targetUrl = url.replace(/\/$/, '');
  // ルートパスの場合は完全一致、それ以外は前方一致
  return currentPath === targetUrl || (url === '/' && route.path === '/');
};

const isVisibleMenu = ref(false);
const toggleMenu = (val?: boolean) => {
  isVisibleMenu.value = typeof val === 'boolean' ? val : !isVisibleMenu.value;
};

// 検索ポップアップの参照
const searchPopup = ref<{ open: () => void } | null>(null);

// ヘッダーの動的テーマ変更
const headerTheme = ref<'light' | 'dark'>('light');

const updateHeaderTheme = () => {
    if (!import.meta.client) return;
    
    // ヘッダー直下の要素を取得
    const x = 60;
    const y = 30;

    // 重なりを考慮して要素を取得
    const elements = document.elementsFromPoint(x, y);

    // 1. data-header-inverse属性を確認
    const forceInverse = elements.some(el => el.getAttribute('data-header-inverse') === 'true');

    // 2. 背景色を確認
    let isDarkBg = false;
    if (!forceInverse) {
        let rTotal = 0;
        let gTotal = 0;
        let bTotal = 0;
        let alphaLeft = 1.0;

        for (const el of elements) {
            const style = window.getComputedStyle(el);
            const bgColor = style.backgroundColor;
            // RGBA解析
            const rgba = bgColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
            
            if (rgba) {
                const r = parseInt(rgba[1] ?? '0');
                const g = parseInt(rgba[2] ?? '0');
                const b = parseInt(rgba[3] ?? '0');
                const a = rgba[4] !== undefined ? parseFloat(rgba[4]) : 1;

                // アルファ合成（Over演算子）
                // 前面の色の寄与分を加算
                rTotal += r * a * alphaLeft;
                gTotal += g * a * alphaLeft;
                bTotal += b * a * alphaLeft;

                // 残りの透過度を更新
                alphaLeft *= (1 - a);

                // ほぼ不透明になったら終了
                if (alphaLeft < 0.01) break;
            }
        }

        // 残りが透明なら白背景（ブラウザのデフォルト）と仮定して合成
        if (alphaLeft > 0) {
            rTotal += 255 * alphaLeft;
            gTotal += 255 * alphaLeft;
            bTotal += 255 * alphaLeft;
        }

        // 輝度計算 (IEC 61966-2-1 sRGB)
        // Y = 0.2126 * R + 0.7152 * G + 0.0722 * B
        const luminance = 0.2126 * rTotal + 0.7152 * gTotal + 0.0722 * bTotal;

        // 閾値より暗ければダーク背景とみなす
        if (luminance < 140) { 
            isDarkBg = true;
        }
    }
    
    headerTheme.value = (forceInverse || isDarkBg) ? 'dark' : 'light';
};

// イベントリスナーの設定
if (import.meta.client) {
    useEventListener('scroll', updateHeaderTheme, { passive: true });
    useEventListener('resize', updateHeaderTheme, { passive: true });
    onMounted(() => {
        updateHeaderTheme();
        // レイアウトシフト対策
        setTimeout(updateHeaderTheme, 100);
        setTimeout(updateHeaderTheme, 500);
    });
}
</script>

<template>
  <header :class="[headerTheme === 'dark' ? 'text-white' : '']">
    <h1 class="fixed z-40 top-[20px] left-[20px] min-[801px]:top-[60px] min-[801px]:left-[60px] max-[1260px]:left-[30px]">    
      <NuxtLink to="/" class="cursor-react">
        <NuxtImg :alt="config.siteName" src="web-logo.png" height="200" format="webp" 
                 class="max-h-[80px] w-auto max-[800px]:w-[180px]" />
      </NuxtLink>
    </h1>    
    <nav class="fixed z-10 top-[25px] right-[80px] flex justify-start items-center min-[801px]:top-[67px] min-[801px]:right-[132px]">
      <ul class="flex justify-end items-start list-none p-0 m-0 max-[1110px]:hidden">
        <li
          v-for="(item, index) in config.headerMenu"
          :key="item.url"
          class="min-[801px]:ml-[46px] max-[1260px]:ml-[30px] first:ml-0 relative"
          :class="{ 'group': true }"
        >
          <NuxtLink
            :to="item.url"
            :target="(item.url.startsWith('/') || item.url.startsWith('#')) ? '_self' : '_blank'"
            class="text-[14px] font-semibold tracking-[0.05em] no-underline transition-colors duration-300 ease-out cursor-react"
            :class="[
               isActivePage(item.url) ? 'text-primary' : 'text-current'
            ]"
          >
            {{ item.title }}
          </NuxtLink>
          <span 
             v-if="isActivePage(item.url)"
             class="absolute top-[32px] left-0 block w-full h-[3px] bg-primary"
          ></span>
        </li>
      </ul>
      <!-- ショップリンク（検索、RSS） -->
      <ul class="flex justify-start items-center list-none p-0 min-[801px]:ml-[40px] max-[800px]:ml-0">
         <!-- 検索ボタン -->
         <li class="ml-[1rem]">
          <button
            type="button"
            aria-label="検索を開く"
            class="relative flex size-8 border-none items-center justify-center rounded before:absolute before:-z-10 before:size-full before:rounded before:bg-slate-200/50 before:opacity-0 before:transition-opacity hover:before:opacity-100"
            @click="searchPopup?.open()"
          >
             <Icon name="material-symbols:search" class="size-5" />
          </button>
        </li>
        <!-- RSSガイド -->
        <li class="ml-[1rem]">
           <MqPopupRssGuide type="header" />
        </li>
      </ul>      
    </nav>
    <div 
      class="fixed z-[10001] top-[16px] right-[20px] w-[50px] h-[50px] pt-[17px] max-[1260px]:right-[30px] min-[801px]:top-[58px] min-[801px]:right-[50px] cursor-pointer cursor-react group/menu"
      @click="() => toggleMenu()"
    >
      <button class="block relative z-100 w-[30px] h-[15px] mx-auto bg-transparent border-none p-0 menu-trigger" :class="{ 'is-active': isVisibleMenu }">
        <span class="inline-block absolute z-[3] right-0 w-full top-0 h-[1px] bg-current rounded-[8px] transition-all duration-200 ease-out origin-center group-hover/menu:w-full" :class="{ 'translate-y-[7px] rotate-[30deg]': isVisibleMenu }"></span>
        <span class="inline-block absolute z-[3] right-0 top-[7px] w-[calc(100%-5px)] h-[1px] bg-current rounded-[8px] transition-all duration-200 ease-out group-hover/menu:w-full" :class="{ 'opacity-0': isVisibleMenu }"></span>
        <span class="inline-block absolute z-[3] right-0 bottom-0 w-[calc(100%-10px)] h-[1px] bg-current rounded-[8px] transition-all duration-200 ease-out origin-center group-hover/menu:w-full" :class="{ 'translate-y-[-7px] rotate-[-30deg] w-full': isVisibleMenu }"></span>
      </button>
    </div>

    <!-- モーダルとコンテナ -->
    <MenuContainer v-model:visible="isVisibleMenu" @close="toggleMenu(false)" />
    <MqSearchPopup ref="searchPopup" />
  </header>
</template>
