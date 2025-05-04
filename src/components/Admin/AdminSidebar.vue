<template>
  <div class="admin-sidebar" :class="{ 
  'collapsed': localIsCollapsed, 
  'mobile-dock': isMobile && !isMobileMenuOpen, 
  'mobile-visible': isMobileMenuOpen 
}">
    <div v-if="!isMobile" class="sidebar-header">
      <div class="logo-area">
        <img src="../../assets/logo.png" alt="Eco Tracker" class="logo-img" />
        <h2 v-if="!localIsCollapsed">E-connect</h2>
      </div>
      <button class="toggle-btn" @click="toggleSidebar">
        <i class="fas" :class="localIsCollapsed ? 'fa-angle-right' : 'fa-angle-left'"></i>
      </button>
    </div>

    <div  class="user-info" v-if="!localIsCollapsed && !isMobile">
      <div class="avatar">
        <img 
          ref="avatarImg"
          :src="avatarSrc" 
          alt="Admin Avatar" 
          @error="handleAvatarError"
          :key="stableAvatarKey"
        />
      </div>
      <div class="user-details">
        <div class="username">{{ username }}</div>
        <div class="role">{{ adminLevel }}</div>
      </div>
    </div>

    <div v-if="!isMobile" class="sidebar-divider"></div>

    <nav class="sidebar-nav">
      <div 
        v-for="(item, index) in navItems" 
        :key="index"
        class="nav-item"
        :class="{ 'active': $route.path === item.path || $route.path.startsWith(item.path + '/') }"
        :title="item.title"
        @click="navigateTo(item.path)"
        :data-path="item.path"
      >
        <i class="fas" :class="item.icon"></i>
        <span v-if="!localIsCollapsed && !isMobile">{{ item.title }}</span>
      </div>
    </nav>

    <div class="sidebar-divider" v-if="!isMobile"></div>

    <div v-if="!isMobile" class="sidebar-footer">
      <router-link to="/dashboard" class="nav-item" title="Return to App">
        <i class="fas fa-arrow-left"></i>
        <span v-if="!localIsCollapsed">Return to App</span>
      </router-link>

      <div class="nav-item logout" @click="logout" title="Logout">
        <i class="fas fa-sign-out-alt"></i>
        <span v-if="!localIsCollapsed">Logout</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import axios from 'axios'; // Add axios import

// Helper function to get authentication headers
const getAuthHeader = () => {
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`
    }
  };
};

// Mobile detection
const isMobile = ref(false);

// Check if we're on mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false
  },
  isMobileMenuOpen: {
  type: Boolean,
  default: false
}
});

const emit = defineEmits(['sidebar-toggle', 'close-mobile-menu']);

const authStore = useAuthStore();
const router = useRouter();

// Use localStorage directly to ensure persistence across page loads and component mounts
const getInitialIsCollapsed = () => {
  const stored = localStorage.getItem('adminSidebarCollapsed');
  return stored === 'true';
};

// Initialize from localStorage instead of props
const localIsCollapsed = ref(getInitialIsCollapsed());

// Update localStorage immediately when state changes
const toggleSidebar = () => {
  localIsCollapsed.value = !localIsCollapsed.value;
  localStorage.setItem('adminSidebarCollapsed', localIsCollapsed.value.toString());
  emit('sidebar-toggle', localIsCollapsed.value);
};

// When props change, only update if it differs from localStorage
watch(() => props.isCollapsed, (newVal) => {
  const storedValue = getInitialIsCollapsed();
  // Only sync with props if localStorage doesn't already have a value
  if (storedValue !== newVal && localStorage.getItem('adminSidebarCollapsed') === null) {
    localIsCollapsed.value = newVal;
    localStorage.setItem('adminSidebarCollapsed', newVal.toString());
  }
}, { immediate: true });

// User info
const username = computed(() => authStore.user?.username || 'Admin');
const adminLevel = computed(() => {
  return authStore.user?.adminDetails?.admin_level || 'Administrator';
});

// Enhanced avatar handling
const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
// Use a stable key that doesn't change during navigation
const stableAvatarKey = ref('avatar-key');
const avatarLoadFailed = ref(false);

// Use a more persistent caching mechanism
const avatarCache = shallowRef(new Map());
const lastAvatarUrl = ref('');
const lastAvatarUpdate = ref(Date.now());

// Try to retrieve cached avatar URL from sessionStorage
const getPersistedAvatarUrl = () => {
  try {
    return sessionStorage.getItem('admin_avatar_url') || '';
  } catch (e) {
    return '';
  }
};

// Store avatar URL in sessionStorage for persistent caching
const persistAvatarUrl = (url: string) => {
  try {
    if (url && url !== defaultAvatar) {
      sessionStorage.setItem('admin_avatar_url', url);
    }
  } catch (e) {
    console.warn('Failed to persist avatar URL to sessionStorage', e);
  }
};

// Use ref to access the DOM element directly
const avatarImg = ref<HTMLImageElement | null>(null);

// Enhanced avatar source computation with better caching
const avatarSrc = computed(() => {
  // Get the current avatar URL from the store or session storage
  const avatarUrl = authStore.user?.avatar || getPersistedAvatarUrl();
  
  // If no avatar or load failed, use default
  if (!avatarUrl || avatarLoadFailed.value) {
    return defaultAvatar;
  }
  
  // Check if we've already processed this URL - use from cache
  if (avatarCache.value.has(avatarUrl)) {
    return avatarCache.value.get(avatarUrl);
  }
  
  // Process the URL - without dynamic timestamps to prevent flicker
  let processedUrl;
  if (avatarUrl.startsWith('http')) {
    processedUrl = avatarUrl;
  } else {
    const baseURL = import.meta.env.VITE_API_URL || '';
    const formattedUrl = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    // Use a stable cache key instead of timestamp
    processedUrl = `${baseURL}${formattedUrl}?v=1`;
  }
  
  // Store in cache and return
  avatarCache.value.set(avatarUrl, processedUrl);
  return processedUrl;
});

// Instead of changing the src attribute through reactivity, directly update the image
const updateAvatarDirectly = (newUrl: string) => {
  if (!avatarImg.value) return;
  
  // Only update if URL has actually changed
  if (avatarImg.value.src === newUrl) return;
  
  // Create a new image to preload
  const tempImg = new Image();
  tempImg.onload = () => {
    // Only update the actual image after successful load
    if (avatarImg.value) {
      avatarImg.value.src = newUrl;
      // Store successful URL
      persistAvatarUrl(newUrl);
    }
  };
  tempImg.onerror = () => {
    if (avatarImg.value && avatarImg.value.src !== defaultAvatar) {
      avatarImg.value.src = defaultAvatar;
    }
  };
  // Start loading
  tempImg.src = newUrl;
};

// Use a single fetch when the component is mounted
onMounted(async () => {
  // Check for persisted avatar first
  const persistedUrl = getPersistedAvatarUrl();
  if (persistedUrl && !authStore.user?.avatar) {
    // Try to use persisted URL first to avoid flicker
    if (avatarImg.value) {
      updateAvatarDirectly(persistedUrl);
    }
  }
  
  // Then fetch fresh data only once
  await fetchAdminData();
  
  // Only set interval if we don't have an avatar yet
  if (!authStore.user?.avatar && !getPersistedAvatarUrl()) {
    const checkInterval = setInterval(async () => {
      if (!avatarLoadFailed.value && !authStore.user?.avatar) {
        await fetchAdminData();
      } else {
        // Clear interval once we have avatar
        clearInterval(checkInterval);
      }
    }, 5000);

    // Clean up interval
    onUnmounted(() => {
      clearInterval(checkInterval);
    });
  }
});

// Improved fetchAdminData to avoid navigation-related flickering
const fetchAdminData = async () => {
  // Skip fetching during navigation events
  if (document.querySelector('.fade-leave-active, .fade-enter-active')) {
    return;
  }
  
  try {
    const response = await axios.get('/api/admin/settings', getAuthHeader());
    const data = response.data;
    
    if (data.avatar) {
      // Only update if avatar has changed
      if (authStore.user?.avatar !== data.avatar) {
        // Update avatar in store
        authStore.updateAvatar(data.avatar);
        lastAvatarUrl.value = data.avatar;
        lastAvatarUpdate.value = Date.now();
        avatarLoadFailed.value = false;
        
        // Process and cache the URL with a stable reference
        const baseURL = import.meta.env.VITE_API_URL || '';
        const formattedUrl = data.avatar.startsWith('/') ? data.avatar : `/${data.avatar}`;
        const processedUrl = data.avatar.startsWith('http') 
          ? data.avatar 
          : `${baseURL}${formattedUrl}?v=1`;
          
        // Update cache with this URL
        avatarCache.value.set(data.avatar, processedUrl);
        persistAvatarUrl(processedUrl);
        
        // Update image if DOM element exists
        if (avatarImg.value) {
          updateAvatarDirectly(processedUrl);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching admin data for sidebar:', error);
  }
};

// Prevent navigation-related flicker by using router guards
const removeRouterHooks = [
  router.beforeEach((to, from, next) => {
    // Keep avatar stable during navigation
    next();
  }),
  router.afterEach(() => {
    // Prevent refetching avatar immediately after navigation
    lastAvatarUpdate.value = Date.now();
  })
];

// Clean up router hooks when component unmounts
onUnmounted(() => {
  removeRouterHooks.forEach(removeHook => {
    if (typeof removeHook === 'function') {
      removeHook();
    }
  });
});

// More efficient error handling
const handleAvatarError = (e: Event) => {
  console.warn('Failed to load avatar image');
  avatarLoadFailed.value = true;
  
  // Use the default avatar directly on the element
  if (e.target) {
    (e.target as HTMLImageElement).src = defaultAvatar;
  }
};

const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Navigation items
const navItems = [
  { path: '/admin/dashboard', title: 'Dashboard', icon: 'fa-tachometer-alt' },
  { path: '/admin/users', title: 'Users', icon: 'fa-users' },
  { path: '/admin/challenges', title: 'Challenges', icon: 'fa-tasks' },
  { path: '/admin/badges', title: 'Badges', icon: 'fa-award' },
  { path: '/admin/donations', title: 'Donations', icon: 'fa-hand-holding-usd' },
  { path: '/admin/contact', title: 'Contact', icon: 'fa-address-book' },
  { path: '/admin/settings', title: 'Settings', icon: 'fa-cog' }
];

// Enhanced navigateTo function with specific dock handling
const navigateTo = (path: string) => {
  // Check if we're clicking from the mobile dock
  const isDockClick = isMobile.value && !props.isMobileMenuOpen;
  
  // Handle differently based on where the click came from
  if (isMobile.value && props.isMobileMenuOpen) {
    // If clicking from the full mobile sidebar, close it
    emit('close-mobile-menu');
  } 
  
  // Add a small delay on mobile to allow for visual feedback
  if (isMobile.value) {
    const clickedItem = document.querySelector(`.nav-item[data-path="${path}"]`);
    if (clickedItem) {
      clickedItem.classList.add('clicked');
      setTimeout(() => {
        clickedItem.classList.remove('clicked');
      }, 300);
    }
    
    setTimeout(() => {
      // Use replace instead of push to avoid building up history stack
      if (isDockClick) {
        router.replace(path).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            throw err;
          }
        });
      } else {
        router.push(path).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            throw err;
          }
        });
      }
    }, 100);
  } else {
    router.push(path).catch(err => {
      if (err.name !== 'NavigationDuplicated') {
        throw err;
      }
    });
  }
};
</script>

<style scoped>

/* Mobile dock styles */
.admin-sidebar.mobile-dock {
  width: 100%;
  height: 70px;
  bottom: 0;
  top: auto;
  left: 0;
  flex-direction: row;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  transition: none;
  transform: none !important;
}

.admin-sidebar.mobile-dock .sidebar-nav {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  padding: 0;
  width: 100%;
  overflow-y: visible;
}

.admin-sidebar.mobile-dock .nav-item {
  padding: 0.7rem 0;
  margin: 0;
  flex: 1;
  justify-content: center;
  text-align: center;
  border-radius: 0;
  touch-action: manipulation; /* Optimize for touch */
  -webkit-tap-highlight-color: transparent; /* Remove tap highlight */
}

/* Add active tap effect for mobile */
.admin-sidebar.mobile-dock .nav-item:active {
  background-color: rgba(76, 175, 80, 0.1);
  transform: none; /* Don't scale on mobile - it can cause rendering issues */
}

/* Add "clicked" style for mobile items */
.admin-sidebar.mobile-dock .nav-item.clicked {
  background-color: rgba(76, 175, 80, 0.2);
}

/* Hide dock when full sidebar is visible */
.admin-sidebar.mobile-visible.mobile-dock {
  display: none;
}
.admin-sidebar {
  width: 250px;
  height: 100vh;
  background-color: white;
  color: #2c3e50;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  will-change: transform, width;
  backface-visibility: hidden;
}

.admin-sidebar.collapsed {
  width: 90px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid #f0f0f0;
}

.logo-area {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #2E7D32;
}

.toggle-btn {
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background-color: #f8f8f8;
  color: #4CAF50;
}

.user-info {
  display: flex;
  align-items: center;
  padding: 1.25rem;
  background-color: #f9f9f9;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  overflow: hidden;
}
.logo-img{
  margin-right: 1rem;
}
.username {
  font-weight: 600;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #2c3e50;
}

.role {
  font-size: 0.8rem;
  opacity: 0.8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #7f8c8d;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.sidebar-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 0.5rem 0;
}

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 0.9rem 1.5rem;
  color: #7f8c8d;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  margin: 0.15rem 0.75rem;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  will-change: transform, background-color;
  backface-visibility: hidden;
}

.admin-sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.9rem 0;
  margin: 0.15rem;
}

.nav-item:hover {
  background-color: #f8f8f8;
  color: #2E7D32;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(46, 125, 50, 0.1);
}

.nav-item.active {
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
  animation: pulse 2s infinite;
}

.nav-item:active {
  transform: scale(0.95);
  transition: transform 0.1s;
}

.nav-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.7);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.nav-item:active::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
  }
  50% {
    box-shadow: 0 4px 20px rgba(76, 175, 80, 0.4);
  }
  100% {
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.2);
  }
}

.nav-item i {
  width: 22px;
  margin-right: 0.75rem;
  text-align: center;
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

/* Remove margin-right from icons in mobile dock */
.admin-sidebar.mobile-dock .nav-item i {
  margin-right: 0;
  width: auto; /* Allow natural width in the dock */
}

.nav-item:hover i {
  transform: scale(1.2);
}

.admin-sidebar.collapsed .nav-item i {
  margin-right: 0;
}

.nav-item span {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.nav-item:hover span {
  transform: translateX(4px);
}

.sidebar-footer {
  padding: 0.75rem 0;
  background-color: #f9f9f9;
}

.logout {
  color: #e74c3c;
}

.logout:hover {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
}

/* Scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {

  
  .admin-sidebar.collapsed {
    transform: translateX(-100%);
  }
  
  /* Show sidebar when menu button is clicked (you'd need to add this functionality) */
  .admin-sidebar.mobile-visible:not(.mobile-dock) {
    transform: translateX(0);
  }
  
  .admin-sidebar:not(.mobile-dock) {
    transform: translateX(-100%);
    height: 100vh;
    top: 0;
    left: 0;
    bottom: auto;
  }
}
</style>
