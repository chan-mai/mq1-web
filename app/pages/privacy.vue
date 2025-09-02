<script setup lang="ts">
const config = useWebConfig();
const pageTitle = `プライバシーポリシー - ${config.value.siteName}`;
const pageDescription = config.value.siteDescription;
const pageUrl = config.value.siteUrl;

useHead({
    title: pageTitle,
    meta: [
        { property: 'og:title', content: pageTitle },
        { property: 'og:description', content: pageDescription },
        { property: 'og:image', content: `${config.value.baseOgpUrl}` },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: pageUrl },
        { property: 'og:site_name', content: config.value.siteName },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'description', content: pageDescription },
    ],
});
</script>
<template>
  <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
    <h1 class="text-3xl md:text-4xl mb-8">プライバシーポリシー</h1>
    
    <p class="mb-6 leading-relaxed">
      mq1.dev（以下「本サイト」といいます）は、利用するお客さまから収集する個人情報の取り扱いについて、以下の通りプライバシーポリシー（以下「本プライバシーポリシー」といいます）を定めます。
    </p>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">基本方針</h2>
      <p class="mb-4 leading-relaxed">
        本サイトは、円滑な運営に必要な範囲で、お客さまの個人情報を収集しております。収集した個人情報は、利用目的の範囲内で適切に取り扱います。
        また、個人情報の取り扱いに関する運用状況を適宜見直し、改善を図ってまいります。
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">適用範囲</h2>
      <p class="mb-4 leading-relaxed">
        本プライバシーポリシーは、お客さまが本サイトを利用しているときにのみ適用されます。第三者が運営するサービスには適用されません。
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">個人情報の収集範囲</h2>
      <p class="mb-4 leading-relaxed">
        本サイトは、お客さまが利用している情報端末に関する情報や Cookie（お客さまが利用している情報端末とウェブサイトとの間で、利用者を識別するためにやり取りされる情報のこと）を自動的に収集します。
        これには第三者が収集するものを含みますが、個人を特定できる情報は含まれておりません。第三者が収集するものにつきましては本プライバシーポリシー内の「アクセス解析ツールについて」をご覧ください。
      </p>
      <p class="mb-4 leading-relaxed">
        また、お客さまからのお問い合わせを通じてお客さまの会社名、氏名、メールアドレス、ソーシャル・ネットワーキング・サービスのアカウント情報、お問い合わせ内容を収集いたします。
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">個人情報の利用目的</h2>
      <p class="mb-4 leading-relaxed">当方は、本サイトを通じてお客さまから収集した個人情報を、以下の目的で利用いたします。</p>
      <ul class="list-disc pl-6 mb-4 space-y-2 leading-relaxed">
        <li>お客さまに本サイトをご提供するため</li>
        <li>本サイトに関していただいたお問い合わせに回答するため</li>
        <li>本サイトの改善およびご利用状況を調査、分析するため</li>
      </ul>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">個人情報の利用及び提供の制限</h2>
      <p class="mb-4 leading-relaxed">
        当方は、お客さまの許諾がない限り、本プライバシーポリシー内の「個人情報の利用目的」に記載した目的以外で収集した個人情報を利用することはありません。
        また、法令に基づく開示要請があった場合、不正アクセス・脅迫等の違法行為があった場合、その他特別の理由のある場合を除き、収集した個人情報を本プライバシーポリシーの「個人情報の利用目的」に記載した目的以外で第三者に提供することはありません。
        ただし、個人を特定できる情報を含まない、統計的に処理された本サイトの利用状況については公表することがあります。
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">個人情報の開示</h2>
      <p class="mb-4 leading-relaxed">
        お客さまが、当方が保有する個人情報の開示・訂正・削除をご希望される場合には、ご本人であることを確認した上で対応させていただきます。
        ご希望される場合はお問い合わせください。
      </p>
    </section>

    <section class="mb-8">
      <h2 class="text-2xl mb-4 pb-2 border-b border-gray-200">アクセス解析ツールについて</h2>
      <p class="mb-4 leading-relaxed">
        本サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
        この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は<NuxtLink class="text-primary font-semibold underline" to="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank">Google アナリティクス利用規約</NuxtLink>や<NuxtLink class="text-primary font-semibold underline" to="https://policies.google.com/technologies/ads?hl=ja" target="_blank">Google ポリシーと規約</NuxtLink>をご覧ください。
      </p>
    </section>
  </div>
</template>