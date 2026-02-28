<template>
  <div class="page-container fixed-height">
    <h1 class="page-title">今晚，你希望这杯酒陪你走进什么样的片刻？</h1>
    <p class="page-subtitle">
      可以写一句完整的话。比如：<br>
      "想慢慢放松下来，不想太吵。"<br>
      "庆祝一下，但不想太失控。"<br>
      "一个人待着，但希望有点陪伴感。"<br>
      不用写得很好，只要真实。
    </p>

    <div class="input-area">
      <textarea
        v-model="emotionText"
        class="emotion-input"
        placeholder="写下此刻的状态，而不是你想喝什么..."
        @input="handleInput"
      ></textarea>
    </div>

    <div class="inspiration-cards">
      <p class="inspiration-label">或选择一个灵感</p>
      <div class="cards-row">
        <button
          v-for="card in inspirationCards"
          :key="card"
          class="inspiration-card"
          @click="selectCard(card)"
        >
          {{ card }}
        </button>
      </div>
    </div>

    <transition name="fade">
      <div v-if="showFeedback" class="feedback-message">
        收到。我们会围绕这个状态来构建。
      </div>
    </transition>

    <button
      class="btn-primary next-btn"
      :disabled="!canProceed"
      @click="handleNext"
    >
      下一步
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const emotionText = ref('')
const showFeedback = ref(false)

const inspirationCards = [
  '想慢一点',
  '想亮一点',
  '想有点重量',
  '想轻轻逃开',
  '想有人陪'
]

const canProceed = computed(() => {
  return emotionText.value.trim().length > 0
})

function handleInput() {
}

function selectCard(text) {
  emotionText.value = text
}

function handleNext() {
  showFeedback.value = true
  
  sessionStorage.setItem('emotionText', emotionText.value)
  
  setTimeout(() => {
    router.push('/alcohol')
  }, 800)
}
</script>

<style scoped>
.input-area {
  margin-bottom: 24px;
}

.emotion-input {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: var(--border-radius);
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  background: var(--card-bg);
  transition: border-color var(--transition-speed);
}

.emotion-input:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.emotion-input::placeholder {
  color: #bbb;
}

.inspiration-cards {
  margin-bottom: 32px;
}

.inspiration-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  text-align: center;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.inspiration-card {
  padding: 10px 16px;
  background: rgba(52, 152, 219, 0.1);
  border: 1px solid rgba(52, 152, 219, 0.2);
  border-radius: 20px;
  font-size: 14px;
  color: var(--secondary-color);
  cursor: pointer;
  transition: all var(--transition-speed);
}

.inspiration-card:active {
  background: rgba(52, 152, 219, 0.2);
  transform: scale(0.95);
}

.feedback-message {
  text-align: center;
  padding: 12px;
  color: var(--secondary-color);
  font-size: 15px;
  margin-bottom: 20px;
}

.next-btn {
  margin-top: auto;
}
</style>
