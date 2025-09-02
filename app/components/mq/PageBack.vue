<template>
    <Button @click="$router.back()" class="inline-flex items-center gap-x-1 text-sm text-gray-800 hover:text-primary" >
        <svg class="flex-shrink-0 w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
        前のページへ戻る
    </Button>
</template>