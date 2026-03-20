<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from './components/Header.vue'
import RiskModal from './components/RiskModal.vue'

const showRiskModal = ref(false)
const router = useRouter()

onMounted(() => {
  const hasSeenRisk = localStorage.getItem('hasSeenRiskModal')
  if (!hasSeenRisk) {
    showRiskModal.value = true
  }
})

const closeRiskModal = () => {
  localStorage.setItem('hasSeenRiskModal', 'true')
  showRiskModal.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <Header />
    <main class="container mx-auto px-4 py-6">
      <router-view />
    </main>
    <RiskModal v-if="showRiskModal" @close="closeRiskModal" />
  </div>
</template>
