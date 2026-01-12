<script setup>
const props = defineProps({
  items: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(item =>
        typeof item.id === 'string' &&
        typeof item.text === 'string' &&
        typeof item.level === 'number'
      );
    }
  },
  title: {
    type: String,
    default: "目次"
  }
});

const isOpen = ref(props.items.length > 0);
const expandedSections = ref({});

// 初期化時にすべてのセクションを展開状態にする
const initializeExpandedSections = () => {
  const expanded = {};
  props.items.forEach(item => {
    if (item.level === 1) {
      expanded[item.id] = true;
    }
  });
  expandedSections.value = expanded;
};

// ネストされた構造に変換
const nestedItems = computed(() => {
  const result = [];
  const stack = [];
  let counter = { 1: 0, 2: 0, 3: 0 };

  props.items.forEach(item => {
    // 現在のレベルのカウンターをインクリメント
    counter[item.level] = (counter[item.level] || 0) + 1;

    // より下位のレベルのカウンターをリセット
    for (let i = item.level + 1; i <= 3; i++) {
      counter[i] = 0;
    }

    // 階層的な番号を生成
    let hierarchicalNumber = '';
    if (item.level === 1) {
      hierarchicalNumber = counter[1].toString();
    } else if (item.level === 2) {
      hierarchicalNumber = `${counter[1]}.${counter[2]}`;
    } else if (item.level === 3) {
      hierarchicalNumber = `${counter[1]}.${counter[2]}.${counter[3]}`;
    }

    const newItem = {
      ...item,
      children: [],
      counter: hierarchicalNumber
    };

    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      result.push(newItem);
    } else {
      stack[stack.length - 1].children.push(newItem);
    }

    stack.push(newItem);
  });

  return result;
});

// セクションの展開/折りたたみを切り替える
function toggleSection(itemId) {
  expandedSections.value = {
    ...expandedSections.value,
    [itemId]: !expandedSections.value[itemId]
  };
}

// セクションが展開されているかどうか
function isExpanded(itemId) {
  return !!expandedSections.value[itemId];
}

// コンポーネントがマウントされた時に初期化
onMounted(() => {
  initializeExpandedSections();
});
</script>

<template>
  <nav class="w-full max-w-6xl rounded-lg border border-gray-100 bg-gray-50/50 p-6" aria-label="目次">
    <div class="space-y-4">
      <div class="flex items-center justify-between w-full border-b border-gray-200 pb-3">
        <div class="flex items-center justify-center gap-3">
            <div class="p-1.5 rounded-md text-primary bg-white/50 size-8 flex items-center justify-center">
                <Icon name="lucide:list" class="size-6" />
            </div>
          <h2 class="text-sm font-bold text-gray-700 tracking-wide uppercase">{{ title }}</h2>
        </div>
        <button 
            class="text-gray-400 hover:text-gray-600 transition-colors p-1 flex items-center justify-center aspect-square size-8 rounded-md border-none hover:bg-gray-100" 
            @click="isOpen = !isOpen"
            :aria-expanded="isOpen"
        >
          <Icon :name="isOpen ? 'lucide:minus' : 'lucide:plus'" class="h-4 w-4" />
          <span class="sr-only">{{ isOpen ? "目次の折りたたみ" : "目次の展開" }}</span>
        </button>
      </div>

      <Transition v-if="nestedItems.length > 0" name="toc-fade">
        <ol v-show="isOpen" class="space-y-1 list-none m-0 p-0">
          <li v-for="item in nestedItems" :key="item.id">
            <div class="flex items-center justify-center group">
                <button 
                    v-if="item.children.length" 
                    @click="toggleSection(item.id)" 
                    class="flex items-center justify-center size-6 mr-0.5 mt-[1px] rounded hover:bg-black/5 cursor-pointer border-none bg-transparent"
                    :aria-label="isExpanded(item.id) ? '目次の折りたたみ' : '目次の展開'"
                    :aria-expanded="isExpanded(item.id)"
                >
                  <Icon 
                    name="lucide:chevron-right" 
                    class="h-3.5 w-3.5 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-90': isExpanded(item.id) }" 
                  />
                </button>
                <span v-else class="w-6 shrink-0"></span> <!-- Spacer for alignment -->
                
                <NuxtLink :to="`#${item.id}`" class="block flex-1 py-1.5">
                  <span class="font-mono text-xs text-gray-400 mr-2 group-hover:text-primary transition-colors">{{ item.counter }}</span>
                  <span class="text-sm text-gray-700 group-hover:text-gray-900 group-hover:text-primary group-hover:underline decoration-1 decoration-primary underline-offset-4 transition-all">{{ item.text }}</span>
                </NuxtLink>
            </div>

            <!-- セクション子項目 -->
            <Transition name="toc-expand">
                <ol v-if="item.children.length && isExpanded(item.id)" class="pl-2 ml-3 border-l border-gray-200/60 my-1 space-y-1 list-none">
                  <li v-for="child in item.children" :key="child.id">
                    <div class="flex items-center justify-center group pl-4">
                        <NuxtLink :to="`#${child.id}`" class="block flex-1 py-1">
                            <span class="font-mono text-[10px] text-gray-300 mr-2 group-hover:text-primary transition-colors">{{ child.counter }}</span>
                            <span class="text-sm text-gray-600 group-hover:text-gray-900 group-hover:text-primary group-hover:underline decoration-1 decoration-primary underline-offset-4 transition-all">{{ child.text }}</span>
                        </NuxtLink>
                    </div>

                    <!-- 孫項目 -->
                    <Transition name="toc-expand">
                      <ol v-if="child.children.length" class="pl-2 ml-3 border-l border-gray-200/60 my-1 space-y-1 list-none">
                        <li v-for="grandChild in child.children" :key="grandChild.id">
                          <div class="flex items-center justify-center group pl-4">
                            <NuxtLink :to="`#${grandChild.id}`" class="block flex-1 py-1">
                                <span class="font-mono text-[10px] text-gray-300 mr-2 group-hover:text-primary transition-colors">{{ grandChild.counter }}</span>
                                <span class="text-xs text-gray-500 group-hover:text-gray-800 transition-colors">{{ grandChild.text }}</span>
                            </NuxtLink>
                          </div>
                        </li>
                      </ol>
                    </Transition>
                  </li>
                </ol>
            </Transition>
          </li>
        </ol>
      </Transition>

      <Transition v-else name="toc-fade">
        <div v-show="isOpen" class="flex items-center justify-center py-8 opacity-50">
          <p class="text-sm text-gray-400">目次はありません</p>
        </div>
      </Transition>
    </div>
  </nav>
</template>

<style scoped>
/* アニメーション用のスタイル */
.toc-fade-enter-active,
.toc-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.toc-fade-enter-from,
.toc-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.toc-expand-enter-active,
.toc-expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: 1000px;
  opacity: 1;
}

.toc-expand-enter-from,
.toc-expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
}
</style>
