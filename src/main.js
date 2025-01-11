import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'

const app = createApp(App)

// 修改 axios 配置，移除 baseURL 中的 /api
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''  // 移除 '/api'
axios.defaults.withCredentials = true

app.use(router)
app.mount('#app') 