import express from 'express'
import axios from 'axios'
import NodeCache from 'node-cache'
import iconv from 'iconv-lite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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

    const secid = code.startsWith('6') ? `1.${code}` : `0.${code}`

    let stock = {
      code,
      name: '未知',
      price: 0,
      open: 0,
      high: 0,
      low: 0,
      change: 0,
      changePercent: 0,
      volume: '0',
      industry: '未知',
      marketCap: '0',
      ma5: '0',
      ma10: '0',
      ma20: '0',
      macd: '0',
      kdj: { k: '0', d: '0', j: '0' }
    }

    try {
      const eastMoneyUrl = 'https://push2.eastmoney.com/api/qt/stock/get'
      const response = await axios.get(eastMoneyUrl, {
        params: {
          fltt: 2,
          invt: 2,
          fields: 'f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f20,f21,f37,f38,f39,f40,f45',
          secid: secid
        },
        timeout: 8000,
        headers: {
          'Referer': 'https://finance.eastmoney.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const data = response.data?.data
      if (data) {
        stock = {
          code: data.f12 || code,
          name: data.f14 || '未知',
          price: (data.f2 || 0) / 100,
          open: (data.f15 || 0) / 100,
          high: (data.f16 || 0) / 100,
          low: (data.f17 || 0) / 100,
          change: (data.f3 || 0) / 100,
          changePercent: (data.f4 || 0) / 100,
          volume: formatNumber(data.f5 || 0),
          industry: data.f40 || '未知',
          marketCap: formatNumber(data.f20 || 0),
          ma5: ((data.f21 || 0) / 100).toFixed(2),
          ma10: ((data.f37 || 0) / 100).toFixed(2),
          ma20: ((data.f38 || 0) / 100).toFixed(2),
          macd: ((data.f39 || 0) / 100).toFixed(3),
          kdj: {
            k: ((data.f39 || 0) / 100).toFixed(1),
            d: ((data.f40 || 0) / 100).toFixed(1),
            j: ((data.f41 || 0) / 100).toFixed(1)
          }
        }
      }
    } catch (e) {
      console.log('个股API失败:', e.message)
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

    const stockCodes = [
      { code: '002185', name: '华天科技', industry: '半导体', risk: '中', reasons: ['价格低估', '量比放大', '技术面修复'] },
      { code: '002241', name: '歌尔股份', industry: '消费电子', risk: '中', reasons: ['苹果产业链', '超跌反弹', '主力介入'] },
      { code: '002374', name: '丽鹏股份', industry: '包装印刷', risk: '中', reasons: ['低价筹码', '板块轮动', '技术企稳'] },
      { code: '300088', name: '长信科技', industry: '电子元件', risk: '中', reasons: ['新能源概念', '超跌反弹', '资金介入'] },
      { code: '002456', name: '欧菲光', industry: '光学光电子', risk: '高', reasons: ['超跌低价', '风险较高', '谨慎操作'] },
      { code: '300083', name: '创世纪', industry: '通用设备', risk: '中', reasons: ['数控机床', '超跌反弹', '板块轮动'] },
      { code: '300220', name: '金升智能', industry: '机械行业', risk: '中', reasons: ['智能制造', '技术修复', '量比放大'] },
      { code: '300432', name: '富临精工', industry: '汽车零部件', risk: '中', reasons: ['新能源车', '超跌反弹', '主力护盘'] },
      { code: '002055', name: '得润电子', industry: '电子元件', risk: '中', reasons: ['汽车电子', '超跌低价', '技术企稳'] },
      { code: '002331', name: '皖通科技', industry: '软件服务', risk: '中', reasons: ['智慧交通', '超跌反弹', '资金关注'] },
    ]

    const sinaCodes = stockCodes.map(s => {
      if (s.code.startsWith('6')) return `sh${s.code}`
      return `sz${s.code}`
    }).join(',')

    let stockData = []
    let rawData = []

    try {
      const response = await axios.get(`https://hq.sinajs.cn/list=${sinaCodes}`, {
        headers: {
          'Referer': 'https://finance.sina.com.cn',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        responseType: 'arraybuffer',
        timeout: 8000
      })

      const buffer = Buffer.from(response.data)
      const dataStr = iconv.decode(buffer, 'gbk')

      const lines = dataStr.split('\n')
      for (const line of lines) {
        const match = line.match(/hq_str_(\w+)="([^"]+)"/)
        if (match) {
          const code = match[1].replace(/^(sz|sh)/, '')
          const fields = match[2].split(',')
          rawData.push({ code, fields })
        }
      }
    } catch (e) {
      console.log('新浪API失败:', e.message)
    }

    const recommendations = stockCodes.map((stock, idx) => {
      const raw = rawData.find(r => r.code === stock.code)
      const fields = raw?.fields || []

      const price = parseFloat(fields[3]) || 0
      const open = parseFloat(fields[1]) || 0
      const yesterdayClose = parseFloat(fields[2]) || 0
      const high = parseFloat(fields[4]) || 0
      const low = parseFloat(fields[5]) || 0
      const volume = parseInt(fields[8]) || 0
      const amount = parseFloat(fields[9]) || 0

      const change = price - yesterdayClose
      const changePercent = yesterdayClose > 0 ? (change / yesterdayClose) * 100 : 0

      const turnover = price > 0 && amount > 0 ? ((amount / price) / 100000000 * 100).toFixed(2) : '0'
      const volumeRatio = parseFloat(fields[31]) || 0

      const buyRange = price > 0 ? `${(price * 0.97).toFixed(2)}-${(price * 1.02).toFixed(2)}` : '暂无'
      const targetProfit = price > 0 ? (price * 1.15).toFixed(2) : '暂无'
      const stopLoss = price > 0 ? (price * 0.93).toFixed(2) : '暂无'

      return {
        code: stock.code,
        name: fields[0] || stock.name,
        price,
        change,
        changePercent,
        risk: stock.risk,
        industry: stock.industry,
        marketCap: amount > 0 ? formatNumber(amount) : '暂无',
        reasons: stock.reasons,
        buyRange,
        targetProfit,
        stopLoss,
        volume: formatNumber(volume),
        turnover: turnover + '%',
        volumeRatio: volumeRatio > 0 ? volumeRatio.toFixed(2) : '1.0',
        open,
        high,
        low
      }
    }).filter(s => s.price > 0 && s.price <= parseFloat(maxPrice))

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

app.use(express.static('/workspace/frontend/dist'))

app.get('*', (req, res) => {
  res.sendFile('/workspace/frontend/dist/index.html')
})

app.listen(port, () => {
  console.log(`A股短线宝服务运行在 http://localhost:${port}`)
})
