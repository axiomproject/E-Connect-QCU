<template>
  <div class="dashboard">
    <!-- Header component -->
     
    <AppHeader 
      :username="user?.username || 'User'" 
      @logout="logout" 
    />
  
    <!-- Main Content -->
    <main class="dashboard-main">
      <div class="container">
        <section class="hero-section">
          <h2>Your Environmental Impact</h2>
          <p>Track your eco-friendly activities and see how you're helping the planet.</p>
        </section>
        
        <!-- Cards section -->
        <section class="cards-section">
          <!-- Feature cards grid -->
          <div class="feature-cards">
            <div class="card">
              <div class="card-icon">🎯</div>
              <h3>Set Personalized Goal</h3>
              <p>Create custom sustainability goals aligned with your lifestyle</p>
              <button class="card-btn" @click="navigateToGoals">Set Goals</button>
            </div>
            <div class="card">
              <div class="card-icon">🌱</div>
              <h3>Challenges For Today</h3>
              <p>Complete eco-challenges to earn rewards and make an impact</p>
              <button class="card-btn" @click="navigateToChallenges">View Challenges</button>
            </div>
            <div class="card">
              <div class="card-icon">♻️</div>
              <h3>Recycling Guide</h3>
              <p>Learn how to properly recycle different materials</p>
              <button class="card-btn" @click="navigateToRecyclingGuide">Open Guide</button>
            </div>
            <div class="card">
              <div class="card-icon">🌍</div>
              <h3>Carbon Footprint Calculator</h3>
              <p>Measure your environmental impact with our calculator</p>
              <button class="card-btn"@click="navigateToCalculator">Calculate</button>
            </div>
          </div>

          <!-- Donation card -->
<div class="donation-card">
  <div class="quote-icon">💚</div>
  <h2>Donate to Eco Causes</h2>
  <p>Support environmental organizations and projects making a difference.</p>
  <button class="quote-btn" @click="navigateToDonation">Donate Now</button>
</div>
          
          <!-- Featured quote card -->
          <div class="quote-card">
            <div class="quote-icon">💭</div>
            <h2>Quote of the Day</h2>
            <div v-if="quoteLoading" class="quote-loading">
              <div class="quote-spinner"></div>
              <p>Finding inspiration...</p>
            </div>
            <div v-else class="quote-content">
              <blockquote>"{{ currentQuote.text }}"</blockquote>
              <p class="quote-author">— {{ currentQuote.author }}</p>
            </div>
            <div class="quote-actions">
              <button class="quote-btn" @click="shareQuote">Share Quote</button>
              <button class="quote-btn secondary" @click="getNewQuote">Get New Quote</button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer component -->
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../views/Header.vue'
import AppFooter from '../views/Footer.vue'
import axios from 'axios'
import "../styles/Dashboard.css" 

interface User {
  username: string;
  [key: string]: any; // Allow for other properties
}

interface EcoActivity {
  id: string | number;
  date: string;
  activity: string;
  carbonSaved: number;
}

interface Quote {
  id: number;
  text?: string;       // Add this property
  quote_text?: string; // Make this optional
  author: string;
  category?: string;
}

const router = useRouter()
const authStore = useAuthStore()

const user = computed<User | null>(() => authStore.user as User | null)
const ecoData = ref<EcoActivity[]>([])
const loading = ref(false)
const error = ref('')

const totalCarbonSaved = computed(() => {
  return ecoData.value.reduce((total, activity) => total + activity.carbonSaved, 0).toFixed(1)
})

const fetchEcoData = async () => {
  try {
    loading.value = true
    // Use the mock data from the auth store instead of making a fetch request
    ecoData.value = await authStore.getEcoData()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}

const navigateToRecyclingGuide = () => {
  router.push('/recycling-guide')
}

const navigateToChallenges = () => {
  router.push('/challenges')
}
const navigateToGoals = () => {
  router.push('/Goals')
}
const navigateToCalculator = () => {
  router.push('/Calculator')
}

// Add this function for donation navigation
const navigateToDonation = () => {
  router.push('/Donate')
}

// Quote handling
const currentQuote = ref<Quote>({
  id: 0,
  text: "The greatest threat to our planet is the belief that someone else will save it.",
  author: "Robert Swan"
});

const quoteLoading = ref(false);

const getNewQuote = async () => {
  try {
    quoteLoading.value = true;
    const response = await axios.get('/api/quotes/random', getAuthHeader());
    currentQuote.value = response.data;
  } catch (error) {
    console.error('Error fetching quote:', error);
    // If we can't fetch a quote, keep the current one
  } finally {
    quoteLoading.value = false;
  }
};

const shareQuote = async () => {
  try {
    if (!currentQuote.value.id) return;
    
    await axios.post(`/api/quotes/${currentQuote.value.id}/share`, {}, getAuthHeader());
    
    // Show a success message or open a share dialog
    // For simplicity, we'll use the native share API if available
    if (navigator.share) {
      await navigator.share({
        title: 'Eco Quote',
        text: `"${currentQuote.value.text || currentQuote.value.quote_text}" — ${currentQuote.value.author}`,
        url: window.location.href,
      });
    } else {
      // Fallback - copy to clipboard
      await navigator.clipboard.writeText(
        `"${currentQuote.value.text || currentQuote.value.quote_text}" — ${currentQuote.value.author}`
      );
      alert('Quote copied to clipboard!');
    }
  } catch (error) {
    console.error('Error sharing quote:', error);
    // Fallback for browsers without clipboard API
    alert(`"${currentQuote.value.text || currentQuote.value.quote_text}" — ${currentQuote.value.author}`);
  }
};

// Helper function to get auth header
const getAuthHeader = () => {
  const token = authStore.token;
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

onMounted(() => {
  fetchEcoData();
  getNewQuote();
});
</script>

<style scoped>
.dashboard {
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

/* Main content styling */
.dashboard-main {
  flex: 1;
  padding: 30px 0;
}

/* Hero section styling */
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

/* Cards layout */
.cards-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

/* Feature cards grid */
.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.card h3 {
  font-size: 1.2rem;
  margin: 0 0 15px 0;
  color: #2E7D32;
}

.card p {
  margin: 0 0 20px 0;
  color: #666;
  flex-grow: 1;
}

.card-btn {
  padding: 8px 15px;
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.card-btn:hover {
  background: linear-gradient(90deg, #2E7D32, #43A047);
  transform: translateY(-2px);
}

/* Featured quote card */
.quote-card {
  background: linear-gradient(135deg, #f9f9f9, #e8f5e9);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border-left: 6px solid #4CAF50;
}

.quote-icon {
  font-size: 3.5rem;
  margin-bottom: 20px;
  color: #4CAF50;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
}

.quote-card h2 {
  font-size: 1.8rem;
  margin-bottom: 30px;
  color: #2E7D32;
}

.quote-content {
  margin-bottom: 30px;
}

.quote-card blockquote {
  font-size: 1.5rem;
  font-style: italic;
  margin: 0 0 20px 0;
  color: #333;
  line-height: 1.5;
  position: relative;
}

.quote-card blockquote::before,
.quote-card blockquote::after {
  content: '"';
  font-size: 2rem;
  color: #4CAF50;
  opacity: 0.5;
}

.quote-author {
  text-align: right;
  font-weight: 500;
  font-size: 1.1rem;
  color: #555;
}

.quote-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.quote-btn {
  padding: 10px 20px;
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.quote-btn:hover {
  background: linear-gradient(90deg, #2E7D32, #43A047);
  transform: translateY(-2px);
}

.quote-btn.secondary {
  background: transparent;
  border: 2px solid #4CAF50;
  color: #4CAF50;
}

.quote-btn.secondary:hover {
  background: rgba(76, 175, 80, 0.1);
}

/* Add these new styles for quote loading */
.quote-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.quote-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(76, 175, 80, 0.2);
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s ease infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .quote-card {
    padding: 30px 20px;
  }
  
  .quote-card blockquote {
    font-size: 1.3rem;
  }
  
  .quote-actions {
    flex-direction: column;
    gap: 10px;
  }

  .dashboard-main {
    padding-bottom: 70px; /* space for bottom dock */
  }
}
/* Donation card styling */
.donation-card {
  background: linear-gradient(135deg, #f9f9f9, #ffe8e8);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
  border-left: 6px solid #e91e63;
  margin-bottom: 30px;
}

/* Add to responsive section */
@media (max-width: 768px) {
  .donation-card {
    padding: 30px 20px;
  }
}
</style>
`

