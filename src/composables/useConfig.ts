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
      { title: "運営者情報", url: "/about" },
      { title: "お問い合わせ", url: "/contact" },
      { title: "記事一覧", url: "/articles" },
    ],
    footer: {
      menu: [
        { title: "トップ", url: "/" },
        { title: '記事一覧', url: '/articles' },
        { title: '運営者情報', url: '/about' },
        { title: "プライバシーポリシー", url: "/privacy" },
        { title: 'お問い合わせ', url: '/contact' },
      ],
    },
    socials: {
      misskey: {
        name: "Misskey",
        url: "https://shahu.ski/@mai_llj",
        icon: "simple-icons:misskey",
        color: "lime-400",
      },
      github: {
        name: "GitHub",
        url: "https://github.com/chan-mai",
        icon: "simple-icons:github",
        color: "gray-900",
      },
      twitter: {
        name: "Twitter",
        url: "https://twitter.com/mai_llj",
        icon: "simple-icons:twitter",
        color: "sky-500",
      },
      qiita: {
        name: "Qiita",
        url: "https://qiita.com/mai_llj",
        icon: "simple-icons:qiita",
        color: "green-500",
      },
    },
    rss: {
      name: "RSS",
      url: `https://mq1.dev/feed.xml`,
      icon: "line-md:rss",
    },
  }));
};
