<script setup>
import { ref, computed } from 'vue';

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

const isOpen = ref(true);
const expandedSections = ref({});

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
    
    const newItem = { 
      ...item, 
      children: [],
      counter: counter[item.level]
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
</script>

<template>
  <div class="w-full max-w-6xl rounded-lg border bg-card p-4 bg-white toc-container">
    <div class="space-y-2">
      <div class="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 w-full border-b border-gray-200 rounded-lg py-2 px-4">
        <div class="flex items-center gap-2 font-medium">
          <Icon name="lucide:book-open" class="h-4 w-4 text-pink-500" />
          <h2 class="text-gradient">{{ title }}</h2>
        </div>
        <button class="rounded px-2 bg-white rounded-lg" @click="isOpen = !isOpen">
          <Icon name="lucide:chevron-up" v-if="isOpen" class="h-5 w-5 text-purple-500" />
          <Icon name="lucide:chevron-down" v-else class="h-5 w-5 text-purple-500" />
          <span class="sr-only">{{ isOpen ? "Close table of contents" : "Open table of contents" }}</span>
        </button>
      </div>
      
      <!-- メイン目次のアニメーション -->
      <Transition name="toc-fade">
        <div v-show="isOpen" class="toc-tree">
          <template v-for="item in nestedItems" :key="item.id">
            <div class="toc-item">
              <div class="toc-item-content">
                <button 
                  v-if="item.children.length" 
                  @click="toggleSection(item.id)"
                  class="toc-toggle"
                >
                  <Icon 
                    :name="isExpanded(item.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'" 
                    class="h-3 w-3 transition-transform" 
                  />
                </button>
                <span v-else class="toc-indent"></span>
                <a 
                  :href="`#${item.id}`"
                  class="toc-link"
                  :class="{ 'font-medium': item.level === 1 }"
                >
                  <span>{{ item.text }}</span>
                  <span class="toc-decoration">
                    <span class="toc-number">{{ item.counter }}</span>
                  </span>
                </a>
              </div>
              
              <!-- セクション子項目のアニメーション -->
              <Transition name="toc-expand">
                <div v-if="item.children.length && isExpanded(item.id)" class="toc-children">
                  <div 
                    v-for="child in item.children" 
                    :key="child.id"
                    class="toc-item pl-4"
                  >
                    <div class="toc-item-content">
                      <span class="toc-branch"></span>
                      <a 
                        :href="`#${child.id}`"
                        class="toc-link"
                      >
                        <span>{{ child.text }}</span>
                        <span class="toc-decoration">
                          <span class="toc-number">{{ child.counter }}</span>
                        </span>
                      </a>
                    </div>
                    
                    <!-- 孫項目のアニメーション -->
                    <Transition name="toc-expand">
                      <div v-if="child.children.length" class="toc-children pl-4">
                        <div 
                          v-for="grandChild in child.children" 
                          :key="grandChild.id"
                          class="toc-item"
                        >
                          <div class="toc-item-content">
                            <span class="toc-leaf"></span>
                            <a 
                              :href="`#${grandChild.id}`"
                              class="toc-link"
                            >
                              <span>{{ grandChild.text }}</span>
                              <span class="toc-decoration">
                                <span class="toc-number">{{ grandChild.counter }}</span>
                              </span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </Transition>
                  </div>
                </div>
              </Transition>
            </div>
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.toc-container {
  border-color: #f3e8ff;
}

.text-gradient {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 600;
}

.toc-tree {
  margin-left: 0.25rem;
}

.toc-item {
  position: relative;
  margin-bottom: 0.25rem;
}

.toc-item-content {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.toc-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  border-radius: 2px;
  background-color: #f1f5f9;
  cursor: pointer;
}

.toc-toggle:hover {
  background-color: #e2e8f0;
}

.toc-indent {
  width: 12px;
}

.toc-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  line-height: 1.2;
  text-decoration: none;
  color: #374151;
  transition: all 0.15s ease;
}

.toc-link:hover {
  background-color: #fdf2f8;
  text-decoration: underline;
}

.toc-decoration {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 12px;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.toc-link:hover .toc-decoration {
  opacity: 1;
}

.toc-number {
  font-size: 0.75rem;
  background: linear-gradient(to right, #fda4af, #c4b5fd);
  color: white;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toc-children {
  position: relative;
  margin-top: 0.25rem;
}

.toc-children::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 6px;
  width: 1px;
  background: linear-gradient(to bottom, #fda4af, #c4b5fd);
}

.toc-branch::before {
  content: '';
  display: inline-block;
  width: 12px;
  height: 1px;
  background: linear-gradient(to right, #fda4af, #c4b5fd);
  margin-right: 4px;
  vertical-align: middle;
}

.toc-leaf::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fda4af, #c4b5fd);
  margin-right: 6px;
  vertical-align: middle;
}

/* アニメーション用のスタイル追加 */
/* フェードインアニメーション */
.toc-fade-enter-active,
.toc-fade-leave-active {
  transition: opacity 0.3s ease;
}

.toc-fade-enter-from,
.toc-fade-leave-to {
  opacity: 0;
}

/* 展開/折りたたみアニメーション */
.toc-expand-enter-active,
.toc-expand-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.toc-expand-enter-from,
.toc-expand-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-8px);
}

/* アイコン回転アニメーション */
.toc-toggle .lucide-chevron-down {
  transform: rotate(0);
  transition: transform 0.3s ease;
}

.toc-toggle:hover .lucide-chevron-down {
  transform: rotate(180deg);
}

.toc-toggle .lucide-chevron-right {
  transition: transform 0.3s ease;
}

.toc-toggle:hover .lucide-chevron-right {
  transform: rotate(45deg);
}
</style>
