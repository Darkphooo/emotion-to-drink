import { createRouter, createWebHistory } from 'vue-router'
import EmotionInput from '../views/EmotionInput.vue'
import AlcoholLevel from '../views/AlcoholLevel.vue'
import FlavorPreference from '../views/FlavorPreference.vue'
import Result from '../views/Result.vue'

const routes = [
  { path: '/', name: 'emotion', component: EmotionInput },
  { path: '/alcohol', name: 'alcohol', component: AlcoholLevel },
  { path: '/flavor', name: 'flavor', component: FlavorPreference },
  { path: '/result', name: 'result', component: Result }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
