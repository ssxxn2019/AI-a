import axios from 'axios'

const API_BASE = '/api'

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export const stockApi = {
  async getIndices() {
    return apiClient.get('/indices')
  },

  async getStockList(params = {}) {
    return apiClient.get('/stocks', { params })
  },

  async getStockDetail(code) {
    return apiClient.get(`/stock/${code}`)
  },

  async getKLineData(code, period = 'daily') {
    return apiClient.get(`/kline/${code}`, { params: { period } })
  },

  async searchStocks(keyword) {
    return apiClient.get('/search', { params: { keyword } })
  },

  async getRecommendedStocks(maxPrice = 20) {
    return apiClient.get('/recommend', { params: { maxPrice } })
  },

  async getCapitalFlow(code) {
    return apiClient.get(`/capital-flow/${code}`)
  },
}

export default stockApi
