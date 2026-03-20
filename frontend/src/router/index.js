import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Recommend from '../views/Recommend.vue'
import StockDetail from '../views/StockDetail.vue'
import MyStocks from '../views/MyStocks.vue'
import Search from '../views/Search.vue'
import Help from '../views/Help.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/recommend', name: 'Recommend', component: Recommend },
  { path: '/stock/:code', name: 'StockDetail', component: StockDetail },
  { path: '/my', name: 'MyStocks', component: MyStocks },
  { path: '/search', name: 'Search', component: Search },
  { path: '/help', name: 'Help', component: Help },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
