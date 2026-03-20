import express from 'express'
import axios from 'axios'
import NodeCache from 'node-cache'

const app = express()
const port = 3001
const cache = new NodeCache({ stdTTL: 30 })

app.use(express.json())

const corsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

app.use((req, res, next) => {
  corsHeaders(res)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

const formatNumber = (num) => {
  if (Math.abs(num) >= 100000000) {
    return (num / 100000000).toFixed(2) + '亿'
  }
  if (Math.abs(num) >= 10000) {
    return (num / 10000).toFixed(2) + '万'
  }
  return num.toFixed(2)
}

app.get('/api/indices', async (req, res) => {
  try {
    const cached = cache.get('indices')
    if (cached) return res.json(cached)

    const indices = [
      { code: '000001', name: '上证指数', type: 'SH', current: 3150.25, change: 15.32, changePercent: 0.49 },
      { code: '399001', name: '深证成指', type: 'SZ', current: 10150.83, change: 45.67, changePercent: 0.45 },
      { code: '399006', name: '创业板指', type: 'CY', current: 2015.42, change: -8.56, changePercent: -0.42 },
    ]

    try {
      const eastMoneyUrl = 'https://push2.eastmoney.com/api/qt/ulist.np/get'
      const response = await axios.get(eastMoneyUrl, {
        params: {
          fltt: 2,
          invt: 2,
          fields: 'f12,f14,f3,f4,f2',
          secids: '1.000001,0.399001,0.399006'
        },
        timeout: 5000
      })
      
      if (response.data?.data?.diff) {
        const data = response.data.data.diff
        data.forEach((item, idx) => {
          if (item) {
            indices[idx].current = item.f2 || indices[idx].current
            indices[idx].change = item.f3 || indices[idx].change
            indices[idx].changePercent = item.f4 || indices[idx].changePercent
          }
        })
      }
    } catch (e) {
      console.log('指数API fallback')
    }

    cache.set('indices', indices)
    res.json(indices)
  } catch (error) {
    console.error('Indices error:', error.message)
    res.json([
      { code: '000001', name: '上证指数', type: 'SH', current: 3150.25, change: 15.32, changePercent: 0.49 },
      { code: '399001', name: '深证成指', type: 'SZ', current: 10150.83, change: 45.67, changePercent: 0.45 },
      { code: '399006', name: '创业板指', type: 'CY', current: 2015.42, change: -8.56, changePercent: -0.42 },
    ])
  }
})

app.get('/api/stocks', async (req, res) => {
  try {
    const { market = 'all' } = req.query
    const cached = cache.get(`stocks_${market}`)
    if (cached) return res.json(cached)

    res.json([])
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/search', async (req, res) => {
  try {
    const { keyword } = req.query
    if (!keyword) return res.json([])

    const mockStocks = [
      { code: '600519', name: '贵州茅台', industry: '白酒' },
      { code: '600036', name: '招商银行', industry: '银行' },
      { code: '000858', name: '五粮液', industry: '白酒' },
      { code: '601318', name: '中国平安', industry: '保险' },
      { code: '000333', name: '美的集团', industry: '家电' },
      { code: '300750', name: '宁德时代', industry: '新能源' },
      { code: '002475', name: '立讯精密', industry: '电子' },
      { code: '600887', name: '伊利股份', industry: '乳业' },
      { code: '300059', name: '东方财富', industry: '互联网券商' },
      { code: '002594', name: '比亚迪', industry: '汽车' },
    ]

    const filtered = mockStocks.filter(s => 
      s.code.includes(keyword) || s.name.includes(keyword)
    )

    res.json(filtered)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/stock/:code', async (req, res) => {
  try {
    const { code } = req.params
    const cached = cache.get(`stock_${code}`)
    if (cached) return res.json(cached)

    const basePrice = 10 + Math.random() * 100
    const change = (Math.random() - 0.5) * 5
    const stock = {
      code,
      name: code === '600519' ? '贵州茅台' : code === '000001' ? '平安银行' : '示例股票',
      price: basePrice,
      open: basePrice - Math.random() * 2,
      high: basePrice + Math.random() * 3,
      low: basePrice - Math.random() * 3,
      change,
      changePercent: (change / basePrice) * 100,
      volume: formatNumber(Math.random() * 100000000),
      industry: '示例行业',
      marketCap: formatNumber(Math.random() * 10000000000),
      ma5: (basePrice * (0.98 + Math.random() * 0.04)).toFixed(2),
      ma10: (basePrice * (0.96 + Math.random() * 0.08)).toFixed(2),
      ma20: (basePrice * (0.94 + Math.random() * 0.12)).toFixed(2),
      macd: ((Math.random() - 0.5) * 2).toFixed(3),
      kdj: {
        k: (50 + Math.random() * 30).toFixed(1),
        d: (50 + Math.random() * 30).toFixed(1),
        j: (50 + Math.random() * 50).toFixed(1)
      }
    }

    cache.set(`stock_${code}`, stock, 60)
    res.json(stock)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/kline/:code', async (req, res) => {
  try {
    const { code } = req.params
    const { period = 'daily' } = req.query
    
    const kline = []
    let price = 50
    const now = new Date()
    
    for (let i = 60; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      price = price + (Math.random() - 0.48) * 2
      kline.push({
        date: date.toISOString().split('T')[0],
        open: price - Math.random(),
        close: price,
        high: price + Math.random() * 2,
        low: price - Math.random() * 2,
        volume: Math.random() * 100000000
      })
    }
    
    res.json(kline)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/capital-flow/:code', async (req, res) => {
  try {
    const { code } = req.params
    const cached = cache.get(`flow_${code}`)
    if (cached) return res.json(cached)

    const flow = {
      mainNet: formatNumber(Math.random() * 1000000000 - 300000000),
      retailNet: formatNumber(Math.random() * 500000000 - 400000000),
      mainRatio: (Math.random() * 8).toFixed(2),
      volumeRatio: (1 + Math.random()).toFixed(2)
    }

    cache.set(`flow_${code}`, flow, 60)
    res.json(flow)
  } catch (error) {
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/recommend', async (req, res) => {
  try {
    const { maxPrice = 20 } = req.query
    const cacheKey = `recommend_${maxPrice}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    const allRecommendations = [
      {
        code: '002475',
        name: '立讯精密',
        price: 18.90,
        changePercent: 4.15,
        change: 0.75,
        risk: '中',
        industry: '消费电子',
        marketCap: '2100亿',
        reasons: ['量比放大', 'MACD零轴上方', '均线多头排列'],
        buyRange: '18-20',
        targetProfit: '21',
        stopLoss: '17'
      },
      {
        code: '300059',
        name: '东方财富',
        price: 15.80,
        changePercent: -0.63,
        change: -0.10,
        risk: '中',
        industry: '互联网券商',
        marketCap: '2200亿',
        reasons: ['回调企稳', '主力护盘', '成交量萎缩'],
        buyRange: '15.5-16.2',
        targetProfit: '17.5',
        stopLoss: '14.8'
      },
      {
        code: '300274',
        name: '阳光电源',
        price: 12.35,
        changePercent: 2.80,
        change: 0.34,
        risk: '中',
        industry: '光伏设备',
        marketCap: '920亿',
        reasons: ['光伏板块回暖', '主力资金流入', '技术面企稳'],
        buyRange: '12-13',
        targetProfit: '14',
        stopLoss: '11.5'
      },
      {
        code: '002185',
        name: '华天科技',
        price: 8.75,
        changePercent: 5.42,
        change: 0.45,
        risk: '高',
        industry: '半导体',
        marketCap: '350亿',
        reasons: ['量比放大3倍', '超跌反弹', '游资炒作'],
        buyRange: '8.5-9.2',
        targetProfit: '10',
        stopLoss: '8'
      },
      {
        code: '002463',
        name: '沪电股份',
        price: 14.20,
        changePercent: 1.85,
        change: 0.26,
        risk: '低',
        industry: 'PCB板',
        marketCap: '480亿',
        reasons: ['业绩预增', '均线多头', '主力持续买入'],
        buyRange: '13.8-14.8',
        targetProfit: '16',
        stopLoss: '13'
      },
      {
        code: '300496',
        name: '中科创达',
        price: 19.60,
        changePercent: 3.25,
        change: 0.62,
        risk: '中',
        industry: '软件服务',
        marketCap: '520亿',
        reasons: ['AI概念活跃', 'KDJ金叉', '量比2.1'],
        buyRange: '19-20.5',
        targetProfit: '22',
        stopLoss: '18'
      },
      {
        code: '002049',
        name: '紫光国微',
        price: 16.80,
        changePercent: 1.52,
        change: 0.25,
        risk: '低',
        industry: '芯片设计',
        marketCap: '680亿',
        reasons: ['国产替代', '主力净流入', '趋势向上'],
        buyRange: '16.2-17.5',
        targetProfit: '19',
        stopLoss: '15.5'
      },
      {
        code: '300373',
        name: '扬杰科技',
        price: 11.45,
        changePercent: 4.80,
        change: 0.52,
        risk: '中',
        industry: '半导体',
        marketCap: '280亿',
        reasons: ['功率器件景气', '放量上涨', 'MACD底部金叉'],
        buyRange: '11-12',
        targetProfit: '13',
        stopLoss: '10.5'
      },
      {
        code: '002456',
        name: '欧菲光',
        price: 6.85,
        changePercent: -2.42,
        change: -0.17,
        risk: '高',
        industry: '光学光电子',
        marketCap: '220亿',
        reasons: ['超跌低价', '风险较高', '不建议新手追高'],
        buyRange: '观望',
        targetProfit: '8',
        stopLoss: '6.2'
      },
      {
        code: '002241',
        name: '歌尔股份',
        price: 17.30,
        changePercent: 2.15,
        change: 0.36,
        risk: '中',
        industry: '消费电子',
        marketCap: '590亿',
        reasons: ['苹果产业链', '主力资金介入', '技术面修复'],
        buyRange: '16.8-18',
        targetProfit: '19.5',
        stopLoss: '16'
      }
    ]

    const recommendations = allRecommendations.filter(s => s.price <= parseFloat(maxPrice))

    const result = {
      stocks: recommendations,
      updateTime: new Date().toLocaleTimeString(),
      filter: { maxPrice: parseFloat(maxPrice) }
    }

    cache.set(cacheKey, result, 120)
    res.json(result)
  } catch (error) {
    console.error('Recommend error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

app.listen(port, () => {
  console.log(`A股短线宝后端服务运行在 http://localhost:${port}`)
})
