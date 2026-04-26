import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import EmotionInput from '../views/EmotionInput.vue'
import AlcoholLevel from '../views/AlcoholLevel.vue'
import FlavorPreference from '../views/FlavorPreference.vue'
import GlassType from '../views/GlassType.vue'
import IceType from '../views/IceType.vue'
import Result from '../views/Result.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/emotion', name: 'emotion', component: EmotionInput },
  { path: '/alcohol', name: 'alcohol', component: AlcoholLevel },
  { path: '/flavor', name: 'flavor', component: FlavorPreference },
  { path: '/glass', name: 'glass', component: GlassType },
  { path: '/ice', name: 'ice', component: IceType },
  { path: '/result', name: 'result', component: Result }
]

const router = createRouter({
  history: createWebHistory('/emotion-to-drink/'),
  routes
})

export default router
