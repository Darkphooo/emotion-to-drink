<template>
  <div class="page-container">
    <div v-if="!recipe" class="loading">
      正在计算配方...
    </div>
    <div v-else class="result-card">
      <h1 class="result-title">调酒配方</h1>
      <p class="result-description">根据您的心情和偏好为您推荐</p>

      <div class="result-stats">
        <div class="stat-item">
          <span class="stat-label">酒精度</span>
          <span class="stat-value">{{ recipe.alcoholContent }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总量</span>
          <span class="stat-value">{{ recipe.totalVolume }}ml</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">制作方法</span>
          <span class="stat-value">{{ recipe.methodName }}</span>
        </div>
      </div>

      <div class="ingredients-section">
        <h2 class="section-title">配方原料</h2>
        <ul class="ingredients-list">
          <li v-for="(ing, id) in recipe.materials" :key="id" class="ingredient-item">
            <span class="ingredient-name">{{ ing.name }}</span>
            <span class="ingredient-amount">
              {{ ing.volume }}{{ ing.unit === '滴' ? '滴' : 'ml' }}
            </span>
          </li>
        </ul>
      </div>

      <div class="method-section">
        <h2 class="section-title">制作说明</h2>
        <ol class="method-steps">
          <li v-for="(step, index) in recipe.detail" :key="index">
            {{ step }}
          </li>
        </ol>
      </div>

      <div class="flavor-section">
        <h2 class="section-title">口感特征</h2>
        <div class="flavor-bars">
          <div class="flavor-bar">
            <span class="flavor-label">酸</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (getTasteLevel(recipe.tasteRatio.sourLevel) / 3 * 100) + '%' }">
              </div>
            </div>
          </div>
          <div class="flavor-bar">
            <span class="flavor-label">甜</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (getTasteLevel(recipe.tasteRatio.sweetLevel) / 3 * 100) + '%' }">
              </div>
            </div>
          </div>
          <div class="flavor-bar">
            <span class="flavor-label">苦</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (getTasteLevel(recipe.tasteRatio.bitterLevel) / 3 * 100) + '%' }">
              </div>
            </div>
          </div>
          <div class="flavor-bar">
            <span class="flavor-label">辣</span>
            <div class="bar-track">
              <div class="bar-fill" :style="{ width: (getTasteLevel(recipe.tasteRatio.spicyLevel) / 3 * 100) + '%' }">
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-secondary favorite-btn-main" @click="toggleFavorite">
          <span v-if="!isFavorite">❤️ 收藏到我的最爱</span>
          <span v-else>💔 取消收藏</span>
        </button>
      </div>
    </div>

    <button class="btn-primary restart-btn" @click="handleRestart">
      重新开始
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { calculateRecipe } from '../utils/recipeEngine'

const router = useRouter()
const recipe = ref(null)
const isFavorite = ref(false)
const currentHistoryIndex = ref(-1)

function getTasteLevel(level) {
  if (!level) return 0
  return parseInt(level.replace('h', ''))
}

function saveToHistory() {
  const emotionText = sessionStorage.getItem('emotionText') || ''
  const alcoholData = sessionStorage.getItem('alcoholLevel')
  const alcoholIndex = alcoholData ? JSON.parse(alcoholData).index : ''
  
  const historyItem = {
    date: new Date().toLocaleString('zh-CN'),
    emotion: emotionText.substring(0, 30) + (emotionText.length > 30 ? '...' : ''),
    recipeName: recipe.value.methodName,
    alcohol: recipe.value.alcoholContent,
    alcoholIndex: alcoholIndex,
    recipe: recipe.value,
    favorite: false
  }
  
  const saved = localStorage.getItem('drinkHistory')
  let historyList = saved ? JSON.parse(saved) : []
  historyList.unshift(historyItem)
  currentHistoryIndex.value = 0
  localStorage.setItem('drinkHistory', JSON.stringify(historyList))
}

function toggleFavorite() {
  const savedFavorites = localStorage.getItem('drinkFavorites')
  let favoritesList = savedFavorites ? JSON.parse(savedFavorites) : []
  
  const emotionText = sessionStorage.getItem('emotionText') || ''
  const emotionKey = emotionText.substring(0, 30) + (emotionText.length > 30 ? '...' : '')
  const recipeName = recipe.value.methodName
  
  const existingIndex = favoritesList.findIndex(f => 
    f.emotion === emotionKey && f.recipeName === recipeName
  )
  
  if (existingIndex !== -1) {
    favoritesList.splice(existingIndex, 1)
    isFavorite.value = false
  } else {
    const historySaved = localStorage.getItem('drinkHistory')
    const historyList = historySaved ? JSON.parse(historySaved) : []
    const historyItem = historyList.find(h => h.emotion === emotionKey && h.recipeName === recipeName)
    
    if (historyItem) {
      favoritesList.unshift({ ...historyItem, favorite: true })
    } else {
      const alcoholData = sessionStorage.getItem('alcoholLevel')
      const alcoholIndex = alcoholData ? JSON.parse(alcoholData).index : ''
      favoritesList.unshift({
        date: new Date().toLocaleString('zh-CN'),
        emotion: emotionKey,
        recipeName: recipeName,
        alcohol: recipe.value.alcoholContent,
        alcoholIndex: alcoholIndex,
        recipe: recipe.value,
        favorite: true
      })
    }
    isFavorite.value = true
  }
  
  localStorage.setItem('drinkFavorites', JSON.stringify(favoritesList))
}

function checkIfFavorite() {
  const savedFavorites = localStorage.getItem('drinkFavorites')
  if (!savedFavorites) return
  
  const favoritesList = JSON.parse(savedFavorites)
  const emotionText = sessionStorage.getItem('emotionText') || ''
  const emotionKey = emotionText.substring(0, 30) + (emotionText.length > 30 ? '...' : '')
  
  const index = favoritesList.findIndex(item => 
    item.emotion === emotionKey &&
    item.recipeName === recipe.value.methodName
  )
  
  if (index !== -1) {
    isFavorite.value = true
  }
}

onMounted(async () => {
  const emotionText = sessionStorage.getItem('emotionText') || ''
  const alcoholData = sessionStorage.getItem('alcoholLevel')
  const flavorData = sessionStorage.getItem('flavorPreference')

  if (!emotionText || !alcoholData || !flavorData) {
    router.push('/')
    return
  }

  const alcoholIndex = JSON.parse(alcoholData).index
  const flavorPreference = JSON.parse(flavorData)

  recipe.value = await calculateRecipe(emotionText, alcoholIndex, flavorPreference, true)
  
  saveToHistory()
  checkIfFavorite()
})

function handleRestart() {
  sessionStorage.clear()
  router.push('/')
}
</script>

<style scoped>
.page-container {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.result-card {
  background: rgba(27, 39, 53, 0.6);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: #74b9ff;
  margin-bottom: 8px;
  text-shadow: 0 0 15px rgba(116, 185, 255, 0.5);
}

.result-description {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #74b9ff;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #74b9ff;
}

.ingredients-section {
  margin-bottom: 24px;
}

.ingredients-list {
  list-style: none;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.ingredient-name {
  font-size: 15px;
  color: #fff;
}

.ingredient-amount {
  font-size: 15px;
  font-weight: 500;
  color: #a29bfe;
}

.method-section {
  margin-bottom: 24px;
}

.method-steps {
  padding-left: 20px;
}

.method-steps li {
  font-size: 14px;
  color: #fff;
  margin-bottom: 6px;
  line-height: 1.4;
}

.flavor-section {
  margin-bottom: 24px;
}

.flavor-bars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flavor-bar {
  display: flex;
  align-items: center;
}

.flavor-label {
  width: 30px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.bar-track {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #a29bfe, #00cec9);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.btn-secondary {
  flex: 1;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(116, 185, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 185, 255, 0.2);
}

.favorite-btn-main {
  background: rgba(116, 185, 255, 0.1);
  border-color: rgba(116, 185, 255, 0.3);
}

.favorite-btn-main:hover {
  background: rgba(116, 185, 255, 0.2);
  box-shadow: 0 4px 12px rgba(116, 185, 255, 0.3);
}

.restart-btn {
  margin-top: 24px;
}
</style>
