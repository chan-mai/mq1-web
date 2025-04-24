export const useWebConfig = () => {
  const runtimeConfig = useRuntimeConfig();
  return computed(() => ({
    siteUrl: runtimeConfig.public.siteUrl as string,
    baseOgpUrl: runtimeConfig.public.siteOgpUrl as string,
    siteName: runtimeConfig.public.siteName as string,
    siteDescription: runtimeConfig.public.siteDescription as string,

    themeColor: "#fc9fa8",

    headerMenu: [
      { title: "トップ", url: "/" },
      { title: "運営者情報", url: "https://chan-mai.dev/" },
      { title: "記事一覧", url: "/articles" },
    ],
    footer: {
      menu: [
        { title: "トップ", url: "/" },
        { title: '記事一覧', url: '/articles' },
        { title: '運営者情報', url: 'https://chan-mai.dev/' },
        { title: 'お問い合わせ', url: 'mailto:chan-mai@mq1.dev' },
      ],
    },
    socials: {
      misskey: {
        name: "Misskey",
        url: "https://shahu.ski/@mai_llj",
      },
      github: {
        name: "GitHub",
        url: "https://github.com/chan-mai",
      },
      twitter: {
        name: "Twitter",
        url: "https://twitter.com/mai_llj",
      },
      qiita: {
        name: "Qiita",
        url: "https://qiita.com/mai_llj",
      },
      rss: {
        name: "RSS",
        url: `https://mq1.dev/feed.xml`,
      },
    },
  }));
};
