<template>
  <div class="page-container fixed-height">
    <h1 class="page-title">今晚，你愿意走到哪一步？</h1>
    <p class="page-subtitle">
      不用考虑数字，只选择你能接受的感觉。
    </p>

    <div class="options-list">
      <button
        v-for="(option, index) in alcoholOptions"
        :key="index"
        class="option-card"
        :class="{ selected: selectedIndex === index }"
        @click="selectOption(index)"
      >
        <span class="option-emoji">{{ option.emoji }}</span>
        <span class="option-text">{{ option.text }}</span>
        <span class="option-range">{{ option.range }}</span>
      </button>
    </div>

    <button
      class="btn-primary next-btn"
      :disabled="selectedIndex === null"
      @click="handleNext"
    >
      下一步
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedIndex = ref(null)

const alcoholOptions = [
  { emoji: '1️⃣', text: '几乎感觉不到酒精，只是有点味道', range: '5-10%', id: 'g1' },
  { emoji: '2️⃣', text: '微醺刚刚好，还能保持清醒', range: '10-15%', id: 'g2' },
  { emoji: '3️⃣', text: '有明显酒感，但还能控制自己', range: '15-20%', id: 'g3' },
  { emoji: '4️⃣', text: '会有点上头，但我愿意', range: '20-25%', id: 'g4' }
]

function selectOption(index) {
  selectedIndex.value = index
}

function handleNext() {
  const selected = alcoholOptions[selectedIndex.value]
  sessionStorage.setItem('alcoholLevel', JSON.stringify({
    index: selected.id,
    text: selected.text,
    range: selected.range
  }))
  router.push('/flavor')
}
</script>

<style scoped>
.options-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.option-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--card-bg);
  border: 2px solid #e0e0e0;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-speed);
  text-align: left;
}

.option-card:active {
  transform: scale(0.98);
}

.option-card.selected {
  border-color: var(--secondary-color);
  background: rgba(52, 152, 219, 0.05);
}

.option-emoji {
  font-size: 20px;
  margin-right: 12px;
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
}

.option-range {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: #f0f0f0;
  border-radius: 12px;
}

.next-btn {
  margin-top: auto;
}
</style>
