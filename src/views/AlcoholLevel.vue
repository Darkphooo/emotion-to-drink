<template>
  <div class="page-container fixed-height" :class="{ 'page-transition': isTransitioning }">
    <h1 class="page-title glow-title">今晚，你愿意走到哪一步？</h1>
    <p class="page-subtitle">
      不用考虑数字，只选择你能接受的感觉。
    </p>

    <div class="options-list">
      <button
        v-for="(option, index) in alcoholOptions"
        :key="index"
        class="option-card"
        :class="{ 
          selected: selectedIndex === index,
          'other-dimmed': selectedIndex !== null && selectedIndex !== index
        }"
        :style="{ 
          '--progress-color': option.color,
          '--progress-depth': (index + 1) / alcoholOptions.length 
        }"
        @click="selectOption(index)"
      >
        <div class="progress-indicator"></div>
        <span class="option-text">{{ option.text }}</span>
        <span class="option-range">{{ option.range }}</span>
      </button>
    </div>

    <transition name="fade-up">
      <div v-if="feedbackMessage" class="feedback-message">
        {{ feedbackMessage }}
      </div>
    </transition>

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
const feedbackMessage = ref('')
const isTransitioning = ref(false)

const alcoholOptions = [
  { text: '几乎感觉不到酒精，只是有点味道', range: '5-10%', id: 'g1', color: 'rgba(116, 185, 255, 0.15)' },
  { text: '微醺刚刚好，还能保持清醒', range: '10-15%', id: 'g2', color: 'rgba(116, 185, 255, 0.25)' },
  { text: '有明显酒感，但还能控制自己', range: '15-20%', id: 'g3', color: 'rgba(116, 185, 255, 0.35)' },
  { text: '会有点上头，但我愿意', range: '20-25%', id: 'g4', color: 'rgba(116, 185, 255, 0.45)' }
]

const feedbackMessages = [
  '好的，我们会让它保持轻盈。',
  '明白，我们会让它保持在刚刚好的边缘。',
  '收到，我们会让它有明显的存在感。',
  '好的，我们会让它更有力量。'
]

function selectOption(index) {
  selectedIndex.value = index
  feedbackMessage.value = feedbackMessages[index]
}

function handleNext() {
  isTransitioning.value = true
  
  const selected = alcoholOptions[selectedIndex.value]
  sessionStorage.setItem('alcoholLevel', JSON.stringify({
    index: selected.id,
    text: selected.text,
    range: selected.range
  }))
  
  setTimeout(() => {
    router.push('/flavor')
  }, 600)
}
</script>

<style scoped>
.page-container {
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
}

.glow-title {
  text-shadow: 0 0 15px rgba(116, 185, 255, 0.6);
  animation: glow 3s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow: 0 0 10px rgba(116, 185, 255, 0.6);
  }
  to {
    text-shadow: 0 0 20px rgba(116, 185, 255, 0.8), 0 0 30px rgba(116, 185, 255, 0.4);
  }
}

.page-transition {
  animation: pageFadeOut 0.6s ease-out forwards;
}

@keyframes pageFadeOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.options-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.option-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 16px 16px 16px 20px;
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.progress-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(180deg, #74b9ff, #a29bfe);
  transition: all 0.3s ease;
  opacity: 0.7;
}

.option-card:hover {
  transform: translateY(-2px) scale(1.02);
  background: rgba(27, 39, 53, 0.8);
  box-shadow: 0 4px 20px rgba(116, 185, 255, 0.2);
}

.option-card:hover .progress-indicator {
  width: 6px;
  opacity: 1;
}

.option-card.selected {
  border-color: rgba(116, 185, 255, 0.5);
  background: rgba(116, 185, 255, 0.1);
  box-shadow: 0 0 0 2px rgba(116, 185, 255, 0.3), 0 4px 20px rgba(116, 185, 255, 0.2);
}

.option-card.selected .progress-indicator {
  width: 6px;
  opacity: 1;
  background: linear-gradient(180deg, #a29bfe, #00cec9);
}

.option-card.other-dimmed {
  opacity: 0.5;
  transform: scale(0.98);
}

.option-text {
  flex: 1;
  font-size: 15px;
  color: #fff;
  padding-left: 8px;
  transition: all 0.3s ease;
}

.option-card:hover .option-text {
  font-size: 15.3px;
}

.option-range {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.option-card:hover .option-range {
  background: rgba(116, 185, 255, 0.1);
  border-color: rgba(116, 185, 255, 0.3);
}

.feedback-message {
  text-align: center;
  padding: 16px;
  color: rgba(116, 185, 255, 0.9);
  font-size: 15px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5);
  opacity: 0.9;
  font-style: italic;
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}

.fade-up-enter-active,
.fade-up-leave-active {
  transition: all 0.4s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.next-btn {
  margin-top: auto;
  background: linear-gradient(135deg, rgba(116, 185, 255, 0.8), rgba(162, 155, 254, 0.8));
  box-shadow: 0 4px 15px rgba(116, 185, 255, 0.3);
  transition: all 0.3s ease;
}

.next-btn:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(116, 185, 255, 0.4);
  transform: translateY(-2px);
}

.next-btn:active:not(:disabled) {
  transform: translateY(0);
}
</style>
