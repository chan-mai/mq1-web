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
        { name: 'twitter:title', content: pageTitle },
        { name: 'twitter:description', content: pageDescription },
        { name: 'twitter:image', content: `${config.value.baseOgpUrl}` },
        { name: 'description', content: pageDescription },
    ],
});
</script>
<template>
  <div class="min-h-screen pt-[120px] md:pt-[160px] px-6">
    <div class="max-w-4xl mx-auto px-4">
      
      <div class="mb-12">
        <div class="flex items-center gap-3 mb-4">
          <div class="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Icon name="mdi:shield-check" class="w-7 h-7 text-primary" />
          </div>
          <h1 class="text-3xl md:text-5xl text-fg">
            プライバシーポリシー
          </h1>
        </div>
      </div>

      <!-- 導入文 -->
      <div class="mb-10">
        <p class="leading-relaxed text-fg-muted">
          {{ config.siteName }}（以下「本サイト」といいます）は、本サイトを利用するユーザーから収集する個人情報の取り扱いについて、以下の通りプライバシーポリシー（以下「本プライバシーポリシー」といいます）を定めます。
        </p>
      </div>

      
      <div class="space-y-6">
        <!-- 基本方針 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:file-document-check" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">基本方針</h2>
          </div>
          <p class="leading-relaxed text-fg-muted">
            本サイトは、円滑な運営に必要な範囲で、ユーザーの個人情報を収集しております。収集した個人情報は、利用目的の範囲内で適切に取り扱います。
            また、個人情報の取り扱いに関する運用状況を適宜見直し、改善を図ってまいります。
          </p>
        </section>

        <!-- 適用範囲 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:web" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">適用範囲</h2>
          </div>
          <p class="leading-relaxed text-fg-muted">
            本プライバシーポリシーは、ユーザーが本サイトを利用しているときにのみ適用されます。第三者が運営するサービスには適用されません。
          </p>
        </section>

        <!-- 個人情報の収集範囲 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:database" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">個人情報の収集範囲</h2>
          </div>
          <div class="space-y-4">
            <p class="leading-relaxed text-fg-muted">
              本サイトは、ユーザーが利用している情報端末に関する情報や Cookie（ユーザーが利用している情報端末とウェブサイトとの間で、利用者を識別するためにやり取りされる情報のこと）を自動的に収集します。
              これには第三者が収集するものを含みますが、個人を特定できる情報は含まれておりません。第三者が収集するものにつきましては本プライバシーポリシー内の「アクセス解析ツールについて」をご覧ください。
            </p>
            <p class="leading-relaxed text-fg-muted">
              また、ユーザーからのお問い合わせを通じて会社名、氏名、メールアドレス、ソーシャル・ネットワーキング・サービスのアカウント情報、お問い合わせ内容を収集いたします。
            </p>
            <div class="p-4 rounded-xl bg-primary/10 border border-primary">
              <div class="flex items-start gap-3">
                <Icon name="mdi:information" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="font-semibold text-primary mb-2">いいね機能について</p>
                  <p class="text-sm leading-relaxed text-primary">
                    本サイトでは、記事へのいいね機能を提供しております。いいね機能をご利用いただく際、不正利用の防止、スパム対策、および適切なサービス提供のため、ユーザーのIPアドレスを自動的に収集し、データベースに保存いたします。
                    収集したIPアドレスはサービス運営の目的でのみ利用し、一般には公開されません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 個人情報の利用目的 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:target" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">個人情報の利用目的</h2>
          </div>
          <p class="mb-4 leading-relaxed text-fg-muted">当方は、本サイトを通じてユーザーから収集した個人情報を、以下の目的で利用いたします。</p>
          <ul class="space-y-4">
            <li class="flex items-start gap-3 px-3">
              <Icon name="mdi:check-circle" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span class="text-fg-muted">ユーザーに本サイトをご提供するため</span>
            </li>
            <li class="flex items-start gap-3 px-3">
              <Icon name="mdi:check-circle" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span class="text-fg-muted">本サイトに関していただいたお問い合わせに回答するため</span>
            </li>
            <li class="flex items-start gap-3 px-3">
              <Icon name="mdi:check-circle" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span class="text-fg-muted">本サイトの改善およびご利用状況を調査、分析するため</span>
            </li>
            <li class="flex items-start gap-3 px-3">
              <Icon name="mdi:check-circle" class="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <span class="text-fg-muted">いいね機能における不正利用の防止、スパム対策、および適切なサービス運営のため</span>
            </li>
          </ul>
        </section>

        <!-- 個人情報の利用及び提供の制限 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:lock" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">個人情報の利用及び提供の制限</h2>
          </div>
          <p class="leading-relaxed text-fg-muted">
            当方は、ユーザーの許諾がない限り、本プライバシーポリシー内の「個人情報の利用目的」に記載した目的以外で収集した個人情報を利用することはありません。
            また、法令に基づく開示要請があった場合、不正アクセス・脅迫等の違法行為があった場合、その他特別の理由のある場合を除き、収集した個人情報を本プライバシーポリシーの「個人情報の利用目的」に記載した目的以外で第三者に提供することはありません。
            ただし、個人を特定できる情報を含まない、統計的に処理された本サイトの利用状況については公表することがあります。
          </p>
        </section>

        <!-- 個人情報の開示 -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:eye" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">個人情報の開示</h2>
          </div>
          <p class="leading-relaxed text-fg-muted">
            ユーザーが、当方が保有する個人情報の開示・訂正・削除をご希望される場合には、ご本人であることを確認した上で対応させていただきます。
            ご希望される場合はお問い合わせください。
          </p>
        </section>

        <!-- アクセス解析ツールについて -->
        <section class="p-6 md:p-8 rounded-2xl bg-surface-elevated border border-primary">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon name="mdi:chart-line" class="w-5 h-5 text-primary" />
            </div>
            <h2 class="text-2xl md:text-3xl text-primary">アクセス解析ツールについて</h2>
          </div>
          <div class="space-y-4">
            <p class="leading-relaxed text-fg-muted">
              本サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。このGoogleアナリティクスはデータの収集のためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
              この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。この規約に関しての詳細は<NuxtLink class="text-primary underline hover:text-primary/80 transition-colors" to="https://marketingplatform.google.com/about/analytics/terms/jp/" target="_blank">Google アナリティクス利用規約</NuxtLink>や<NuxtLink class="text-primary underline hover:text-primary/80 transition-colors" to="https://policies.google.com/technologies/ads?hl=ja" target="_blank">Google ポリシーと規約</NuxtLink>をご覧ください。
            </p>
            <p class="leading-relaxed text-fg-muted">
              また、本サイトでは、Microsoftによる行動分析ツール「Microsoft Clarity」を使用しています。Microsoft Clarityはヒートマップやセッション録画などの機能を通じて、ユーザーが本サイトをどのように利用しているかを分析するためにCookieを使用しています。このデータは匿名で収集されており、個人を特定するものではありません。
              この機能はCookieを無効にすることで収集を拒否することが出来ますので、お使いのブラウザの設定をご確認ください。詳細については<NuxtLink class="text-primary underline hover:text-primary/80 transition-colors" to="https://privacy.microsoft.com/ja-jp/privacystatement" target="_blank">Microsoft プライバシーに関する声明</NuxtLink>をご覧ください。
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
