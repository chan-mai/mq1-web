<script setup lang="ts">
const config = useWebConfig();
const socials = Object.values(config.value.socials);

useHead({
    title: `私について - ${config.value.siteName}`,
    meta: [
        { name: 'description', content: config.value.siteDescription },
        { property: 'og:site_name', content: config.value.siteName },
        { property: 'og:title', content: `${config.value.siteName} - 私について` },
        { property: 'og:description', content: config.value.siteDescription },
        { property: 'og:image', content: `${config.value.siteUrl}images/ogp/about-ogp.png` },
        { property: 'og:url', content: `${config.value.siteUrl}about` },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: `${config.value.siteUrl}images/ogp/about-ogp.png` },
    ],
});

// 構造化データ (JSON-LD)
useJsonld([
    {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: config.value.author.name,
        alternateName: config.value.author.name,
        givenName: config.value.author.name,
        familyName: config.value.author.name,
        birthDate: config.value.author.birthDate,
        jobTitle: config.value.author.jobTitle,
        description: config.value.author.description,
        url: config.value.siteUrl,
        image: `${config.value.siteUrl}images/about/mai.png`,
        sameAs: socials.filter((social: any) => social.url).map((social: any) => social.url),
    },
    {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: config.value.siteName,
        description: config.value.siteDescription,
        url: config.value.siteUrl,
        author: {
            '@type': 'Person',
            name: config.value.author.name,
            url: config.value.siteUrl,
        },
    }
]);
</script>

<template>
    <main class="max-w-none h-full text-[0.925rem] leading-loose tracking-wide text-inherit [&>div>*:first-child]:mt-0">
        <div class="min-h-screen overflow-hidden">

            <div class="bg-primary text-white relative w-full max-w-none overflow-hidden md:overflow-visible dot-overlay">
                <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none bg-[url(/images/about/bg.png)] bg-cover opacity-90 contrast-110" />
                <AboutHeadBackground />

                <!-- 右側のエッジ文字 -->
                <div class="absolute bottom-0 z-20 w-full h-2/3 pointer-events-none">
                    <NuxtImg src="/images/about/mai-bg-text.png" format="webp" alt="Mai Sudachi" fetchpriority="high"
                        class="w-full h-full object-contain object-right" loading="eager" />
                </div>

                <div class="w-full px-8 pt-[180px] md:pt-[200px] pb-8 max-w-6xl mx-auto relative z-30">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <!-- ヘッダ 情報 -->
                        <div class="z-30 relative">
                            <div class="mb-32">
                                <p class="mobile-text-outline text-sm md:text-base font-light mb-2">応用睡眠技術者</p>
                                <div class="w-16 h-0.5 bg-white mb-4"></div>
                                <h1 class="mobile-text-outline text-5xl md:text-6xl font-bold mb-2">月出里 まい</h1>
                                <p class="mobile-text-outline text-sm tracking-widest mb-16">SUDACHI MAI</p>

                                <!-- Socials -->
                                <div class="grid grid-cols-1 space-y-2 mb-8 relative z-30">
                                    <NuxtLink v-for="social in socials.filter(s => s.isFixed)" :key="social.name" :to="social.url"
                                        target="_blank"
                                        rel="me"
                                        class="w-1/3 bg-white/80 text-accent rounded-full px-3 py-2 hover:bg-primary/90 hover:text-white transition-all flex items-center">
                                        <Icon :name="social.icon" class="mr-2 size-5" />
                                        <span class="text-sm">{{ social.name }}</span>
                                    </NuxtLink>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div class="absolute w-full h-full left-0 pointer-events-none">
                    <!-- 背景画像 -->
                    <div class="absolute top-0 z-20 w-full h-full opacity-30 -translate-y-full contrast-120 overflow-hidden">
                        <NuxtImg src="/images/about/mai-bg.png" format="webp" alt="doted mai" fetchpriority="high"
                            class="w-full h-full object-cover object-center pointer-events-none" loading="eager" />
                    </div>

                    <!-- 立ち絵 -->
                    <div class="absolute w-full top-0 z-20 -translate-y-[75%] md:-translate-y-2/3 scale-80 md:scale-100 -right-0 md:right-[15%]">
                        <div class="character-glow absolute w-full h-full top-0 right-0 z-40 bg-white/10 blur-3xl rounded-full transform scale-150"></div>
                        <NuxtImg src="/images/about/mai.png" format="webp" alt="Mai Sudachi" fetchpriority="high"
                            class="object-contain max-h-[800px] relative z-[60] ml-auto character-shadow" loading="eager"
                            decoding="async" />
                    </div>
                </div>
            </div>

            <!-- ループテキスト -->
            <div class="w-full bg-white border-t-2 border-b-2 border-accent overflow-hidden py-1">
                <div class="flex whitespace-nowrap">
                    <div v-for="i in 30" :key="i" class="animate-marquee flex gap-12 items-center pr-12 select-none shrink-0">
                        <span class="text-xs font-semibold tracking-tighter text-accent">SUDACHI MAI</span>
                        <Icon name="ph:star-four-fill" class="size-3 text-primary" />
                    </div>
                </div>
            </div>

            <!-- 以下下部セクション -->
            <div class="relative w-full overflow-hidden pb-20">
                <!-- ヘッダーセクション 左 -->
                <!-- コンテンツの重なりを防ぐためにpb-[120px]を追加 -->
                <div class="relative z-10 pt-[130px] pb-[120px] mb-[40px]">

                    <h2 class="md:absolute px-4 md:px-0 mt-4 md:mt-0 left-0 text-4xl md:text-5xl font-bold tracking-tighter text-accent/80 uppercase md:[writing-mode:vertical-rl] select-none whitespace-nowrap">Introduction</h2>
                    <!-- 背景要素 -->
                    <!-- 下に拡張するためにbottom-0をbottom-[-180px]に変更 -->
                    <div class="absolute top-[130px] bottom-[-180px] left-0 w-full md:w-[calc(50%+600px)] bg-[#f2e6e7] -z-10"></div>

                    <div class="max-w-[1200px] mx-auto px-4 relative">
                        <!-- ヘッダーコンテンツwrapper -->
                        <div class="w-full md:w-[50%]">
                            <div class="md:bg-transparent rounded-lg relative z-20">
                                <div class="flex flex-col gap-6 my-4 md:my-8">
                                    <div class="flex items-center gap-8">
                                        <div>
                                            <p class="text-xs tracking-widest font-light text-gray-500">ROLE</p>
                                            <p class="text-xl">Engineer?</p>
                                        </div>
                                        <div>
                                            <p class="text-xs tracking-widest font-light text-gray-500">CHARACTER DESIGN</p>
                                            <NuxtLink to="https://x.com/CSea2073" target="_blank"
                                                class="text-xl hover:text-primary transition-all">しなもん</NuxtLink>
                                        </div>
                                    </div>
                                    <div class="flex flex-col gap-2 mt-2">
                                        <p class="text-xs tracking-widest font-light text-gray-500">SOCIALS</p>
                                        <div class="flex flex-wrap gap-2">
                                            <div v-for="social in socials" :key="social.name">
                                                <MqAppLink class="text-xs" :to="social.url" rel="me noopener noreferrer">
                                                    {{ social.name }}
                                                    <template #icon>
                                                        <Icon :name="social.icon" class="size-3" />
                                                    </template>
                                                </MqAppLink>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ボディセクション 右/中央 -->
                <!-- 上に引き上げるために-mt-[100px]を追加 -->
                <div class="relative z-10 -mt-[100px]">
                    <!-- 背景要素 -->
                     <div class="absolute top-0 left-0 md:left-[calc(50%-680px)] w-full md:w-[calc(50%+680px)] h-full bg-white md:shadow-[0_16px_38px_10px_rgba(0,0,0,0.05)] -z-10"></div>

                    <div class="max-w-[1200px] mx-auto px-4 py-12 md:py-20">
                         <div class="w-full">

                            <!-- Snapshots -->
                            <div class="mb-12">
                                <p class="text-sm text-gray-500 tracking-widest mb-3 font-light">SNAPSHOTS</p>
                                <div class="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                    <div v-for="i in 5" :key="i" class="w-[200px] h-[112px] bg-gray-50 border border-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 group cursor-pointer transition-transform hover:scale-[1.02]">
                                        <div class="absolute inset-0 bg-gray-100">
                                            <div class="w-full h-full opacity-10 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                        </div>
                                        <div class="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                            <div class="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                                                 <Icon name="ph:play-fill" class="w-4 h-4 text-primary/80 ml-0.5" />
                                            </div>
                                            <span class="text-xs font-semibold tracking-tighter text-primary">COMING SOON...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <p
                                class="mb-4 max-w-2xl text-2xl leading-none md:text-3xl xl:text-4xl text-primary font-semibold">
                                Hello, I'm
                                <span
                                    class="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-indigo-400">chan-mai</span>
                                <span class="waving-hand">👋🏻</span>
                            </p>

                            <p class="text-base md:text-[16px] leading-[2.2] mb-12 text-gray-700 font-light tracking-wide text-justify">
                                九州を根城に生息している、ひとのふりをした自称フルスタックエンジニア。<br />
                                たまにクリエイティブなことにも手を出します。
                                普段はMisskeyで鯖缶をしています。<br />
                                以後お見知りおきを。
                            </p>

                            <!-- Profile -->
                            <div class="profile mt-12 w-full">
                                <p class="text-sm text-gray-500 tracking-widest mb-3 font-light">PROFILE</p>
                                <div class="flex flex-wrap justify-between mt-3">
                                    <dl v-for="(item, index) in [
                                        { label: '誕生日', value: '2006/04/04' },
                                        { label: '好きなもの', value: 'インターネット' },
                                        { label: '星 座', value: 'おひつじ座' },
                                        { label: '言語', value: 'Go / Dart' },
                                        { label: '生息地', value: '九州' },
                                    ]" :key="item.label"
                                    class="w-[48%] flex py-4 border-b border-dotted border-gray-400 items-baseline"
                                    :class="{ 'border-t': index < 2 }">
                                        <dt class="w-[36%] md:w-[110px] text-gray-500 text-base font-light tracking-wide">{{ item.label }}</dt>
                                        <dd class="flex-1 text-base font-medium">
                                            <span>{{ item.value }}</span>
                                        </dd>
                                    </dl>
                                </div>
                            </div>

                         </div>
                    </div>
                </div>


                <!-- background pattern -->
                <div class="absolute top-0 left-0 w-full h-full">
                    <div class="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:16px_16px]"></div>
                </div>

            </div>
        </div>
    </main>
</template>

<style scoped>
.animate-marquee {
    animation: marquee 30s linear infinite;
}
@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
}
.dot-overlay::after {
    content: '';
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAEElEQVR4nGP4//9/GgNlAADe/gNkBNkWTgAAAABJRU5ErkJggg==) repeat;
    background-color: rgba(0, 0, 0, 0.1);
    background-color: rgba(0, 0, 0, 0.1);
    pointer-events: none;
}

/* 立ち絵の影: 近い順に濃いピンク → 遠いほど薄くなる */
.character-shadow {
    filter:
        drop-shadow(5px -3px 0 #ff8fb0)
        drop-shadow(10px -5px 0 #ffcada)
        drop-shadow(17px -9px 0 #ffe3ed)
}

.mobile-text-outline {
    color: #fff;
    -webkit-text-stroke: 2px #ff759c;
    text-stroke: 2px #ff759c;
    paint-order: stroke fill;
}
@media (min-width: 768px) {
    .mobile-text-outline {
        -webkit-text-stroke: 0;
        text-stroke: 0;
    }
}
</style>
