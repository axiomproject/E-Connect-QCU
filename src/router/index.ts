import { createRouter, createWebHistory, RouteLocationNormalized, NavigationGuardNext, RouteRecordRaw } from 'vue-router'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import VerifyEmail from '../components/VerifyEmail.vue'
import Dashboard from '../components/Dashboard.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      if (localStorage.getItem('token')) {
        return next('/dashboard')
      }
      next()
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    beforeEnter: (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
      if (localStorage.getItem('token')) {
        return next('/dashboard')
      }
      next()
    }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  console.log('Navigation to:', to.path)
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    console.log('Auth required, checking token...')
    const token = localStorage.getItem('token')
    
    if (!token) {
      console.log('No token found, redirecting to login')
      return next({ path: '/login' })
    } else {
      console.log('Token found, proceeding to route')
      return next()
    }
  } else {
    return next()
  }
})

export default router
