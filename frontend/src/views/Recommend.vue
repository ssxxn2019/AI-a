<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import stockApi from '../api/stock'
import { useStockStore } from '../stores/stock'

const router = useRouter()
const stockStore = useStockStore()
const stocks = ref([])
const loading = ref(true)
const error = ref(null)
const lastUpdate = ref('')
const filterInfo = ref({ maxPrice: 20 })

const getRiskClass = (risk) => {
  switch (risk) {
    case '低': return 'bg-green-100 text-green-700'
    case '中': return 'bg-yellow-100 text-yellow-700'
    case '高': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const formatChange = (change) => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
}

const getChangeClass = (change) => {
  return change >= 0 ? 'text-red-500' : 'text-green-500'
}

const toggleMyStock = (stock, e) => {
  e.stopPropagation()
  if (stockStore.isInMyStocks(stock.code)) {
    stockStore.removeStock(stock.code)
  } else {
    stockStore.addStock(stock)
  }
}

const fetchRecommendations = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await stockApi.getRecommendedStocks(filterInfo.value.maxPrice)
    stocks.value = data.stocks || []
    lastUpdate.value = data.updateTime || new Date().toLocaleTimeString()
    if (data.filter) {
      filterInfo.value = data.filter
    }
  } catch (e) {
    error.value = '获取推荐失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(fetchRecommendations)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold">🎯 智能选股推荐</h1>
        <p class="text-xs text-gray-500 mt-1">
          更新时间: {{ lastUpdate }} | 股价 ≤ {{ filterInfo.maxPrice }}元 | 排除科创板/ST
        </p>
      </div>
      <button
        @click="loading = true; error = null; $router.go(0)"
        class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200"
      >
        🔄 刷新
      </button>
    </div>

    <div v-if="loading" class="text-center py-16 text-gray-500">
      <div class="text-4xl mb-2">⏳</div>
      <p>正在分析市场数据，请稍候...</p>
    </div>

    <div v-else-if="error" class="text-center py-16 text-red-500">
      <div class="text-4xl mb-2">❌</div>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="stocks.length === 0" class="text-center py-16 text-gray-500">
      <div class="text-4xl mb-2">📭</div>
      <p>暂无符合条件的股票</p>
      <p class="text-sm mt-1">市场条件不佳时，策略会更为保守</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="stock in stocks"
        :key="stock.code"
        class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push(`/stock/${stock.code}`)"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-lg">{{ stock.name }}</span>
              <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">{{ stock.code }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded font-medium', getRiskClass(stock.risk)]">
                {{ stock.risk }}风险
              </span>
            </div>
            <div class="text-xs text-gray-500 mb-2">
              {{ stock.industry }} | 流通市值: {{ stock.marketCap }}
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span
                v-for="(reason, idx) in stock.reasons"
                :key="idx"
                class="bg-blue-50 text-blue-700 px-2 py-1 rounded"
              >
                {{ reason }}
              </span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold" :class="getChangeClass(stock.changePercent)">
              {{ formatChange(stock.changePercent) }}
            </div>
            <div class="text-sm text-gray-400">
              现价: {{ stock.price }}
            </div>
            <button
              @click="toggleMyStock(stock, $event)"
              :class="[
                'mt-2 px-3 py-1 rounded-full text-xs transition-colors',
                stockStore.isInMyStocks(stock.code)
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
            >
              {{ stockStore.isInMyStocks(stock.code) ? '⭐ 已关注' : '+ 加自选' }}
            </button>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-4 text-xs">
          <div>
            <span class="text-gray-400">买入区间</span>
            <div class="font-medium">{{ stock.buyRange }}</div>
          </div>
          <div>
            <span class="text-gray-400">止盈价</span>
            <div class="font-medium text-green-600">{{ stock.targetProfit }}</div>
          </div>
          <div>
            <span class="text-gray-400">止损价</span>
            <div class="font-medium text-red-600">{{ stock.stopLoss }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm">
      <div class="flex items-start gap-2">
        <span class="text-xl">💡</span>
        <div>
          <p class="font-semibold text-yellow-800">温馨提示</p>
          <p class="text-yellow-700 mt-1">
            推荐仅供参考，不构成投资建议。短线交易风险极高，请务必设置止盈止损，仓位控制在3成以内。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
