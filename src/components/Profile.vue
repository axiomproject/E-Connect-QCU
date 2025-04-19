<template>
    <div class="profile">
      <!-- Header component -->
      <AppHeader 
        :username="user?.username || 'User'" 
        @logout="logout" 
      />
      
      <!-- Main Content -->
      <main class="profile-main">
        <div class="container">
          <section class="hero-section">
            <h2>Your Eco Profile</h2>
            <p>Manage your account and track your environmental impact.</p>
          </section>
          
          <div v-if="loading" class="loading">
            <span class="loading-spinner"></span>
            <p>Loading your profile...</p>
          </div>
          
          <div v-else-if="error" class="error-message">
            <p>{{ error }}</p>
            <button class="retry-btn" @click="fetchUserProfile">Retry</button>
          </div>
          
          <div v-else class="profile-content">
            <!-- User Info Card -->
            <section class="profile-card">
              <div class="profile-header">
                <div class="profile-avatar" @click="triggerFileInput" :class="{ 'avatar-edit-mode': editMode }">
                  <img :src="profileData.avatar || defaultAvatar" alt="Profile avatar">
                  <div v-if="editMode" class="avatar-edit-overlay">
                    <span>Change</span>
                  </div>
                  <input 
                    type="file" 
                    ref="fileInput" 
                    @change="handleAvatarChange" 
                    accept="image/*" 
                    style="display: none"
                  >
                </div>
                
                <div class="profile-info">
                  <div class="name-section">
                    <h3 v-if="!editMode">{{ profileData.username }}</h3>
                    <input 
                      v-else 
                      type="text" 
                      v-model="editedProfile.username" 
                      class="edit-field" 
                      placeholder="Username"
                    >
                    
                    <div class="user-level" :class="'level-' + profileData.level.toLowerCase()">
                      {{ profileData.level }}
                    </div>
                  </div>
                  
                  <p v-if="!editMode" class="user-bio">{{ profileData.bio }}</p>
                  <textarea 
                    v-else 
                    v-model="editedProfile.bio" 
                    class="edit-field bio-field" 
                    placeholder="Tell us about yourself..."
                  ></textarea>
                  
                  <div class="user-location">
                    <span v-if="!editMode">📍 {{ profileData.location }}</span>
                    <input 
                      v-else 
                      type="text" 
                      v-model="editedProfile.location" 
                      class="edit-field" 
                      placeholder="Your location"
                    >
                  </div>
                  
                  <div class="joined-date">Joined {{ formatDate(profileData.joinedDate) }}</div>
                </div>
                
                <div class="profile-actions">
                  <button v-if="!editMode" class="edit-btn" @click="startEdit">
                    <span class="icon">✏️</span> Edit Profile
                  </button>
                  <div v-else class="edit-actions">
                    <button class="save-btn" @click="saveProfile">
                      <span class="icon">💾</span> Save
                    </button>
                    <button class="cancel-btn" @click="cancelEdit">
                      <span class="icon">❌</span> Cancel
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- User Stats -->
              <div class="profile-stats">
                <div class="stat-item">
                  <div class="stat-value">{{ profileData.points }}</div>
                  <div class="stat-label">Points</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profileData.rank }}</div>
                  <div class="stat-label">Rank</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profileData.actions }}</div>
                  <div class="stat-label">Actions</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ profileData.badges.length }}</div>
                  <div class="stat-label">Badges</div>
                </div>
              </div>
            </section>
            
            <!-- Highlighted Badges -->
            <section class="profile-badges">
              <div class="section-header">
                <h3>Featured Badges</h3>
                <button @click="viewAllBadges" class="view-all">
  View All Badges
</button>
              </div>
              
              <div v-if="profileData.badges.length === 0" class="no-badges">
                <p>You haven't earned any badges yet. Complete challenges to earn your first badge!</p>
                <router-link to="/challenges" class="action-btn">
                  Explore Challenges
                </router-link>
              </div>
              
              <div v-else class="badges-showcase">
                <div 
                  v-for="badge in profileData.badges.slice(0, 4)" 
                  :key="badge.id" 
                  class="badge-showcase-item"
                >
                  <div class="badge-icon" :class="badge.rarity">
                    <span>{{ badge.icon }}</span>
                  </div>
                  <div class="badge-info">
                    <h4>{{ badge.name }}</h4>
                    <div class="badge-earned-date">{{ formatDate(badge.earnedDate) }}</div>
                  </div>
                </div>
              </div>
            </section>
            
            <!-- Environmental Impact -->
            <section class="environmental-impact">
              <div class="section-header">
                <h3>Your Environmental Impact</h3>
              </div>
              
              <div class="impact-metrics">
                <div class="impact-metric carbon">
                  <div class="metric-icon">🌳</div>
                  <div class="metric-details">
                    <div class="metric-value">{{ profileData.impact.carbonSaved }} kg</div>
                    <div class="metric-label">Carbon Footprint Reduced</div>
                    <div class="metric-equivalent">Equivalent to planting {{ Math.round(profileData.impact.carbonSaved / 20) }} trees</div>
                  </div>
                </div>
                <div class="impact-metric water">
                  <div class="metric-icon">💧</div>
                  <div class="metric-details">
                    <div class="metric-value">{{ profileData.impact.waterSaved }} L</div>
                    <div class="metric-label">Water Saved</div>
                    <div class="metric-equivalent">Equivalent to {{ Math.round(profileData.impact.waterSaved / 150) }} showers</div>
                  </div>
                </div>
                <div class="impact-metric waste">
                  <div class="metric-icon">♻️</div>
                  <div class="metric-details">
                    <div class="metric-value">{{ profileData.impact.wasteDiverted }} kg</div>
                    <div class="metric-label">Waste Diverted from Landfills</div>
                    <div class="metric-equivalent">Equivalent to {{ Math.round(profileData.impact.wasteDiverted / 0.5) }} plastic bottles</div>
                  </div>
                </div>
                <div class="impact-metric energy">
                  <div class="metric-icon">⚡</div>
                  <div class="metric-details">
                    <div class="metric-value">{{ profileData.impact.energySaved }} kWh</div>
                    <div class="metric-label">Energy Saved</div>
                    <div class="metric-equivalent">Powers a home for {{ Math.round(profileData.impact.energySaved / 30) }} days</div>
                  </div>
                </div>
              </div>
            </section>
            
            <!-- Recent Activity -->
            <section class="recent-activity">
              <div class="section-header">
                <h3>Recent Activity</h3>
                <button @click="viewAllActivity" class="view-all">
  View All Activity
</button>
              </div>
              
              <div class="activity-timeline">
                <div 
                  v-for="activity in profileData.recentActivity" 
                  :key="activity.id" 
                  class="activity-item"
                >
                  <div class="activity-icon" :class="activity.type">{{ activity.icon }}</div>
                  <div class="activity-content">
                    <div class="activity-header">
                      <span class="activity-title">{{ activity.title }}</span>
                      <span class="activity-date">{{ formatTimeAgo(activity.date) }}</span>
                    </div>
                    <div class="activity-description">{{ activity.description }}</div>
                    <div v-if="activity.points" class="activity-points">+{{ activity.points }} points</div>
                  </div>
                </div>
              </div>
            </section>
            
          
          </div>
        </div>
      </main>
      
      <AppFooter />
      <!-- Add this right before the closing </div> of your profile-content div -->
<!-- Activity Modal -->
<div 
  v-if="showActivityModal" 
  class="activity-modal-overlay" 
  :class="{ 'modal-closing': modalClosing }" 
  @click="closeActivityModal"
>
  <div class="activity-modal" @click.stop>
    <div class="activity-modal-header">
      <h3>All Activity</h3>
      <button class="close-modal-btn" @click="closeActivityModal">×</button>
    </div>
    
    <div class="activity-modal-body">
      <div v-if="allActivity.length === 0" class="no-activity">
        <p>No activity recorded yet. Complete challenges, earn badges, and set goals to see your activity here!</p>
      </div>
      
      <div v-else class="activity-timeline modal-timeline">
        <div 
          v-for="activity in allActivity" 
          :key="activity.id" 
          class="activity-item"
        >
          <div class="activity-icon" :class="activity.type">{{ activity.icon }}</div>
          <div class="activity-content">
            <div class="activity-header">
              <span class="activity-title">{{ activity.title }}</span>
              <span class="activity-date">{{ formatTimeAgo(activity.date) }}</span>
            </div>
            <div class="activity-description">{{ activity.description }}</div>
            <div v-if="activity.points" class="activity-points">+{{ activity.points }} points</div>
          </div>
        </div>
      </div>
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
  import axios from 'axios' // Add this import
  import { useToast } from 'vue-toastification'

const toast = useToast()
  
  // Store and router initialization
  const router = useRouter()
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  
  // Component state
  const loading = ref(true)
  const error = ref('')
  const editMode = ref(false)
  const fileInput = ref(null)
  const defaultAvatar = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'
  // Add these to your existing data structure
const showActivityModal = ref(false)
const allActivity = ref([])

const modalClosing = ref(false);
// Add this method to load all activity when the modal is opened
const viewAllActivity = async () => {
  modalClosing.value = false;
  showActivityModal.value = true;
  
  try {
    // Load all activity, not just the 5 most recent
    const completedChallengesResponse = await axios.get('/api/user/activity/challenges', getAuthHeader())
    const earnedBadgesResponse = await axios.get('/api/user/activity/badges', getAuthHeader())
    const goalActivitiesResponse = await axios.get('/api/user/activity/goals', getAuthHeader())
    
    // Combine all activities and sort by date (most recent first)
    let activities = [
      ...completedChallengesResponse.data.map(challenge => ({
        id: `challenge-${challenge.id}`,
        type: 'challenge',
        icon: '🏆',
        title: 'Challenge Completed',
        description: challenge.title,
        date: new Date(challenge.completed_at),
        points: challenge.points
      })),
      
      ...earnedBadgesResponse.data.map(badge => ({
        id: `badge-${badge.id}`,
        type: 'badge',
        icon: badge.icon || '🏅',
        title: 'Badge Earned',
        description: badge.name,
        date: new Date(badge.earned_at),
        points: badge.points
      })),
      
      ...goalActivitiesResponse.data.map(goal => ({
        id: `goal-${goal.id}-${goal.activity_type}`,
        type: 'goal',
        icon: goal.activity_type === 'created' ? '🎯' : '📈',
        title: goal.activity_type === 'created' ? 'Goal Created' : 'Goal Updated',
        description: goal.title,
        date: new Date(goal.activity_date),
        progress: goal.activity_type === 'updated' ? goal.progress : null
      }))
    ]
    
    // Sort by date (newest first)
    activities.sort((a, b) => b.date - a.date)
    
    allActivity.value = activities
  } catch (error) {
    console.error('Error fetching all activity:', error)
    toast.error('Failed to load activity data')
  }
}

// Add this new method to handle closing with animation
const closeActivityModal = () => {
  modalClosing.value = true;
  setTimeout(() => {
    showActivityModal.value = false;
    modalClosing.value = false;
  }, 300); // Match this duration to your CSS animation duration
}


// Update the "View All Activity" link to use this method
// Replace the router-link with a button

  // Profile data
  const profileData = reactive({
    username: '',
    avatar: '',
    bio: '',
    location: '',
    level: '',
    joinedDate: null,
    points: 0,
    rank: 0,
    actions: 0,
    badges: [],
    impact: {
      carbonSaved: 0,
      waterSaved: 0,
      wasteDiverted: 0,
      energySaved: 0
    },
    recentActivity: [],
    settings: {
      emailNotifications: true,
      challengeReminders: true,
      profileVisibility: true,
      showOnLeaderboard: true
    }
  })
  
  // Editable profile data
  const editedProfile = reactive({
    username: '',
    bio: '',
    location: '',
    avatar: ''
  })
  
  const fetchUserProfile = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // Fetch user profile data from API
    const userSettingsResponse = await axios.get('/api/user/settings', getAuthHeader())
    const userData = userSettingsResponse.data.profile
    
    // Update profile with user data
    profileData.username = userData.username
    profileData.avatar = userData.avatar
    profileData.bio = userData.bio || 'No bio provided yet.'
    profileData.location = userData.location || 'No location set'
    profileData.joinedDate = new Date(userData.created_at)
    profileData.settings.showOnLeaderboard = userData.show_on_leaderboard === true
  // After setting carbon saved

    // Fetch rank data (includes points and carbon)
    const rankResponse = await axios.get('/api/leaderboard/user-rank', getAuthHeader())
    profileData.points = rankResponse.data.points || 0
    profileData.rank = rankResponse.data.rank || 0
    
    // Update carbon saved
    const totalCarbonSaved = parseFloat(rankResponse.data.carbonSaved) || 0;
profileData.impact.carbonSaved = totalCarbonSaved;
// Calculate other impacts based on carbon value
profileData.impact.waterSaved = Math.round(totalCarbonSaved * 10 * 0.25); // 25% as water (in liters)
profileData.impact.wasteDiverted = Math.round(totalCarbonSaved * 0.35); // 35% as waste (in kg)
profileData.impact.energySaved = Math.round(totalCarbonSaved * 2 * 0.20); // 20% as energy (in kWh)
    
    // Fetch badges data
    const badgesResponse = await axios.get('/api/badges/earned', getAuthHeader())
    
    // Format badges from API
    if (badgesResponse.data && badgesResponse.data.length > 0) {
      profileData.badges = badgesResponse.data.map(badge => ({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        rarity: badge.rarity?.toLowerCase() || 'common',
        earnedDate: new Date(badge.earned_at)
      }))
    } else {
      profileData.badges = []
    }
    
    // Fetch challenges data to calculate actions
    const challengesResponse = await axios.get('/api/challenges', getAuthHeader())
    
    // Count completed challenges as actions
    profileData.actions = challengesResponse.data.filter(challenge => 
      challenge.completed).length || 0
    
    // Set user level based on points
    if (profileData.points < 100) {
      profileData.level = 'Beginner'
    } else if (profileData.points < 500) {
      profileData.level = 'Enthusiast'
    } else if (profileData.points < 1000) {
      profileData.level = 'Eco-Warrior'
    } else {
      profileData.level = 'Eco-Champion'
    }
    
    // For remaining mock data that isn't available from API yet,
    // we'll keep minimal placeholder data
    try {
  // 1. Get recent completed challenges
  const completedChallengesResponse = await axios.get('/api/user/activity/challenges', getAuthHeader());
  
  // 2. Get recently earned badges
  const earnedBadgesResponse = await axios.get('/api/user/activity/badges', getAuthHeader());
  
  // 3. Get recent goal activities
  const goalActivitiesResponse = await axios.get('/api/user/activity/goals', getAuthHeader());
  
  // 4. Combine all activities and sort by date (most recent first)
  let allActivities = [
    ...completedChallengesResponse.data.map(challenge => ({
      id: `challenge-${challenge.id}`,
      type: 'challenge',
      icon: '🏆',
      title: 'Challenge Completed',
      description: challenge.title,
      date: new Date(challenge.completed_at),
      points: challenge.points
    })),

    ...earnedBadgesResponse.data.map(badge => ({
      id: `badge-${badge.id}`,
      type: 'badge',
      icon: badge.icon || '🏅',
      title: 'Badge Earned',
      description: badge.name,
      date: new Date(badge.earned_at),
      points: badge.points
    })),
    
    ...goalActivitiesResponse.data.map(goal => ({
      id: `goal-${goal.id}-${goal.activity_type}`,
      type: 'goal',
      icon: goal.activity_type === 'created' ? '🎯' : '📈',
      title: goal.activity_type === 'created' ? 'Goal Created' : 'Goal Updated',
      description: goal.title,
      date: new Date(goal.activity_date),
      progress: goal.activity_type === 'updated' ? goal.progress : null
    }))
  ];
  
  // Sort by date (newest first)
  allActivities.sort((a, b) => b.date - a.date);
  
  // Take the 5 most recent activities
  profileData.recentActivity = allActivities.slice(0, 5);
} catch (activityError) {
  console.error('Error fetching activity data:', activityError);
  // If fetching activities fails, set empty array but don't fail the whole profile load
  profileData.recentActivity = [];
}
    
  
    
    loading.value = false
  } catch (error) {
    console.error('Error fetching profile:', error)
    loading.value = false
    error.value = 'Failed to load profile data. Please try again later.'
  }
}



  
  // Helper function to get auth headers
  const getAuthHeader = () => {
    return {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      }
    }
  }
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return ''
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(date).toLocaleDateString(undefined, options)
  }
  
  // Format relative time (e.g. "2 days ago")
  const formatTimeAgo = (date) => {
    if (!date) return ''
    
    const now = new Date()
    const diff = Math.floor((now - new Date(date)) / 1000) // difference in seconds
    
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
    if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`
    
    return formatDate(date)
  }
  
  // Edit profile functionality
  const startEdit = () => {
  // Navigate to the Settings page
  router.push('/settings')
}
  
  const cancelEdit = () => {
    // Reset edited values to current profile values
    Object.assign(editedProfile, {
      username: profileData.username,
      bio: profileData.bio,
      location: profileData.location,
      avatar: profileData.avatar
    })
    editMode.value = false
  }
  
  const saveProfile = () => {
    // In a real app, you would send this data to an API
    Object.assign(profileData, {
      username: editedProfile.username,
      bio: editedProfile.bio,
      location: editedProfile.location,
      avatar: editedProfile.avatar
    })
    
    editMode.value = false
    
    // Show success message
    alert('Profile updated successfully!')
  }
  
  const triggerFileInput = () => {
    if (editMode.value) {
      fileInput.value.click()
    }
  }

  const viewAllBadges = () => {
  console.log('Navigating to view all badges')
  router.push('/Reward')
}
  
  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    // In a real app, you'd upload this file to a server
    // For this demo, we'll just use a FileReader to get a data URL
    const reader = new FileReader()
    reader.onload = (e) => {
      editedProfile.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
  
  const saveSettings = async () => {
  try {
    // Save leaderboard visibility
    await axios.put('/api/user/settings/leaderboard', {
      showOnLeaderboard: profileData.settings.showOnLeaderboard
    }, getAuthHeader())
    
    // Display success message using standard alert
    alert('Settings saved successfully')
  } catch (error) {
    console.error('Error saving settings:', error)
    alert('Failed to save settings. Please try again.')
  }
}

  
  
  // Logout function
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  
  onMounted(() => {
    fetchUserProfile()
  })
  
  </script>
  
  <style scoped>
  /* Base styles */
  .profile {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
  }
  
  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .profile-main {
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
  
  /* Section styling */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 10px;
  }
  
  .section-header h3 {
    font-size: 1.4rem;
    color: #2E7D32;
    margin: 0;
  }
  
  .view-all {
  font-size: 0.9rem;
  font-family: "Poppins";
  color: #1976D2;
  text-decoration: none;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 6px 12px;
  border-radius: 15px;
}

.view-all:hover {
  transform: translateY(-1px);
  color: #0d47a1;
  text-decoration: none;
  box-shadow: 0 2px 5px rgba(25, 118, 210, 0.15);
}
  
  .profile-content > section {
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    margin-bottom: 30px;
  }
  
  /* Profile card */
  .profile-card {
    background: linear-gradient(135deg, #f9f9f9, #e8f5e9);
    border-left: 5px solid #4CAF50;
  }
  
  .profile-header {
    display: flex;
    flex-wrap: wrap;
    gap: 25px;
    margin-bottom: 25px;
  }
  
  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  
  .avatar-edit-mode {
    cursor: pointer;
  }
  
  .avatar-edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .avatar-edit-mode:hover .avatar-edit-overlay {
    opacity: 1;
  }
  
  .profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .profile-info {
    flex: 1;
    min-width: 250px;
  }
  
  .name-section {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 10px;
  }
  
  .name-section h3 {
    font-size: 1.8rem;
    margin: 0;
    color: #333;
  }

  .view-all {
  font-size: 0.9rem;
  font-family: "Poppins";
  color: #1976D2;
  text-decoration: none;
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
}


  
  .user-level {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
    color: white;
  }
  
  .level-novice {
    background-color: #81C784;
  }
  
  .level-enthusiast {
    background-color: #4CAF50;
  }
  
  .level-champion {
    background-color: #388E3C;
  }
  
  .level-eco {
    background-color: #2E7D32;
  }
  
  .level-warrior {
    background: linear-gradient(90deg, #2E7D32, #1B5E20);
  }
  
  .level-master {
    background: linear-gradient(90deg, #1B5E20, #194D1A);
  }
  
  .user-bio {
    margin: 0 0 15px 0;
    color: #555;
    line-height: 1.5;
  }
  
  .user-location {
    color: #666;
    margin-bottom: 10px;
  }
  
  .joined-date {
    font-size: 0.85rem;
    color: #777;
    font-style: italic;
  }
  
  .profile-actions {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  
  .edit-btn, .save-btn, .cancel-btn {
    padding: 10px 20px;
    border-radius: 30px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
  }
  
  .edit-btn {
    background-color: #E0E0E0;
    color: #333;
  }
  
  .edit-btn:hover {
    background-color: #BDBDBD;
  }
  
  .edit-actions {
    display: flex;
    gap: 10px;
  }
  
  .save-btn {
    background-color: #4CAF50;
    color: white;
  }
  
  .save-btn:hover {
    background-color: #388E3C;
  }
  
  .cancel-btn {
    background-color: #F5F5F5;
    color: #333;
  }
  
  .cancel-btn:hover {
    background-color: #E0E0E0;
  }
  
  .edit-field {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    margin-bottom: 10px;
  }
  
  .bio-field {
    min-height: 100px;
    resize: vertical;
  }
  
  .profile-stats {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .stat-item {
    text-align: center;
    padding: 15px;
    flex: 1;
    min-width: 100px;
  }
  
  .stat-value {
    font-size: 1.8rem;
    font-weight: 700;
    color: #2E7D32;
    margin-bottom: 5px;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  /* Badges section */
  .badges-showcase {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }
  
  .badge-showcase-item {
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
    border: 1px solid #f0f0f0;
    width: calc(50% - 10px);
    transition: all 0.3s ease;
  }
  
  .badge-showcase-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .badge-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .badge-icon.common {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  }
  
  .badge-icon.rare {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  }
  
  .badge-icon.epic {
    background: linear-gradient(135deg, #ede7f6, #d1c4e9);
  }
  
  .badge-icon.legendary {
    background: linear-gradient(135deg, #fff8e1, #ffecb3);
  }
  
  .badge-info h4 {
    margin: 0 0 5px 0;
    font-size: 1.1rem;
  }
  
  .badge-earned-date {
    font-size: 0.85rem;
    color: #666;
  }
  
  .no-badges {
    text-align: center;
    padding: 30px;
    background-color: #f9f9f9;
    border-radius: 10px;
    color: #666;
  }
  
  .no-badges .action-btn {
    display: inline-block;
    margin-top: 15px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border-radius: 30px;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  .no-badges .action-btn:hover {
    background-color: #388E3C;
    transform: translateY(-2px);
  }
  
  /* Environmental Impact */
  .impact-metrics {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .impact-metric {
    display: flex;
    align-items: center;
    padding: 20px;
    border-radius: 10px;
    gap: 15px;
    transition: all 0.3s ease;
  }
  
  .impact-metric.carbon {
    background-color: #E8F5E9;
  }
  
  .impact-metric.water {
    background-color: #E3F2FD;
  }
  
  .impact-metric.waste {
    background-color: #FFF3E0;
  }
  
  .impact-metric.energy {
    background-color: #F3E5F5;
  }
  
  .impact-metric:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  }
  
  .metric-icon {
    font-size: 2.5rem;
    width: 60px;
    height: 60px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  }
  
  .metric-details {
    flex: 1;
  }
  
  .metric-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2E7D32;
    margin-bottom: 5px;
  }
  
  .metric-label {
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
  }
  
  .metric-equivalent {
    font-size: 0.85rem;
    color: #666;
  }
  
  /* Activity timeline */
  .activity-timeline {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .activity-item {
    display: flex;
    gap: 15px;
    padding: 15px;
    background-color: #f9f9f9;
    border-radius: 10px;
    border-left: 4px solid transparent;
  }
  
  .activity-item.challenge {
    border-color: #FFC107;
  }
  
  .activity-item.badge {
    border-color: #9C27B0;
  }
  
  .activity-item.action {
    border-color: #4CAF50;
  }
  
  .activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
  
  .activity-icon.challenge {
    background-color: #FFF8E1;
  }
  
  .activity-icon.badge {
    background-color: #F3E5F5;
  }
  
  .activity-icon.action {
    background-color: #E8F5E9;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  
  .activity-title {
    font-weight: 600;
    color: #333;
  }
  
  .activity-date {
    font-size: 0.85rem;
    color: #777;
  }
  
  .activity-description {
    margin-bottom: 8px;
    color: #555;
  }
  
  .activity-points {
    font-weight: 500;
    color: #2E7D32;
  }
  
  /* Settings section */
  .settings-options {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
  
  .settings-group {
    margin-bottom: 10px;
  }
  
  .settings-group h4 {
    font-size: 1.1rem;
    color: #333;
    margin-bottom: 15px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
  }
  
  .settings-item {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    border-radius: 24px;
    transition: .4s;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    border-radius: 50%;
    transition: .4s;
  }
  
  input:checked + .toggle-slider {
    background-color: #4CAF50;
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(26px);
  }
  
  .setting-info {
    flex: 1;
  }
  
  .setting-info span {
    display: block;
    font-weight: 500;
    margin-bottom: 3px;
  }
  
  .setting-info p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }
  
  .settings-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  
  .save-settings-btn {
    padding: 10px 25px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 30px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .save-settings-btn:hover {
    background-color: #388E3C;
    box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3);
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
  
  .retry-btn {
    margin-top: 15px;
    padding: 8px 20px;
    background-color: #F5F5F5;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    
    .profile-info {
      width: 100%;
    }
    
    .name-section {
      flex-direction: column;
      align-items: center;
    }
    
    .badge-showcase-item {
      width: 100%;
    }
    
    .impact-metrics {
      grid-template-columns: 1fr;
    }
    
    .profile-actions {
      margin-top: 20px;
      width: 100%;
    }
    
    .edit-actions {
      width: 100%;
      justify-content: center;
    }
  }
  /* Add this to your existing CSS */
.activity-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.activity-modal {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.activity-modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activity-modal-header h3 {
  margin: 0;
  color: #2E7D32;
  font-size: 1.4rem;
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #555;
}

.activity-modal-body {
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
}

.modal-timeline {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.no-activity {
  text-align: center;
  padding: 30px;
  color: #666;
}

/* Additional styles for scrollable content */
.modal-timeline::-webkit-scrollbar {
  width: 6px;
}

.modal-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.modal-timeline::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

.modal-timeline::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
/* Add these CSS properties to your .activity-modal-overlay class */
.activity-modal-overlay {
  /* ...existing code... */
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

.activity-modal {
  /* ...existing code... */
  transform: translateY(20px);
  animation: slideIn 0.3s ease forwards;
}

/* Add these animation keyframes to your style section */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0.8;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Add this class for closing animation */
.modal-closing {
  animation: fadeOut 0.3s ease forwards !important;
}

.modal-closing .activity-modal {
  animation: slideOut 0.3s ease forwards !important;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes slideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(20px);
    opacity: 0;
  }
}
  </style>