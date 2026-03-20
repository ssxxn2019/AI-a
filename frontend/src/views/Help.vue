<script setup>
const terms = [
  {
    category: '基础术语',
    items: [
      { term: 'A股', desc: '在上海证券交易所和深圳证券交易所上市交易的股票，以人民币计价' },
      { term: '主板', desc: '大型成熟企业上市的市场，如中石油、工商银行等' },
      { term: '创业板', desc: '中小型企业和高新技术企业上市的市场，波动较大' },
      { term: '科创板', desc: '科技创新型企业上市的市场，实行注册制，风险较高（暂不推荐）' },
      { term: 'ST股', desc: '连续亏损被特别处理的股票，风险极高，新手应避免' },
    ]
  },
  {
    category: '技术指标',
    items: [
      { term: 'MA5/MA10/MA20', desc: '5日/10日/20日均线，显示短期/中期/长期价格趋势。均线多头排列（短 > 中 > 长）是看涨信号' },
      { term: 'MACD', desc: '指数平滑异同移动平均线。DIF上穿DEA形成"金叉"是买入信号，反之"死叉"是卖出信号' },
      { term: 'KDJ', desc: '随机指标。K值上穿D值且两值在80以下时为买入信号，超过80为超买区域' },
      { term: '量比', desc: '当日每分钟平均成交量与过去5日平均成交量的比值。大于1.5表示成交量明显放大' },
      { term: '换手率', desc: '当日成交股数与流通股本的比值。3%-15%为适中，>25%可能有炒作风险' },
    ]
  },
  {
    category: '资金流向',
    items: [
      { term: '主力净流入', desc: '大单买入金额减去大单卖出金额。正值表示主力看多' },
      { term: '散户净流入', desc: '小单买入金额减去小单卖出金额。散户持续买入往往是反向指标' },
      { term: '主力净流入占比', desc: '主力净流入占总成交额的比例，>3%表示有明显资金介入' },
    ]
  },
  {
    category: '交易策略',
    items: [
      { term: '止盈', desc: '股价上涨到目标价位时卖出，锁定利润。建议涨幅15%-20%' },
      { term: '止损', desc: '股价下跌到底线时卖出，控制亏损。建议跌幅7%-8%' },
      { term: '仓位', desc: '用于投资的资金占全部资金的比例。新手建议单只股票不超过3成仓' },
      { term: '金叉', desc: '短期均线上穿长期均线，是买入信号' },
      { term: '死叉', desc: '短期均线下穿长期均线，是卖出信号' },
    ]
  }
]
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-xl font-bold">📚 帮助中心</h1>

    <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <div class="flex items-start gap-2">
        <span class="text-xl">⚠️</span>
        <div>
          <p class="font-semibold text-yellow-800">风险提示</p>
          <p class="text-yellow-700 text-sm mt-1">
            短线交易风险极高，可能造成重大损失。本平台仅供参考，不构成投资建议。
          </p>
        </div>
      </div>
    </div>

    <div v-for="category in terms" :key="category.category" class="space-y-3">
      <h2 class="text-lg font-bold text-gray-800 border-b pb-2">{{ category.category }}</h2>
      <div class="space-y-2">
        <div
          v-for="item in category.items"
          :key="item.term"
          class="bg-white rounded-xl p-4 shadow-sm"
        >
          <h3 class="font-semibold text-blue-600 mb-1">{{ item.term }}</h3>
          <p class="text-sm text-gray-600">{{ item.desc }}</p>
        </div>
      </div>
    </div>

    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <h3 class="font-semibold text-blue-800 mb-2">📖 建议学习路径</h3>
      <ol class="text-sm text-blue-700 space-y-1 list-decimal list-inside">
        <li>理解基础术语和股票交易规则</li>
        <li>学习看懂K线图和技术指标</li>
        <li>了解资金流向的意义</li>
        <li>学会设置止盈止损</li>
        <li>先用模拟盘练习1-3个月</li>
        <li>小资金实盘验证策略</li>
      </ol>
    </div>
  </div>
</template>
