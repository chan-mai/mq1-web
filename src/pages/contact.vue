<script setup lang="ts">
const type = {
    "question": "質問",
    "work": "お仕事",
    "etc": "その他",
}

const formState = reactive({
    name: "",
    contact: "",
    subject: "",
    message: "",
    contactType: "etc",
    token: "",
})

const handleSubmit = async () => {

    try {
        // /api/push-contactにPOSTリクエストを送信
        await $fetch("/api/push-contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: formState.name,
                contact: formState.contact,
                subject: formState.subject,
                message: formState.message,
                contactType: formState.contactType,
                token: formState.token,
            }),
        });
    } catch (error) {
        console.error(error);
        alert("送信に失敗しました。");
        return;
    }

    // 送信処理
    alert("メッセージを送信しました！")
    formState.name = "";
    formState.contact = "";
    formState.subject = "";
    formState.message = "";
    formState.contactType = "etc";
}
</script>
<template>
    <div class="min-h-screen overflow-hidden mt-5 md:mt-10">
        <div class="container mx-auto md:px-4">
            <div class="md:max-w-3xl mx-auto bg-white rounded-xl overflow-hidden py-10">
                <div class="text-center mb-10">
                    <h1 class="text-3xl font-medium text-primary mb-3">お問い合わせ</h1>
                    <p class="text-gray-600">
                        お気軽にお問い合わせください。
                    </p>
                </div>

                <div class="overflow-hidden">
                    <div class="p-4 md:p-8">
                        <form @submit.prevent="handleSubmit()" class="space-y-8 w-full">
                            <!-- 個人情報セクション -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                <div class="w-full">
                                    <label for="name" class="text-primary font-medium text-sm block mb-1.5">
                                        お名前<span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input id="name" name="name" v-model="formState.name" required placeholder="@hanako"
                                        class="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-2 focus:border-primary outline-none forcus:outline-none transition-all duration-200" />
                                </div>

                                <div class="w-full">
                                    <label for="contact" class="text-primary font-medium text-sm block mb-1.5">
                                        連絡先<span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input id="contact" name="contact" type="text" v-model="formState.contact" required
                                        placeholder="hana.c0@example.com, @hanako, ..."
                                        class="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-2 focus:border-primary outline-none forcus:outline-none transition-all duration-200" />
                                    <p class="text-gray-500 text-xs mt-1">メールアドレス、Twitter ID、Fediverseアカウントなど、ご希望の連絡方法をご記入ください。</p>
                                </div>
                            </div>

                            <!-- お問い合わせ内容セクション -->
                            <div class="space-y-6 w-full">
                                <div class="w-full">
                                    <label class="text-primary font-medium text-sm block mb-2">
                                        お問い合わせ種類<span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <div class="flex flex-col sm:flex-row w-full gap-2 sm:gap-4">
                                        <div v-for="(text, key) in type" :key="key" @click="formState.contactType = key"
                                            :class="[
                                                'flex items-center p-3 border rounded-md transition-colors cursor-pointer w-full',
                                                formState.contactType === key
                                                    ? 'bg-primary/10 border-primary border-2 shadow-sm'
                                                    : 'hover:bg-gray-50'
                                            ]">
                                            <input type="radio" :id="key" :value="key" v-model="formState.contactType" required
                                                class="text-primary accent-rose-500 border-primary focus:ring-accent" />
                                            <label :for="key" class="cursor-pointer text-gray-700 text-sm ml-2 flex-1">
                                                {{ text }}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div class="w-full">
                                    <label for="subject" class="text-primary font-medium text-sm block mb-1.5">
                                        件名<span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <input id="subject" name="subject" v-model="formState.subject"
                                        placeholder="お問い合わせの件名"
                                        class="w-full px-4 py-2.5 rounded-md border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-2 focus:border-primary outline-none forcus:outline-none transition-all duration-200" required/>
                                </div>

                                <div class="w-full">
                                    <label for="message" class="text-primary font-medium text-sm block mb-1.5">
                                        メッセージ<span class="text-red-500 ml-1">*</span>
                                    </label>
                                    <textarea id="message" name="message" v-model="formState.message"
                                        placeholder="メッセージを入力してください"
                                        class="w-full min-h-[180px] px-4 py-2.5 rounded-md border border-gray-200 focus:ring-4 focus:ring-primary/20 focus:border-2 focus:border-primary outline-none forcus:outline-none transition-all duration-200" required />
                                </div>
                            </div>

                            <div class="w-full">
                                <NuxtTurnstile v-model="formState.token" /> 
                                <button type="submit"
                                    class="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-md transition-all duration-200 flex items-center justify-center font-medium shadow-sm hover:shadow">
                                    <Icon name="lucide:send" class="mr-2 size-5 opacity-90" />
                                    送信する
                                </button>

                                <div class="mt-5 text-center text-gray-500 text-sm">
                                    <p>通常2-3日以内に返信いたします</p>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
