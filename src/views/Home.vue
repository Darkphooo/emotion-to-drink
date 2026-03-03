<template>
  <div class="page-container home-page">
    <div class="particles-container">
      <div v-for="i in 80" :key="i" class="particle" :style="getParticleStyle(i)"></div>
    </div>

    <button class="library-btn" @click="showLibrary = true">
      My Library
    </button>

    <div class="main-content">
      <div class="title-section">
        <h1 class="main-title">Emotion to Drink</h1>
        <p class="subtitle">发现属于你的完美配方</p>
      </div>

      <div class="start-button-container">
        <svg class="blob-shape" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path class="blob-path" d="M47.5,-57.2C59.9,-47.3,67.5,-31.1,71.1,-13.6C74.7,3.9,74.3,22.7,66.1,37.2C57.9,51.7,42,61.9,24.8,67.1C7.6,72.3,-10.9,72.5,-27.2,65.6C-43.5,58.7,-57.6,44.7,-65.4,27.5C-73.2,10.3,-74.7,-10.1,-68.1,-27.3C-61.5,-44.5,-46.8,-58.5,-30.2,-67.1C-13.6,-75.7,4.9,-78.9,21.8,-74.4C38.7,-69.9,54,-57.8,47.5,-57.2Z" transform="translate(100 100)" />
        </svg>
        <button class="start-btn" @click="handleStart">
          Start Mixing
        </button>
      </div>
    </div>

    <div v-if="showLibrary" class="library-modal" @click.self="showLibrary = false">
      <div class="library-content">
        <div class="library-header">
          <h2>My Library</h2>
          <button class="close-btn" @click="showLibrary = false">×</button>
        </div>
        <div class="library-tabs">
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'favorites' }"
            @click="activeTab = 'favorites'"
          >
            ❤️ 我的最爱
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            📚 历史记录
          </button>
        </div>
        <div v-if="currentList.length === 0" class="empty-library">
          {{ activeTab === 'favorites' ? '暂无收藏' : '暂无历史记录' }}
        </div>
        <div v-else class="library-list">
          <div v-for="(item, index) in currentList" :key="index" class="library-item">
            <div class="library-item-header">
              <span class="library-date">{{ item.date }}</span>
              <div class="library-actions">
                <button 
                  class="favorite-btn" 
                  :class="{ active: item.favorite }"
                  @click="toggleFavorite(index)"
                >
                  {{ item.favorite ? '❤️' : '🤍' }}
                </button>
                <button class="delete-btn" @click="deleteItem(index)">
                  🗑️
                </button>
              </div>
            </div>
            <div class="library-item-content">
              <p class="library-emotion">心情：{{ item.emotion }}</p>
              <p class="library-recipe">配方：{{ item.recipeName }}</p>
              <p class="library-alcohol">酒精度：{{ item.alcohol }}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const showLibrary = ref(false)
const activeTab = ref('favorites')
const historyList = ref([])
const favoritesList = ref([])
const currentHour = ref(new Date().getHours())

let timeInterval = null

const timeOfDay = computed(() => {
  const hour = currentHour.value
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'night'
})

const particleColors = computed(() => {
  const time = timeOfDay.value
  const colors = {
    morning: ['#74b9ff', '#a29bfe', '#fd79a8', '#fdcb6e', '#81ecec'],
    afternoon: ['#3498db', '#9b59b6', '#e74c3c', '#f39c12', '#1abc9c'],
    evening: ['#6c5ce7', '#a29bfe', '#fd79a8', '#e17055', '#00cec9'],
    night: ['#0984e3', '#6c5ce7', '#00b894', '#ffeaa7', '#81ecec']
  }
  return colors[time]
})

function getParticleStyle(index) {
  const size = Math.random() * 6 + 2
  const left = Math.random() * 100
  const top = Math.random() * 100
  const colorIndex = Math.floor(Math.random() * particleColors.value.length)
  const color = particleColors.value[colorIndex]
  const duration = Math.random() * 15 + 15
  const delay = Math.random() * 5
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    top: `${top}%`,
    background: `radial-gradient(circle, ${color}, transparent)`,
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`
  }
}

const currentList = computed(() => {
  if (activeTab.value === 'favorites') {
    return favoritesList.value
  }
  return historyList.value
})

function handleStart() {
  router.push('/emotion')
}

function toggleFavorite(index) {
  const item = currentList.value[index]
  if (activeTab.value === 'favorites') {
    const favIndex = favoritesList.value.findIndex(f => f.id === item.id && f.name === item.name)
    if (favIndex !== -1) {
      favoritesList.value.splice(favIndex, 1)
      localStorage.setItem('drinkFavorites', JSON.stringify(favoritesList.value))
    }
  } else {
    const existingFavIndex = favoritesList.value.findIndex(f => f.id === item.id && f.name === item.name)
    if (existingFavIndex === -1) {
      const itemWithFavorite = { ...item, favorite: true }
      favoritesList.value.push(itemWithFavorite)
      localStorage.setItem('drinkFavorites', JSON.stringify(favoritesList.value))
    } else {
      favoritesList.value.splice(existingFavIndex, 1)
      localStorage.setItem('drinkFavorites', JSON.stringify(favoritesList.value))
    }
  }
}

function deleteItem(index) {
  const item = currentList.value[index]
  if (activeTab.value === 'favorites') {
    const favIndex = favoritesList.value.findIndex(f => f.id === item.id && f.name === item.name)
    if (favIndex !== -1) {
      favoritesList.value.splice(favIndex, 1)
      localStorage.setItem('drinkFavorites', JSON.stringify(favoritesList.value))
    }
  } else {
    const histIndex = historyList.value.findIndex(h => h.id === item.id && h.name === item.name)
    if (histIndex !== -1) {
      historyList.value.splice(histIndex, 1)
      localStorage.setItem('drinkHistory', JSON.stringify(historyList.value))
    }
  }
}

function loadHistory() {
  const saved = localStorage.getItem('drinkHistory')
  if (saved) {
    historyList.value = JSON.parse(saved)
  }
  const savedFavorites = localStorage.getItem('drinkFavorites')
  if (savedFavorites) {
    favoritesList.value = JSON.parse(savedFavorites)
  }
}

function updateTime() {
  currentHour.value = new Date().getHours()
}

onMounted(() => {
  loadHistory()
  updateTime()
  timeInterval = setInterval(updateTime, 60000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.home-page {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  filter: blur(2px);
  animation: floatParticle linear infinite;
  pointer-events: none;
}

@keyframes floatParticle {
  0%, 100% {
    transform: translate(0, 0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translate(calc(100vw - 100vw * var(--random-x, 0.5)), calc(100vh - 100vh * var(--random-y, 0.5))) scale(0);
    opacity: 0;
  }
}

.library-btn {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  letter-spacing: 1px;
}

.library-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.main-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
}

.title-section {
  margin-bottom: 60px;
}

.main-title {
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
  text-shadow: 0 0 30px rgba(116, 185, 255, 0.5);
  letter-spacing: -1px;
}

.subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.start-button-container {
  position: relative;
  display: inline-block;
}

.blob-shape {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 280px;
  height: 280px;
  opacity: 0.3;
  animation: blobMorph 8s ease-in-out infinite;
}

.blob-path {
  fill: rgba(116, 185, 255, 0.2);
  backdrop-filter: blur(10px);
}

@keyframes blobMorph {
  0%, 100% {
    d: path("M47.5,-57.2C59.9,-47.3,67.5,-31.1,71.1,-13.6C74.7,3.9,74.3,22.7,66.1,37.2C57.9,51.7,42,61.9,24.8,67.1C7.6,72.3,-10.9,72.5,-27.2,65.6C-43.5,58.7,-57.6,44.7,-65.4,27.5C-73.2,10.3,-74.7,-10.1,-68.1,-27.3C-61.5,-44.5,-46.8,-58.5,-30.2,-67.1C-13.6,-75.7,4.9,-78.9,21.8,-74.4C38.7,-69.9,54,-57.8,47.5,-57.2Z");
  }
  25% {
    d: path("M55.4,-58.1C69.4,-47.1,77.1,-28.4,77.2,-9.5C77.3,9.4,69.8,28.5,57.2,42.6C44.6,56.7,26.9,65.8,8.1,70.4C-10.7,75,-30.6,75.1,-46.5,66.4C-62.4,57.7,-74.3,40.2,-78.3,21.2C-82.3,2.2,-78.4,-18.3,-68.3,-35.1C-58.2,-51.9,-41.9,-65,-24.2,-72.1C-6.5,-79.2,12.6,-80.3,30.4,-74.8C48.2,-69.3,64.7,-57.2,55.4,-58.1Z");
  }
  50% {
    d: path("M44.3,-52.1C56.1,-42.3,63.6,-27.1,67.4,-10.4C71.2,6.3,71.3,24.5,63.4,39.1C55.5,53.7,39.6,64.7,22.2,69.7C4.8,74.7,-14.1,73.7,-30.7,66.6C-47.3,59.5,-61.6,46.3,-69.1,29.8C-76.6,13.3,-77.3,-6.5,-71.3,-23.7C-65.3,-40.9,-52.6,-55.5,-37.7,-64.5C-22.8,-73.5,-5.7,-76.9,8.8,-73.9C23.3,-70.9,38.4,-61.5,44.3,-52.1Z");
  }
  75% {
    d: path("M51.1,-60.2C64.4,-49.9,73.3,-33.1,75.6,-15.2C77.9,2.7,73.6,21.7,64.1,37.3C54.6,52.9,39.9,65.1,23.1,70.7C6.3,76.3,-12.6,75.3,-29.3,68.4C-46,61.5,-60.5,48.7,-68.5,32.3C-76.5,15.9,-78,-4,-72.3,-21.5C-66.6,-39,-53.7,-54.1,-38.4,-63.9C-23.1,-73.7,-5.4,-78.2,10.3,-75.6C26,-73,41.8,-63.3,51.1,-60.2Z");
  }
}

.start-btn {
  position: relative;
  padding: 24px 48px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(116, 185, 255, 0.4);
  border-color: rgba(255, 255, 255, 0.4);
}

.start-btn:active {
  transform: scale(0.98);
}

.library-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(9, 10, 15, 0.9);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.library-content {
  background: rgba(27, 39, 53, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--border-radius);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.library-header h2 {
  font-size: 20px;
  color: #fff;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #fff;
  transform: rotate(90deg);
}

.library-tabs {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: rgba(116, 185, 255, 0.2);
  border-color: rgba(116, 185, 255, 0.4);
  color: #fff;
}

.tab-btn:hover:not(.active) {
  background: rgba(255, 255, 255, 0.1);
}

.empty-library {
  padding: 40px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.library-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.library-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  transition: all 0.3s ease;
}

.library-item:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateX(4px);
}

.library-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.library-date {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.library-actions {
  display: flex;
  gap: 8px;
}

.favorite-btn,
.delete-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px;
}

.favorite-btn:hover,
.delete-btn:hover {
  transform: scale(1.2);
}

.library-item-content p {
  font-size: 14px;
  color: #fff;
  margin-bottom: 4px;
}

.library-emotion {
  font-style: italic;
  color: rgba(255, 255, 255, 0.6) !important;
}

.library-recipe {
  font-weight: 500;
  color: #74b9ff !important;
}

.library-alcohol {
  font-size: 12px !important;
  color: rgba(255, 255, 255, 0.6) !important;
}

@media (max-width: 768px) {
  .main-title {
    font-size: 36px;
  }
  
  .subtitle {
    font-size: 16px;
  }
  
  .start-btn {
    padding: 20px 40px;
    font-size: 18px;
  }
  
  .blob-shape {
    width: 240px;
    height: 240px;
  }
}
</style>
