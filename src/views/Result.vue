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

function getTasteLevel(level) {
  if (!level) return 0
  return parseInt(level.replace('h', ''))
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
})

function handleRestart() {
  sessionStorage.clear()
  router.push('/')
}
</script>

<style scoped>
.result-card {
  background: var(--card-bg);
  border-radius: var(--border-radius);
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
  font-size: 16px;
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.result-description {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 24px;
  line-height: 1.5;
}

.result-stats {
  display: flex;
  justify-content: space-around;
  padding: 16px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--primary-color);
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
  border-bottom: 1px dashed #eee;
}

.ingredient-name {
  font-size: 15px;
  color: var(--text-primary);
}

.ingredient-amount {
  font-size: 15px;
  font-weight: 500;
  color: var(--secondary-color);
}

.method-section {
  margin-bottom: 24px;
}

.method-steps {
  padding-left: 20px;
}

.method-steps li {
  font-size: 14px;
  color: var(--text-primary);
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
  color: var(--text-secondary);
}

.bar-track {
  flex: 1;
  height: 8px;
  background: #eee;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--secondary-color), #5dade2);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.restart-btn {
  margin-top: 24px;
}
</style>
