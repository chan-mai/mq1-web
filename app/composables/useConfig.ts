interface Social {
  name: string;
  url: string;
  icon: string;
  color: string;
}

interface WebConfig {
  siteUrl: string;
  baseOgpUrl: string;
  siteName: string;
  siteDescription: string;
  themeColor: string;
  author: {
    name: string;
    birthDate: string;
    jobTitle: string;
    description: string;
  };
  headerMenu: {
    title: string;
    url: string;
  }[];
  footer: {
    menu: {
      title: string;
      url: string;
    }[];
  };
  socials: {
    misskey: Social;
    github: Social;
    twitter: Social;
    qiita: Social;
  };
  rss: {
    name: string;
    url: string;
    icon: string;
  };
}


export const useWebConfig = (): ComputedRef<WebConfig> => {
  const runtimeConfig = useRuntimeConfig();
  return computed(() => ({
    siteUrl: runtimeConfig.public.siteUrl as string,
    baseOgpUrl: runtimeConfig.public.siteOgpUrl as string,
    siteName: runtimeConfig.public.siteName as string,
    siteDescription: runtimeConfig.public.siteDescription as string,

    themeColor: "#fc9fa8",

    // Author情報
    author: {
      name: "chan-mai",
      birthDate: "2006-04-04",
      jobTitle: "Engineer",
      description: "九州に生息する自称フルスタック",
    },

    headerMenu: [
      { title: "Top", url: "/" },
      { title: "About", url: "/about" },
      { title: "Articles", url: "/articles" },
    ],
    footer: {
      menu: [
        { title: "Top", url: "/" },
        { title: "Articles", url: "/articles" },
        { title: "About", url: "/about" },
        { title: "Privacy", url: "/privacy" },
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
