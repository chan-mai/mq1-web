<script setup lang="ts">
const config = useWebConfig();
const socials = config.value.socials;

// いけいけパララックス効果をよしなに
const scrollY = ref(0);
const containerRef = ref(null);

const handleScroll = () => {
    scrollY.value = window.scrollY;
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll)
});
onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
});

// OGP生成
const ogImageUrl = useOgGenerator("ABOUT ME");
useHead({
    title: `${config.value.siteName} - 私について`,
    meta: [
        { name: 'description', content: config.value.siteDescription },
        { property: 'og:site_name', content: config.value.siteName },
        { property: 'og:title', content: `${config.value.siteName} - 私について` },
        { property: 'og:description', content: config.value.siteDescription },
        { property: 'og:image', content: `${config.value.siteUrl}about-ogp.png` },
        { property: 'og:url', content: `${config.value.siteUrl}/about` },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${config.value.siteUrl}about-ogp.png` },
    ],
});
</script>
<template>
    <div class="min-h-screen rounded-xl overflow-hidden mt-5 md:mt-10">
        <div class="bg-accent text-white relative w-full max-w-none overflow-hidden md:overflow-visible">
            <!-- 右側のエッジ文字 -->
            <div class="absolute bottom-0 z-20 w-full h-2/3">
                <img src="@/assets/images/about/mai-bg-text.webp" alt="Mai Sudachi"
                    class="w-full h-full object-contain object-right" loading="eager" />
            </div>
            <div class="w-full px-8 py-8 max-w-6xl mx-auto">
                <!-- ふわふわ円形 -->
                <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div
                        class="absolute rounded-full opacity-10 bg-white w-[300px] h-[300px] -top-[100px] -left-[100px] circle-1">
                    </div>
                    <div
                        class="absolute rounded-full opacity-10 bg-white w-[200px] h-[200px] -bottom-[50px] right-[30%] circle-2">
                    </div>
                    <div
                        class="absolute rounded-full opacity-10 bg-white w-[150px] h-[150px] top-[20%] right-[10%] circle-3">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- ヘッダ 情報 -->
                    <div class="z-30 relative">
                        <div class="mb-6">
                            <p class="text-sm md:text-base font-light mb-2">応用睡眠技術者</p>
                            <div class="w-16 h-0.5 bg-white mb-4"></div>
                            <h1 class="text-5xl md:text-6xl font-bold mb-2">月出里 まい</h1>
                            <p class="text-sm tracking-widest mb-16">SUDACHI MAI</p>

                            <!-- Socials -->
                            <div class="grid grid-cols-1 space-y-2 mb-8 relative z-30">
                                <NuxtLink v-for="social in socials" :key="social.name" :to="social.url"
                                    class="w-1/3 bg-white text-accent rounded-md px-3 py-2 hover:bg-primary hover:text-white transition-all flex items-center">
                                    <Icon :name="social.icon" class="mr-2 size-5" />
                                    <span class="text-sm">{{ social.name }}</span>
                                </NuxtLink>
                            </div>

                            <p class="text-sm mb-4">イラスト： <NuxtLink to="https://x.com/CSea2073" target="_blank"
                                    class="p-2 font-semibold hover:bg-white hover:text-accent rounded-xl transition-all ">
                                    しなもん</NuxtLink>
                            </p>

                            <!-- 顔 -->
                            <div class="flex space-x-4 mb-12">
                                <div class="bg-white rounded-full p-1 size-15">
                                    <img src="@/assets/images/about/mai-crop2.webp" alt="Icon 1"
                                        class="rounded-full size-10" />
                                </div>
                                <div class="bg-white rounded-full p-1 size-15">
                                    <img src="@/assets/images/about/mai-crop.webp" alt="Icon 1" class="rounded-full size-10" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="absolute w-full h-full left-0 pointer-events-none">
                <!-- 背景画像 -->
                <div class="absolute top-0 z-20 w-full h-full opacity-40 -translate-y-full">
                    <img src="@/assets/images/about/mai-bg.webp" alt="doted mai"
                        class="w-full h-full object-cover object-center" loading="eager" />
                </div>

                <!-- 立ち絵後 グロー -->
                <div class="absolute w-full top-0 z-20 -translate-y-[75%] md:-translate-y-2/3  
         scale-80 md:scale-100 -right-0 md:right-[15%]">
                    <div class="character-glow absolute w-full h-full top-0 right-0 z-40"></div>
                    <img src="@/assets/images/about/mai.webp" alt="Mai Sudachi"
                        class="object-contain max-h-[800px] relative z-[60] ml-auto" loading="eager" decoding="async" />
                </div>
            </div>
        </div>

        <!-- 以下下部セクション -->
        <div class="bg-white text-black relative pt-12 pb-32" ref="containerRef">
            <div class="container mx-auto px-4">
                <!-- 詳細 -->
                <div class="mr-auto px-8 z-50 relative max-w-6xl mx-auto w-full">
                    <div class="mb-12 mt-5">
                        <h2
                            class="text-hey mb-4 max-w-2xl text-2xl leading-none font-extrabold md:text-3xl xl:text-4xl text-primary">
                            Hello, I'm
                            <span
                                class="text-hey bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">chan-mai</span>
                            <span class="waving-hand">👋🏻</span>
                        </h2>
                        <p class="text-xl md:text-2xl mb-4 text-shadow-lg text-shadow-white">
                            わたしについて
                        </p>
                        <div class="space-y-4 text-sm md:text-base font-light mb-2">
                            <p class="text-shadow-lg text-shadow-white">
                                九州を根城に生息しているひとのふりをした自称フルスタックエンジニアです。
                                <br />
                                たまにクリエイティブなことにも手を出します。
                            </p>
                            <p class="text-shadow-lg text-shadow-white">
                                普段はMisskeyで鯖缶をしています。
                                <br />
                                あまいものとかわいいものがすきです。
                            </p>
                            <p class="text-shadow-lg text-shadow-white">
                                以後お見知りおきを。
                            </p>
                        </div>
                    </div>

                    <!-- box -->
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 gap-6 relative bg-white/90 md:bg-transparent z-60 md:z-auto">
                        <div>
                            <div class="text-accent text-lg font-medium">誕生日</div>
                            <div class="text-xl">2006/04/04</div>
                        </div>
                        <div>
                            <div class="text-accent text-lg font-medium">趣味</div>
                            <div class="text-xl">インターネット </div>
                        </div>
                        <div>
                            <div class="text-accent text-lg font-medium">好きな言語</div>
                            <div class="text-xl">Go / Dart</div>
                        </div>
                    </div>

                </div>



            </div>
        </div>
    </div>
</template>
<style scoped>
.character-glow {
    background: radial-gradient(circle at 70% 40%, rgba(173, 216, 230, 0.3) 0%, rgba(255, 182, 193, 0.2) 30%, transparent 60%);
    filter: blur(20px);
}


.circle-1 {
    animation: pulse 15s infinite alternate;
}

.circle-2 {
    animation: pulse 12s infinite alternate-reverse;
}

.circle-3 {
    animation: pulse 10s infinite alternate;
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.1;
    }

    50% {
        transform: scale(1.1);
        opacity: 0.15;
    }
}
</style>