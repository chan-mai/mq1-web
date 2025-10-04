<script setup lang="ts">
import { Avatar } from '@boringer-avatars/vue3';

definePageMeta({
  middleware: 'admin',
  layout: 'admin'
});

// メタタグ設定
useHead({
  title: '管理画面 - ダッシュボード',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// ユーザーセッション情報
const { user } = useUserSession();

</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ヘッダー -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">ダッシュボード</h1>
        <p class="text-gray-600">サイトの管理概要を確認できます</p>
      </div>

      <!-- ようこそメッセージ -->
      <div v-if="user" class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div class="flex items-center gap-4">
          <NuxtImg
            :src="user.avatarUrl"
            alt="ユーザー画像"
            class="w-12 h-12 rounded-full"
          />
          <div>
            <h2 class="text-xl font-bold text-gray-900">ようこそ、{{ user.username }}さん</h2>
            <p class="text-gray-600">管理画面へようこそ。</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
