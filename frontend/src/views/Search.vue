<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import stockApi from '../api/stock'
import { useStockStore } from '../stores/stock'

const router = useRouter()
const stockStore = useStockStore()
const keyword = ref('')
const results = ref([])
const loading = ref(false)
const searched = ref(false)

let searchTimeout = null

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (!keyword.value.trim()) {
    results.value = []
    searched.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    loading.value = true
    searched.value = true
    try {
      results.value = await stockApi.searchStocks(keyword.value)
    } catch (e) {
      results.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

watch(keyword, handleSearch)

const isExcluded = (stock) => {
  return stock.code.startsWith('688') || stock.code.startsWith('8') || stock.code.startsWith('4')
}

const getExchangeName = (code) => {
  if (code.startsWith('6')) return '上证'
  if (code.startsWith('0') || code.startsWith('3')) return '深证'
  return '未知'
}
</script>

<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold">🔍 搜索股票</h1>

    <div class="relative">
      <input
        v-model="keyword"
        type="text"
        placeholder="输入股票代码或名称..."
        class="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
      />
      <span v-if="loading" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
        ⏳
      </span>
    </div>

    <div v-if="!searched" class="text-center py-12 text-gray-400">
      <div class="text-4xl mb-2">🔎</div>
      <p>输入股票代码或名称搜索</p>
      <p class="text-sm mt-1">支持主板和创业板股票</p>
    </div>

    <div v-else-if="results.length === 0 && !loading" class="text-center py-12 text-gray-400">
      <div class="text-4xl mb-2">📭</div>
      <p>未找到相关股票</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="stock in results"
        :key="stock.code"
        :class="[
          'bg-white rounded-xl p-4 shadow-sm transition-shadow',
          isExcluded(stock) ? 'opacity-50' : 'cursor-pointer hover:shadow-md'
        ]"
        @click="!isExcluded(stock) && router.push(`/stock/${stock.code}`)"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold">{{ stock.name }}</span>
              <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">{{ stock.code }}</span>
              <span class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {{ getExchangeName(stock.code) }}
              </span>
            </div>
            <p class="text-xs text-gray-500">{{ stock.industry || '未知行业' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="isExcluded(stock)" class="text-xs text-red-500">
              暂不支持
            </span>
            <button
              v-else
              @click.stop="stockStore.isInMyStocks(stock.code) ? stockStore.removeStock(stock.code) : stockStore.addStock(stock)"
              :class="[
                'px-3 py-1 rounded-full text-xs transition-colors',
                stockStore.isInMyStocks(stock.code)
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              ]"
            >
              {{ stockStore.isInMyStocks(stock.code) ? '⭐ 已关注' : '+ 加自选' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
