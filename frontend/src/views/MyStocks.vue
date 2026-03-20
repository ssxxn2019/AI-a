<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStockStore } from '../stores/stock'

const router = useRouter()
const stockStore = useStockStore()

const stocks = computed(() => stockStore.myStocks)

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">⭐ 我的自选股</h1>
      <button
        @click="router.push('/search')"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
      >
        + 添加自选
      </button>
    </div>

    <div v-if="stocks.length === 0" class="text-center py-16 bg-white rounded-xl">
      <div class="text-6xl mb-4">📋</div>
      <p class="text-gray-500 mb-4">暂无自选股票</p>
      <button
        @click="router.push('/recommend')"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        去添加
      </button>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="stock in stocks"
        :key="stock.code"
        class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="router.push(`/stock/${stock.code}`)"
      >
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold">{{ stock.name }}</span>
              <span class="text-xs bg-gray-100 px-2 py-0.5 rounded">{{ stock.code }}</span>
            </div>
            <p class="text-xs text-gray-400">添加于 {{ formatDate(stock.addedAt) }}</p>
          </div>
          <button
            @click.stop="stockStore.removeStock(stock.code)"
            class="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
      <p class="text-blue-800">
        💡 提示：自选股数据保存在本地浏览器中，更换设备后需要重新添加。
      </p>
    </div>
  </div>
</template>
