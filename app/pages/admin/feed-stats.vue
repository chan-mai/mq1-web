<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
  ssr: false
});

const { hasPermission } = useAdminPermissions();

interface ReaderStat {
  readerType: string;
  count: number;
  percentage: string;
}

interface DailyStat {
  date: Date;
  count: number;
}

interface HourlyStat {
  hour: number;
  count: number;
}

interface RecentAccess {
  readerType: string;
  ipAddress: string;
  accessedAt: Date;
}

interface FeedStats {
  period: string;
  startDate: Date;
  summary: {
    totalAccess: number;
    uniqueSubscribers: number;
    activeSubscribers: number;
  };
  readerStats: ReaderStat[];
  dailyStats: DailyStat[];
  hourlyStats: HourlyStat[];
  recentAccess: RecentAccess[];
}

// メタタグ設定
useHead({
  title: 'Admin Console - フィード統計',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' }
  ]
});

// 状態管理
const stats = ref<FeedStats | null>(null);
const isLoading = ref<boolean>(false);
const error = ref<string | null>(null);
const selectedPeriod = ref<string>('week');

// 統計データを取得
const fetchStats = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const { data, error: fetchError } = await useFetch<FeedStats>(
      `/api/admin/feed/stats?period=${selectedPeriod.value}`,
      { server: false }
    );
    
    if (fetchError.value) {
      throw fetchError.value;
    }
    
    stats.value = data.value;
  } catch (err: any) {
    console.error('Error fetching feed stats:', err);
    error.value = err.message || 'フィード統計の取得に失敗しました';
  } finally {
    isLoading.value = false;
  }
};

// 期間選択時
const onPeriodChange = () => {
  fetchStats();
};

// 初期読み込み
onMounted(() => {
  fetchStats();
});

// 日付フォーマット
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
};

// 日時フォーマット
const formatDateTime = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleString('ja-JP', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// UTC時間をJSTに変換
const convertToJST = (utcHour: number): number => {
  return (utcHour + 9) % 24;
};

// JST時間帯別統計（時間帯別アクセス分布用）
const jstHourlyStats = computed(() => {
  if (!stats.value?.hourlyStats) return [];
  
  // UTCからJSTに変換
  const jstStats = stats.value.hourlyStats.map(stat => ({
    hour: convertToJST(stat.hour),
    count: stat.count
  }));
  
  // 同じJST時間のデータがある場合は合計
  const aggregated = new Map<number, number>();
  jstStats.forEach(stat => {
    const current = aggregated.get(stat.hour) || 0;
    aggregated.set(stat.hour, current + stat.count);
  });
  
  // 0-23時の配列を作成
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: aggregated.get(hour) || 0
  }));
});

// 最大値を取得（グラフ表示用）
const maxDailyCount = computed(() => {
  if (!stats.value?.dailyStats.length) return 0;
  return Math.max(...stats.value.dailyStats.map(s => s.count));
});

const maxHourlyCount = computed(() => {
  if (!jstHourlyStats.value.length) return 0;
  return Math.max(...jstHourlyStats.value.map(s => s.count));
});

const maxReaderCount = computed(() => {
  if (!stats.value?.readerStats.length) return 0;
  return Math.max(...stats.value.readerStats.map(s => s.count));
});

// アクセス推移のタイトル（時間別 or 日別）
const accessTrendTitle = computed(() => {
  return selectedPeriod.value === 'day' 
    ? `時間別アクセス推移`
    : `日別アクセス推移`;
});

// 時間フォーマット（0時、1時、...）
const formatHour = (hour: number) => {
  return `${hour}時`;
};

// ソート済み時間別統計（JST）
const sortedHourlyStats = computed(() => {
  return jstHourlyStats.value.filter(stat => stat.count > 0);
});

// リーダー種類の色（primary/accentの濃淡を使用）
const getReaderColor = (readerType: string) => {
  const colors: { [key: string]: string } = {
    'Feedly': 'bg-primary',
    'Inoreader': 'bg-accent',
    'Browser': 'bg-primary/80',
    'Bot': 'bg-gray-400',
    'RSS Bot': 'bg-accent/80',
    'Unknown': 'bg-gray-300',
    'Other': 'bg-primary/60',
  };
  return colors[readerType] || 'bg-primary';
};
</script>

<template>
  <div class="py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- ヘッダー -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl text-gray-900 mb-2">フィード統計</h1>
          <p class="text-gray-600">RSSフィードの購読状況とアクセストレンドを確認できます</p>
        </div>
        
        <!-- 期間選択 -->
        <div class="flex items-center gap-2">
          <label for="period" class="text-sm text-gray-600">期間:</label>
          <select
            id="period"
            v-model="selectedPeriod"
            @change="onPeriodChange"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="day">過去24時間</option>
            <option value="week">過去7日間</option>
            <option value="month">過去30日間</option>
            <option value="year">過去1年間</option>
            <option value="all">全期間</option>
          </select>
        </div>
      </div>

      <!-- 権限チェック -->
      <div v-if="!hasPermission('FEED_STATS_VIEW')" class="bg-red-50 border border-red-200 rounded-xl p-6">
        <p class="text-red-800">フィード統計を表示する権限がありません。</p>
      </div>

      <!-- エラー表示 -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6">
        <p class="text-red-800">{{ error }}</p>
      </div>

      <!-- ローディング -->
      <div v-else-if="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>

      <!-- 統計データ表示 -->
      <div v-else-if="stats">
        <!-- サマリーカード -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <!-- 総アクセス数 -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">総アクセス数</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.totalAccess.toLocaleString() }}</p>
              </div>
              <div class="p-3 bg-primary/10 rounded-lg">
                <Icon name="material-symbols:rss-feed" class="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <!-- ユニーク購読者数 -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">ユニーク購読者</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.uniqueSubscribers.toLocaleString() }}</p>
              </div>
              <div class="p-3 bg-accent/10 rounded-lg">
                <Icon name="material-symbols:person" class="w-8 h-8 text-accent" />
              </div>
            </div>
          </div>

          <!-- アクティブ購読者数 -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 mb-1">アクティブ購読者</p>
                <p class="text-3xl font-bold text-gray-900">{{ stats.summary.activeSubscribers.toLocaleString() }}</p>
              </div>
              <div class="p-3 bg-primary/20 rounded-lg">
                <Icon name="material-symbols:trending-up" class="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>
        </div>

        <!-- リーダーの種類別統計 -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">RSSリーダーの種類</h2>
          <div class="space-y-3">
            <div v-for="reader in stats.readerStats" :key="reader.readerType" class="flex items-center gap-4">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-sm font-medium text-gray-700">{{ reader.readerType }}</span>
                  <span class="text-sm text-gray-600">{{ reader.count }} ({{ reader.percentage }}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    :class="getReaderColor(reader.readerType)" 
                    class="h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${(reader.count / maxReaderCount) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- アクセス推移統計（日別 or 時間別） -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ accessTrendTitle }}</h2>
          
          <!-- 過去24時間の場合：時間別表示 -->
          <div v-if="selectedPeriod === 'day'" class="space-y-2">
            <div v-for="hourStat in sortedHourlyStats" :key="hourStat.hour" class="flex items-center gap-4">
              <div class="w-24 text-sm text-gray-600">{{ formatHour(hourStat.hour) }}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-6">
                    <div 
                      class="bg-primary h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${maxHourlyCount > 0 ? (hourStat.count / maxHourlyCount) * 100 : 0}%`, minWidth: '30px' }"
                    >
                      <span class="text-xs font-medium text-white">{{ hourStat.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!sortedHourlyStats.length" class="text-center py-4 text-gray-500">
              データがありません
            </div>
          </div>
          
          <!-- それ以外の期間：日別表示 -->
          <div v-else class="space-y-2">
            <div v-for="day in stats.dailyStats" :key="day.date.toString()" class="flex items-center gap-4">
              <div class="w-24 text-sm text-gray-600">{{ formatDate(day.date) }}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-6">
                    <div 
                      class="bg-primary h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      :style="{ width: `${maxDailyCount > 0 ? (day.count / maxDailyCount) * 100 : 0}%`, minWidth: '30px' }"
                    >
                      <span class="text-xs font-medium text-white">{{ day.count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="!stats.dailyStats.length" class="text-center py-4 text-gray-500">
              データがありません
            </div>
          </div>
        </div>

        <!-- 時間帯別アクセス統計 -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">時間帯別アクセス分布(JST)</h2>
          <div class="grid grid-cols-12 gap-2">
            <div v-for="hourData in jstHourlyStats" :key="hourData.hour" class="flex flex-col items-center">
              <div class="w-full bg-gray-200 rounded-t h-32 flex items-end">
                <div 
                  v-if="hourData.count > 0"
                  class="w-full bg-accent rounded-t transition-all duration-500"
                  :style="{ 
                    height: `${maxHourlyCount > 0 ? (hourData.count / maxHourlyCount) * 100 : 0}%`,
                    minHeight: '4px'
                  }"
                  :title="`${hourData.hour}時: ${hourData.count}アクセス`"
                >
                  <span class="text-[10px] text-white h-4 flex items-center justify-center font-medium mb-1">
                    <span v-if="hourData.count > 0">{{ hourData.count }}</span>
                  </span>
              </div>
              </div>
              <div class="text-xs text-gray-600 mt-1">{{ hourData.hour }}</div>
            </div>
          </div>
        </div>

        <!-- 最近のアクセス -->
        <div class="bg-white rounded-xl border border-gray-200 p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">最近のアクセス（上位10件）</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">リーダー種類</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">IPアドレス</th>
                  <th class="text-left py-3 px-4 text-sm font-medium text-gray-700">アクセス日時</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(access, index) in stats.recentAccess" :key="index" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {{ access.readerType }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-sm text-gray-700 font-mono">{{ access.ipAddress }}</td>
                  <td class="py-3 px-4 text-sm text-gray-700">{{ formatDateTime(access.accessedAt) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-if="!stats.recentAccess.length" class="text-center py-4 text-gray-500">
              データがありません
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

