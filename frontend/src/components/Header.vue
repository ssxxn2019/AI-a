<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/recommend', label: '智能选股', icon: '📈' },
  { path: '/my', label: '自选股', icon: '⭐' },
  { path: '/search', label: '搜索', icon: '🔍' },
  { path: '/help', label: '帮助', icon: '❓' },
]

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="bg-white shadow-sm sticky top-0 z-50">
    <div class="container mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-2 cursor-pointer" @click="router.push('/')">
          <span class="text-2xl">📊</span>
          <span class="font-bold text-xl text-blue-600">A股短线宝</span>
        </div>
        <nav class="hidden md:flex items-center gap-1">
          <button
            v-for="item in navItems"
            :key="item.path"
            @click="router.push(item.path)"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive(item.path)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            ]"
          >
            <span class="mr-1">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </nav>
      </div>
    </div>
    <div class="md:hidden border-t px-4 py-2 flex gap-2 overflow-x-auto">
      <button
        v-for="item in navItems"
        :key="item.path"
        @click="router.push(item.path)"
        :class="[
          'px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors',
          isActive(item.path)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 bg-gray-50'
        ]"
      >
        {{ item.icon }} {{ item.label }}
      </button>
    </div>
  </header>
</template>
