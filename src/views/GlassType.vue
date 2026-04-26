<template>
  <div class="page-container fixed-height">
    <h1 class="page-title glow-title">What kind of wine glass are you looking for?</h1>
    <p class="page-subtitle">
      Choose a glass type, and we'll use it as the final suggestion.
    </p>

    <div class="choice-grid">
      <button v-for="glass in glassOptions" :key="glass.id" class="choice-card"
        :class="{ selected: selectedGlass === glass.id }" @click="selectedGlass = glass.id">
        <span class="choice-name">{{ glass.name }}</span>
      </button>
    </div>

    <button class="btn-primary next-btn" :disabled="!selectedGlass" @click="handleNext">
      Next
    </button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedGlass = ref(null)

const glassOptions = [
  { id: 'g1', name: 'Old Fashioned Glass' },
  { id: 'g2', name: 'Collins Glass' },
  { id: 'g3', name: 'Martini Glass' },
  { id: 'g4', name: 'Hammered Glass' }
]

onMounted(() => {
  if (!sessionStorage.getItem('flavorPreference')) {
    router.push('/flavor')
    return
  }

  const saved = sessionStorage.getItem('glassType')
  if (saved) {
    selectedGlass.value = JSON.parse(saved).id
  }
})

function handleNext() {
  const selected = glassOptions.find(glass => glass.id === selectedGlass.value)
  if (!selected) return

  sessionStorage.setItem('glassType', JSON.stringify(selected))
  router.push('/ice')
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
