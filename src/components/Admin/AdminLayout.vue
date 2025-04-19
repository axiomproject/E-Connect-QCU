<template>
  <div class="admin-layout">
    <div v-if="isMobile && mobileMenuOpen" class="sidebar-backdrop" @click="closeMobileMenu"></div>
    
    <!-- Pass closeMobileMenu to sidebar -->
    <AdminSidebar 
      @sidebar-toggle="updateSidebarState" 
      @close-mobile-menu="closeMobileMenu"
      :is-collapsed="sidebarCollapsed" 
      :is-mobile-menu-open="mobileMenuOpen" 
    />
    
    <div class="admin-content" :class="{ 
  'sidebar-collapsed': sidebarCollapsed,
  'mobile-view': isMobile,
  'has-dock': isMobile
}">
      <AdminHeader :title="pageTitle" :isCollapsed="sidebarCollapsed" @toggle-mobile-menu="toggleMobileMenu" />
      <div class="admin-page-content">
        <!-- Slot for page content -->
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminSidebar from './AdminSidebar.vue';
import AdminHeader from '../../views/AdminHeader.vue';

const router = useRouter();

// Props
const props = defineProps({
  pageTitle: {
    type: String,
    default: 'Admin Dashboard'
  }
});

// Update emits
const emit = defineEmits(['update-sidebar-state']);

// Sidebar state
const sidebarCollapsed = ref(false);

// Function to update sidebar state - make it stable
const updateSidebarState = (isCollapsed: boolean) => {
  // Only update if the state actually changed
  if (sidebarCollapsed.value !== isCollapsed) {
    sidebarCollapsed.value = isCollapsed;
    
    // No need to set localStorage here, it's handled in the sidebar component
    emit('update-sidebar-state', isCollapsed);
  }
};

// Mobile state
const isMobile = ref(false);
const mobileMenuOpen = ref(false);

// Check if mobile
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

// Toggle mobile menu with an exclusion for dock navigations
const toggleMobileMenu = (fromDock = false) => {
  if (fromDock) {
    return; // Don't toggle if navigation is from dock
  }
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

// Close mobile menu - expose to sidebar
const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

// Ensure routing doesn't interfere with mobile dock/sidebar state
const handleRouteChange = () => {
  // If we're in mobile mode and the full sidebar is open, close it
  if (isMobile.value && mobileMenuOpen.value) {
    mobileMenuOpen.value = false;
  }
};

// Make sure our mobile content has enough top padding for the fixed header
const mobileHeaderHeight = ref(70); // Approximate height of mobile header

onMounted(() => {
  // Get sidebar collapse state from localStorage
  const storedState = localStorage.getItem('adminSidebarCollapsed');
  if (storedState !== null) {
    sidebarCollapsed.value = storedState === 'true';
  }
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
  
  // Add route change handler
  router.afterEach(handleRouteChange);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
  
  // Remove route change handler
  router.afterEach(() => {});
});
</script>

<style scoped>
.sidebar-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  z-index: 999;
}

/* Additional mobile styles */
@media (max-width: 768px) {
  .admin-content.has-dock .admin-page-content {
    padding-bottom: 70px; /* Make room for dock at bottom - adjusted since we removed 2 items */
  }
  
  
}
.admin-layout {
  display: flex;
  min-height: 100vh;
  width: 100%; /* Changed from min-width to width */
  background-color: #f8f9fa;
  font-family: 'Poppins', 'Segoe UI', Roboto, Arial, sans-serif;
  position: relative;
  overflow-x: hidden; /* Prevent horizontal scrolling */
  will-change: contents;
}

.admin-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s ease;
  width: calc(100% - 250px); /* Set explicit width */
  overflow-x: hidden; /* Prevent horizontal scrolling */
  will-change: margin-left, width;
  backface-visibility: hidden;
}

.admin-content.sidebar-collapsed {
  margin-left: 70px;
  width: calc(100% - 70px); /* Adjust width when sidebar is collapsed */
}



.admin-page-content {
  padding: 1.5rem;
  box-sizing: border-box; /* Ensure padding is included in width */
  max-width: 100%; /* Ensure content doesn't exceed container */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .admin-content {
    margin-left: 0;
    width: 100%; /* Full width on mobile */
    transition: none; /* Remove transition on mobile to prevent visual glitches */
  }
  
  .admin-content.sidebar-collapsed {
    margin-left: 0;
    width: 100%; /* Full width on mobile when collapsed */
  }
  
  .admin-page-content {
    padding: 1rem;
  }
}
</style>
