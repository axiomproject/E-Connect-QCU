<template>
    <div class="rewards">
      <!-- Header component -->
      <AppHeader 
        :username="user?.username || 'User'" 
        @logout="logout" 
      />
  
      <!-- Main Content -->
      <main class="rewards-main">
        <div class="container">
          <section class="hero-section">
            <h2>Environmental Achievements</h2>
            <p>Collect badges by completing eco-friendly actions and challenges.</p>
          </section>
  
          <!-- User Badges Overview -->
          <section class="user-badges-overview">
            <div class="badges-card">
              <div class="badges-header">
                <h3>Your Eco Badges</h3>
                <div class="badge-stats">
                  <span class="badge-count">{{ userBadges.length }} / {{ allBadges.length }}</span>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: `${(userBadges.length / allBadges.length) * 100}%` }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <div class="badges-collection">
                <div 
                  v-for="badge in userBadges" 
                  :key="badge.id" 
                  class="badge-item earned"
                  @click="selectBadge(badge)"
                >
                  <div class="badge-icon" :class="badge.rarity">
                    <span>{{ badge.icon }}</span>
                  </div>
                  <div class="badge-info">
                    <h4>{{ badge.name }}</h4>
                    <p>{{ badge.shortDescription }}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Badge Categories -->
          <section class="badge-categories">
            <h3>Badge Collections</h3>
            <div class="category-tabs">
              <button 
                v-for="category in categories" 
                :key="category.id"
                :class="{ active: currentCategory === category.id }"
                @click="setCategory(category.id)"
              >
                <span class="category-icon">{{ category.icon }}</span>
                {{ category.name }}
              </button>
            </div>
        
          </section>
          
          <!-- All Badges (Filtered by Category) -->
          <section class="all-badges">
            <div v-if="loading" class="loading">
              <span class="loading-spinner"></span>
              <p>Loading badges...</p>
            </div>
            
            <div v-else class="badges-grid">
              <div 
                v-for="badge in filteredBadges" 
                :key="badge.id" 
                class="badge-card"
                :class="{ 'earned': hasBadge(badge.id), 'locked': !hasBadge(badge.id) }"
                @click="selectBadge(badge)"
              >
                <div class="badge-icon" :class="badge.rarity">
                  <span v-if="hasBadge(badge.id)">{{ badge.icon }}</span>
                  <span v-else class="locked-icon">🔒</span>
                </div>
                <div class="badge-details">
                  <h4>{{ badge.name }}</h4>
                  <div class="badge-rarity" :class="badge.rarity">
                    {{ badge.rarity }}
                  </div>
                  <p>{{ hasBadge(badge.id) ? badge.shortDescription : badge.requirement }}</p>
                  <div class="progress-container" v-if="!hasBadge(badge.id) && badge.progress !== undefined">
                    <div class="badge-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: `${badge.progress}%` }"></div>
                      </div>
                      <span>{{ Math.round(badge.progress) }}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Badge Detail Modal -->
          <div 
  v-if="selectedBadge" 
  class="badge-modal"
  :class="{ 'modal-closing': modalClosing }"
>
            <div class="modal-content">
              <button class="close-btn" @click="closeBadgeModal">×</button>
              <div class="modal-header">
                <div class="badge-icon large" :class="selectedBadge.rarity">
                  <span v-if="hasBadge(selectedBadge.id)">{{ selectedBadge.icon }}</span>
                  <span v-else class="locked-icon">🔒</span>
                </div>
                <div>
                  <h3>{{ selectedBadge.name }}</h3>
                  <div class="badge-rarity" :class="selectedBadge.rarity">{{ selectedBadge.rarity }}</div>
                </div>
              </div>
              
              <div class="modal-body">
                <p class="badge-description">{{ selectedBadge.description }}</p>
                
                <div v-if="hasBadge(selectedBadge.id)" class="achievement-date">
                  <span>Achieved on {{ formatDate(selectedBadge.earnedDate) }}</span>
                </div>
                
                <div v-else class="badge-requirements">
                  <h4>How to earn:</h4>
                  <p>{{ selectedBadge.requirement }}</p>
                  
                  <div v-if="selectedBadge.progress !== undefined" class="progress-container">
                    <div class="badge-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: `${selectedBadge.progress}%` }"></div>
                      </div>
                      <span>{{ Math.round(selectedBadge.progress) }}%</span>
                    </div>
                  </div>
                </div>
                
                <div class="badge-benefits" v-if="selectedBadge.points > 0">
                  <h4>Rewards:</h4>
                  <p><strong>{{ selectedBadge.points }} points</strong> added to your eco score</p>
                </div>
              </div>
              
              <div class="modal-footer">
                <button 
                  v-if="!hasBadge(selectedBadge.id)" 
                  class="action-btn" 
                  @click="navigateToChallenge(selectedBadge)"
                >
                  Go to challenge
                </button>
                <button 
                  v-else 
                  class="share-btn" 
                  @click="shareBadge(selectedBadge)"
                >
                  Share achievement
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <AppFooter />
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
  import axios from 'axios'
  
  // Store and router initialization
  const router = useRouter()
  const authStore = useAuthStore()
  const user = computed(() => authStore.user)
  
  // Component state
  const loading = ref(true)
  const selectedBadge = ref(null)
  const currentCategory = ref('all')
  const challenges = ref([]);
  const refreshingBadges = ref(false);
  const modalClosing = ref(false)

  // Badge categories
  const categories = [
    { id: 'all', name: 'All Badges', icon: '🏆' },
    { id: 'waste', name: 'Waste', icon: '♻️' },
    { id: 'energy', name: 'Energy', icon: '⚡' },
    { id: 'water', name: 'Water', icon: '💧' },
    { id: 'transportation', name: 'Transportation', icon: '🚲' },
    { id: 'food', name: 'Food', icon: '🥗' },
    { id: 'difficulty', name: 'Challenges', icon: '🏅' }
  ]
  
  // All available badges in the system
  const allBadges = ref([])
  
  // User's earned badges (would come from API in real app)
  const userBadges = ref([])
  
  onMounted(async () => {
    try {
      loading.value = true;
      
      // Fetch all badges and challenges in parallel for efficiency
      const [badgesResponse, challengesResponse] = await Promise.all([
        axios.get('/api/badges', getAuthHeader()),
        axios.get('/api/challenges', getAuthHeader())
      ]);
      
      // Process challenges data
      challenges.value = challengesResponse.data.map(challenge => ({
        id: challenge.id,
        title: challenge.title || '',
        category: challenge.category || '',
        difficulty: challenge.difficulty || 'medium',
        completed: !!challenge.completed,
        carbonReduction: parseFloat(challenge.carbon_reduction) || 0
      }));
      
      // Process badges data with proper progress calculation
      allBadges.value = badgesResponse.data.map(badge => ({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        shortDescription: badge.short_description,
        description: badge.description,
        requirement: badge.requirement,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        earnedDate: badge.earned_at ? new Date(badge.earned_at) : null,
        // Calculate accurate progress for badges not yet earned
        progress: badge.earned ? 100 : calculateBadgeProgress(badge)
      }));
      
      // Filter earned badges
      userBadges.value = allBadges.value.filter(badge => badge.earnedDate !== null);
      
      loading.value = false;
    } catch (error) {
      console.error('Error fetching data:', error);
      loading.value = false;
    }
  });
  
  // Get auth header for API requests
  const getAuthHeader = () => {
    return {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    };
  };
  
  // Calculate badge progress (this would be more sophisticated in a real app)
  const calculateBadgeProgress = (badge) => {
    if (badge.earned) return 100;
    
    // Category-based badges progress (recycling, water, energy, etc.)
    if (['recycling', 'waste', 'water', 'energy', 'transport', 'transportation', 'food'].includes(badge.category)) {
      // Map the category to handle minor variations in naming
      const categoryMap = {
        'transport': 'transportation', // Map 'transport' to 'transportation'
        'recycling': 'waste'           // Map 'recycling' to 'waste'
      };
      
      const mappedCategory = categoryMap[badge.category] || badge.category;
      
      // Find challenges in this category
      const relevantChallenges = challenges.value.filter(
        challenge => challenge.category === mappedCategory
      );
      
      // Count completed challenges in this category
      const completedCount = relevantChallenges.filter(challenge => challenge.completed).length;
      
      // If no challenges in this category have been completed, return 0
      if (completedCount === 0) return 0;
      
      const totalCount = relevantChallenges.length;
      if (totalCount === 0) return 0; // No challenges in this category
      
      // For badges that require 3 completions (like Water Protector), adjust the formula
      if (badge.requirement && badge.requirement.includes('3') && badge.requirement.toLowerCase().includes('complete')) {
        return Math.min(Math.round((completedCount / 3) * 100), 99);
      }
      
      // General progress based on category completion ratio
      return Math.min(Math.round((completedCount / totalCount) * 100), 99);
    }
    
    // Handle milestone badges (based on total challenges completed)
    if (badge.category === 'milestone') {
      const totalCompleted = challenges.value.filter(c => c.completed).length;
      
      // If no challenges completed, return 0
      if (totalCompleted === 0) return 0;
      
      let targetNumber = 1; // Default
      
      // Extract the number from the requirement (e.g., "Complete 5 challenges" -> 5)
      if (badge.requirement) {
        const match = badge.requirement.match(/(\d+)/);
        if (match) {
          targetNumber = parseInt(match[1], 10);
        }
      }
      
      if (targetNumber <= 0) return 0;
      return Math.min(Math.round((totalCompleted / targetNumber) * 100), 99);
    }
    
    // Handle difficulty-based badges
    if (badge.category === 'difficulty') {
      const difficulty = badge.name.toLowerCase().includes('easy') ? 'easy' :
                         badge.name.toLowerCase().includes('medium') ? 'medium' :
                         badge.name.toLowerCase().includes('hard') ? 'hard':
                         badge.name.toLowerCase().includes('ultra-hard') ? 'ultra-hard' : null;
      
      if (!difficulty) return 0; // Unknown difficulty
      
      // Find challenges with this difficulty
      const relevantChallenges = challenges.value.filter(c => c.difficulty === difficulty);
      const completedCount = relevantChallenges.filter(c => c.completed).length;
      
      // If no challenges of this difficulty completed, return 0
      if (completedCount === 0) return 0;
      
      // Most difficulty badges require 3 completions
      return Math.min(Math.round((completedCount / 3) * 100), 99);
    }
    
    // Handle impact badges (based on CO2 saved)
    if (badge.category === 'impact') {
      let totalCarbon = 0;
      challenges.value.forEach(challenge => {
        if (challenge.completed && challenge.carbonReduction) {
          totalCarbon += parseFloat(challenge.carbonReduction);
        }
      });
      
      // If no carbon saved yet, return 0
      if (totalCarbon === 0) return 0;
      
      // Extract target amount from requirement (e.g., "Save over 50kg of CO₂" -> 50)
      let targetAmount = 50; // Default
      if (badge.requirement) {
        const match = badge.requirement.match(/(\d+)/);
        if (match) {
          targetAmount = parseInt(match[1], 10);
        }
      }
      
      return Math.min(Math.round((totalCarbon / targetAmount) * 100), 99);
    }
  
    // Default: return 0 for badges that don't fit any category
    return 0;
  };
  
  // Filter badges based on selected category
  const filteredBadges = computed(() => {
    if (currentCategory.value === 'all') {
      return allBadges.value
    }
    return allBadges.value.filter(badge => badge.category === currentCategory.value)
  })
  
  // Check if user has earned a specific badge
  const hasBadge = (badgeId) => {
    return userBadges.value.some(badge => badge.id === badgeId)
  }
  
  // Set the current category filter
  const setCategory = (categoryId) => {
    currentCategory.value = categoryId
  }
  
  // Select a badge to view details
 const selectBadge = (badge) => {
  modalClosing.value = false
  selectedBadge.value = badge
}
  // Check if user has earned a specific badge
  // Format date for display
  const formatDate = (date) => {
    if (!date) return ''
    const options = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(date).toLocaleDateString(undefined, options)
  }
  
  // Navigate to the challenge page for this badge
  const navigateToChallenge = (badge) => {
    // Close the modal
    // Close the modal with animation
  closeBadgeModal()
  // Use setTimeout to wait for animation to finish
  setTimeout(() => {
    router.push({
      path: '/challenges',
      query: { 
        category: badge.category,
        filter: 'open'
      }
    });
  }, 300)
}
  
const shareBadge = (badge) => {
  closeBadgeModal()
  setTimeout(() => {
    alert(`Sharing your "${badge.name}" achievement on social media!`)
  }, 300)
}
  
  // Refresh badges
  const refreshBadges = async () => {
    try {
      refreshingBadges.value = true;
      
      // Call the API to refresh badges
      const response = await axios.post('/api/badges/refresh', {}, getAuthHeader());
      
      // Reload badges data
      const badgesResponse = await axios.get('/api/badges', getAuthHeader());
      allBadges.value = badgesResponse.data.map(badge => ({
        id: badge.id,
        name: badge.name,
        icon: badge.icon,
        shortDescription: badge.short_description,
        description: badge.description,
        requirement: badge.requirement,
        category: badge.category,
        rarity: badge.rarity,
        points: badge.points,
        earnedDate: badge.earned_at ? new Date(badge.earned_at) : null,
        progress: badge.earned ? 100 : calculateBadgeProgress(badge)
      }));
      userBadges.value = allBadges.value.filter(badge => badge.earnedDate !== null);
      
      // Show success message
      alert(response.data.result || 'Badges refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing badges:', error);
      alert('There was an error refreshing your badges. Please try again.');
    } finally {
      refreshingBadges.value = false;
    }
  };

  const closeBadgeModal = () => {
  modalClosing.value = true
  setTimeout(() => {
    selectedBadge.value = null
    modalClosing.value = false
  }, 300) // Match this duration to your CSS animation
}
  
  // Logout function
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  </script>
  
  <style scoped>
  /* Base styles */
  .rewards {
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
  
  .rewards-main {
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
  
  /* User Badges Overview */
  .user-badges-overview {
    margin-bottom: 40px;
  }
  
  .badges-card {
    background: linear-gradient(135deg, #f9f9f9, #e8f5e9);
    border-radius: 16px;
    padding: 30px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
    border-left: 6px solid #4CAF50;
  }
  
  .badges-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .badges-header h3 {
    font-size: 1.5rem;
    color: #2E7D32;
  }
  
  .badge-stats {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .badge-count {
    font-weight: bold;
    color: #2E7D32;
  }
  
  .progress-bar {
    height: 12px;
    width: 150px;
    background-color: #E0E0E0;
    border-radius: 10px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #43A047, #66BB6A);
    border-radius: 10px;
    transition: width 1s ease;
  }
  
  .badges-collection {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .badge-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    cursor: pointer;
  }
  
  .badge-item:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .badge-item.earned {
    border-left: 4px solid #4CAF50;
  }
  
  .badge-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    background-color: #e8f5e9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .badge-icon.large {
    width: 80px;
    height: 80px;
    font-size: 36px;
  }
  
  .badge-icon.easy {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  }
  
  .badge-icon.medium {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  }
  
  .badge-icon.hard {
    background: linear-gradient(135deg, #ede7f6, #d1c4e9);
  }
  
  .badge-icon.ultra-hard {
    background: linear-gradient(135deg, #fff8e1, #ffecb3);
  }
  
  .badge-info h4 {
    margin: 0 0 5px 0;
    font-size: 1rem;
  }
  
  .badge-info p {
    margin: 0;
    font-size: 0.85rem;
    color: #666;
  }
  
  /* Badge Categories */
  .badge-categories {
    margin-bottom: 30px;
  }
  
  .badge-categories h3 {
    font-size: 1.5rem;
    color: #2E7D32;
    margin-bottom: 15px;
  }
  
  .category-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 30px;
  }
  
  .category-tabs button {
    padding: 10px 20px;
    background-color: white;
    border: 2px solid #e0e0e0;
    border-radius: 30px;
    font-size: 1rem;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .category-tabs button.active {
    background-color: #4CAF50;
    border-color: #4CAF50;
    color: white;
    box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3);
  }
  
  .category-tabs button:hover:not(.active) {
    background-color: #f5f5f5;
    border-color: #bdbdbd;
  }
  
  .category-icon {
    font-size: 1.2rem;
  }
  
  .refresh-badges {
    display: flex;
    justify-content: center;
    margin-top: 15px;
  }
  
  .refresh-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 30px;
    padding: 10px 20px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .refresh-btn:hover {
    background-color: #2E7D32;
    transform: translateY(-2px);
  }
  
  .refresh-btn:disabled {
    background-color: #9E9E9E;
    cursor: not-allowed;
    transform: none;
  }
  
  /* All Badges Grid */
  .badges-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .badge-card {
    background-color: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    display: flex;
    gap: 20px;
  }
  
  .badge-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  .badge-card.earned {
    border-color: #A5D6A7;
    background-color: #f9fff9;
  }
  
  .badge-card.locked {
    opacity: 0.8;
  }
  
  .badge-details {
    flex: 1;
  }
  
  .badge-details h4 {
    margin: 0 0 8px 0;
    font-size: 1.2rem;
    color: #333;
  }
  
  .badge-details p {
    margin: 0 0 10px 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .badge-rarity {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 10px;
  }
  
  .badge-rarity.easy {
    background-color: #e8f5e9;
    color: #2E7D32;
  }
  
  .badge-rarity.hard {
    background-color: #e3f2fd;
    color: #1565C0;
  }
  
  .badge-rarity.hard {
    background-color: #ede7f6;
    color: #6A1B9A;
  }
  
  .badge-rarity.ultra-hard {
    background-color: #fff8e1;
    color: #FF6F00;
  }
  
  .locked-icon {
    opacity: 0.6;
  }
  
  .badge-progress {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .badge-progress .progress-bar {
    flex: 1;
    height: 8px;
  }
  
  .badge-progress span {
    font-size: 0.8rem;
    color: #666;
    min-width: 40px;
    text-align: right;
  }
  
  .progress-container {
    margin-top: 10px;
  }
  
  /* Badge Detail Modal */
  .badge-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    position: relative;
    transform: translateY(20px);
    animation: slideIn 0.3s ease forwards;
  }


.modal-closing {
  animation: fadeOut 0.3s ease forwards !important;
}

.modal-closing .modal-content {
  animation: slideOut 0.3s ease forwards !important;
}

/* Add these keyframes to your style section */
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
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 24px;
    color: #555;
    cursor: pointer;
  }
  
  .modal-header {
    padding: 30px 30px 20px 30px;
    display: flex;
    align-items: center;
    gap: 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h3 {
    margin: 0 0 8px 0;
    font-size: 1.6rem;
    color: #333;
  }
  
  .modal-body {
    padding: 20px 30px;
  }
  
  .badge-description {
    font-size: 1.1rem;
    line-height: 1.5;
    margin-bottom: 20px;
    color: #333;
  }
  
  .badge-requirements h4,
  .badge-benefits h4 {
    margin: 0 0 10px 0;
    font-size: 1.1rem;
    color: #2E7D32;
  }
  
  .badge-requirements,
  .badge-benefits {
    margin-bottom: 20px;
  }
  
  .achievement-date {
    font-style: italic;
    color: #666;
    margin-bottom: 20px;
  }
  
  .modal-footer {
    padding: 20px 30px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
  }
  
  .action-btn,
  .share-btn {
    padding: 10px 20px;
    border-radius: 30px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .action-btn {
    background-color: #4CAF50;
    color: white;
    border: none;
  }
  
  .action-btn:hover {
    background-color: #388E3C;
    box-shadow: 0 3px 10px rgba(76, 175, 80, 0.3);
  }
  
  .share-btn {
    background-color: #2196F3;
 
    color: white;
    border: none;
  }
  
  .share-btn:hover {
    background-color: #1976D2;
    box-shadow: 0 3px 10px rgba(33, 150, 243, 0.3);
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
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    
    
    .badges-collection {
      grid-template-columns: 1fr;
    }
    
    .category-tabs {
      overflow-x: auto;
      padding-bottom: 10px;
    }
    
    .category-tabs button {
      white-space: nowrap;
    }
    
    .badges-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }
    
    .modal-content {
      width: 95%;
    }
  }

  @media (min-width: 1200px) {
    .badges-collection {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  </style>

