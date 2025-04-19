<template>
    <div class="challenges">
      <!-- Header component -->
      <AppHeader 
        :username="user?.username || 'User'" 
        @logout="logout" 
      />
  
      <!-- Main Content -->
      <main class="challenges-main">
        <div class="container">
          <section class="hero-section">
            <h2>Environmental Challenges</h2>
            <p>Complete these eco-friendly challenges to make a positive impact and earn rewards.</p>
          </section>
  
          <!-- Challenge Filter Section -->
          <section class="filter-section">
            <div class="filter-controls">
              <div class="search-box">
                <input 
                  type="text" 
                  placeholder="Search challenges..." 
                  v-model="searchQuery"
                  @input="filterChallenges"
                >
              </div>
              <div class="filter-dropdown">
                <select v-model="difficultyFilter" @change="filterChallenges">
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="ultra-hard">Ultra-Hard</option>
                </select>
              </div>
              <div class="filter-dropdown">
                <select v-model="categoryFilter" @change="filterChallenges">
                  <option value="all">All Categories</option>
                  <option value="energy">Energy</option>
                  <option value="water">Water</option>
                  <option value="waste">Waste</option>
                  <option value="transportation">Transportation</option>
                  <option value="food">Food</option>
                </select>
              </div>
            </div>
          </section>
          
          <!-- Challenge Cards Section -->
          <section class="challenge-cards-section">
            <div v-if="loading" class="loading">
              <span class="loading-spinner"></span>
              <p>Loading challenges...</p>
            </div>
            
            <div v-else-if="error" class="error-message">
              <p>{{ error }}</p>
              <button @click="fetchChallenges" class="retry-btn">Try Again</button>
            </div>
            
            <div v-else-if="filteredChallenges.length === 0" class="no-results">
              <div class="no-results-icon">🔍</div>
              <h3>No challenges found</h3>
              <p>Try adjusting your filters or search query</p>
            </div>
            
            <div v-else class="challenge-grid">
              <div 
                v-for="challenge in filteredChallenges" 
                :key="challenge.id" 
                class="challenge-card"
                :class="{ 
                  'challenge-completed': challenge.completed,
                  [`difficulty-${challenge.difficulty}`]: true
                }"
              >
                <div class="challenge-tag" :class="`tag-${challenge.category}`">
                  {{ challenge.category }}
                </div>
                
                <div class="challenge-difficulty">
                  {{ challenge.difficulty }}
                  <span v-if="challenge.difficulty === 'easy'">⭐</span>
                  <span v-else-if="challenge.difficulty === 'medium'">⭐⭐</span>
                  <span v-else-if="challenge.difficulty === 'hard'">⭐⭐⭐</span>
                  <span v-else-if="challenge.difficulty === 'ultra-hard'">⭐⭐⭐⭐</span>
                </div>
                
                <div class="challenge-icon">{{ getChallengeIcon(challenge.category) }}</div>
                <h3>{{ challenge.title }}</h3>
                <p>{{ challenge.description }}</p>
                
                <div class="challenge-impact">
                  <span class="impact-label">Impact:</span>
                  <span class="impact-value">{{ challenge.carbonReduction }}kg CO₂ saved</span>
                </div>
                
                <div class="challenge-points">
                  <span class="points-icon">🏆</span>
                  <span class="points-value">{{ challenge.points }} points</span>
                </div>
                
                <div class="challenge-actions">
                  <button 
                    v-if="!challenge.completed" 
                    @click="completeChallenge(challenge.id)" 
                    class="complete-btn"
                  >
                    Complete Challenge
                  </button>
                  <div v-else class="completed-badge">
                    <span class="completed-icon">✓</span> Completed
                  </div>
                  <button @click="showChallengeDetails(challenge)" class="details-btn">
                    Details
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Challenge Details Modal -->
          <div v-if="showModal" class="modal-overlay" @click="closeModal">
            <div class="modal-content" @click.stop>
              <button @click="closeModal" class="modal-close">&times;</button>
              <div class="modal-header">
                <div class="modal-icon">{{ getChallengeIcon(selectedChallenge?.category || '') }}</div>
                <h2>{{ selectedChallenge?.title }}</h2>
                <div class="modal-tag" :class="`tag-${selectedChallenge?.category}`">
                  {{ selectedChallenge?.category }}
                </div>
              </div>
              <div class="modal-body">
                <p class="modal-description">{{ selectedChallenge?.description }}</p>
                <div class="modal-steps">
                  <h3>How to complete this challenge:</h3>
                  <ul>
                    <li v-for="(step, index) in selectedChallenge?.steps" :key="index">
                      {{ step }}
                    </li>
                  </ul>
                </div>
                <div class="modal-benefits">
                  <h3>Benefits:</h3>
                  <p>{{ selectedChallenge?.benefits }}</p>
                  <div class="benefit-stats">
                    <div class="benefit-stat">
                      <span class="stat-label">Carbon Reduction:</span>
                      <span class="stat-value">{{ selectedChallenge?.carbonReduction }}kg CO₂</span>
                    </div>
                    <div class="benefit-stat">
                      <span class="stat-label">Points:</span>
                      <span class="stat-value">{{ selectedChallenge?.points }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button 
                  v-if="selectedChallenge && !selectedChallenge.completed" 
                  @click="completeChallenge(selectedChallenge.id)" 
                  class="modal-complete-btn"
                >
                  Complete Challenge
                </button>
                <div v-else class="modal-completed-badge">
                  <span class="completed-icon">✓</span> Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
  
      <!-- Footer component -->
      <AppFooter />
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
  import axios from 'axios'
  
  interface User {
    username: string;
    [key: string]: any;
  }
  
  interface Challenge {
    id: number;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    steps: string[];
    carbonReduction: number;
    points: number;
    completed: boolean;
    progress?: number;
    benefits: string;
  }
  
  const router = useRouter()
  const route = useRoute() // Add this to access route parameters
  const authStore = useAuthStore()
  
  const user = computed<User | null>(() => authStore.user as User | null)
  const challenges = ref<Challenge[]>([])
  const filteredChallenges = ref<Challenge[]>([])
  const loading = ref(true)
  const error = ref('')
  
  // Filter and search state
  const searchQuery = ref('')
  const difficultyFilter = ref('all')
  const categoryFilter = ref('all')
  
  // Modal state
  const showModal = ref(false)
  const selectedChallenge = ref<Challenge | null>(null)

  // Check if we're viewing a specific challenge by ID
  const viewingSingleChallenge = ref(false)
  const singleChallengeId = ref<number | null>(null)

  const getAuthHeader = () => {

const token = localStorage.getItem('token');

return {

  headers: {

    Authorization: token ? `Bearer ${token}` : ''

  }

};

};
  
  const fetchChallenges = async () => {
    try {
      loading.value = true;
      error.value = '';
      
      // Fetch challenges from the API
      const response = await axios.get('/api/challenges', getAuthHeader());
      challenges.value = response.data.map((challenge: any) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        steps: challenge.steps || [],
        carbonReduction: challenge.carbon_reduction,
        points: challenge.points,
        completed: challenge.completed,
        progress: challenge.progress,
        benefits: challenge.benefits
      }));
      
      filterChallenges();
      loading.value = false;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'An error occurred while fetching challenges';
      loading.value = false;
    }
  };

  // Function to load a specific challenge by ID
  const loadSingleChallenge = async (id: number) => {
    try {
      loading.value = true;
      error.value = '';
      
      // First check if we already have the challenge in our local state
      if (challenges.value.length > 0) {
        const existingChallenge = challenges.value.find(c => c.id === id);
        if (existingChallenge) {
          // Use the existing challenge if found
          selectedChallenge.value = {...existingChallenge};
          showModal.value = true;
          viewingSingleChallenge.value = true;
          loading.value = false;
          return;
        }
      }
      
      // If we don't have the challenge in local state, fetch all challenges first
      try {
        // Fetch all challenges if they're not already loaded
        if (challenges.value.length === 0) {
          const response = await axios.get('/api/challenges', getAuthHeader());
          challenges.value = response.data.map((challenge: any) => ({
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            category: challenge.category,
            difficulty: challenge.difficulty,
            steps: challenge.steps || [],
            carbonReduction: challenge.carbon_reduction,
            points: challenge.points,
            completed: challenge.completed,
            progress: challenge.progress,
            benefits: challenge.benefits
          }));
          
          filterChallenges(); // Update filtered challenges
        }
        
        // Now try to find the challenge in the updated list
        const targetChallenge = challenges.value.find(c => c.id === id);
        
        if (targetChallenge) {
          selectedChallenge.value = {...targetChallenge};
          showModal.value = true;
          viewingSingleChallenge.value = true;
        } else {
          error.value = 'Challenge not found';
          router.push('/challenges'); // Redirect to challenges list if not found
        }
      } catch (err) {
        console.error('Error fetching challenges:', err);
        error.value = 'Failed to load challenge details';
        router.push('/challenges'); // Redirect to challenges list on error
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'An error occurred while loading the challenge';
      console.error('Error loading challenge:', err);
      router.push('/challenges');
    } finally {
      loading.value = false;
    }
  };
  
  const filterChallenges = () => {
    filteredChallenges.value = challenges.value.filter(challenge => {
      // Apply search query filter
      const matchesSearch = searchQuery.value === '' || 
        challenge.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.value.toLowerCase())
      
      // Apply difficulty filter
      const matchesDifficulty = difficultyFilter.value === 'all' || 
        challenge.difficulty === difficultyFilter.value
      
      // Apply category filter
      const matchesCategory = categoryFilter.value === 'all' || 
        challenge.category === categoryFilter.value
      
      return matchesSearch && matchesDifficulty && matchesCategory
    })
  }
  
  const getChallengeIcon = (category: string): string => {
    switch(category) {
      case 'energy': return '⚡'
      case 'water': return '💧'
      case 'waste': return '♻️'
      case 'transportation': return '🚲'
      case 'food': return '🥗'
      default: return '🌱'
    }
  }
  
  const completeChallenge = async (challengeId: number) => {
    try {
      // Call API to complete the challenge
      const response = await axios.post(`/api/challenges/${challengeId}/complete`, {}, getAuthHeader());
      
      // Find the challenge in both arrays
      const challenge = challenges.value.find(c => c.id === challengeId);
      const filteredChallenge = filteredChallenges.value.find(c => c.id === challengeId);
      
      // Update completed status
      if (challenge) {
        challenge.completed = true;
        challenge.progress = 100;
      }
      
      if (filteredChallenge) {
        filteredChallenge.completed = true;
        filteredChallenge.progress = 100;
      }
      
      // If the modal is open with this challenge, update it as well
      if (selectedChallenge.value?.id === challengeId) {
        selectedChallenge.value.completed = true;
        selectedChallenge.value.progress = 100;
      }
      
      // Show success message with points earned
      alert(`Challenge completed! You earned ${response.data.points} points!`);
    } catch (error) {
      console.error('Error completing challenge:', error);
      alert('There was an error completing the challenge. Please try again.');
    }
  };
  
  const showChallengeDetails = (challenge: Challenge) => {
    selectedChallenge.value = {...challenge}
    showModal.value = true
  }
  
  // Handle route changes
  watch(() => route.params.id, (newId) => {
    if (newId) {
      // When we have an ID parameter, load the specific challenge
      singleChallengeId.value = parseInt(newId as string);
      loadSingleChallenge(singleChallengeId.value);
    } else {
      // Reset when navigating back to the challenges list
      viewingSingleChallenge.value = false;
      singleChallengeId.value = null;
      showModal.value = false;
    }
  }, { immediate: true });

  // Modify closeModal to handle navigation with smoother transitions
  const closeModal = () => {
    // First set a flag to indicate we're closing the modal
    const wasViewingSingle = viewingSingleChallenge.value;
    
    // Start the modal hiding transition
    showModal.value = false;
    
    // If we're viewing a single challenge, delay navigation slightly
    // to allow the modal closing animation to finish first
    if (wasViewingSingle) {
      // Wait for the modal to start closing before navigating
      setTimeout(() => {
        viewingSingleChallenge.value = false;
        singleChallengeId.value = null;
        router.push('/challenges');
      }, 300); // Matches the fadeOut animation duration
    }
  };

  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  
  onMounted(() => {
    // Check if we have category or filter parameters in the URL
    const categoryParam = router.currentRoute.value.query.category;
    const filterParam = router.currentRoute.value.query.filter;
    
    // Set the category filter if provided in URL
    if (categoryParam) {
      categoryFilter.value = Array.isArray(categoryParam) 
        ? categoryParam[0] || 'all' 
        : categoryParam as string || 'all';
    }
    
    // If filter=open was specified, we'll focus on uncompleted challenges
    if (filterParam === 'open') {
      // We'll implement this by focusing on the category
      // The existing filter logic already handles showing challenges
      // of the selected category
    }
    
    // Check if we have an ID in the route
    if (route.params.id) {
      singleChallengeId.value = parseInt(route.params.id as string);
      loadSingleChallenge(singleChallengeId.value);
    } else {
      // Fetch all challenges if no specific ID
      fetchChallenges();
    }
  });
  </script>
  
  <style scoped>
  /* Base styles */
  .challenges {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .container {
    width: 90%;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .challenges-main {
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
  
  .filter-section {
  margin-bottom: 30px;
}

.filter-controls {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  background: linear-gradient(to right, #e8f5e9, #f1f8e9);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.search-box {
  flex: 1;
  min-width: 250px;
  position: relative;
}

.search-box::before {
  content: '🔍';
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #66BB6A;
  font-size: 1rem;
}
  
.search-box input {
  width: 100%;
  padding: 12px 15px 12px 38px;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: white;
  color: #333;
}

.search-box input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.filter-dropdown {
  min-width: 180px;
  position: relative;
}

.filter-dropdown::after {
  content: '▼';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #66BB6A;
  font-size: 0.7rem;
  pointer-events: none;
}
  
.filter-dropdown select {
  width: 100%;
  padding: 12px 15px;
  padding-right: 30px;
  border: 1px solid #c8e6c9;
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  appearance: none;
  transition: all 0.3s ease;
  cursor: pointer;
  color: #333;
}

.filter-dropdown select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
  
  /* Challenge cards */
  .challenge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
  }
  
  .challenge-card {
    position: relative;
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .challenge-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
  
  .challenge-completed {
    border: 2px solid #43A047;
    background-color: #f1f8e9;
  }
  
  .difficulty-easy {
    border-top: 4px solid #8BC34A;
  }
  
  .difficulty-medium {
    border-top: 4px solid #FFA000;
  }
  
  .difficulty-hard {
    border-top: 4px solid #F44336;
  }
  .difficulty-ultra-hard {
    border-top: 4px solid #cefc00;
  }
  
  .challenge-tag {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .tag-energy {
    background-color: #FFF9C4;
    color: #F57F17;
  }
  
  .tag-water {
    background-color: #E1F5FE;
    color: #0277BD;
  }
  
  .tag-waste {
    background-color: #E8F5E9;
    color: #2E7D32;
  }
  
  .tag-transportation {
    background-color: #F3E5F5;
    color: #7B1FA2;
  }
  
  .tag-food {
    background-color: #FFEBEE;
    color: #C62828;
  }
  
  .challenge-difficulty {
    position: absolute;
    top: 15px;
    left: 15px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .challenge-icon {
    font-size: 2.5rem;
    margin: 15px 0;
    text-align: center;
  }
  
  .challenge-card h3 {
    font-size: 1.3rem;
    margin: 10px 0;
    color: #2E7D32;
  }
  
  .challenge-card p {
    color: #666;
    margin-bottom: 15px;
    flex-grow: 1;
  }
  
  .challenge-impact, .challenge-points {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }
  
  .impact-label, .points-icon {
    margin-right: 8px;
    font-weight: 500;
  }
  
  .impact-value, .points-value {
    color: #555;
  }
  
  .challenge-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }
  
  .complete-btn, .details-btn {
    padding: 8px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .complete-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    flex-grow: 1;
    margin-right: 10px;
  }
  
  .complete-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
  }
  
  .details-btn {
    background: transparent;
    border: 1px solid #43A047;
    color: #43A047;
  }
  
  .details-btn:hover {
    background-color: rgba(67, 160, 71, 0.1);
  }
  
  .completed-badge {
    display: flex;
    align-items: center;
    background-color: #81C784;
    color: white;
    padding: 8px 15px;
    border-radius: 4px;
    font-weight: 500;
    flex-grow: 1;
    justify-content: center;
    margin-right: 10px;
  }
  
  .completed-icon {
    margin-right: 5px;
    font-weight: bold;
  }
  
  /* Loading and error states */
  .loading, .error-message, .no-results {
    text-align: center;
    padding: 40px 20px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
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
  
  .loading p, .error-message p {
    margin-top: 15px;
    color: #666;
  }
  
  .retry-btn {
    margin-top: 15px;
    padding: 8px 20px;
    background-color: #43A047;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .no-results-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.7;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    animation: fadeIn 0.3s ease forwards;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .modal-content {
    position: relative;
    background-color: white;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    border-radius: 12px;
    padding: 30px;
    overflow-y: auto;
    transform: scale(0.8) translateY(20px);
    opacity: 0;
    animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }
  
  @keyframes slideIn {
    from {
      transform: scale(0.8) translateY(20px);
      opacity: 0;
    }
    to {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }
  
  .modal-close {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }
  
  .modal-header {
    text-align: center;
    margin-bottom: 20px;
    position: relative;
  }
  
  .modal-icon {
    font-size: 3rem;
    margin-bottom: 10px;
  }
  
  .modal-header h2 {
    font-size: 1.8rem;
    color: #2E7D32;
    margin-bottom: 10px;
  }
  
  .modal-tag {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.9rem;
    text-transform: capitalize;
  }
  
  .modal-description {
    font-size: 1.1rem;
    color: #555;
    margin-bottom: 25px;
    line-height: 1.5;
  }
  
  .modal-steps, .modal-benefits {
    margin-bottom: 25px;
  }
  
  .modal-steps h3, .modal-benefits h3 {
    font-size: 1.2rem;
    color: #2E7D32;
    margin-bottom: 15px;
  }
  
  .modal-steps ul {
    padding-left: 25px;
  }
  
  .modal-steps li {
    margin-bottom: 10px;
    line-height: 1.4;
  }
  
  .benefit-stats {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
    border-top: 1px solid #eee;
    padding-top: 15px;
  }
  
  .benefit-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 5px;
  }
  
  .stat-value {
    font-size: 1.2rem;
    font-weight: 500;
    color: #2E7D32;
  }
  
  .modal-footer {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #eee;
  }
  
  .modal-complete-btn {
    padding: 12px 30px;
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .modal-complete-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
    transform: translateY(-2px);
  }
  
  .modal-completed-badge {
    display: flex;
    align-items: center;
    background-color: #81C784;
    color: white;
    padding: 12px 30px;
    border-radius: 4px;
    font-size: 1.1rem;
    font-weight: 500;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .challenge-grid {
      grid-template-columns: 1fr;
    }
    
    .filter-controls {
    flex-direction: column;
    padding: 15px;
  }
  
  .filter-dropdown {
    width: 100%;
  }
  .search-box{
    width: 91%;
  } 
    
    .modal-content {
      padding: 20px;
      width: 95%;
    }
    
    .benefit-stats {
      flex-direction: column;
      gap: 15px;
      align-items: center;
    }
  }
  </style>