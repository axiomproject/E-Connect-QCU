import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import Dashboard from './components/Dashboard.vue'
import VerifyEmail from './components/VerifyEmail.vue' // Import VerifyEmail component
import ResetPassword from './components/ResetPassword.vue' // Import ResetPassword component
import { useAuthStore } from './stores/auth'
import RecyclingGuide from './components/RecyclingGuide.vue'
import Challenges from './components/Challenges.vue'
import PersonalizedGoal from './components/PersonalizedGoal.vue'
import Calculator from './components/CarbonCalculator.vue'
import Leaderboard from './components/Leaderboard.vue'
import Reward from './components/Reward.vue'
import Profile from './components/Profile.vue'
import Settings from './components/Settings.vue'
import AdminDashboard from './components/Admin/AdminDashboard.vue'
import AdminUsers from './components/Admin/AdminUsers.vue'
import AdminSettings from './components/Admin/AdminSettings.vue'
import AdminContact from './components/Admin/AdminContact.vue'
import AdminChallenges from './components/Admin/AdminChallenges.vue'
import AdminBadges from './components/Admin/AdminBadges.vue'

// Create routes with proper components
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/Login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/Register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/verify-email',  // Add the verify-email route (note the lowercase)
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { requiresAuth: false }
  },
  {
    path: '/reset-password',  // Add the reset-password route
    name: 'ResetPassword',
    component: ResetPassword,
    meta: { requiresAuth: false }
  },
  {
    path: '/Dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/Recycling-Guide',
    name: 'RecyclingGuide',
    component: RecyclingGuide,
    meta: { requiresAuth: true }  // Mark route as requiring authentication
  },
   {
      path: '/challenges',
      name: 'Challenges',
      component: Challenges,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/challenges/:id',
      name: 'ChallengeDetails',
      component: Challenges,
      meta: { requiresAuth: true }
    },
    {
      path: '/Goals',
      name: 'PersonalizedGoal',
      component: PersonalizedGoal,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/Calculator',
      name: 'Calculator',
      component: Calculator,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/Leaderboard',
      name: 'Leaderboard',
      component: Leaderboard,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/Reward',
      name: 'Reward',
      component: Reward,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/Profile',
      name: 'Profile',
      component: Profile,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    {
      path: '/Settings',
      name: 'Settings',
      component: Settings,
      meta: { requiresAuth: true }  // Mark route as requiring authentication
    },
    // Admin routes
    {
      path: '/admin/dashboard',
      name: 'AdminDashboard',
      component: AdminDashboard,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'AdminUsers',
      component: AdminUsers,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users/:id?',
      name: 'AdminUsers',
      component: AdminUsers,
      meta: { requiresAdmin: true },
    },
    {
      path: '/admin/challenges',
      name: 'AdminChallenges',
      component: AdminChallenges,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/badges',
      name: 'AdminBadges',
      component: AdminBadges,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/Contact',
      name: 'AdminContact',
      component: AdminContact,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/Settings',
      name: 'AdminSettings',
      component: AdminSettings,
      meta: { requiresAuth: true, requiresAdmin: true }
    }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard with proper store integration and improved debugging
router.beforeEach((to, from, next) => {
  
  
  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  // Get token directly from localStorage for reliability
  const token = localStorage.getItem('token')
  const isAuthenticated = !!token
  
  // Get admin status directly from localStorage
  const isAdminFromStorage = localStorage.getItem('isAdmin') === 'true'
  const authStore = useAuthStore()
  const isAdmin = authStore.isAdmin || isAdminFromStorage
  

  
  // First check: handle not authenticated user
  if (requiresAuth && !isAuthenticated) {
    console.log('Authentication required but not authenticated. Redirecting to login.')
    return next('/login')
  }
  
  // Second check: prevent non-admin from accessing admin routes
  if (requiresAdmin && !isAdmin) {
    console.log('Admin access required but user is not an admin. Redirecting to dashboard.')
    return next('/dashboard')
  }
  
  // Third check: redirect authenticated users away from auth pages
  if ((to.path.toLowerCase() === '/login' || to.path.toLowerCase() === '/register') && isAuthenticated) {
    console.log('Already authenticated. Redirecting to dashboard.')
    return next('/dashboard')
  }
  
  // If we're here, let the navigation proceed

  return next()
})

export default router
