<script setup lang="ts">
definePageMeta({
  layout: 'admin'
});

const { loggedIn } = useUserSession();

// すでにログイン済みの場合はリダイレクト
onMounted(() => {
    if (loggedIn.value) {
        const redirect = useCookie('redirect');
        const to = redirect.value || '/admin/dashboard';
        redirect.value = null;
        navigateTo(to);
    }
});

async function handleSignIn() {
    await navigateTo('/api/admin/auth/callback/github', { external: true });
}
</script>

<template>
    <!-- GitHubでログイン -->
    <div class="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
            <div>
                <h2 class="text-center text-3xl font-bold text-gray-900">管理画面ログイン</h2>
                <p class="mt-2 text-center text-sm text-gray-600">GitHubアカウントでログインしてください</p>
            </div>
            <button 
                @click="handleSignIn"
                class="w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
                <Icon name="mdi:github" class="w-5 h-5" />
                GitHubでログイン
            </button>
        </div>
    </div>
</template>