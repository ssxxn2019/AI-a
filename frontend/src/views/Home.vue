<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import stockApi from '../api/stock'

const router = useRouter()
const indices = ref([])
const loading = ref(true)
const error = ref(null)

const formatChange = (change, changePercent) => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
}

const getIndexClass = (change) => {
  return change >= 0 ? 'text-red-500' : 'text-green-500'
}

onMounted(async () => {
  try {
    const data = await stockApi.getIndices()
    indices.value = data
  } catch (e) {
    error.value = '数据加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
      <h1 class="text-2xl font-bold mb-1">📊 今日大盘</h1>
      <p class="text-blue-100 text-sm">开盘时间：周一至周五 9:30 - 15:00</p>
    </div>

    <div v-if="loading" class="text-center py-12 text-gray-500">
      加载中...
    </div>

    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ error }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="index in indices"
        :key="index.code"
        class="bg-white rounded-xl p-4 shadow-sm"
      >
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="font-semibold text-gray-800">{{ index.name }}</h3>
            <p class="text-xs text-gray-400">{{ index.code }}</p>
          </div>
          <span class="text-xs bg-gray-100 px-2 py-1 rounded">{{ index.type }}</span>
        </div>
        <div class="text-2xl font-bold" :class="getIndexClass(index.change)">
          {{ index.current.toFixed(2) }}
        </div>
        <div class="flex items-center gap-2 mt-1" :class="getIndexClass(index.change)">
          <span>{{ formatChange(index.change, index.changePercent) }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">🎯 智能选股</h2>
      </div>
      <p class="text-gray-600 text-sm mb-4">
        基于多因素综合策略（技术面40% + 资金流向35% + 趋势25%），为您筛选当日潜力股票
      </p>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 rounded-lg p-3 text-center">
          <div class="text-xs text-blue-600 mb-1">技术面</div>
          <div class="text-sm font-semibold text-blue-800">权重 40%</div>
        </div>
        <div class="bg-purple-50 rounded-lg p-3 text-center">
          <div class="text-xs text-purple-600 mb-1">资金流向</div>
          <div class="text-sm font-semibold text-purple-800">权重 35%</div>
        </div>
        <div class="bg-green-50 rounded-lg p-3 text-center">
          <div class="text-xs text-green-600 mb-1">趋势分析</div>
          <div class="text-sm font-semibold text-green-800">权重 25%</div>
        </div>
        <div class="bg-orange-50 rounded-lg p-3 text-center">
          <div class="text-xs text-orange-600 mb-1">风险排除</div>
          <div class="text-sm font-semibold text-orange-800">ST/科创</div>
        </div>
      </div>
      <button
        @click="router.push('/recommend')"
        class="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
      >
        🚀 开始智能选股
      </button>
    </div>

    <div class="bg-white rounded-2xl p-6 shadow-sm">
      <h2 class="text-lg font-bold mb-4">📚 新手入门</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer"
          @click="router.push('/help')"
        >
          <div class="text-3xl mb-2">📖</div>
          <h3 class="font-semibold mb-1">术语解释</h3>
          <p class="text-xs text-gray-500">了解MA、MACD、KDJ等基础指标</p>
        </div>
        <div
          class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer"
          @click="router.push('/help')"
        >
          <div class="text-3xl mb-2">⚡</div>
          <h3 class="font-semibold mb-1">短线技巧</h3>
          <p class="text-xs text-gray-500">学习短线交易的基本策略</p>
        </div>
        <div
          class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors cursor-pointer"
          @click="router.push('/help')"
        >
          <div class="text-3xl mb-2">🛡️</div>
          <h3 class="font-semibold mb-1">风险控制</h3>
          <p class="text-xs text-gray-500">如何设置止盈止损</p>
        </div>
      </div>
    </div>
  </div>
</template>
