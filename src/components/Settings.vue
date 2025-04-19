<template>
    <div class="settings">
      <!-- Header component -->
      <AppHeader 
        :username="user?.username || 'User'" 
        @logout="logout" 
      />
      
      <!-- Main Content -->
      <main class="settings-main">
        <div class="container">
          <section class="hero-section">
            <h2>Account Settings</h2>
            <p>Manage your preferences and account information</p>
          </section>
          
          <div v-if="loading" class="loading">
            <span class="loading-spinner"></span>
            <p>Loading settings...</p>
          </div>
          
          <div v-else-if="error" class="error-message">
            <p>{{ error }}</p>
            <button class="retry-btn" @click="fetchSettings">Retry</button>
          </div>
          
          <div v-else class="settings-content">
            <div class="settings-sidebar">
              <div class="settings-navigation">
                <button 
                  v-for="section in settingsSections" 
                  :key="section.id"
                  :class="{ active: currentSection === section.id }"
                  @click="setCurrentSection(section.id)"
                >
                  <span class="section-icon">{{ section.icon }}</span>
                  {{ section.name }}
                </button>
              </div>
              
              <div class="danger-zone">
                <h4>Danger Zone</h4>
                <button class="archive-account-btn" @click="confirmArchiveAccount">
                  Archive Account
                </button>
              </div>
            </div>
            
            <div class="settings-panel">
              <!-- Profile Settings -->
              <div v-show="currentSection === 'profile'" class="settings-section">
                <h3>Profile Information</h3>
                <p class="section-description">Update your personal information</p>
                <div class="form-group avatar-upload-container">
  <label>Profile Picture</label>
  <div class="avatar-preview">
    <img :src="settingsData.profile.avatar || defaultAvatar" alt="Profile Avatar" class="avatar-image">
    <div class="avatar-actions">
      <button type="button" class="upload-btn" @click="triggerFileInput">
        <span class="icon">📷</span> Change Photo
      </button>
      <button v-if="settingsData.profile.avatar" type="button" class="remove-btn" @click="removeAvatar">
        <span class="icon">🗑️</span> Remove
      </button>
    </div>
  </div>
  <input 
    type="file" 
    ref="fileInput" 
    @change="handleAvatarChange" 
    accept="image/*" 
    style="display: none"
  >
</div>
                <div class="form-group">
                  <label for="username">Username</label>
                  <input
                    id="username"
                    type="text"
                    v-model="settingsData.profile.username"
                    placeholder="Your username"
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    v-model="settingsData.profile.email"
                    placeholder="Your email"
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    v-model="settingsData.profile.location"
                    placeholder="Your location"
                    class="form-input"
                  >
                </div>
                
                <div class="form-group">
                  <label for="bio">Bio</label>
                  <textarea
                    id="bio"
                    v-model="settingsData.profile.bio"
                    placeholder="Tell us about yourself..."
                    class="form-input form-textarea"
                  ></textarea>
                </div>
                
                <div class="form-actions">
                  <button class="save-btn" @click="saveSettings('profile')">Save Changes</button>
                </div>
              </div>
              
              <!-- Account Settings -->
              <div v-show="currentSection === 'account'" class="settings-section">
                <h3>Account Settings</h3>
                <p class="section-description">Update your password and authentication preferences</p>
                
                <div class="form-group">
                  <label for="current-password">Current Password</label>
                  <div class="password-input-container">
                    <input
                      id="current-password"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      v-model="passwordData.currentPassword"
                      placeholder="Enter your current password"
                      class="form-input"
                    >
                    <span 
                      class="password-toggle-icon" 
                      v-show="passwordData.currentPassword.length > 0" 
                      @click="showCurrentPassword = !showCurrentPassword"
                    >
                      <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="new-password">New Password</label>
                  <div class="password-input-container">
                    <input
                      id="new-password"
                      :type="showNewPassword ? 'text' : 'password'"
                      v-model="passwordData.newPassword"
                      placeholder="Enter new password"
                      class="form-input"
                    >
                    <span 
                      class="password-toggle-icon" 
                      v-show="passwordData.newPassword.length > 0" 
                      @click="showNewPassword = !showNewPassword"
                    >
                      <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </span>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="confirm-password">Confirm New Password</label>
                  <div class="password-input-container">
                    <input
                      id="confirm-password"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      v-model="passwordData.confirmPassword"
                      placeholder="Confirm new password"
                      class="form-input"
                    >
                    <span 
                      class="password-toggle-icon" 
                      v-show="passwordData.confirmPassword.length > 0" 
                      @click="showConfirmPassword = !showConfirmPassword"
                    >
                      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                    </span>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button class="save-btn" @click="updatePassword">Change Password</button>
                </div>
              </div>

              <!-- Privacy Settings -->
              <div v-show="currentSection === 'privacy'" class="settings-section">
                <h3>Privacy Settings</h3>
                <p class="section-description">Manage your privacy preferences</p>
                
                <div class="form-group">
                  <div class="toggle-container">
                    <label for="leaderboard-toggle">Appear on Leaderboards</label>
                    <div class="toggle-switch">
                      <input 
                        type="checkbox" 
                        id="leaderboard-toggle" 
                        v-model="settingsData.privacy.showOnLeaderboard"
                      >
                      <label class="toggle-label" for="leaderboard-toggle"></label>
                    </div>
                  </div>
                  <p class="helper-text">When enabled, your username and achievements will appear on public leaderboards</p>
                </div>
                
                <div class="form-actions">
                  <button class="save-btn" @click="saveSettings('privacy')">Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <AppFooter />
      
      <!-- Archive Account Confirmation Modal -->
      <div v-if="showArchiveConfirmation" class="modal-overlay" @click.self="showArchiveConfirmation = false">
        <div class="confirmation-modal">
          <h3>Archive Your Account?</h3>
          <p>This action will deactivate your account. You can reactivate it later by contacting support.</p>
          
          <div class="confirmation-input">
            <label for="archive-confirm">Type "ARCHIVE" to confirm:</label>
            <input
              id="archive-confirm"
              type="text"
              v-model="archiveConfirmationText"
              placeholder="ARCHIVE"
              class="form-input"
            >
          </div>
          
          <div class="modal-actions">
            <button 
              class="archive-confirm-btn" 
              :disabled="archiveConfirmationText !== 'ARCHIVE'"
              @click="archiveAccount"
            >
              Archive My Account
            </button>
            <button class="cancel-btn" @click="showArchiveConfirmation = false">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
  import axios from 'axios'
  
  // Store and router initialization
  const router = useRouter()
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  const fileInput = ref(null)
const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png' // Better placeholder with "User" text
const avatarFile = ref(null)
const avatarRemoved = ref(false) // Add a flag to track if the avatar should be removed

// Password visibility toggles
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Add these methods to the script section
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Preview the avatar
  const reader = new FileReader()
  reader.onload = (e) => {
    settingsData.profile.avatar = e.target.result
    avatarFile.value = file
  }
  reader.readAsDataURL(file)
}

const removeAvatar = () => {
  // Just mark that the avatar should be removed and update the UI preview
  settingsData.profile.avatar = null
  avatarFile.value = null
  avatarRemoved.value = true // Set flag to true
  
  // Don't update authStore here, wait until save
}
  
  // Component state
  const loading = ref(true)
  const error = ref('')
  const currentSection = ref('profile')
  const showArchiveConfirmation = ref(false)
  const archiveConfirmationText = ref('')
  
  // Settings sections
  const settingsSections = [
    { id: 'profile', name: 'Profile Information', icon: '👤' },
    { id: 'account', name: 'Account Security', icon: '🔒' },
    { id: 'privacy', name: 'Privacy Settings', icon: '🔐' },
  ]
  
  // Settings data
  const settingsData = reactive({
    profile: {
      username: '',
      email: '',
      location: '',
      bio: ''
    },
    account: {},
    privacy: {
      showOnLeaderboard: true // Default to true
    }
  })
  
  // Password change data
  const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Get auth token for API requests
  const getAuthHeader = () => {
    const token = authStore.token
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  }
  
  // Fetch user settings from the backend API
  const fetchSettings = async () => {
    try {
      loading.value = true
      error.value = ''
      
      const response = await axios.get('/api/user/settings', getAuthHeader())
      
      // Update settings with data from the backend
      settingsData.profile = response.data.profile
      settingsData.account = response.data.account
      
      // Make sure to set the showOnLeaderboard property
      settingsData.privacy.showOnLeaderboard = response.data.profile.showOnLeaderboard !== false
      
      loading.value = false
    } catch (err) {
      console.error('Error fetching settings:', err)
      error.value = err.response?.data?.message || 'An error occurred while fetching your settings'
      loading.value = false
    }
  }
  
  // Set current settings section
  const setCurrentSection = (sectionId) => {
    // If leaving profile section without saving, reset avatar state
    if (currentSection.value === 'profile' && sectionId !== 'profile') {
      resetAvatarChanges()
    }
    currentSection.value = sectionId
  }

  const resetAvatarChanges = () => {
    // If avatar was removed but not saved, restore it
    if (avatarRemoved.value) {
      fetchSettings() // Refetch to restore original avatar
      avatarRemoved.value = false
    }
    avatarFile.value = null
  }
  
  // Save settings changes to the backend
  const saveSettings = async (section) => {
    try {
      if (section === 'profile') {
        // Handle avatar changes first
        try {
          if (avatarFile.value) {
            // Upload new avatar
            const formData = new FormData()
            formData.append('avatar', avatarFile.value)
            
            const avatarResponse = await axios.post(
              '/api/user/avatar',
              formData,
              {
                headers: {
                  ...getAuthHeader().headers,
                  'Content-Type': 'multipart/form-data'
                }
              }
            )
            
            // Update avatar URL with the one from the server
            settingsData.profile.avatar = avatarResponse.data.avatarUrl
            
            // Update avatar in the auth store
            authStore.updateAvatar(avatarResponse.data.avatarUrl)
            
            avatarFile.value = null
          } else if (avatarRemoved.value) {
            // Avatar was removed in the UI, send request to remove on server
            await axios.delete(
              '/api/user/avatar',
              getAuthHeader()
            )
            
            // Now update avatar in the auth store to be null
            authStore.updateAvatar(null)
            avatarRemoved.value = false // Reset the flag
          }
        } catch (avatarError) {
          console.error('Error handling avatar:', avatarError)
          alert(avatarError.response?.data?.message || 'Failed to update avatar. Profile data will still be saved.')
          // Continue with profile update even if avatar update fails
        }
        
        // Now handle profile data in a separate try block
        try {
          // Then save the rest of the profile data
          await axios.put(
            '/api/user/settings/profile', 
            settingsData.profile, 
            getAuthHeader()
          )
          
          // Update username in the auth store if it changed
          if (authStore.user && authStore.user.username !== settingsData.profile.username) {
            // Use the new updateUsername method
            authStore.updateUsername(settingsData.profile.username)
          }
          
          alert('Profile settings saved successfully!')
        } catch (profileError) {
          console.error('Error saving profile settings:', profileError)
          alert(profileError.response?.data?.message || 'An error occurred while saving your profile settings.')
        }
      } else if (section === 'privacy') {
        // Save privacy settings
        await axios.put(
          '/api/user/settings/leaderboard', 
          { showOnLeaderboard: settingsData.privacy.showOnLeaderboard }, 
          getAuthHeader()
        )
        
        alert('Privacy settings saved successfully!')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(error.response?.data?.message || 'An error occurred while saving your settings. Please try again.')
    }
  }
  
  // Update password via the backend API
  const updatePassword = async () => {
    // Password validation
    if (!passwordData.currentPassword) {
      alert('Please enter your current password')
      return
    }
    
    if (!passwordData.newPassword) {
      alert('Please enter a new password')
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }
    
    try {
      await axios.put(
        '/api/user/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        getAuthHeader()
      )
      
      // Clear form fields
      passwordData.currentPassword = ''
      passwordData.newPassword = ''
      passwordData.confirmPassword = ''
      
      alert('Password changed successfully!')
    } catch (error) {
      console.error('Error updating password:', error)
      alert(error.response?.data?.message || 'An error occurred while updating your password. Please try again.')
    }
  }
  
  // Archive account confirmation
  const confirmArchiveAccount = () => {
    showArchiveConfirmation.value = true
    archiveConfirmationText.value = ''
  }
  
  // Archive account via the backend API
  const archiveAccount = async () => {
    try {
      await axios.put('/api/user/archive', {}, getAuthHeader())
      
      // Log out user and redirect to landing page
      await authStore.logout()
      showArchiveConfirmation.value = false
      alert('Your account has been archived. You can reactivate it later by contacting support.')
      router.push('/')
    } catch (error) {
      console.error('Error archiving account:', error)
      alert(error.response?.data?.message || 'An error occurred while archiving your account. Please try again.')
    }
  }

  
  
  // Logout function
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  
  onMounted(() => {
    fetchSettings();
    
    // Check if there's a section parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const sectionParam = urlParams.get('section');
    
    // If section parameter exists and matches one of our sections, set it as current
    if (sectionParam && settingsSections.some(section => section.id === sectionParam)) {
      currentSection.value = sectionParam;
    }
  })
  </script>



<style scoped>
/* Base styles */
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  font-family:"Poppins"
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.settings-main {
  flex: 1;
  padding: 30px 0;
}

/* Hero section */
.hero-section {
  text-align: center;
  margin-bottom: 40px;
}

.hero-section h2 {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #2E7D32;
}

.hero-section p {
  font-size: 1.1rem;
  color: #555;
  max-width: 700px;
  margin: 0 auto;
}

/* Settings content layout */
.settings-content {
  display: flex;
  gap: 30px;
}

.settings-sidebar {
  flex: 0 0 250px;
  height: fit-content;
}

.settings-panel {
  flex: 1;
  min-width: 0; /* Important for text wrapping */
}

/* Settings navigation */
.settings-navigation {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.settings-navigation button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 15px 20px;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid #eee;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Poppins";
}

.settings-navigation button:last-child {
  border-bottom: none;
}

.settings-navigation button:hover {
  background-color: #f5f5f5;
}

.settings-navigation button.active {
  background-color: #e8f5e9;
  color: #2E7D32;
  font-weight: 500;
  border-left: 4px solid #2E7D32;
  font-family: "Poppins";
}

.section-icon {
  font-size: 1.2rem;
}

/* Danger zone */
.danger-zone {
  background-color: #ffebee;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.danger-zone h4 {
  color: #c62828;
  margin: 0 0 15px 0;
  font-size: 1rem;
}

.archive-account-btn {
  width: 100%;
  padding: 10px;
  background-color: white;
  border: 1px solid #c62828;
  border-radius: 6px;
  color: #c62828;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archive-account-btn:hover {
  background-color: #c62828;
  color: white;
}

/* Settings sections */
.settings-section {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.settings-section h3 {
  color: #2E7D32;
  margin: 0 0 5px 0;
  font-size: 1.4rem;
}

.section-description {
  color: #666;
  margin: 0 0 25px 0;
  font-size: 0.95rem;
}

/* Form styling */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.checkbox-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.checkbox-group label {
  margin-bottom: 0;
  padding-top: 2px;
}

.checkbox-group input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #4CAF50;
}

.helper-text {
  margin: 5px 0 0 28px;
  font-size: 0.85rem;
  color: #666;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

/* Notification groups */
.notification-group {
  margin-bottom: 30px;
}

.notification-group h4 {
  font-size: 1.1rem;
  color: #333;
  margin: 0 0 15px 0;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

/* Button styling */
.save-btn {
  padding: 12px 25px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background-color: #388E3C;
  box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3);
}

.download-btn {
  padding: 12px 25px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.download-btn:hover {
  background-color: #e0e0e0;
}

.retry-btn {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: #F5F5F5;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Modal styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.confirmation-modal {
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.confirmation-modal h3 {
  color: #c62828;
  margin: 0 0 15px 0;
  font-size: 1.4rem;
}

.confirmation-modal p {
  margin-bottom: 20px;
  color: #333;
}

.confirmation-input {
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  gap: 15px;
}

.archive-confirm-btn {
  padding: 12px 20px;
  background-color: #c62828;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.archive-confirm-btn:hover {
  background-color: #b71c1c;
}

.archive-confirm-btn:disabled {
  background-color: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 12px 20px;
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
}

/* Loading state */
.loading {
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.loading-spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  border-top-color: #4CAF50;
  animation: spin 1s ease infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading p {
  margin-top: 15px;
  color: #666;
}

.error-message {
  text-align: center;
  padding: 40px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
  color: #D32F2F;
}

/* Add to the style section */
.avatar-upload-container {
  margin-bottom: 30px;
}

.avatar-preview {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

.avatar-image {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn, .remove-btn {
  padding: 8px 15px;
  border-radius: 6px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.upload-btn {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.upload-btn:hover {
  background-color: #C8E6C9;
}

.remove-btn {
  background-color: #FFEBEE;
  color: #C62828;
}

.remove-btn:hover {
  background-color: #FFCDD2;
}

/* Add these new toggle switch styles */
.toggle-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 38px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-label {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-label:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-label {
  background-color: #4CAF50;
}

input:focus + .toggle-label {
  box-shadow: 0 0 1px #4CAF50;
}

input:checked + .toggle-label:before {
  transform: translateX(30px);
}

/* Password visibility toggle styles */
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
  color: #4CAF50;
}

.password-input-container .form-input {
  width: 100%;
  padding-right: 40px; /* Make room for the eye icon */
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .settings-content {
    flex-direction: column;
  }
  
  .settings-sidebar {
    flex: none;
    width: 100%;
  }
  
  .settings-navigation {
    display: flex;
    flex-direction: column; /* Change to column layout instead of horizontal scrolling */
    overflow-x: visible; /* Remove horizontal scrolling */
  }
  
  .settings-navigation button {
    flex: 1;
    white-space: normal; /* Allow text to wrap */
    border-bottom: 1px solid #eee;
    border-right: none;
    padding: 12px 15px; /* Slightly smaller padding for mobile */
  }
  
  .settings-navigation button.active {
    border-left: 4px solid #2E7D32; /* Keep the left border for active state */
    border-bottom: 1px solid #eee;
  }
  
  .danger-zone {
    text-align: center;
  }
  
  .archive-account-btn {
    width: auto;
    padding: 10px 20px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>