<script setup lang="ts">
const config = useWebConfig();
const year = useDateFormat(new Date(), 'YYYY');

const isVisible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits(['close']);

// メニュー表示時にスクロールをロックするためbodyクラスを切り替え
watch(isVisible, async (newVal) => {
  if (import.meta.client) {
    if (newVal) {
      document.body.classList.add('is-menu-open');
      // メニューが開いたらフォーカスを移動
      await nextTick();
      setTimeout(() => {
        const firstLink = document.querySelector('#global-menu a') as HTMLElement;
        firstLink?.focus();
      }, 100);
    } else {
      document.body.classList.remove('is-menu-open');
    }
  }
});

const close = () => {
  isVisible.value = false;
  emit('close');
};

// escで閉じる
if (import.meta.client) {
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isVisible.value) {
      close();
    }
  });
}
</script>

<template>
  <Teleport to="body">
    <div 
      id="global-menu"
      role="dialog"
      aria-modal="true"
      aria-label="メインメニュー"
      class="fixed z-[9999] top-0 left-0 w-full h-full bg-neutral-800 text-white overflow-x-hidden overflow-y-auto"
      :class="[
        isVisible 
          ? 'opacity-100 visible pointer-events-auto transition-[opacity] duration-400 ease-out' 
          : 'opacity-0 invisible pointer-events-none transition-[opacity,visibility] duration-400 ease-out delay-400'
      ]"
    >
      <div 
        class="fixed inset-0 transition-opacity duration-400"
        :class="isVisible ? 'pointer-events-auto' : 'pointer-events-none'"
        @click="close"
      ></div>
      
      <!-- 背景画像 -->
      <div 
         class="dot-overlay h-full min-h-[800px] w-[26%] max-[800px]:w-[42%] max-[800px]:min-h-0 absolute z-0 top-0 right-0 transition-all duration-[800px] ease-in-out"
         :class="isVisible 
            ? 'translate-x-0 opacity-100 delay-0 duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]' 
            : 'translate-x-[30px] opacity-0'"
         aria-hidden="true"
      >
        <NuxtImg
          src="/images/hero.png"
          alt=""
          format="webp"
          class="block object-cover w-full h-full"
        />
      </div>

      <div class="h-full min-h-[800px] flex justify-start items-center relative z-[4] max-[800px]:justify-center max-[800px]:items-start max-[800px]:flex-col max-[800px]:min-h-0 max-[800px]:pt-[60px]">
        <div class="relative max-w-[1490px] w-[calc(86%+60px)] mx-auto px-[60px] max-[800px]:static max-[800px]:px-[30px]">
          
          <!-- メインナビゲーション -->
          <nav class="group/nav">
            <ul class="max-w-[280px]" style="counter-reset: listnum;">
              <li 
                v-for="(item, index) in config.headerMenu" 
                :key="item.url" 
                class="pb-[11px] transform transition-all duration-[600ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
                :class="isVisible ? 'translate-x-0 opacity-100' : '-translate-x-[15px] opacity-0'"
                :style="{ transitionDelay: isVisible ? `${0.3 + (index as number) * 0.15}s` : '0s' }"
              >
                <NuxtLink 
                    :to="item.url" 
                    class="relative block text-[36px] text-white no-underline group/link max-[800px]:text-[21px] cursor-react uppercase" 
                    @click="close"
                >
                  <!-- ナンバリング -->
                  <span aria-hidden="true" class="hidden min-[801px]:block absolute top-[22px] left-0 text-[12px] font-[600] leading-none text-white opacity-0 transition-opacity duration-300 ease-out group-hover/link:opacity-100 pointer-events-none before:content-[counter(listnum,decimal-leading-zero)] before:increment-listnum">
                  </span>
                  
                  <span class="inline-block transition-transform duration-300 ease-out min-[801px]:group-hover/link:translate-x-[32px]">
                    {{ item.title }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </nav>
          
          <!-- ソーシャルリンク -->
          <div 
             class="absolute bottom-[14px] left-[48%] transition-all duration-[800ms] ease-in-out max-[800px]:static max-[800px]:mt-[60px] max-[800px]:ml-0"
             :class="isVisible ? 'translate-x-0 opacity-100 delay-[1050ms]' : '-translate-x-[15px] opacity-0 delay-[200ms]'"
          >
             <p class="mb-[14px] text-[14px] font-[300] max-[800px]:hidden">SOCIAL ACCOUNTS</p>
             <ul class="flex gap-[1rem]">
                <li 
                    v-for="(social, index) in config.socials" 
                    :key="social.url" 
                    :style="{ transitionDelay: isVisible ? `${0.3 + (index as unknown as number) * 0.15}s` : '0s' }"
                >
                    <NuxtLink class="text-white cursor-react-sml" :to="social.url" target="_blank" :aria-label="social.name">
                        <Icon :name="social.icon" class="size-5" />
                    </NuxtLink>
                </li> 
             </ul>    
          </div>
          
          <!-- コピーライト -->
          <p 
            class="transition-all duration-[600ms] ease-in-out text-white min-[801px]:absolute min-[801px]:z-[1] min-[801px]:right-[60px] min-[801px]:top-[50%] min-[801px]:mt-[130px] min-[801px]:text-[12px] min-[801px]:rotate-90 min-[801px]:origin-top-right max-[800px]:absolute max-[800px]:bottom-[28px] max-[800px]:w-full max-[800px]:left-0 max-[800px]:px-[30px] max-[800px]:text-[12px]"
            :class="isVisible ? 'opacity-100 delay-[1200ms]' : 'opacity-0 delay-0'"
          >
            Copyright © 2025-{{ year }} {{ config.author.name }} All Rights Reserved.
          </p>
          
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.before\:increment-listnum::before {
    counter-increment: listnum;
}

.dot-overlay::after {
    content: '';
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAG0lEQVQYV2NkYGD4z8DAwMgABXAGNgGwSgwVAFbmAgXQdISfAAAAAElFTkSuQmCC) repeat;
    background-color: rgba(0, 0, 0, 0.2);
    pointer-events: none;
}
</style>
