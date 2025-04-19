import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router' // Make sure we're using the correct router

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
