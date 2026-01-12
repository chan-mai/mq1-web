<script setup lang="ts">
interface Props {
  title: string;
  url: string;
  orientation?: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal'
});

const config = useWebConfig();

// 共有用のURLとテキストを生成
const shareText = computed(() => {
  return `${props.title} - ${config.value.siteName}`;
});

const shareUrl = computed(() => {
  return props.url.startsWith('http') ? props.url : props.url.startsWith('/') ? `${config.value.siteUrl}${props.url.slice(1)}` : `${config.value.siteUrl}${props.url}`;
});

// Twitter共有
const shareToTwitter = () => {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
};

// Misskey共有
const shareToMisskey = () => {
  const misskeyUrl = `https://misskey-hub.net/share/?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`;
  window.open(misskeyUrl, '_blank', 'width=600,height=400');
};

// Facebook共有
const shareToFacebook = () => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
};

// LinkedIn共有
const shareToLinkedIn = () => {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl.value)}`;
  window.open(linkedinUrl, '_blank', 'width=600,height=400');
};

// はてなブックマーク共有
const shareToHatena = () => {
  const hatenaUrl = `https://b.hatena.ne.jp/entry/${encodeURIComponent(shareUrl.value)}`;
  window.open(hatenaUrl, '_blank', 'width=600,height=400');
};

// URLをクリップボードにコピー
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    useToast().success({
      title: 'URLをコピーしました！',
    });
  } catch (err) {
    console.error('Failed to copy: ', err);
    useToast().error({
      title: 'コピーに失敗しました',
    });
  }
};

// 共有ボタンの設定
const shareButtons = [
  {
    name: 'Twitter',
    icon: 'simple-icons:twitter',
    color: 'hover:bg-gradient-to-br hover:from-sky-400 hover:to-blue-500 hover:text-white hover:shadow-sky-200/50',
    action: shareToTwitter
  },
  {
    name: 'Misskey',
    icon: 'simple-icons:misskey',
    color: 'hover:bg-gradient-to-br hover:from-lime-400 hover:to-green-500 hover:text-white hover:shadow-lime-200/50',
    action: shareToMisskey
  },
  {
    name: 'Facebook',
    icon: 'simple-icons:facebook',
    color: 'hover:bg-gradient-to-br hover:from-blue-500 hover:to-blue-600 hover:text-white hover:shadow-blue-200/50',
    action: shareToFacebook
  },
  {
    name: 'LinkedIn',
    icon: 'simple-icons:linkedin',
    color: 'hover:bg-gradient-to-br hover:from-blue-600 hover:to-blue-700 hover:text-white hover:shadow-blue-200/50',
    action: shareToLinkedIn
  },
  {
    name: 'はてなブックマーク',
    icon: 'simple-icons:hatenabookmark',
    color: 'hover:bg-gradient-to-br hover:from-blue-400 hover:to-blue-500 hover:text-white hover:shadow-blue-200/50',
    action: shareToHatena
  },
  {
    name: 'URLコピー',
    icon: 'material-symbols:content-copy',
    color: 'hover:bg-gradient-to-br hover:from-primary/70 hover:to-primary hover:text-white hover:shadow-primary/50',
    action: copyToClipboard
  }
];
</script>

<template>
  <div class="share-buttons">
    <div 
        class="flex gap-3 rounded-xl py-4"
        :class="orientation === 'vertical' ? 'flex-col items-center px-2' : 'flex-col px-5'"
    >
      <div v-if="orientation === 'horizontal'" class="flex items-center gap-2">
        <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <Icon name="material-symbols:share" class="h-4 w-4 text-white" />
        </div>
        <h3 class="text-lg text-primary">この記事を共有</h3>
      </div>
      <div 
        class="flex gap-2"
        :class="orientation === 'vertical' ? 'flex-col w-full' : 'flex-wrap'"
      >
        <button
          v-for="button in shareButtons"
          :key="button.name"
          @click="button.action"
          :class="[
            'group relative flex items-center justify-center gap-2 text-sm font-medium text-gray-600 bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2',
            button.color,
            orientation === 'vertical' ? 'w-10 h-10 p-0 rounded-full mx-auto' : 'px-4 py-2.5'
          ]"
          :title="`${button.name}で共有`"
        >
          <Icon :name="button.icon" class="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110" />
          <span v-if="orientation === 'horizontal'" class="hidden sm:inline whitespace-nowrap font-medium">{{ button.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.share-buttons button {
  min-width: 44px;
  min-height: 44px;
  position: relative;
  overflow: hidden;
}

.share-buttons button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.share-buttons button:hover::before {
  left: 100%;
}

.share-buttons button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.share-buttons button:active {
  transform: translateY(-1px) scale(1.01);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.share-buttons button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* モバイルでのタッチターゲットを確保 */
@media (max-width: 640px) {
  .share-buttons button {
    min-width: 48px;
    min-height: 48px;
  }
}

/* グラスモーフィズム効果 */
.share-buttons {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* アイコンのアニメーション */
.share-buttons button .icon {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.share-buttons button:hover .icon {
  transform: scale(1.1) rotate(5deg);
}

/* テキストのフェードイン効果 */
.share-buttons button span {
  transition: all 0.3s ease;
}

.share-buttons button:hover span {
  transform: translateX(2px);
}
</style>
