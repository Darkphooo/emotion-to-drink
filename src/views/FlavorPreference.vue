<template>
  <div class="page-container fixed-height">
    <h1 class="page-title">这杯酒，你希望哪种味道更明显一点？</h1>
    <p class="page-subtitle">
      点击选择主要口味，点击右上角 × 划掉不想要的口味。
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
      >
        <button
          v-if="selectedMain !== flavor.id && !crossedFlavors.includes(flavor.id)"
          class="cross-btn"
          @click.stop="handleCross(flavor.id)"
        >
          ×
        </button>
        <span class="flavor-emoji">{{ flavor.emoji }}</span>
        <span class="flavor-text">{{ flavor.text }}</span>
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
      <div class="secondary-options">
        <button
          v-for="option in secondaryOptions"
          :key="option.id"
          class="secondary-btn"
          :class="{ 'secondary-selected': selectedSecondary === option.id }"
          @click="selectedSecondary = option.id"
        >
          {{ option.text }}
        </button>
      </div>
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

const secondaryOptions = [
  { id: 'sour', text: '酸' },
  { id: 'sweet', text: '甜' },
  { id: 'bitter', text: '苦' },
  { id: 'spicy', text: '辣' },
  { id: 'balance', text: '酸甜平衡' }
]

const selectedMain = ref(null)
const selectedIntensity = ref('h2')
const selectedSecondary = ref(null)
const crossedFlavors = ref([])
const showWarning = ref(false)

function handleCardClick(flavorId) {
  if (crossedFlavors.value.includes(flavorId)) {
    handleUncross(flavorId)
    return
  }
  
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

function getSecondaryTasteId(optionId) {
  if (optionId === 'sour') return 't1'
  if (optionId === 'sweet') return 't2'
  if (optionId === 'bitter') return 't3'
  if (optionId === 'spicy') return 't4'
  if (optionId === 'balance') return 'neutralize'
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
  
  if (selectedSecondary.value && selectedSecondary.value !== 'balance') {
    const tasteMap = { sour: 'sour', sweet: 'sweet', bitter: 'bitter', spicy: 'spicy' }
    const tasteKey = tasteMap[selectedSecondary.value]
    if (tasteKey && !crossedFlavors.value.includes(tasteKey)) {
      flavorLevels[tasteKey] = Math.min(flavorLevels[tasteKey] + 1, 3)
    }
  }
  
  if (flavorLevels.sour === 0 && flavorLevels.sweet === 0) {
    flavorLevels.sour = 1
    flavorLevels.sweet = 1
  }
  
  sessionStorage.setItem('flavorPreference', JSON.stringify({
    primaryTasteId: selectedMain.value ? (selectedMain.value === 'sour' ? 't1' : selectedMain.value === 'sweet' ? 't2' : selectedMain.value === 'bitter' ? 't3' : 't4') : 't1',
    secondaryTasteId: getSecondaryTasteId(selectedSecondary.value),
    refuseTasteIds: crossedFlavors.value.map(f => f === 'sour' ? 't1' : f === 'sweet' ? 't2' : f === 'bitter' ? 't3' : 't4'),
    tasteLevelId: selectedIntensity.value
  }))
  
  router.push('/result')
}
</script>

<style scoped>
.page-container {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

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
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.flavor-card:active {
  transform: scale(0.98);
}

.flavor-card.selected {
  border-color: rgba(116, 185, 255, 0.5);
  box-shadow: 0 0 20px rgba(116, 185, 255, 0.3), 0 4px 16px rgba(0, 0, 0, 0.3);
  background: rgba(116, 185, 255, 0.1);
}

.flavor-card.crossed {
  opacity: 0.4;
  border-color: rgba(255, 255, 255, 0.1);
  text-decoration: line-through;
}

.flavor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.2);
}

.flavor-emoji {
  font-size: 32px;
  margin-bottom: 8px;
}

.flavor-text {
  font-size: 15px;
  color: #fff;
}

.cross-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(231, 76, 60, 0.8);
  color: white;
  border-radius: 50%;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.8;
  transition: all 0.3s ease;
}

.cross-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.warning-message {
  text-align: center;
  padding: 12px;
  color: #ff6b6b;
  font-size: 14px;
  margin-bottom: 16px;
}

.intensity-section {
  margin-bottom: 24px;
}

.intensity-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
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
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.intensity-btn:active {
  transform: scale(0.98);
}

.intensity-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.2);
}

.intensity-btn.intensity-selected {
  border-color: rgba(116, 185, 255, 0.5);
  background: rgba(116, 185, 255, 0.1);
}

.intensity-text {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.intensity-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.secondary-input {
  margin-bottom: 24px;
}

.secondary-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.secondary-options {
  display: flex;
  gap: 8px;
}

.secondary-btn {
  flex: 1;
  padding: 10px 4px;
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  font-size: 14px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.secondary-btn:active {
  transform: scale(0.98);
}

.secondary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.2);
}

.secondary-btn.secondary-selected {
  border-color: rgba(116, 185, 255, 0.5);
  background: rgba(116, 185, 255, 0.1);
  color: #74b9ff;
}

.next-btn {
  margin-top: auto;
}
</style>
