<template>
     <div class="admin-layout">
        <AdminLayout pageTitle="Settings">
    <div class="admin-settings">

 
  
      <!-- Main Content -->
      <main class="settings-main">
        <div class="container">
          
          <!-- Settings cards section -->
          <section class="cards-section">
            <!-- Profile Settings Card -->
            <div class="settings-card">
                <div class="card-header">
  <div class="card-icon profile-icon">
    <i class="fas fa-user"></i>
  </div>
  <h3>Profile Settings</h3>
</div>
              
              <div class="card-content">
                <div class="form-group">
                  <label for="username">Username</label>
                  <input 
                    type="text" 
                    id="username" 
                    v-model="profile.username" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input 
                    type="email" 
                    id="email" 
                    v-model="profile.email" 
                    class="form-control"
                  />
                </div>
                
                <div class="form-actions">
                  <button 
                    class="primary-btn" 
                    @click="updateProfile"
                    :disabled="isProfileUpdating"
                  >
                    {{ isProfileUpdating ? 'Updating...' : 'Save Changes' }}
                  </button>
                </div>
                
                <div v-if="profileMessage" :class="['message', profileSuccess ? 'success' : 'error']">
                  {{ profileMessage }}
                </div>
              </div>
            </div>
            
            <!-- Avatar Settings Card -->
            <div class="settings-card">
                <div class="card-header">
  <div class="card-icon avatar-icon">
    <i class="fas fa-image"></i>
  </div>
  <h3>Avatar Settings</h3>
</div>
              
              <div class="card-content">
                <div class="avatar-container">
                  <img 
                    :src="processedAvatarUrl" 
                    alt="Admin Avatar" 
                    class="avatar-preview"
                    @error="handleAvatarError"
                  />
                  
                  <div class="avatar-actions">
                    <label for="avatar-upload" class="upload-btn">
                      Select New Image
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        ref="fileInput"
                        @change="handleFileChange" 
                        accept="image/*"
                        class="hidden-input"
                      />
                    </label>
                    
                    <button 
                      class="delete-btn" 
                      @click="deleteAvatar"
                      :disabled="!avatarUrl || isAvatarUpdating"
                    >
                      Remove Avatar
                    </button>
                  </div>
                </div>
                
                <div class="upload-controls" v-if="selectedFile">
                  <p class="file-name">{{ selectedFile.name }}</p>
                  <button 
                    class="primary-btn" 
                    @click="uploadAvatar"
                    :disabled="isAvatarUpdating"
                  >
                    {{ isAvatarUpdating ? 'Uploading...' : 'Upload Avatar' }}
                  </button>
                </div>
                
                <div v-if="avatarMessage" :class="['message', avatarSuccess ? 'success' : 'error']">
                  {{ avatarMessage }}
                </div>
              </div>
            </div>
            
            <!-- Security Settings Card -->
            <div class="settings-card">
                <div class="card-header">
  <div class="card-icon security-icon">
    <i class="fas fa-lock"></i>
  </div>
  <h3>Security Settings</h3>
</div>
              
              <div class="card-content">
                <div class="form-group">
                  <label for="current-password">Current Password</label>
                  <div class="password-input-container">
    <input 
      :type="showCurrentPassword ? 'text' : 'password'" 
      id="current-password" 
      v-model="passwordData.currentPassword" 
      class="form-control"
      placeholder="Enter your current password"
    />
    <span class="password-toggle-icon" @click="showCurrentPassword = !showCurrentPassword">
      <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
                </div>
                
                <div class="form-group">
                  <label for="new-password">New Password</label>
                  <div class="password-input-container">
    <input 
      :type="showNewPassword ? 'text' : 'password'" 
      id="new-password" 
      v-model="passwordData.newPassword" 
      class="form-control"
      placeholder="Enter new password"
    />
    <span class="password-toggle-icon" @click="showNewPassword = !showNewPassword">
      <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
                </div>
                
                <div class="form-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <div class="password-input-container">
    <input 
      :type="showConfirmPassword ? 'text' : 'password'" 
      id="confirm-password" 
      v-model="passwordData.confirmPassword" 
      class="form-control"
      placeholder="Confirm new password"
    />
    <span class="password-toggle-icon" @click="showConfirmPassword = !showConfirmPassword">
      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
                </div>
                
                <div class="password-requirements">
                  <p>Password must:</p>
                  <ul>
                    <li :class="{ 'requirement-met': passwordMeetsLengthRequirement }">Be at least 8 characters long</li>
                    <li :class="{ 'requirement-met': passwordHasUppercase }">Contain an uppercase letter</li>
                    <li :class="{ 'requirement-met': passwordHasLowercase }">Contain a lowercase letter</li>
                    <li :class="{ 'requirement-met': passwordHasNumber }">Contain a number</li>
                  </ul>
                </div>
                
                <div class="form-actions">
                  <button 
                    class="primary-btn" 
                    @click="changePassword"
                    :disabled="isPasswordUpdating || !canSubmitPasswordChange"
                  >
                    {{ isPasswordUpdating ? 'Updating...' : 'Change Password' }}
                  </button>
                </div>
                
                <div v-if="passwordMessage" :class="['message', passwordSuccess ? 'success' : 'error']">
                  {{ passwordMessage }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
</AdminLayout>
    </div>


    
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../../stores/auth'
  import AdminSidebar from './AdminSidebar.vue';
  import AdminHeader from '../../views/AdminHeader.vue';
  import AdminLayout from './AdminLayout.vue';
  import axios from 'axios'
  
  interface AdminUser {
    id: number;
    username: string;
    email: string;
    admin_level: string;
    avatar?: string;
    [key: string]: any;
  }
  
  // Router and auth store
  const router = useRouter()
  const authStore = useAuthStore()
  
  // Admin user data
  const adminUser = computed(() => authStore.user as AdminUser | null)
  
  // Profile form data
  const profile = ref({
    username: '',
    email: ''
  })
  
  // Password form data
  const passwordData = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Avatar handling
  const avatarUrl = ref<string | null>(null)
  const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
  const selectedFile = ref<File | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)
  
  // Loading states
  const isProfileUpdating = ref(false)
  const isPasswordUpdating = ref(false)
  const isAvatarUpdating = ref(false)

  
  // Status messages
  const profileMessage = ref('')
  const profileSuccess = ref(false)
  const passwordMessage = ref('')
  const passwordSuccess = ref(false)
  const avatarMessage = ref('')
  const avatarSuccess = ref(false)
  
  // Password requirement checks
  const passwordMeetsLengthRequirement = computed(() => 
    passwordData.value.newPassword.length >= 8
  )
  const passwordHasUppercase = computed(() => 
    /[A-Z]/.test(passwordData.value.newPassword)
  )
  const passwordHasLowercase = computed(() => 
    /[a-z]/.test(passwordData.value.newPassword)
  )
  const passwordHasNumber = computed(() => 
    /[0-9]/.test(passwordData.value.newPassword)
  )
  

  
  
  // Check if password can be submitted
  const canSubmitPasswordChange = computed(() => 
    passwordData.value.currentPassword &&
    passwordData.value.newPassword &&
    passwordData.value.confirmPassword &&
    passwordData.value.newPassword === passwordData.value.confirmPassword &&
    passwordMeetsLengthRequirement.value &&
    passwordHasUppercase.value &&
    passwordHasLowercase.value &&
    passwordHasNumber.value
  )
  const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
  // Helper function to get auth header
  const getAuthHeader = () => {
    const token = authStore.token
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }
  
  // Initialize data
  const fetchAdminData = async () => {
    try {
      const response = await axios.get('/api/admin/settings', getAuthHeader())
      const data = response.data
      
      console.log('Fetched admin data:', data);
      
      profile.value.username = data.username
      profile.value.email = data.email
      
      avatarUrl.value = data.avatar
      if (data.avatar) {
        console.log('Setting avatar from API:', data.avatar);
        authStore.updateAvatar(data.avatar);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }
  
  // Update profile
  const updateProfile = async () => {
    try {
      isProfileUpdating.value = true
      profileMessage.value = ''
      
      const response = await axios.put('/api/admin/settings/profile', {
        username: profile.value.username,
        email: profile.value.email
      }, getAuthHeader())
      
      profileSuccess.value = true
      profileMessage.value = 'Profile updated successfully'
      
      // Update local user data
      if (authStore.user) {
        // Update the store with the new username
        authStore.updateUsername(profile.value.username)
        
        // Also update the user email directly
        authStore.user.email = profile.value.email
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      profileSuccess.value = false
      profileMessage.value = 'Failed to update profile'
    } finally {
      isProfileUpdating.value = false
      
      // Clear message after 3 seconds
      setTimeout(() => {
        profileMessage.value = ''
      }, 3000)
    }
  }
  
  // Change password
  const changePassword = async () => {
    try {
      isPasswordUpdating.value = true
      passwordMessage.value = ''
      
      // Check if passwords match
      if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
        passwordSuccess.value = false
        passwordMessage.value = 'New passwords do not match'
        return
      }
      
      await axios.put('/api/admin/settings/password', {
        currentPassword: passwordData.value.currentPassword,
        newPassword: passwordData.value.newPassword
      }, getAuthHeader())
      
      passwordSuccess.value = true
      passwordMessage.value = 'Password changed successfully'
      
      // Clear form
      passwordData.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    } catch (error: any) {
      console.error('Error changing password:', error)
      passwordSuccess.value = false
      
      if (error.response?.status === 400) {
        passwordMessage.value = 'Current password is incorrect'
      } else {
        passwordMessage.value = 'Failed to change password'
      }
    } finally {
      isPasswordUpdating.value = false
      
      // Clear message after 3 seconds
      setTimeout(() => {
        passwordMessage.value = ''
      }, 3000)
    }
  }
  
  // Handle file selection
  const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) {
      selectedFile.value = input.files[0]
    }
  }
  
  // Upload avatar
  const uploadAvatar = async () => {
    if (!selectedFile.value) return;
    
    try {
      isAvatarUpdating.value = true;
      avatarMessage.value = '';
      
      const formData = new FormData();
      formData.append('avatar', selectedFile.value);
      
      const response = await axios.post(
        '/api/admin/settings/avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authStore.token}`
          }
        }
      );
      
      console.log('Avatar upload response:', response.data);
      
      avatarUrl.value = response.data.avatarUrl;
      avatarSuccess.value = true;
      avatarMessage.value = 'Avatar uploaded successfully';
      selectedFile.value = null;
      
      // Update avatar in auth store with timestamp to prevent caching
      authStore.updateAvatar(response.data.avatarUrl + '?t=' + Date.now());
      console.log('Updated avatar in store with timestamp:', authStore.user?.avatar);
      
      // Force a re-load of the avatar globally
      // This will trigger the watcher in the sidebar
      setTimeout(() => {
        // Double update pattern to ensure reactivity triggers everywhere
        const tempAvatar = authStore.user?.avatar || '';
        authStore.updateAvatar('');
        setTimeout(() => {
          authStore.updateAvatar(tempAvatar);
        }, 10);
      }, 100);
      
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      avatarSuccess.value = false;
      
      if (error.response?.status === 413) {
        avatarMessage.value = 'File size too large (max 5MB)';
      } else {
        avatarMessage.value = 'Failed to upload avatar';
      }
    } finally {
      isAvatarUpdating.value = false;
      
      setTimeout(() => {
        avatarMessage.value = '';
      }, 3000);
    }
  }
  
  const sidebarCollapsed = ref(false)

// Function to update sidebar state
const updateSidebarState = (isCollapsed: boolean) => {
  sidebarCollapsed.value = isCollapsed
}
const storedState = localStorage.getItem('adminSidebarCollapsed')
  if (storedState !== null) {
    sidebarCollapsed.value = storedState === 'true'
  }

// Better avatar URL processing
const processedAvatarUrl = computed(() => {
  if (!avatarUrl.value) {
    console.log('No avatar URL, using default');
    return defaultAvatar;
  }
  
  if (avatarUrl.value.startsWith('http')) {
    console.log('Using absolute avatar URL:', avatarUrl.value);
    return avatarUrl.value;
  }
  
  const baseURL = import.meta.env.VITE_API_URL || '';
  console.log('Base URL for avatar:', baseURL);
  
  const formattedAvatarUrl = avatarUrl.value.startsWith('/') 
    ? avatarUrl.value 
    : `/${avatarUrl.value}`;
    
  console.log('Full avatar URL:', `${baseURL}${formattedAvatarUrl}`);
  return `${baseURL}${formattedAvatarUrl}`;
});

// Handle avatar loading errors
const handleAvatarError = (e: Event) => {
  console.error('Error loading avatar image');
  (e.target as HTMLImageElement).src = defaultAvatar;
};

  // Delete avatar
  const deleteAvatar = async () => {
    try {
      isAvatarUpdating.value = true
      avatarMessage.value = ''
      
      await axios.delete('/api/admin/settings/avatar', getAuthHeader())
      
      avatarUrl.value = null
      avatarSuccess.value = true
      avatarMessage.value = 'Avatar removed successfully'
      
      // Update avatar in auth store with double update pattern
      authStore.updateAvatar('');
      setTimeout(() => {
        authStore.updateAvatar(''); // Second update to ensure reactivity
      }, 50);
      
    } catch (error) {
      console.error('Error deleting avatar:', error)
      avatarSuccess.value = false
      avatarMessage.value = 'Failed to remove avatar'
    } finally {
      isAvatarUpdating.value = false
      
      // Clear message after 3 seconds
      setTimeout(() => {
        avatarMessage.value = ''
      }, 3000)
    }
  }
  
  // Logout function
  const logout = () => {
    authStore.logout()
    router.push('/admin/login')
  }
  
  onMounted(() => {
    // Initialize with current user data
    if (adminUser.value) {
      profile.value.username = adminUser.value.username
      profile.value.email = adminUser.value.email
      
      console.log('Admin user avatar from store:', adminUser.value.avatar);
      avatarUrl.value = adminUser.value.avatar || null;
    }
    
    fetchAdminData()
  })
  </script>
  
  <style scoped>
  .admin-settings {
  padding: 0;
  background-color: #f8f9fa;
  width: 100%;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Header section styling */
.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.header-section h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #2E7D32;
  font-weight: 600;
}

.header-section p {
  font-size: 1.1rem;
  color: #555;
  max-width: 700px;
  margin: 0 auto;
}

/* Cards layout */
.cards-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

/* Settings card styling */
.settings-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  min-width: 0; /* Allow cards to shrink below their content size if needed */
  word-wrap: break-word; /* Handle long words */
}

.settings-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  background-color: white;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
}

.card-icon i {
  font-size: 1.5rem;
}

.profile-icon {
  background: linear-gradient(135deg, #43A047, #66BB6A);
}

.avatar-icon {
  background: linear-gradient(135deg, #4CAF50, #81C784);
}

.security-icon {
  background: linear-gradient(135deg, #388E3C, #66BB6A);
}

.card-header h3 {
  font-size: 1.2rem;
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.card-content {
  padding: 1.5rem;
  flex-grow: 1;
  overflow: hidden; /* Prevent overflow */
}

/* Form elements */
.form-group {
  margin-bottom: 1.25rem;
  width: 100%;
  box-sizing: border-box;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  box-sizing: border-box; /* Include padding in width calculation */
  max-width: 100%; /* Prevent overflow */
}

.form-control:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-control::placeholder {
  color: #bbb;
}

.form-actions {
  margin-top: 1.5rem;
}

.primary-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.primary-btn:hover:not(:disabled) {
  background: linear-gradient(90deg, #388E3C, #43A047);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Avatar section styling */
.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e8f5e9;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.avatar-preview {
  width: 50%;
  height: 50%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.upload-btn {
  padding: 0.75rem 1rem;
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.upload-btn:hover {
  background: linear-gradient(90deg, #388E3C, #43A047);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.delete-btn {
  padding: 0.75rem 1rem;
  background: white;
  color: #e53935;
  border: 1px solid #e53935;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.delete-btn:hover:not(:disabled) {
  background: rgba(229, 57, 53, 0.05);
  box-shadow: 0 2px 5px rgba(229, 57, 53, 0.2);
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.hidden-input {
  display: none;
}

.upload-controls {
  width: 100%;
  margin-top: 0.5rem;
  padding: 1rem;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px dashed #ddd;
}

.file-name {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Messages */
.message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.message::before {
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.success {
  background-color: #e8f5e9;
  color: #2E7D32;
  border-left: 4px solid #4CAF50;
}

.success::before {
  content: '\f058'; /* fa-check-circle */
}

.error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #e53935;
}

.error::before {
  content: '\f057'; /* fa-times-circle */
}

/* Password requirements */
.password-requirements {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #eee;
}

.password-requirements p {
  margin: 0 0 0.75rem 0;
  font-weight: 600;
  color: #2c3e50;
}

.password-requirements ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.password-requirements li {
  margin-bottom: 0.5rem;
  color: #757575;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.3s ease;
}

.password-requirements li i {
  font-size: 0.85rem;
  transition: color 0.3s ease;
}

.requirement-met {
  color: #4CAF50;
}

.requirement-met i {
  color: #4CAF50;
}

/* Responsive adjustments */
@media (max-width: 992px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .card-content {
    padding: 1.25rem;
  }
  
  .avatar-container {
    flex-direction: column;
  }
}

@media (max-width: 576px) {
  .cards-section {
    grid-template-columns: 1fr; /* Force single column on small screens */
  }
  
  .card-content {
    padding: 1rem; /* Reduce padding on small screens */
  }
  
  .form-control, .primary-btn, .delete-btn, .upload-btn {
    padding: 0.6rem 0.75rem; /* Slightly reduce padding on inputs and buttons */
  }
}
/* Password input styles */
.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-toggle-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #767676;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.password-toggle-icon:hover {
  color: #43A047;
}

.password-input-container .form-control {
  padding-right: 40px; /* Make room for the eye icon */
}
  </style>