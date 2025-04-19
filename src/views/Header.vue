<template>
    <header class="dashboard-header">
      <div class="container header-content">
        <!-- Hide logo on mobile -->
        <div class="logo" @click="navigateToDashboard" style="cursor: pointer;">
            <img src="../assets/logo.png" alt="Eco Tracker" class="logo-img" />
          <h1>E-Connect</h1>
        </div>
        
        <!-- Navigation Links -->
        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link">
            <span class="mobile-icon material-icons">home</span>
            <span class="desktop-text">Home</span>
          </router-link>
          <router-link to="/leaderboard" class="nav-link">
            <span class="mobile-icon material-icons">leaderboard</span>
            <span class="desktop-text">Leaderboard</span>
          </router-link>
          <router-link to="/reward" class="nav-link">
            <span class="mobile-icon material-icons">card_giftcard</span>
            <span class="desktop-text">Rewards</span>
          </router-link>
        </nav>
        
       
        <div class="user-actions">
          <!-- Add notifications component - hide for admin users -->
          <div v-if="!authStore.isAdmin" class="notifications" @click.stop="toggleNotifications" ref="notificationRef">
            <span class="material-icons">notifications</span>
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
                    <span class="material-icons spinning">refresh</span>
                    <p>Loading notifications...</p>
                  </div>
                  <div v-else-if="notifications.length === 0" class="notification-empty">
                    <span class="material-icons">notifications_off</span>
                    <p>No notifications</p>
                  </div>
                  <template v-else>
                    <div 
                      v-for="notification in notifications" 
                      :key="notification.id" 
                      class="notification-item"
                      :class="{ 
                        'unread': !notification.is_read,
                        'system-announcement': notification.type === 'system_announcement' 
                      }"
                      @click="notification.type !== 'system_announcement' && openNotification(notification)"
                    >
                      <div class="notification-icon">
                        <span class="material-icons">{{ getNotificationIcon(notification.type) }}</span>
                      </div>
                      <div class="notification-content">
                        <p class="notification-text">{{ notification.title }}</p>
                        <p class="notification-message">{{ notification.message }}</p>
                        <p class="notification-time">{{ formatTime(notification.created_at) }}</p>
                      </div>
                      <div class="notification-action" v-if="!notification.is_read">
                        <span class="material-icons unread-dot">fiber_manual_record</span>
                      </div>
                    </div>
                    <div v-if="loadingMore" class="notification-loading-more">
                      <span class="material-icons spinning">refresh</span>
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
                </div>
              </div>
            </transition>
          </div>
          <div class="dropdown-container">
            <!-- Add 'active' class when dropdown is open -->
            <div class="user-greeting" @click.stop="toggleDropdown" :class="{'active': isDropdownOpen}">
              <span class="desktop-greeting">Hello, {{ username }}</span>
              
              <img :src="userAvatar" alt="User avatar" class="profile-img" />
              <span class="desktop-arrow material-icons dropdown-icon" :class="{'active': isDropdownOpen}">
                expand_more
              </span>
            </div>
            
            <!-- Fix the dropdown menu for both mobile and desktop -->
            <div class="dropdown-menu" v-if="isDropdownOpen" @click.stop>
              <router-link :to="authStore.isAdmin ? '/admin/dashboard' : '/profile'" class="dropdown-item">
                <span class="material-icons dropdown-icon">{{ authStore.isAdmin ? 'dashboard' : 'person' }}</span> 
                {{ authStore.isAdmin ? 'Dashboard' : 'Profile' }}
              </router-link>
              <router-link :to="authStore.isAdmin ? '/admin/settings' : '/settings'" class="dropdown-item">
                <span class="material-icons dropdown-icon">settings</span> 
                {{ authStore.isAdmin ? 'Settings' : 'Settings' }}
              </router-link>
              <div class="dropdown-divider"></div>
              <button @click="handleLogout" class="dropdown-item logout-item">
                <span class="material-icons dropdown-icon">logout</span> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="isDropdownOpen && isMobileView" class="mobile-dropdown-overlay">
          <div class="mobile-dropdown-menu">
            <div class="mobile-dropdown-header">
              <span>{{ username }}</span>
              <button @click="toggleDropdown" class="mobile-close-btn">&times;</button>
            </div>
            
            <div class="mobile-dropdown-content">
              <router-link :to="authStore.isAdmin ? '/admin/dashboard' : '/profile'" class="mobile-dropdown-item" @click="isDropdownOpen = false">
                <span class="material-icons">{{ authStore.isAdmin ? 'dashboard' : 'person' }}</span> 
                {{ authStore.isAdmin ? 'Dashboard' : 'Profile' }}
              </router-link>
              <router-link :to="authStore.isAdmin ? '/admin/settings' : '/settings'" class="mobile-dropdown-item" @click="isDropdownOpen = false">
                <span class="material-icons">settings</span> 
                {{ authStore.isAdmin ? 'Settings' : 'Settings' }}
              </router-link>
              <div class="mobile-dropdown-divider"></div>
              <button @click="handleLogout" class="mobile-dropdown-item mobile-logout-item">
                <span class="material-icons">logout</span> Logout
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  import { defineProps, defineEmits, ref, onMounted, onUnmounted, computed, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import axios from 'axios'
  
  const authStore = useAuthStore()
  const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
  const avatar = ref('')
  const isAvatarLoading = ref(false)
  const avatarFetchError = ref(false)
  
  const router = useRouter()
  const props = defineProps<{
    username: string
  }>()
  
  const emit = defineEmits<{
    (e: 'logout'): void
  }>()
  
  const isDropdownOpen = ref(false)
  const isMobileView = ref(false)
  
  // Enhanced toggle dropdown function with debug
  const toggleDropdown = (event: MouseEvent) => {
    event.stopPropagation();
  
    isDropdownOpen.value = !isDropdownOpen.value;
   
  }
  
  const closeDropdown = (event: MouseEvent) => {
    const target = event.target as HTMLElement
    const dropdownContainer = document.querySelector('.dropdown-container')
    
    if (dropdownContainer && !dropdownContainer.contains(target)) {
      isDropdownOpen.value = false
    }
  }
  
  const handleLogout = () => {
    isDropdownOpen.value = false
    emit('logout')
  }
  
  const navigateToDashboard = () => {
    router.push('/dashboard')
  }
  const navigateToLeaderboard = () => {
    router.push('/Leaderboard')
  }
  
  const checkMobileView = () => {
    isMobileView.value = window.innerWidth <= 877
  }
  
  const userAvatar = computed(() => {
    if (authStore.user?.avatar) {
      return authStore.user.avatar;
    }
    
    if (avatar.value) {
      return avatar.value;
    }
    
    return defaultAvatar;
  })
  
  const fetchUserAvatar = async (retryCount = 0) => {
    if (isAvatarLoading.value || retryCount > 2) return;
    
    isAvatarLoading.value = true;
    avatarFetchError.value = false;
    
    try {
      const token = authStore.token;
      if (!token) {
        isAvatarLoading.value = false;
        return;
      }
  
      const response = await axios.get('/api/user/settings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data?.profile?.avatar) {
        avatar.value = response.data.profile.avatar;
        
        if (authStore.user && !authStore.user.avatar) {
          authStore.updateAvatar(avatar.value);
        }
      }
    } catch (error) {
      console.error('Error fetching user avatar:', error);
      avatarFetchError.value = true;
      
      if (retryCount < 2) {
        setTimeout(() => {
          fetchUserAvatar(retryCount + 1);
        }, 2000);
      }
    } finally {
      isAvatarLoading.value = false;
    }
  }
  
  watch(() => authStore.user, (newUser) => {
    if (newUser && !newUser.avatar) {
      fetchUserAvatar();
    }
  }, { immediate: true });
  
  onMounted(() => {
    document.addEventListener('click', closeDropdown);
    window.addEventListener('resize', checkMobileView);
    checkMobileView();
    
    if (authStore.user && !avatar.value) {
      fetchUserAvatar();
    }
  })
  
  onUnmounted(() => {
    document.removeEventListener('click', closeDropdown)
    window.removeEventListener('resize', checkMobileView)
  })

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
  const handleNotificationsClickOutside = (event: MouseEvent) => {
    if (notificationRef.value && !notificationRef.value.contains(event.target as Node)) {
      showNotifications.value = false;
    }
  };

  // Fetch notifications from API with pagination
  const fetchNotifications = async (page = 1, append = false) => {
    if (!authStore.token || authStore.isAdmin) return;
    
    if (page === 1) {
      loading.value = true;
    } else {
      loadingMore.value = true;
    }
    error.value = '';
    
    try {
      const response = await axios.get('/api/user/notifications', {
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
      
      // If API doesn't return 'total', check if we got fewer notifications than requested
      if (!response.data.total) {
        const receivedCount = response.data.notifications.length;
        hasMoreNotifications.value = receivedCount >= pageSize.value;
      } else {
        // Otherwise use the total count from API
        hasMoreNotifications.value = notifications.value.length < totalNotifications.value;
      }
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
    if (!authStore.token || authStore.isAdmin) return;
    
    try {
      const response = await axios.get('/api/user/notifications', {
        params: { limit: 0 },
        headers: {
          Authorization: `Bearer ${authStore.token}`
        }
      });
      
      const newCount = response.data.unreadCount;
      
      // Only animate if this isn't the initial load
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

  // Mark a specific notification as read
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await axios.put(`/api/user/notifications/${notificationId}/read`, {}, {
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
      await axios.put('/api/user/notifications/read-all', {}, {
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
    if (notification.type === 'badge_earned' && notification.reference_id) {
      router.push(`/profile/badges`);
    } else if (notification.type === 'challenge_completed' && notification.reference_id) {
      // Navigate to the specific challenge using the reference_id
      router.push(`/challenges/${notification.reference_id}`);
    } else if (notification.type === 'leaderboard_update' || notification.type === 'leaderboard_position') {
      // Handle both leaderboard update and position notifications
      router.push('/leaderboard');
    } else if (notification.type === 'system_announcement') {
      // For system announcements, just mark as read with no navigation
      // You could optionally add navigation to a system announcements page in the future
    }
    
    // Close dropdown after navigation
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

  // Get an appropriate Material icon for each notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'badge_earned':
        return 'emoji_events';
      case 'challenge_completed':
        return 'task_alt';
      case 'leaderboard_update':
        return 'leaderboard';
      case 'system_announcement':
        return 'campaign';
      default:
        return 'notifications';
    }
  };

  // Check for new notifications periodically
  let notificationInterval: number | undefined;

  // Extend existing onMounted to include notification setup
  onMounted(() => {
    // Keep existing event listeners and functionality
    document.addEventListener('click', closeDropdown);
    document.addEventListener('click', handleNotificationsClickOutside);
    window.addEventListener('resize', checkMobileView);
    checkMobileView();
    
    if (authStore.user && !avatar.value) {
      fetchUserAvatar();
    }
    
    // Only set up notification polling for non-admin users
    if (!authStore.isAdmin) {
      fetchNotificationCount();
      
      // Poll for new notifications every 30 seconds
      notificationInterval = window.setInterval(() => {
        fetchNotificationCount();
      }, 30000);
    }
    
    // Add visibility change detection to check when tab becomes active again
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Add focus event to check when window regains focus
    window.addEventListener('focus', handleWindowFocus);
  });

  // Extend existing onUnmounted to include notification cleanup
  onUnmounted(() => {
    // Keep existing cleanup
    document.removeEventListener('click', closeDropdown);
    document.removeEventListener('click', handleNotificationsClickOutside);
    window.removeEventListener('resize', checkMobileView);
    
    // Add notification cleanup
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    
    if (notificationInterval) {
      clearInterval(notificationInterval);
    }
  });

  // Handle tab visibility changes
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && !authStore.isAdmin) {
      fetchNotificationCount();
    }
  };

  // Handle window focus
  const handleWindowFocus = () => {
    if (!authStore.isAdmin) {
      fetchNotificationCount();
    }
  };

  // Watch for auth token changes
  watch(() => authStore.token, (newToken) => {
    if (newToken && !authStore.isAdmin) {
      fetchNotificationCount();
    }
  });
  </script>
  
  <style scoped>
  .dashboard-header {
    background-color: #dfefe0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 0;
  }
  
  .logo {
    display: flex;
    align-items: center;
  }
  
  .logo h1 {
    font-size: 1.5rem;
    margin: 0;
    margin-left: 10px;
    color: #4CAF50;
  }
  
  .logo-img {
    height: 40px;
    width: 40px;
  }
  
  .nav-links {
    display: flex;
    gap: 25px;
  }
  
  .nav-link {
    color: #2E7D32;
    text-decoration: none;
    font-weight: 500;
    padding: 5px 0;
    position: relative;
    transition: color 0.2s;
  }
  
  .nav-link:hover {
    color: #43A047;
  }
  
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background-color: #43A047;
    transition: width 0.3s;
  }
  
  .nav-link:hover::after,
  .router-link-active::after {
    width: 100%;
  }
  
  .router-link-active {
    color: #43A047;
    font-weight: 600;
  }
  
  .user-actions {
    display: flex;
    align-items: center;
    position: relative;
  }
  
  .dropdown-container {
    position: relative;
  }
  
  .user-greeting {
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }
  
  .user-greeting:hover {
    background-color: rgba(76, 175, 80, 0.1);
  }
  
  .welcome-message {
    margin-right: 8px;
    font-weight: 500;
  }
  
  .dropdown-icon {
    font-size: 18px;
    transition: transform 0.3s;
    color: #2E7D32;
  }
  
  .dropdown-icon.active {
    transform: rotate(180deg);
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    width: 200px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    z-index: 110;
    animation: fadeIn 0.2s ease-out;
    overflow: hidden;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .dropdown-item {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    color: #333;
    text-decoration: none;
    transition: background-color 0.2s;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
    font-size: 1rem;
    box-sizing: border-box;
  }
  
  .dropdown-item:hover {
    background-color: #f5f5f5;
  }
  
  .dropdown-item .dropdown-icon {
    margin-right: 10px;
    font-size: 20px;
  }
  
  .dropdown-divider {
    height: 1px;
    background-color: #eeeeee;
    margin: 5px 0;
  }
  
  .logout-item {
    color: #d32f2f;
  }
  
  .logout-item:hover {
    background-color: rgba(211, 47, 47, 0.1);
  }

  .profile-img{
    margin-left: 10px;
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      text-align: center;
      gap: 15px;
    }
    
    .nav-links {
      margin: 10px 0;
      justify-content: center;
    }
    
    .user-actions {
      justify-content: center;
    }
    
    .dropdown-menu {
      right: 50%;
      transform: translateX(50%);
    }
  }

  @media (max-width: 768px) {
    .profile-img{
    margin-left: 0px;
  }
    .dashboard-header {
      position: fixed;
      bottom: 0;
      top: auto;
      width: 100%;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
    .header-content {
      justify-content: space-around;
      padding: 10px 0;
    }
    .nav-links {
      display: flex;
      gap: 0;
      align-items: center;
    }
    .nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
    .desktop-text {
      display: none;
    }
    .mobile-icon {
      font-size: 24px;
      display: block;
    }
  }

  @media (max-width: 877px) {
    .logo {
      display: none;
    }
    .dashboard-header {
      position: fixed;
      bottom: 0;
      top: auto;
      width: 100%;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }
    .header-content {
      flex-direction: row;
      align-items: center;
      padding: 15px;
      justify-content: center;
      gap:0px;
    }
    .nav-links,
    .user-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .nav-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
    .desktop-text {
      display: none;
    }
    .mobile-icon {
      font-size: 24px;
      display: block;
    }
    .desktop-greeting,
    .desktop-arrow {
      display: none;
    }
    .mobile-profile {
      display: block;
      font-size: 24px;
      color: #43A047;
    }
    .dropdown-menu {
      position: fixed;
      bottom: 80px; /* Position above the navbar */
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 300px;
      z-index: 9999; /* Increase z-index to ensure it shows above everything */
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
    }
    .user-greeting {
      padding: 10px;
      justify-content: center;
    }
    .dropdown-item {
      padding: 15px;
      font-size: 1.1rem;
    }
    .user-greeting.active {
      background-color: rgba(76, 175, 80, 0.3) !important;
      border: 2px solid #4CAF50 !important;
    }
    .profile-img {
      width: 45px;
      height: 45px;
      padding: 3px;
      border: 2px solid transparent;
      transition: border-color 0.3s ease;
    }
    .active .profile-img {
      border-color: #4CAF50;
    }
    .user-actions {
      display: flex;
      align-items: center;
      gap: 5px; /* Add gap between notification and avatar */
      flex-direction: row;
    }
    .user-actions > .notifications {
      order: 2; /* Place notifications second */
      margin-left: 0; /* Reset margin */
      margin-right: 5px; /* Add space to the right of notification, before avatar */
      z-index: 2; /* Ensure above other elements */
    }
    .user-actions > .dropdown-container {
      order: 1; /* Place avatar first */
      z-index: 1;
    }
    .notification-dropdown {
      position: fixed;
      top: auto;
      bottom: 80px;
      right: 10px;
      left: auto;
      transform: none;
      width: 90%;
      max-width: 340px;
      max-height: 70vh;
      overflow-y: auto;
      z-index: 1001;
    }
  }

  @media (max-width: 400px) {
    .header-content {
      padding: 15px 10px; /* Reduce horizontal padding */
    }
    
    .user-actions {
      gap: 3px; /* Reduce gap between elements */
    }
    
    .notifications {
      margin-left: 5px; /* Reduce left margin */
    }
    
    .nav-links {
      gap: 5px; /* Reduce gap between nav links */
    }
    
    .nav-link {
      padding: 8px; /* Reduce padding on nav links */
    }
  }

  @media (min-width: 878px) {
    .mobile-icon {
      display: none;
    }
    
  }

  .profile-img {
    border-radius: 50%;
    width: 30px;
    height: 30px;
    object-fit: cover;
  }

  /* Custom Mobile Dropdown */
  .mobile-dropdown-overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    width: 100%;
    height: 100%;
    animation: fadeIn 0.2s ease-out;
  }

  .mobile-dropdown-menu {
    background-color: white;
    border-top-left-radius: 16px;
    border-top-right-radius: 16px;
    overflow: hidden;
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-height: 60vh;
    animation: slideUp 0.3s ease-out;
  }

  .mobile-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #e8f5e9;
    border-bottom: 1px solid #c8e6c9;
  }

  .mobile-dropdown-header span {
    font-weight: 600;
    color: #2E7D32;
    font-size: 1.1rem;
  }

  .mobile-close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: #2E7D32;
    cursor: pointer;
  }

  .mobile-dropdown-content {
    padding: 10px 0;
  }

  .mobile-dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 15px 20px;
    color: #333;
    text-decoration: none;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .mobile-dropdown-item:active {
    background-color: #f0f0f0;
  }

  .mobile-dropdown-divider {
    height: 1px;
    background-color: #e0e0e0;
    margin: 5px 0;
  }

  .mobile-logout-item {
    color: #d32f2f;
  }

  .mobile-logout-item:active {
    background-color: rgba(211, 47, 47, 0.1);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  /* Transition classes */
  .slide-up-enter-active,
  .slide-up-leave-active {
    transition: all 0.3s ease;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }

  /* Notification styles */
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
    background-color: rgba(76, 175, 80, 0.1);
  }

  .notifications span.material-icons {
    font-size: 24px;
    color: #2E7D32;
    transition: color 0.3s ease;
  }

  .notifications:hover span.material-icons {
    color: #43A047;
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
    overflow-x: hidden;
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
    will-change: transform;
  }

  .mark-all:hover {
    color: #2E7D32;
  }

  .mark-all:hover::after {
    transform: scaleX(1);
  }

  .dropdown-body {
    max-height: 320px;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .notification-item {
    display: flex;
    padding: 12px 20px;
    border-bottom: 1px solid #f5f5f5;
    cursor: pointer;
    transition: all 0.2s ease;
    align-items: center;
    border-left: 3px solid transparent;
    transform: none;
  }

  .notification-item:hover {
    background-color: #f0f7f0;
    border-left: 3px solid #4CAF50;
    padding-left: 24px;
    padding-right: 16px;
  }

  .notification-item.unread {
    background-color: rgba(76, 175, 80, 0.05);
  }

  .notification-item.system-announcement {
    cursor: default !important;
    pointer-events: auto !important; /* Allow interactions like marking as read */
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

  .notification-icon span.material-icons {
    font-size: 20px;
    color: #666;
  }

  .notification-item.unread .notification-icon span.material-icons {
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
    margin-left: 10px;
  }

  .unread-dot {
    font-size: 10px !important;
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

  .notification-loading span.material-icons,
  .notification-empty span.material-icons {
    font-size: 2rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .spinning {
    animation: spin 1s infinite linear;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .notification-loading-more {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    border-bottom: 1px solid #f5f5f5;
  }

  .notification-loading-more span.material-icons {
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
    display: inline-block;
    text-align: center;
    position: relative;
    padding-bottom: 2px;
    font-weight: 500;
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
    color: #2E7D32;
    text-decoration: none;
  }

  .dropdown-footer a:hover::after {
    transform: scaleX(1);
  }

  .no-more-notifications {
    color: #95a5a6;
    font-style: italic;
    position: relative;
  }

  /* Mobile styles for notifications */
  @media (max-width: 877px) {
    .notifications {
      width: auto;
      height: auto;
      margin-right: 0;
    }
    
    .notification-dropdown {
      position: fixed;
      top: auto;
      bottom: 80px;
      right: 10px; /* Position from right instead of centering */
      left: auto;
      transform: none; /* Remove the translateX to position from right */
      width: 90%;
      max-width: 340px;
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  @media (max-width: 500px) {
    .notification-dropdown {
      right: 5px;
      width: 95%;
    }
  }
  </style>
