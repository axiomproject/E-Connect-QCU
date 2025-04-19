<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import "../src/styles/Layout.css"  // Fix the import path

const isLoggedIn = ref(false)
const route = useRoute()
const router = useRouter()
const previousRoute = ref('')
const authStore = useAuthStore()

// Determine transition type based on route
const transitionName = computed(() => {
  // Auth routes (login/register)
  if (route.path === '/login' || route.path === '/register') {
    return 'auth-page'
  }
  
  // Dashboard transition (when coming from login)
  if (route.path === '/dashboard' && 
      (previousRoute.value === '/login' || previousRoute.value === '/register')) {
    return 'login-to-dashboard'
  }
  
  // Default - no transition
  return ''
})

// Store previous route to determine transition direction
watch(() => route.path, (newPath, oldPath) => {
  previousRoute.value = oldPath
})

// Check login status and admin status on mount
onMounted(() => {
  const token = localStorage.getItem('token')
  isLoggedIn.value = token !== null
  
  // Make sure admin status in store matches localStorage
  if (isLoggedIn.value) {
    const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true'
    if (isAdminFromStorage && !authStore.isAdmin) {
      console.log('Restoring admin status from localStorage')
      // This ensures the store has the right admin status after a page refresh
      authStore.isAdmin = isAdminFromStorage
    }
  }
})
</script>

<template>
  <!-- Enhanced transition system -->
  <router-view v-slot="{ Component, route }">
    <transition 
      :name="transitionName" 
      mode="out-in"
    >
      <component :is="Component" :key="route.path" />
    </transition>
  </router-view>
</template>

<style>
/* Auth page transitions */
.auth-page-enter-active,
.auth-page-leave-active {
  transition: all 0.2s ease-out;
}

.auth-page-enter-from {
  opacity: 0;
  transform: translateX(50px);
}

.auth-page-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}

/* Login to Dashboard transition */
.login-to-dashboard-enter-active,
.login-to-dashboard-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.login-to-dashboard-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.login-to-dashboard-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Add a subtle fade transition for all other page changes */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

