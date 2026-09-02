interface Social {
  name: string;
  url: string;
  icon: string;
  color: string;
  isFixed?: boolean;
}

interface Work {
  title: string;
  description: string;
  url: string;
  image?: string;
  tags: string[];
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
  works: Work[];
}

export const useWebConfig = (): ComputedRef<WebConfig> => {
  const runtimeConfig = useRuntimeConfig();
  return computed(() => ({
    siteUrl: runtimeConfig.public.siteUrl as string,
    baseOgpUrl: runtimeConfig.public.siteOgpUrl as string,
    siteName: runtimeConfig.public.siteName as string,
    siteDescription: runtimeConfig.public.siteDescription as string,

    themeColor: '#fc9fa8',

    // Author情報
    author: {
      name: 'chan-mai',
      birthDate: '2006-04-04',
      jobTitle: 'Engineer',
      description: '九州に生息する自称フルスタック',
    },

    headerMenu: [
      { title: 'Top', url: '/' },
      { title: 'About', url: '/about' },
      { title: 'Articles', url: '/articles' },
    ],
    footer: {
      menu: [
        { title: 'Top', url: '/' },
        { title: 'Articles', url: '/articles' },
        { title: 'About', url: '/about' },
        { title: 'Privacy', url: '/privacy' },
      ],
    },
    socials: {
      misskey: {
        name: 'Misskey',
        url: 'https://misskey.blue/@mai_llj',
        icon: 'simple-icons:misskey',
        color: '#a3e635',
        isFixed: true,
      },
      github: {
        name: 'GitHub',
        url: 'https://github.com/chan-mai',
        icon: 'simple-icons:github',
        color: '#111827',
        isFixed: true,
      },
      twitter: {
        name: 'Twitter',
        url: 'https://twitter.com/mai_llj',
        icon: 'simple-icons:twitter',
        color: '#0ea5e9',
      },
      qiita: {
        name: 'Qiita',
        url: 'https://qiita.com/mai_llj',
        icon: 'simple-icons:qiita',
        color: '#22c55e',
      },
      zenn: {
        name: 'Zenn',
        url: 'https://zenn.dev/mai_llj',
        icon: 'simple-icons:zenn',
        color: '#3b82f6',
      },
    },
    rss: {
      name: 'RSS',
      url: 'https://mq1.dev/feed.xml',
      icon: 'line-md:rss',
    },

    // Things I Make
    works: [
      {
        title: 'まいの雑記帳',
        description: 'このサイト',
        url: 'https://mq1.dev/',
        tags: [
          'Nuxt',
          'GSAP',
          'Three.js',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
        ],
      },
      {
        title: 'Mewk',
        description: 'Misskeyユーザーのための匿名質問箱',
        url: 'https://mewk.app/',
        tags: [
          'Nuxt',
          'GSAP',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
          'CockroachDB',
        ],
      },
      {
        title: 'Misskey Server List',
        description: '非公式のMisskeyサーバーリスト',
        url: 'https://servers.misskey.ink/',
        tags: [
          'Nuxt',
          'GSAP',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
          'D1',
          'KV',
          'Queues',
        ],
      },
      {
        title: 'h0taru.me',
        description: 'VTuber月影ほたるの公式サイト',
        url: 'https://h0taru.me/',
        tags: [
          'Nuxt',
          'GSAP',
          'Lenis',
          'microCMS',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
        ],
      },
      {
        title: "fuki's website",
        description: 'イラストレーターfukiのWebサイト',
        url: 'https://fuki.foo/',
        tags: [
          'Nuxt',
          'GSAP',
          'Lenis',
          'microCMS',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
        ],
      },
      {
        title: 'Tsumugi',
        description: 'Cloudflareスタック向けジョブ管理システム',
        url: 'https://github.com/chan-mai/Tsumugi',
        tags: [
          'TypeScript',
          'Cloudflare',
          'D1',
          'KV',
          'Queues',
          'Durable Objects',
        ],
      },
      {
        title: 'misskey-backup',
        description: 'MisskeyのDB・Redisバックアップツール',
        url: 'https://github.com/team-shahu/misskey-backup',
        tags: ['Go'],
      },
      {
        title: 'cloudnative-misskey',
        description: 'MisskeyのKubernetes Operator',
        url: 'https://github.com/chan-mai/cloudnative-misskey',
        tags: ['Go', 'Kubernetes', 'Operator'],
      },
      {
        title: 'bucchi.work',
        description: 'MIXED MEDIA ARTIST bucchiのWebサイト',
        url: 'https://bucchi.work/',
        image: '/images/works/bucchi.jpg',
        tags: [
          'Nuxt',
          'GSAP',
          'Lenis',
          'microCMS',
          'Tailwind CSS',
          'TypeScript',
          'Cloudflare',
        ],
      },
    ],
  }));
};
