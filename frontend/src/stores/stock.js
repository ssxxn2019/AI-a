import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useStockStore = defineStore('stock', () => {
  const myStocks = ref(JSON.parse(localStorage.getItem('myStocks') || '[]'))

  const addStock = (stock) => {
    const exists = myStocks.value.find(s => s.code === stock.code)
    if (!exists) {
      myStocks.value.push({
        code: stock.code,
        name: stock.name,
        addedAt: new Date().toISOString()
      })
      saveToStorage()
    }
  }

  const removeStock = (code) => {
    myStocks.value = myStocks.value.filter(s => s.code !== code)
    saveToStorage()
  }

  const isInMyStocks = (code) => {
    return myStocks.value.some(s => s.code === code)
  }

  const saveToStorage = () => {
    localStorage.setItem('myStocks', JSON.stringify(myStocks.value))
  }

  return {
    myStocks,
    addStock,
    removeStock,
    isInMyStocks,
  }
})
