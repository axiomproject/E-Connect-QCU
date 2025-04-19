<template>
  <div>
    <div class="admin-header" :class="{ 'sidebar-collapsed': isCollapsed }">

<!-- Mobile user info -->
<div class="mobile-user-info">
  <div class="avatar" @click.stop="toggleMobileUserMenu" ref="avatarRef">
    <img ref="headerAvatarImg" :src="avatarSrc" alt="Admin Avatar" @error="handleAvatarError">
  </div>
</div>

<!-- Place dropdown as direct child of body for guaranteed visibility -->
<transition 
  name="dropdown-fade"
  @enter="onEnter"
  @leave="onLeave"
>
  <div v-if="showMobileUserMenu" class="mobile-user-dropdown-container" ref="mobileUserMenuRef">
    <div class="mobile-user-dropdown">
      <div class="mobile-dropdown-username">{{ username }}</div>
      <div class="mobile-user-dropdown-item" @click="navigateTo('/dashboard')">
        <i class="fas fa-arrow-left"></i>
        <span>Return to App</span>
      </div>
      <div class="mobile-user-dropdown-divider"></div>
      <div class="mobile-user-dropdown-item logout" @click="logout">
        <i class="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </div>
    </div>
  </div>
</transition>

        <h1 class="admin-header-title">{{ title }}</h1>
      <div class="user-actions">
       
        <div class="notifications" @click.stop="toggleNotifications" ref="notificationRef">
          <i class="fas fa-bell"></i>
          <span class="badge" v-if="unreadCount > 0">
            <span class="badge-number" :class="{'number-animate': isAnimating}">{{ unreadCount }}</span>
          </span>
          
          <!-- Notification dropdown -->
          <transition name="fade">
            <div class="notification-dropdown" v-if="showNotifications">
              <div class="dropdown-header">
                <h3>Notifications</h3>
                <span class="mark-all" @click.stop="markAllAsRead">Mark all as read</span>
              </div>
              <div class="dropdown-body">
                <div v-if="loading && !loadingMore" class="notification-loading">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Loading notifications...</p>
                </div>
                <div v-else-if="notifications.length === 0" class="notification-empty">
                  <i class="fas fa-bell-slash"></i>
                  <p>No notifications</p>
                </div>
                <template v-else>
                  <div 
                    v-for="notification in notifications" 
                    :key="notification.id" 
                    class="notification-item"
                    :class="{ 'unread': !notification.is_read }"
                    @click="openNotification(notification)"
                  >
                    <div class="notification-icon">
                      <i class="fas" :class="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="notification-content">
                      <p class="notification-text">{{ notification.title }}</p>
                      <p class="notification-message">{{ notification.message }}</p>
                      <p class="notification-time">{{ formatTime(notification.created_at) }}</p>
                    </div>
                    <div class="notification-action" v-if="!notification.is_read">
                      <i class="fas fa-circle"></i>
                    </div>
                  </div>
                  <div v-if="loadingMore" class="notification-loading-more">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading more...</p>
                  </div>
                </template>
              </div>
              <div class="dropdown-footer">
                <a 
                  href="#" 
                  @click.stop.prevent="loadMoreNotifications" 
                  v-if="hasMoreNotifications"
                >
                  See previous notifications
                </a>
                <span v-else-if="notifications.length > 0" class="no-more-notifications">No more notifications</span>
                <!-- Don't show any message if no notifications at all -->
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <div class="settings-content">
      <!-- Existing settings content goes here -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import { shallowRef } from 'vue';


const avatarCache = shallowRef(new Map());
const lastAvatarUpdate = ref(Date.now());
const headerAvatarImg = ref<HTMLImageElement | null>(null);
const emit = defineEmits(['toggle-mobile-menu']);

// Mobile menu toggle with fromDock parameter
const toggleMobileMenu = (fromDock = false) => {
  emit('toggle-mobile-menu', fromDock);
};

// User info
const username = computed(() => authStore.user?.username || 'Admin');

// Avatar handling
const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png';
const avatarKey = ref(Date.now());
const avatarLoadFailed = ref(false);

// Avatar source computation
// Enhanced avatar source computation with stable caching
const avatarSrc = computed(() => {
  const avatarUrl = authStore.user?.avatar;
  
  if (!avatarUrl || avatarLoadFailed.value) {
    return defaultAvatar;
  }
  
  // Use cached URL if available
  if (avatarCache.value.has(avatarUrl)) {
    return avatarCache.value.get(avatarUrl);
  }
  
  // Process the URL
  let processedUrl;
  if (avatarUrl.startsWith('http')) {
    processedUrl = avatarUrl;
  } else {
    const baseURL = import.meta.env.VITE_API_URL || '';
    const formattedUrl = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
    processedUrl = `${baseURL}${formattedUrl}`;
  }
  
  // Store in cache and return
  avatarCache.value.set(avatarUrl, processedUrl);
  return processedUrl;
});

const updateAvatarDirectly = (newUrl: string) => {
  if (!headerAvatarImg.value) return;
  
  // Create a new image to preload
  const tempImg = new Image();
  tempImg.onload = () => {
    // Only update the actual image after successful load
    if (headerAvatarImg.value) {
      headerAvatarImg.value.src = newUrl;
    }
  };
  tempImg.onerror = () => {
    if (headerAvatarImg.value) {
      headerAvatarImg.value.src = defaultAvatar;
    }
  };
  // Start loading
  tempImg.src = newUrl;
};

// Handle avatar load errors
const handleAvatarError = (e: Event) => {
  avatarLoadFailed.value = true;
  if (e.target) {
    (e.target as HTMLImageElement).src = defaultAvatar;
  }
};

const props = defineProps({
  title: {
    type: String,
    default: 'Admin Dashboard'
  },
  isCollapsed: {
    type: Boolean,
    default: false
  }
});

// Notification data
const notifications = ref<any[]>([]);
const unreadCount = ref(0);
const loading = ref(false);
const error = ref('');

// Pagination state
const currentPage = ref(1);
const pageSize = ref(5); // Show 5 notifications initially
const loadingMore = ref(false);
const hasMoreNotifications = ref(true);
const totalNotifications = ref(0);

// Notification dropdown state
const showNotifications = ref(false);
const notificationRef = ref<HTMLElement | null>(null);

// For notification badge animation
const isAnimating = ref(false);
const previousUnreadCount = ref(0);

// Add refs to track elements for proper event handling
const mobileUserMenuRef = ref<HTMLElement | null>(null);
const avatarRef = ref<HTMLElement | null>(null);

// Toggle notifications dropdown
const toggleNotifications = () => {
  if (!showNotifications.value) {
    // Reset pagination when opening the dropdown
    currentPage.value = 1;
    notifications.value = [];
    fetchNotifications(1);
  }
  
  showNotifications.value = !showNotifications.value;
};

// Close notifications when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (notificationRef.value && !notificationRef.value.contains(event.target as Node)) {
    showNotifications.value = false;
  }
};

const authStore = useAuthStore();
const router = useRouter();

// Fetch notifications from API with pagination
const fetchNotifications = async (page = 1, append = false) => {
  if (!authStore.token) return;
  
  if (page === 1) {
    loading.value = true;
  } else {
    loadingMore.value = true;
  }
  error.value = '';
  
  try {
    const response = await axios.get('/api/admin/notifications', {
      params: { 
        limit: pageSize.value,
        offset: (page - 1) * pageSize.value 
      },
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    if (append) {
      notifications.value = [...notifications.value, ...response.data.notifications];
    } else {
      notifications.value = response.data.notifications;
    }
    
    unreadCount.value = response.data.unreadCount;
    
    // Get the total notification count from the API response
    totalNotifications.value = response.data.total || 0;
    
    // Fix: If API doesn't return 'total', check if we got fewer notifications than requested
    if (!response.data.total) {
      // If we received fewer items than the page size, there are no more notifications
      const receivedCount = response.data.notifications.length;
      hasMoreNotifications.value = receivedCount >= pageSize.value;
    } else {
      // Otherwise use the total count from API
      hasMoreNotifications.value = notifications.value.length < totalNotifications.value;
    }
    
    console.log(`Notifications loaded: ${notifications.value.length}, Retrieved: ${response.data.notifications.length}, Page size: ${pageSize.value}, Has more: ${hasMoreNotifications.value}`);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    error.value = 'Failed to load notifications';
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// Load more notifications when "See previous notifications" is clicked
const loadMoreNotifications = async () => {
  currentPage.value++;
  await fetchNotifications(currentPage.value, true);
};

// Fetch notification count only (for badge)
const fetchNotificationCount = async () => {
  if (!authStore.token) return;
  
  try {
    const response = await axios.get('/api/admin/notifications', {
      params: { limit: 0 },
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    const newCount = response.data.unreadCount;
    
    // Only animate if this isn't the initial load and count increases
    if (unreadCount.value > 0 && newCount > unreadCount.value) {
      isAnimating.value = true;
      setTimeout(() => {
        isAnimating.value = false;
      }, 600);
    }
    
    unreadCount.value = newCount;
  } catch (err) {
    console.error('Error fetching notification count:', err);
  }
};

// Watch for changes to unreadCount to trigger animation
watch(() => unreadCount.value, (newCount, oldCount) => {
  if (newCount > oldCount && oldCount !== 0) {
    // Only animate when count increases and is not the initial load
    isAnimating.value = true;
    
    // Remove the animation class after animation completes
    setTimeout(() => {
      isAnimating.value = false;
    }, 600); // Animation duration + a little buffer
  }
  
  previousUnreadCount.value = newCount;
});

// Mark a specific notification as read
const markNotificationAsRead = async (notificationId: number) => {
  try {
    await axios.put(`/api/admin/notifications/${notificationId}/read`, {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    // Update local state
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      notifications.value[index].is_read = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  } catch (err) {
    console.error('Error marking notification as read:', err);
  }
};

// Mark all notifications as read
const markAllAsRead = async () => {
  try {
    await axios.put('/api/admin/notifications/read-all', {}, {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    });
    
    // Update local state
    notifications.value.forEach(notification => {
      notification.is_read = true;
    });
    unreadCount.value = 0;
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
  }
};

// Open notification and mark as read
const openNotification = (notification: any) => {
  // Mark as read if unread
  if (!notification.is_read) {
    markNotificationAsRead(notification.id);
  }
  
  // Handle different notification types
  if (notification.type === 'new_user' && notification.reference_id) {
    // Use router.push instead of directly changing location
    router.push(`/admin/users/${notification.reference_id}`);
  } else if (notification.type === 'message' && notification.reference_id) {
    router.push(`/admin/contact?messageId=${notification.reference_id}`);
  }
  // Add other notification type handling as needed
};

// View all notifications
const viewAllNotifications = () => {
  // Navigate to notifications page
  router.push('/admin/notifications');
  showNotifications.value = false;
};

// Format the notification timestamp
const formatTime = (timestamp: string) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

// Get an appropriate icon for each notification type
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_user':
      return 'fa-user-plus';
    case 'challenge_completed':
      return 'fa-check-circle';
    case 'badge_earned':
      return 'fa-award';
    case 'message':
      return 'fa-envelope';
    default:
      return 'fa-bell';
  }
};

// Check for new notifications more frequently
let notificationInterval: number | undefined;

// Add event listeners and start polling on mount
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  fetchNotificationCount(); // Initial fetch
  
  // Poll for new notifications every 30 seconds (was 2 minutes)
  notificationInterval = window.setInterval(() => {
    fetchNotificationCount();
  }, 30000); // Reduced from 120000 to 30000
  
  // Add a handler for route changes that doesn't update the avatar
router.afterEach(() => {
  // No-op for avatar during navigation
});
  // Add visibility change detection to check when tab becomes active again
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Add focus event to check when window regains focus
  window.addEventListener('focus', handleWindowFocus);

  // Add event listener for closing mobile user dropdown
  document.addEventListener('click', closeMobileUserMenu);
  
  // Add a console log to verify the dropdown container exists when menu is open
  watch(showMobileUserMenu, (isOpen) => {
    console.log("Menu state changed:", isOpen);
    
    // Calculate and position the dropdown after a small delay
    if (isOpen) {
      setTimeout(() => {
        positionDropdown();
      }, 10);
    }
  });
});

// Handle tab visibility changes
const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    // Tab is now visible, fetch notifications
    fetchNotificationCount();
  }
};

// Handle window focus
const handleWindowFocus = () => {
  fetchNotificationCount();
};

// Clean up on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('focus', handleWindowFocus);
  
  if (notificationInterval) {
    clearInterval(notificationInterval);
  }

  // Remove event listener for closing mobile user dropdown
  document.removeEventListener('click', closeMobileUserMenu);
});

// Watch for auth token changes
watch(() => authStore.token, (newToken) => {
  if (newToken) {
    fetchNotificationCount();
  }
});

// Watch for avatar changes
watch(() => authStore.user?.avatar, (newAvatar, oldAvatar) => {
  if (newAvatar === oldAvatar) return;
  
  const now = Date.now();
  // Debounce updates
  if (now - lastAvatarUpdate.value > 500) {
    lastAvatarUpdate.value = now;
    avatarLoadFailed.value = false;
    
    if (newAvatar) {
      // Process the URL
      let processedUrl;
      if (newAvatar.startsWith('http')) {
        processedUrl = newAvatar;
      } else {
        const baseURL = import.meta.env.VITE_API_URL || '';
        const formattedUrl = newAvatar.startsWith('/') ? newAvatar : `/${newAvatar}`;
        processedUrl = `${baseURL}${formattedUrl}?t=${now}`;
      }
      
      // Update the cache and DOM element
      avatarCache.value.set(newAvatar, processedUrl);
      
      // Direct DOM update
      if (headerAvatarImg.value) {
        updateAvatarDirectly(processedUrl);
      }
    } else if (headerAvatarImg.value) {
      // Reset to default if avatar is removed
      headerAvatarImg.value.src = defaultAvatar;
    }
  }
});

// Mobile user dropdown state
const showMobileUserMenu = ref(false);

// Improved mobile user dropdown toggle
const toggleMobileUserMenu = (event: MouseEvent) => {
  event.stopPropagation(); // Prevent click from bubbling
  showMobileUserMenu.value = !showMobileUserMenu.value;
  console.log("Toggle mobile menu:", showMobileUserMenu.value);
  
  // Apply visual feedback on avatar
  if (avatarRef.value) {
    if (showMobileUserMenu.value) {
      avatarRef.value.classList.add('active');
    } else {
      avatarRef.value.classList.remove('active');
    }
  }
};

// Improved click outside handler
const closeMobileUserMenu = (event: MouseEvent) => {
  // Only close if click was outside avatar AND outside dropdown
  if (
    showMobileUserMenu.value && 
    avatarRef.value && 
    mobileUserMenuRef.value && 
    !avatarRef.value.contains(event.target as Node) &&
    !mobileUserMenuRef.value.contains(event.target as Node)
  ) {
    showMobileUserMenu.value = false;

    // Remove active class from avatar
    if (avatarRef.value) {
      avatarRef.value.classList.remove('active');
    }
    console.log("Closed mobile menu by outside click"); // Debug log
  }
};

// Navigate to a path
const navigateTo = (path: string) => {
  router.push(path);
  showMobileUserMenu.value = false; // Close dropdown after navigation
};

// Logout function
const logout = () => {
  authStore.logout();
  router.push('/login');
};

// Updated function to position dropdown further to the right
const positionDropdown = () => {
  const avatar = avatarRef.value;
  const dropdown = document.querySelector('.mobile-user-dropdown-container');
  
  if (avatar && dropdown) {
    const rect = avatar.getBoundingClientRect();
    console.log("Avatar position:", rect);
    
    // Position dropdown - with a significant offset to the right
    const dropdownElem = dropdown as HTMLElement;
    const avatarCenterX = rect.left + (rect.width / 2);
    
    dropdownElem.style.position = 'fixed';
    dropdownElem.style.top = (rect.bottom + 10) + 'px';
    
    // Increase the offset to move dropdown more to the right
    // Change +10 to +50 to shift it more to the right
    const dropdownWidth = 180;
    dropdownElem.style.left = (avatarCenterX - (dropdownWidth / 2) + 50) + 'px';
    
    console.log("Positioned dropdown at:", dropdownElem.style.top, dropdownElem.style.left);
  }
};

// Add animation hooks for mobile user dropdown
const onEnter = (el: Element) => {
  // Position the dropdown first before animation starts
  positionDropdown();
  
  // Apply initial animation state
  const dropdown = el as HTMLElement;
  dropdown.style.opacity = '0';
  dropdown.style.transform = 'translateY(-15px)';
  
  // Force reflow to ensure transition works
  dropdown.offsetHeight;
  
  // Apply final animation state
  dropdown.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
  dropdown.style.opacity = '1';
  dropdown.style.transform = 'translateY(0)';
};

const onLeave = (el: Element) => {
  const dropdown = el as HTMLElement;
  dropdown.style.opacity = '0';
  dropdown.style.transform = 'translateY(-15px)';
};
</script>

<style scoped>

/* Mobile menu button */
.mobile-menu-button {
  display: none;
  font-size: 1.2rem;
  color: #666;
  cursor: pointer;
}

/* Mobile user info */
.mobile-user-info {
  display: none;
  align-items: center;
  margin-right: 1rem;
  position: relative; /* Added for dropdown positioning */
  z-index: 1001; /* Ensure proper stacking context */
}

.mobile-user-info .avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 0.75rem;
  border: 2px solid #4CAF50;
  box-shadow: 0 2px 10px rgba(76, 175, 80, 0.2);
  cursor: pointer; /* Show it's clickable */
  position: relative; /* For dropdown position */
  transition: all 0.2s ease;
}

.mobile-user-info .avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 12px rgba(76, 175, 80, 0.3);
}

.mobile-user-info .avatar:active {
  transform: scale(0.95);
}

.mobile-user-info .avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.mobile-user-info .avatar.active {
  border-color: #2E7D32;
  box-shadow: 0 2px 12px rgba(46, 125, 50, 0.4);
}

.mobile-user-info .user-details,
.mobile-user-info .username {
  display: none;
}

/* Mobile user dropdown menu */
.mobile-user-dropdown-container {
  position: absolute;
  
  z-index: 9999; /* Extremely high z-index */
  pointer-events: auto;
  width: 180px; /* Set explicit width to match the inner dropdown */
}

.mobile-user-dropdown {
  position: relative;
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: visible;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2), 0 0 10px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* Adjust dropdown arrow position to match new dropdown position */
.dropdown-arrow {
  position: absolute;
  top: -30px;
  margin-left: -6px;
  width: 12px;
  height: 12px;
  background: white;
  transform: rotate(45deg);
  border-top: 1px solid rgba(0,0,0,0.05);
  border-left: 1px solid rgba(0,0,0,0.05);
  animation: popIn 0.3s ease-out forwards;
}

/* Add dropdown animation */
.dropdown-anim-enter-active,
.dropdown-anim-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dropdown-anim-enter-from,
.dropdown-anim-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Improve dropdown items */
.mobile-user-dropdown-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  animation: fadeIn 0.2s ease-out forwards;
  opacity: 0;
  transform: translateY(10px);
}

.mobile-user-dropdown-item:nth-child(1) {
  animation-delay: 0.05s;
}

.mobile-user-dropdown-item:nth-child(2) {
  animation-delay: 0.15s;
}

.mobile-user-dropdown-item:hover {
  background: #f5f5f5;
}

.mobile-user-dropdown-item i {
  width: 20px;
  margin-right: 12px;
  font-size: 0.95rem;
  color: #555;
  text-align: center;
}

.mobile-user-dropdown-item span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

/* Improve the divider */
.mobile-user-dropdown-divider {
  height: 1px;
  background: linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.06), rgba(0,0,0,0.03));
  margin: 4px 0;
}

/* Improve logout button */
.mobile-user-dropdown-item.logout {
  margin-bottom: 0;
}

.mobile-user-dropdown-item.logout i,
.mobile-user-dropdown-item.logout span {
  color: #e74c3c;
}

.mobile-user-dropdown-item.logout:hover {
  background-color: rgba(231, 76, 60, 0.08);
}

/* Username in mobile dropdown */
.mobile-dropdown-username {
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
  text-align: center;
  padding: 12px 0 4px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 4px;
  background: none;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .admin-header {
    padding: 1rem;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .admin-header h1 {
    font-size: 1.2rem;
    text-align: center;
    flex: 1;
  }
  
  .mobile-menu-button {
    display: block;
    margin-right: 0.5rem;
  }
  
  .mobile-user-info {
    display: flex;
  }
  
  .mobile-user-dropdown {
    z-index: 1500;
     left: 10px;
  }
}

/* For very small screens */
@media (max-width: 360px) {
  .mobile-user-dropdown {
    left: -30px;
  }
  
  .dropdown-arrow {
    left: 40px;
  }
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
  margin-left: 0;
  transition: margin-left 0.3s ease;
  width: 100%;
  box-sizing: border-box;
  position: relative;
  z-index: 10;
}

.admin-header.sidebar-collapsed {
  margin-left: 0;
  width: 100%;
}

.admin-header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2E7D32;
  margin: 0;
  text-align: center;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .admin-header-title {
    font-size: 0.5rem;
    padding: 0 0.5rem;
    max-width: 70vw;
  }
}

@media (max-width: 480px) {
  .admin-header-title {
    font-size: 0.3rem;
    max-width: 55vw;
  }
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.notifications {
  position: relative;
  cursor: pointer;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.notifications:hover {
  background-color: #f0f0f0;
}

.notifications:active {
  transform: none; /* Changed from scale(0.95) */
}

.notifications i {
  font-size: 1.2rem;
  color: #666;
  transition: color 0.3s ease;
}

.notifications:hover i {
  color: #2E7D32;
}

.badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  border: 2px solid white;
  transition: transform 0.3s ease;
  overflow: hidden; /* Ensure the number animation stays inside the badge */
}

.badge-number {
  display: inline-block;
  position: relative;
}

.number-animate {
  animation: number-increment 0.5s ease forwards;
}

@keyframes number-increment {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Remove or modify this hover effect that might interfere with our animation */
.notifications:hover .badge {
  transform: none; /* Changed from scale(1.1) to avoid conflicting with the number animation */
}

/* Notification dropdown styles */
.notification-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: -10px;
  width: 340px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

/* Update the fade transition to only affect opacity */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: default;
}

.dropdown-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #2c3e50;
}

.mark-all {
  font-size: 0.8rem;
  color: #4CAF50;
  cursor: pointer;
  position: relative;
  text-decoration: none;
  padding-bottom: 2px;
}

.mark-all::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -1px;
  left: 0;
  background-color: #4CAF50;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  will-change: transform; /* Optimize animation performance */
}

.mark-all:hover {
  color: #2E7D32;
}

.mark-all:hover::after {
  transform: scaleX(1); /* This should persist while hovering */
}

.dropdown-body {
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden; /* Prevent horizontal scrolling */
}

.notification-item {
  display: flex;
  padding: 12px 20px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: all 0.2s ease;
  align-items: center;
  border-left: 3px solid transparent; /* Predefine border space with transparent border */
  transform: none; /* Reset transform */
}

.notification-item:hover {
  background-color: #f0f7f0; /* Lighter green tint */
  border-left: 3px solid #4CAF50;
  padding-left: 24px; /* Move content slightly instead of using transform */
  padding-right: 16px; /* Compensate on the right side */
}

.notification-item.unread {
  background-color: rgba(76, 175, 80, 0.05);
}

.notification-item:active {
  transform: none;
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.notification-item.unread .notification-icon {
  background-color: rgba(76, 175, 80, 0.1);
}

.notification-icon i {
  font-size: 1rem;
  color: #666;
}

.notification-item.unread .notification-icon i {
  color: #4CAF50;
}

.notification-content {
  flex: 1;
}

.notification-text {
  margin: 0 0 5px 0;
  font-size: 0.9rem;
  color: #333;
  line-height: 1.4;
}

.notification-message {
  margin: 0 0 5px 0;
  font-size: 0.85rem;
  color: #666;
  line-height: 1.3;
}

.notification-time {
  margin: 0;
  font-size: 0.75rem;
  color: #95a5a6;
}

.notification-action {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
}

.notification-action i {
  font-size: 0.5rem;
  color: #4CAF50;
}

.notification-loading,
.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: #95a5a6;
  text-align: center;
}

.notification-loading i,
.notification-empty i {
  font-size: 2rem;
  margin-bottom: 1rem;
  opacity: 0.7;
}

.notification-loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  border-bottom: 1px solid #f5f5f5;
}

.notification-loading-more i {
  font-size: 1rem;
  margin-right: 0.5rem;
  color: #4CAF50;
}

.notification-loading-more p {
  margin: 0;
  font-size: 0.85rem;
  color: #666;
}

.dropdown-footer {
  padding: 12px 20px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.dropdown-footer a {
  color: #4CAF50;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  display: inline-block; /* Changed from block to inline-block */
  text-align: center;
  position: relative;
  padding-bottom: 2px; /* Add space for animated underline */
  font-weight: 500; /* Make it slightly bolder */
}

.dropdown-footer a::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 2px;
  bottom: -1px;
  left: 0;
  background-color: #4CAF50;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  will-change: transform;
}

.dropdown-footer a:hover {
  color: #2E7D32; /* Darker green on hover */
  text-decoration: none; /* Explicitly disable text-decoration */
}

.dropdown-footer a:hover::after {
  transform: scaleX(1);
}

.no-more-notifications {
  color: #95a5a6;
  font-style: italic;
  position: relative;
}

/* Custom scrollbar for dropdown */
.dropdown-body::-webkit-scrollbar {
  width: 4px;
}

.dropdown-body::-webkit-scrollbar-track {
  background: transparent;
}

.dropdown-body::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.dropdown-body::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

.settings-content {
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  margin-left: 0;
  transition: margin-left 0.3s ease;
  width: 100%;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes popIn {
  0% {
    transform: rotate(45deg) scale(0);
    opacity: 0;
  }
  50% {
    transform: rotate(45deg) scale(1.2);
  }
  100% {
    transform: rotate(45deg) scale(1);
    opacity: 1;
  }
}
@media (max-width: 359px) {
    .mobile-user-dropdown {
        left: 5px;
    }
}
</style>

