<template>
  <div class="page-container fixed-height">
    <h1 class="page-title glow-title">What kind of ice are you looking for?</h1>
    <p class="page-subtitle">
      Choose an ice type, and we'll remember this preference.
    </p>

    <div class="choice-grid">
      <button v-for="ice in iceOptions" :key="ice.id" class="choice-card" :class="{ selected: selectedIce === ice.id }"
        @click="selectedIce = ice.id">
        <span class="choice-name">{{ ice.name }}</span>
      </button>
    </div>

    <button class="btn-primary next-btn" :disabled="!selectedIce" @click="handleFinish">
      Finish
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedIce = ref(null)

const iceOptions = [
  { id: 'k1', name: 'Cube Ice' },
  { id: 'k2', name: 'Block Ice' },
  { id: 'k3', name: 'Sphere Ice' },
  { id: 'k4', name: 'Crushed Ice' }
]

onMounted(() => {
  if (!sessionStorage.getItem('glassType')) {
    router.push('/glass')
    return
  }

  const saved = sessionStorage.getItem('iceType')
  if (saved) {
    selectedIce.value = JSON.parse(saved).id
  }
})

function handleFinish() {
  const selected = iceOptions.find(ice => ice.id === selectedIce.value)
  if (!selected) return

  sessionStorage.setItem('iceType', JSON.stringify(selected))
  router.push('/result')
}
</script>

<style scoped>
.page-container {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.glow-title {
  text-shadow: 0 0 15px rgba(116, 185, 255, 0.6);
}

.choice-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-content: center;
  margin-bottom: 24px;
}

.choice-card {
  display: flex;
  min-height: 104px;
  align-items: center;
  justify-content: center;
  padding: 18px 16px;
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.choice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.2);
}

.choice-card:active {
  transform: scale(0.98);
}

.choice-card.selected {
  border-color: rgba(116, 185, 255, 0.5);
  background: rgba(116, 185, 255, 0.1);
  box-shadow: 0 0 20px rgba(116, 185, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3);
}

.choice-name {
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 650;
  line-height: 1.2;
  text-align: center;
  text-wrap: balance;
}

.next-btn {
  margin-top: auto;
}
</style>
