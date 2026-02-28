<template>
  <div class="page-container">
    <h1 class="page-title">这杯酒，你希望哪种味道更明显一点？</h1>
    <p class="page-subtitle">
      可以选一个方向，并选择强度。如果有特别不想要的味道，可以长按划掉。
    </p>

    <div class="flavor-cards">
      <div
        v-for="flavor in flavorOptions"
        :key="flavor.id"
        class="flavor-card"
        :class="{
          'selected': selectedMain === flavor.id,
          'crossed': crossedFlavors.includes(flavor.id)
        }"
        @click="handleCardClick(flavor.id)"
        @contextmenu.prevent="handleCross(flavor.id)"
      >
        <span class="flavor-emoji">{{ flavor.emoji }}</span>
        <span class="flavor-text">{{ flavor.text }}</span>
        <button
          v-if="crossedFlavors.includes(flavor.id)"
          class="cross-btn"
          @click.stop="handleUncross(flavor.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-if="selectedMain" class="intensity-section">
      <p class="intensity-label">选择强度</p>
      <div class="intensity-options">
        <button
          v-for="level in intensityLevels"
          :key="level.id"
          class="intensity-btn"
          :class="{ 'intensity-selected': selectedIntensity === level.id }"
          @click="selectedIntensity = level.id"
        >
          <span class="intensity-text">{{ level.text }}</span>
          <span class="intensity-desc">{{ level.desc }}</span>
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showWarning" class="warning-message">
        这杯酒需要一点酸或甜来保持结构。
      </div>
    </transition>

    <div class="secondary-input">
      <p class="secondary-label">也想要什么可以给我们备注！</p>
      <input
        v-model="secondaryText"
        class="secondary-text-input"
        placeholder="也想要酸/甜/苦/辣..."
        @input="handleSecondaryInput"
      />
    </div>

    <button
      class="btn-primary next-btn"
      @click="handleNext"
    >
      完成
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const flavorOptions = [
  { id: 'sour', emoji: '🍋', text: '偏酸一点' },
  { id: 'sweet', emoji: '🍯', text: '偏甜一点' },
  { id: 'bitter', emoji: '🌿', text: '偏苦一点' },
  { id: 'spicy', emoji: '🌶', text: '偏辣一点' }
]

const intensityLevels = [
  { id: 'h1', text: '轻微', desc: '一点点味道' },
  { id: 'h2', text: '适中', desc: '明显但不强烈' },
  { id: 'h3', text: '强烈', desc: '明显的味道' }
]

const selectedMain = ref(null)
const selectedIntensity = ref('h2')
const crossedFlavors = ref([])
const secondaryText = ref('')
const showWarning = ref(false)

function handleCardClick(flavorId) {
  if (crossedFlavors.value.includes(flavorId)) return
  
  if (selectedMain.value === flavorId) {
    selectedMain.value = null
  } else {
    selectedMain.value = flavorId
  }
}

function handleCross(flavorId) {
  if (selectedMain.value === flavorId) return
  
  if (!crossedFlavors.value.includes(flavorId)) {
    const newCrossed = [...crossedFlavors.value, flavorId]
    
    if (newCrossed.includes('sour') && newCrossed.includes('sweet')) {
      showWarning.value = true
      setTimeout(() => {
        showWarning.value = false
      }, 2000)
      return
    }
    
    crossedFlavors.value = newCrossed
  }
}

function handleUncross(flavorId) {
  crossedFlavors.value = crossedFlavors.value.filter(id => id !== flavorId)
}

function handleSecondaryInput() {
}

function getSecondaryTasteId(text) {
  const lower = text.toLowerCase()
  if (lower.includes('酸') && lower.includes('甜')) return 'neutralize'
  if (lower.includes('酸')) return 't1'
  if (lower.includes('甜')) return 't2'
  if (lower.includes('苦')) return 't3'
  if (lower.includes('辣')) return 't4'
  return null
}

function getTasteLevelId(levels) {
  const maxLevel = Math.max(levels.sour, levels.sweet, levels.bitter, levels.spicy)
  if (maxLevel >= 3) return 'h3'
  if (maxLevel >= 2) return 'h2'
  return 'h1'
}

function handleNext() {
  let flavorLevels = {
    sour: 1,
    sweet: 1,
    bitter: 0,
    spicy: 0
  }
  
  if (selectedMain.value) {
    flavorLevels[selectedMain.value] = 3
  }
  
  crossedFlavors.value.forEach(id => {
    flavorLevels[id] = 0
  })
  
  const secondary = secondaryText.value.toLowerCase()
  if (secondary.includes('酸') && !crossedFlavors.value.includes('sour')) {
    flavorLevels.sour = Math.min(flavorLevels.sour + 1, 3)
  }
  if (secondary.includes('甜') && !crossedFlavors.value.includes('sweet')) {
    flavorLevels.sweet = Math.min(flavorLevels.sweet + 1, 3)
  }
  if (secondary.includes('苦') && !crossedFlavors.value.includes('bitter')) {
    flavorLevels.bitter = Math.min(flavorLevels.bitter + 1, 3)
  }
  if (secondary.includes('辣') && !crossedFlavors.value.includes('spicy')) {
    flavorLevels.spicy = Math.min(flavorLevels.spicy + 1, 3)
  }
  
  if (flavorLevels.sour === 0 && flavorLevels.sweet === 0) {
    flavorLevels.sour = 1
    flavorLevels.sweet = 1
  }
  
  sessionStorage.setItem('flavorPreference', JSON.stringify({
    primaryTasteId: selectedMain.value ? (selectedMain.value === 'sour' ? 't1' : selectedMain.value === 'sweet' ? 't2' : selectedMain.value === 'bitter' ? 't3' : 't4') : 't1',
    secondaryTasteId: getSecondaryTasteId(secondaryText.value),
    refuseTasteIds: crossedFlavors.value.map(f => f === 'sour' ? 't1' : f === 'sweet' ? 't2' : f === 'bitter' ? 't3' : 't4'),
    tasteLevelId: selectedIntensity.value
  }))
  
  router.push('/result')
}
</script>

<style scoped>
.flavor-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.flavor-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: var(--card-bg);
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.flavor-card:active {
  transform: scale(0.98);
}

.flavor-card.selected {
  border-color: var(--secondary-color);
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.4);
}

.flavor-card.crossed {
  opacity: 0.4;
  border-color: #ccc;
  text-decoration: line-through;
}

.flavor-emoji {
  font-size: 32px;
  margin-bottom: 8px;
}

.flavor-text {
  font-size: 15px;
  color: var(--text-primary);
}

.cross-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
}

.warning-message {
  text-align: center;
  padding: 12px;
  color: #e74c3c;
  font-size: 14px;
  margin-bottom: 16px;
}

.intensity-section {
  margin-bottom: 24px;
}

.intensity-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-align: center;
}

.intensity-options {
  display: flex;
  gap: 12px;
}

.intensity-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: var(--card-bg);
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.intensity-btn:active {
  transform: scale(0.98);
}

.intensity-btn.intensity-selected {
  border-color: var(--secondary-color);
  background: rgba(52, 152, 219, 0.05);
}

.intensity-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.intensity-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.secondary-input {
  margin-bottom: 24px;
}

.secondary-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.secondary-text-input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 15px;
  background: var(--card-bg);
}

.secondary-text-input:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.next-btn {
  margin-top: auto;
}
</style>
