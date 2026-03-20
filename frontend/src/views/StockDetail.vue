<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as echarts from 'echarts'
import stockApi from '../api/stock'
import { useStockStore } from '../stores/stock'

const route = useRoute()
const router = useRouter()
const stockStore = useStockStore()
const stock = ref(null)
const klineData = ref([])
const capitalFlow = ref(null)
const loading = ref(true)
const error = ref(null)
const chartRef = ref(null)
let chartInstance = null

const code = computed(() => route.params.code)

const formatChange = (change, percent) => {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`
}

const getChangeClass = (change) => {
  return change >= 0 ? 'text-red-500' : 'text-green-500'
}

const initChart = (data) => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  const dates = data.map(d => d.date)
  const prices = data.map(d => d.close)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const p = params[0]
        return `${p.name}<br/>收盘价: ¥${p.value.toFixed(2)}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      scale: true,
    },
    series: [{
      name: '收盘价',
      type: 'line',
      data: prices,
      smooth: true,
      lineStyle: {
        color: stock.value?.change >= 0 ? '#ef4444' : '#10b981'
      },
      itemStyle: {
        color: stock.value?.change >= 0 ? '#ef4444' : '#10b981'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: stock.value?.change >= 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)' },
          { offset: 1, color: 'transparent' }
        ])
      }
    }]
  }
  chartInstance.setOption(option)
}

onMounted(async () => {
  try {
    const [detail, kline, flow] = await Promise.all([
      stockApi.getStockDetail(code.value),
      stockApi.getKLineData(code.value),
      stockApi.getCapitalFlow(code.value)
    ])
    stock.value = detail
    klineData.value = kline
    capitalFlow.value = flow
    setTimeout(() => initChart(kline), 100)
  } catch (e) {
    error.value = '加载失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-4">
    <button
      @click="router.back()"
      class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
    >
      ← 返回
    </button>

    <div v-if="loading" class="text-center py-16 text-gray-500">
      加载中...
    </div>

    <div v-else-if="error" class="text-center py-16 text-red-500">
      {{ error }}
    </div>

    <template v-else-if="stock">
      <div class="bg-white rounded-xl p-6 shadow-sm">
        <div class="flex items-start justify-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h1 class="text-2xl font-bold">{{ stock.name }}</h1>
              <span class="text-sm bg-gray-100 px-2 py-1 rounded">{{ stock.code }}</span>
            </div>
            <p class="text-sm text-gray-500">{{ stock.industry }} | {{ stock.marketCap }}</p>
          </div>
          <button
            @click="stockStore.isInMyStocks(stock.code) ? stockStore.removeStock(stock.code) : stockStore.addStock(stock)"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              stockStore.isInMyStocks(stock.code)
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            ]"
          >
            {{ stockStore.isInMyStocks(stock.code) ? '⭐ 已关注' : '+ 加自选' }}
          </button>
        </div>

        <div class="flex items-end gap-4 mb-4">
          <span class="text-4xl font-bold" :class="getChangeClass(stock.change)">
            {{ stock.price.toFixed(2) }}
          </span>
          <span class="text-lg" :class="getChangeClass(stock.change)">
            {{ formatChange(stock.change, stock.changePercent) }}
          </span>
        </div>

        <div class="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span class="text-gray-400">开盘</span>
            <div class="font-medium">{{ stock.open.toFixed(2) }}</div>
          </div>
          <div>
            <span class="text-gray-400">最高</span>
            <div class="font-medium text-red-500">{{ stock.high.toFixed(2) }}</div>
          </div>
          <div>
            <span class="text-gray-400">最低</span>
            <div class="font-medium text-green-500">{{ stock.low.toFixed(2) }}</div>
          </div>
          <div>
            <span class="text-gray-400">成交量</span>
            <div class="font-medium">{{ stock.volume }}</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 shadow-sm">
        <h2 class="text-lg font-bold mb-4">📈 K线走势</h2>
        <div ref="chartRef" class="h-64 w-full"></div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-semibold mb-3">📊 主要指标</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">MA5</span>
              <span class="font-medium">{{ stock.ma5 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">MA10</span>
              <span class="font-medium">{{ stock.ma10 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">MA20</span>
              <span class="font-medium">{{ stock.ma20 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">MACD</span>
              <span class="font-medium">{{ stock.macd }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">KDJ K</span>
              <span class="font-medium">{{ stock.kdj.k }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">KDJ D</span>
              <span class="font-medium">{{ stock.kdj.d }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-4 shadow-sm">
          <h3 class="font-semibold mb-3">💰 资金流向</h3>
          <div v-if="capitalFlow" class="space-y-3 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-500">主力净流入</span>
              <span :class="capitalFlow.mainNet >= 0 ? 'text-red-500' : 'text-green-500'">
                {{ capitalFlow.mainNet }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">散户净流入</span>
              <span :class="capitalFlow.retailNet >= 0 ? 'text-red-500' : 'text-green-500'">
                {{ capitalFlow.retailNet }}
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">主力净流入占比</span>
              <span class="font-medium">{{ capitalFlow.mainRatio }}%</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">今日量比</span>
              <span class="font-medium">{{ capitalFlow.volumeRatio }}</span>
            </div>
          </div>
          <div v-else class="text-gray-400 text-center py-4">暂无数据</div>
        </div>
      </div>
    </template>
  </div>
</template>
