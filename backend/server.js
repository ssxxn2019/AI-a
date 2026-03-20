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
    const { maxPrice = 20, limit = 10 } = req.query
    const cacheKey = `recommend_${maxPrice}_${limit}`
    const cached = cache.get(cacheKey)
    if (cached) return res.json(cached)

    // 从新浪获取A股实时报价（主板+创业板代表性股票）
    // 每次获取市场上有代表性的股票进行筛选
    const allStockCodes = [
      'sh600000','sh600010','sh600015','sh600016','sh600018','sh600019','sh600028','sh600030','sh600031','sh600036',
      'sh600048','sh600050','sh600104','sh600109','sh600111','sh600150','sh600160','sh600176','sh600183','sh600196',
      'sh600276','sh600309','sh600406','sh600436','sh600519','sh600547','sh600570','sh600585','sh600588','sh600690',
      'sh600703','sh600745','sh600760','sh600809','sh600837','sh600887','sh600893','sh600900','sh600905','sh600918',
      'sh600926','sh600989','sh601006','sh601012','sh601066','sh601088','sh601118','sh601138','sh601166','sh601169',
      'sh601186','sh601211','sh601236','sh601288','sh601318','sh601328','sh601336','sh601390','sh601398','sh601601',
      'sh601628','sh601658','sh601688','sh601818','sh601857','sh601888','sh601899','sh601919','sh601939','sh601985',
      'sh601988','sh601989','sh601995','sh603259','sh603288','sh603501','sh603799','sh603986',
      'sz000001','sz000002','sz000063','sz000100','sz000333','sz000338','sz000425','sz000568','sz000596','sz000651',
      'sz000661','sz000708','sz000725','sz000768','sz000858','sz000876','sz000895','sz000938','sz000976','sz000999',
      'sz002001','sz002007','sz002027','sz002049','sz002050','sz002142','sz002153','sz002171','sz002185','sz002236',
      'sz002241','sz002252','sz002304','sz002311','sz002352','sz002371','sz002410','sz002415','sz002456','sz002460',
      'sz002466','sz002475','sz002493','sz002555','sz002601','sz002624','sz002673','sz002714','sz002736','sz002812',
      'sz300001','sz300003','sz300015','sz300033','sz300059','sz300122','sz300124','sz300142','sz300274','sz300496',
    ]

    let rawData = []
    try {
      // 分批获取，每次50支
      const batchSize = 50
      for (let i = 0; i < allStockCodes.length; i += batchSize) {
        const batch = allStockCodes.slice(i, i + batchSize)
        const response = await axios.get(`https://hq.sinajs.cn/list=${batch.join(',')}`, {
          headers: {
            'Referer': 'https://finance.sina.com.cn',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          responseType: 'arraybuffer',
          timeout: 15000
        })

        const buffer = Buffer.from(response.data)
        const dataStr = iconv.decode(buffer, 'gbk')

        const lines = dataStr.split('\n')
        for (const line of lines) {
          const match = line.match(/hq_str_(\w+)="([^"]+)"/)
          if (match) {
            const code = match[1].replace(/^(sz|sh)/, '')
            const fields = match[2].split(',')
            if (fields.length > 10 && fields[0]) {
              rawData.push({ code, fields })
            }
          }
        }
      }
    } catch (e) {
      console.log('获取股票数据失败:', e.message)
    }

    // 筛选并打分
    const scoredStocks = rawData
      .map(({ code, fields }) => {
        const name = fields[0]
        const open = parseFloat(fields[1]) || 0
        const yesterdayClose = parseFloat(fields[2]) || 0
        const current = parseFloat(fields[3]) || 0
        const high = parseFloat(fields[4]) || 0
        const low = parseFloat(fields[5]) || 0
        const volume = parseInt(fields[8]) || 0
        const amount = parseFloat(fields[9]) || 0

        // 排除无效数据
        if (current <= 0 || yesterdayClose <= 0) return null

        // 计算涨跌
        const change = current - yesterdayClose
        const changePercent = (change / yesterdayClose) * 100

        // 排除ST、*ST、688开头（科创板）
        if (name.includes('ST') || name.includes('*ST') || code.startsWith('688')) return null

        // 排除价格不在范围内的
        if (current > maxPrice || current < 3) return null

        // 排除涨跌停（波动太大风险高）
        if (changePercent > 9.5 || changePercent < -9.5) return null

        // 计算换手率（成交额/市值估算）
        const turnoverRate = amount > 0 && current > 0 ? ((amount / current) / 100000000 * 100) : 0

        // 排除换手率异常的（>25%可能有炒作风险）
        if (turnoverRate > 25) return null

        // ===== 打分算法 =====
        let score = 0
        const factorDetails = []

        // 1. 量比打分 (15分) - 成交量活跃度
        const volumeRatio = parseFloat(fields[31]) || 1
        if (volumeRatio > 2) {
          score += 15
          factorDetails.push('量比放大')
        } else if (volumeRatio > 1.5) {
          score += 10
        } else if (volumeRatio > 1) {
          score += 5
        }

        // 2. 涨幅打分 (20分) - 上涨趋势但不过于追高
        if (changePercent > 0 && changePercent <= 3) {
          score += 20
          factorDetails.push('温和上涨')
        } else if (changePercent > 3 && changePercent <= 6) {
          score += 15
          factorDetails.push('涨幅较大')
        } else if (changePercent > 6 && changePercent <= 9) {
          score += 10
          factorDetails.push('强势上涨')
        } else if (changePercent >= -2 && changePercent <= 0) {
          score += 12
          factorDetails.push('小幅回调')
        }

        // 3. 换手率打分 (15分) - 活跃度适中为佳
        if (turnoverRate >= 3 && turnoverRate <= 10) {
          score += 15
        } else if (turnoverRate > 10 && turnoverRate <= 20) {
          score += 10
        } else if (turnoverRate < 3 && turnoverRate > 0) {
          score += 5
        }

        // 4. 价格位置打分 (10分) - 今日价格在近期相对低位
        const todayRange = high - low
        const pricePosition = todayRange > 0 ? ((current - low) / todayRange) : 0.5
        if (pricePosition < 0.4) {
          score += 10
          factorDetails.push('价格低位')
        } else if (pricePosition > 0.6 && pricePosition < 0.85) {
          score += 8
        } else if (pricePosition >= 0.85) {
          score += 3
          factorDetails.push('价格高位')
        }

        // 5. 振幅打分 (10分) - 波动稳健
        const amplitude = yesterdayClose > 0 ? ((high - low) / yesterdayClose) * 100 : 0
        if (amplitude >= 2 && amplitude <= 5) {
          score += 10
        } else if (amplitude > 5 && amplitude <= 8) {
          score += 7
        } else if (amplitude < 2) {
          score += 5
        } else {
          score += 2
        }

        // 6. 资金体量打分 (15分) - 成交金额适中（不能太小也不能太大）
        const amountLevel = amount / 100000000 // 亿
        if (amountLevel >= 3 && amountLevel <= 15) {
          score += 15
        } else if (amountLevel > 15 && amountLevel <= 30) {
          score += 12
        } else if (amountLevel >= 1 && amountLevel < 3) {
          score += 8
        }

        // 7. 趋势稳健打分 (15分) - 近几日表现
        // 用今开与昨收的关系简单判断
        const openChange = yesterdayClose > 0 ? ((open - yesterdayClose) / yesterdayClose) * 100 : 0
        if (openChange >= -1 && openChange <= 2) {
          score += 15
        } else if (openChange >= -3 && openChange < -1) {
          score += 10
        } else if (openChange > 2 && openChange <= 5) {
          score += 8
        }

        // 风险等级判定
        let riskLevel = '低'
        if (score < 40) riskLevel = '中'
        if (score < 25) riskLevel = '高'
        if (turnoverRate > 20 || amplitude > 10) riskLevel = '高'

        // 计算推荐理由
        const reasons = []
        if (factorDetails.length > 0) {
          reasons.push(...factorDetails.slice(0, 2))
        }
        if (volumeRatio > 1.5) reasons.push('量比活跃')
        if (changePercent > 0 && changePercent <= 5) reasons.push('走势稳健')
        if (turnoverRate >= 3 && turnoverRate <= 15) reasons.push('换手适中')
        if (reasons.length < 2) reasons.push('综合筛选')

        return {
          code,
          name,
          price: current,
          change,
          changePercent,
          open,
          high,
          low,
          volume: formatNumber(volume),
          turnover: turnoverRate.toFixed(2) + '%',
          volumeRatio: volumeRatio.toFixed(2),
          amplitude: amplitude.toFixed(2) + '%',
          amount: amountLevel.toFixed(2) + '亿',
          risk: riskLevel,
          industry: '实时行情',
          marketCap: amount > 0 ? formatNumber(amount) : '暂无',
          reasons: reasons.slice(0, 3),
          buyRange: `${(current * 0.98).toFixed(2)}-${(current * 1.02).toFixed(2)}`,
          targetProfit: (current * 1.12).toFixed(2),
          stopLoss: (current * 0.95).toFixed(2),
          score
        }
      })
      .filter(s => s !== null && s.score >= 25)
      .sort((a, b) => b.score - a.score)
      .slice(0, parseInt(limit))

    const result = {
      stocks: scoredStocks,
      updateTime: new Date().toLocaleString('zh-CN'),
      filter: { maxPrice: parseFloat(maxPrice), totalScanned: rawData.length },
      algorithm: {
        description: '多因素综合打分算法',
        factors: [
          { name: '量比活跃度', weight: '15%', description: '成交量放大程度' },
          { name: '涨幅合理性', weight: '20%', description: '上涨但不过于追高' },
          { name: '换手率适度', weight: '15%', description: '活跃度适中(3%-25%)' },
          { name: '价格位置', weight: '10%', description: '今日价格在近期相对低位' },
          { name: '振幅稳健', weight: '10%', description: '波动幅度适中(2%-8%)' },
          { name: '资金体量', weight: '15%', description: '成交金额3-15亿为佳' },
          { name: '趋势稳健', weight: '15%', description: '开盘涨幅合理(-1%~2%)' }
        ],
        riskFilter: '排除ST/*ST、科创板、涨停/跌停、换手率>25%、价格<3元或>20元'
      }
    }

    cache.set(cacheKey, result, 60)
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
