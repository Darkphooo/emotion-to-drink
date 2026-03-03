<template>
  <div class="page-container fixed-height">
    <h1 class="page-title glow-title">今晚，你希望这杯酒陪你走进什么样的片刻？</h1>

    <div class="input-area">
      <textarea
        v-model="emotionText"
        class="emotion-input diary-page"
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

.input-area {
  margin: 24px 0;
}

.emotion-input {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  background: rgba(27, 39, 53, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius);
  font-size: 16px;
  line-height: 1.6;
  resize: none;
  transition: all 0.3s ease;
  font-family: inherit;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.emotion-input:focus {
  outline: none;
  border-color: rgba(116, 185, 255, 0.5);
  box-shadow: 0 0 20px rgba(116, 185, 255, 0.2), 0 4px 16px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
  background: rgba(27, 39, 53, 0.7);
}

.emotion-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.inspiration-cards {
  margin-bottom: 32px;
}

.inspiration-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
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
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  font-size: 14px;
  color: rgba(116, 185, 255, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.inspiration-card::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(116, 185, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.inspiration-card:hover::before {
  width: 150px;
  height: 150px;
}

.inspiration-card:hover {
  background: rgba(116, 185, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(116, 185, 255, 0.2);
  border-color: rgba(116, 185, 255, 0.3);
}

.inspiration-card:active {
  transform: scale(0.95);
}

.feedback-message {
  text-align: center;
  padding: 12px;
  color: rgba(116, 185, 255, 0.9);
  font-size: 15px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(116, 185, 255, 0.5);
  animation: fadeInUp 0.5s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.next-btn {
  margin-top: auto;
}

@media (max-width: 480px) {
  .sticky-note {
    max-width: calc(50% - 6px);
  }
  
  .sticky-note.hint {
    max-width: 100%;
  }
}
</style>
