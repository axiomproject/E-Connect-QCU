<template>
    <div class="personalized-goal-container">
  <!-- Loading State -->
<div v-if="isLoading" class="loading-container">
  <div class="loading-spinner"></div>
  <p>Loading your goals...</p>
</div>
    <div class="personalized-goal">
      <!-- Header component -->
      <AppHeader :username="user?.username || 'User'" @logout="logout" />
  
      <!-- Main Content -->
      <main class="goal-main">
        <div class="container">
          <section class="hero-section">
            <h2>Set Your Personalized Goals</h2>
            <p>Create customized sustainability goals that fit your lifestyle and help you make a positive environmental impact.</p>
          </section>
  
          <!-- Goal Creation Section -->
          <section class="goal-creation-section">
            <div class="goal-form">
              <h3>Create a New Goal</h3>
              <div class="form-group">
                <label for="goalTitle">Goal Title</label>
                <input 
                  type="text" 
                  id="goalTitle" 
                  v-model="newGoal.title" 
                  placeholder="e.g. Reduce my water consumption"
                  @input="validateForm"
                >
              </div>
              
              <div class="form-group">
                <label for="goalCategory">Category</label>
                <select 
                  id="goalCategory" 
                  v-model="newGoal.category"
                  @change="validateForm"
                >
                  <option value="">Select a category</option>
                  <option value="energy">Energy</option>
                  <option value="water">Water</option>
                  <option value="waste">Waste</option>
                  <option value="transportation">Transportation</option>
                  <option value="food">Food</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="goalDescription">Description</label>
                <textarea 
                  id="goalDescription" 
                  v-model="newGoal.description" 
                  placeholder="Describe your goal and why it matters to you..."
                  @input="validateForm"
                ></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group half">
                  <label for="goalTarget">Target</label>
                  <input 
                    type="number" 
                    id="goalTarget" 
                    v-model="newGoal.target" 
                    placeholder="e.g. 20"
                    min="1"
                    @input="validateForm"
                  >
  </div>
  
  <div class="form-group half">
    <label for="goalUnit">Unit</label>
    <select 
      id="goalUnit" 
      v-model="newGoal.unit" 
      class="form-control" 
      required
    >
    <option value="" disabled>Select a unit</option>
    <option value="kg">Kilograms (kg)</option>
    <option value="lbs">Pounds (lbs)</option>
    <option value="steps">Steps</option>
    <option value="km">Kilometers (km)</option>
    <option value="miles">Miles</option>
    <option value="minutes">Minutes</option>
    <option value="hours">Hours</option>
    <option value="calories">Calories</option>
    <option value="sessions">Sessions</option>
    <option value="%">Percentage (%)</option>
  </select>
</div>
              </div>
              
              <div class="form-row">
                <div class="form-group half">
                  <label for="goalStart">Start Date</label>
                  <input 
                    type="date" 
                    id="goalStart" 
                    v-model="newGoal.startDate"
                    @change="validateForm"
                  >
                </div>
                
                <div class="form-group half">
                  <label for="goalEnd">End Date</label>
                  <input 
                    type="date" 
                    id="goalEnd" 
                    v-model="newGoal.endDate"
                    @change="validateForm"
                  >
                </div>
              </div>

              <div v-if="dateError" class="form-error">
                {{ dateError }}
              </div>
              
              <div class="form-actions">
                <button 
                  @click="saveGoal" 
                  class="save-btn" 
                  :disabled="!formValid || isSaving"
                >
                  <span v-if="isSaving">Saving...</span>
                  <span v-else>Save Goal</span>
                </button>
                <button @click="resetForm" class="reset-btn">Clear Form</button>
              </div>
            </div>
            
            <div class="goal-preview">
              <h3>Goal Preview</h3>
              <div class="preview-card" :class="{ 'has-content': hasGoalContent }">
                <div v-if="hasGoalContent" class="preview-content">
                  <div class="preview-tag" :class="`tag-${newGoal.category}`">
                    {{ newGoal.category || 'Category' }}
                  </div>
                  <h4>{{ newGoal.title || 'Goal Title' }}</h4>
                  <p class="preview-description">{{ newGoal.description || 'Goal description will appear here...' }}</p>
                  
                  <div class="preview-target" v-if="newGoal.target && newGoal.unit">
                    <span class="target-icon">🎯</span>
                    <span>Target: {{ newGoal.target }} {{ newGoal.unit }}</span>
                  </div>
                  
                  <div class="preview-dates" v-if="newGoal.startDate && newGoal.endDate">
                    <span class="date-icon">📅</span>
                    <span>{{ formatDate(newGoal.startDate) }} to {{ formatDate(newGoal.endDate) }}</span>
                  </div>
                </div>
                <div v-else class="empty-preview">
                  <div class="empty-icon">🎯</div>
                  <p>Your goal preview will appear here as you fill out the form.</p>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Current Goals Section -->
          <section class="current-goals-section" v-if="!isLoading && goals.length > 0">
            <h3>Your Current Goals</h3>
            <div class="goals-grid">
              <div 
                v-for="goal in goals" 
                :key="goal.id" 
                class="goal-card"
                :class="`category-${goal.category}`"
              >
                <div class="goal-tag" :class="`tag-${goal.category}`">
                  {{ goal.category }}
                </div>
                
                <h4>{{ goal.title }}</h4>
                <p>{{ goal.description }}</p>
                
                <div class="goal-progress">
                  <div class="progress-label">
                    <span>Progress: {{ goal.progress }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="`width: ${goal.progress}%`"
                    ></div>
                  </div>
                </div>
                
                <div class="goal-details">
                  <div class="goal-target">
                    <span class="target-icon">🎯</span>
                    <span>{{ goal.current }} / {{ goal.target }} {{ goal.unit }}</span>
                  </div>
                  
                  <div class="goal-dates">
                    <span class="date-icon">📅</span>
                    <span>{{ formatDate(goal.start_date) }} to {{ formatDate(goal.end_date) }}</span>
                  </div>
                </div>
                
                <div class="goal-actions">
                  <button @click="updateProgress(goal.id)" class="update-btn">
                    Update Progress
                  </button>
                  <button @click="deleteGoal(goal.id)" class="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>
          
          <section class="no-goals" v-if="!isLoading && goals.length === 0">
            <div class="no-goals-content">
              <div class="no-goals-icon">🌱</div>
              <h3>No Goals Yet</h3>
              <p>Create your first sustainability goal using the form above to start tracking your environmental impact!</p>
            </div>
          </section>
        </div>
      </main>
  
      <!-- Footer component -->
      <AppFooter />
      
      <!-- Progress Update Modal -->
      <div 
  v-if="showProgressModal" 
  class="modal-overlay" 
  :class="{ 'modal-closing': modalClosing }"
  @click="closeModal"
>
        <div class="modal-content" @click.stop>
          <button @click="closeModal" class="modal-close">&times;</button>
          <div class="modal-header">
            <h2>Update Goal Progress</h2>
          </div>
          <div class="modal-body">
            <h3>{{ selectedGoal?.title }}</h3>
            <p>Current progress: {{ selectedGoal?.current }} of {{ selectedGoal?.target }} {{ selectedGoal?.unit }}</p>
            
            <div class="progress-form">
              <label for="progressAmount">New Progress Amount</label>
              <input 
                type="number" 
                id="progressAmount" 
                v-model="progressUpdate" 
                :min="0" 
                :max="selectedGoal?.target"
                placeholder="Enter current amount"
              >
              <span class="unit-label">{{ selectedGoal?.unit }}</span>
         
            </div>
            <div v-if="progressError" class="progress-error">
                {{ progressError }}
              </div>
          </div>
          <div class="modal-footer">
            <button @click="saveProgress" class="save-progress-btn" :disabled="isSavingProgress">
  <span v-if="isSavingProgress">Saving...</span>
  <span v-else>Save Progress</span>
</button>
            <button @click="closeModal" class="cancel-btn">Cancel</button>
          </div>
        </div>
      </div>
      <div v-if="errorMessage" class="error-alert">
  <div class="error-content">
    <div class="error-icon">⚠️</div>
    <div class="error-text">{{ errorMessage }}</div>
    <button @click="errorMessage = ''" class="error-close">&times;</button>
  </div>
</div>
    </div>
  </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '../stores/auth'
  import AppHeader from '../views/Header.vue'
  import AppFooter from '../views/Footer.vue'
  import axios from 'axios'
  
  interface User {
    username: string;
    [key: string]: any;
  }
  
  interface Goal {
  id: number;
  title: string;
  description: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  start_date: string; // Note: backend uses snake_case
  end_date: string; // Note: backend uses snake_case
  progress: number;
  user_id: number;
  created_at: string;
  updated_at?: string;
}
  
  const router = useRouter()
  const authStore = useAuthStore()
  const isLoading = ref(false)
const isSavingProgress = ref(false)
const errorMessage = ref('')
  const user = computed<User | null>(() => authStore.user as User | null)
  const goals = ref<Goal[]>([])
  const formValid = ref(false)
  const isSaving = ref(false)
  const showProgressModal = ref(false)
  const selectedGoal = ref<Goal | null>(null)
  const progressUpdate = ref(0)
  const progressError = ref('')
  const dateError = ref('')
  
  const newGoal = ref({
    title: '',
    category: '',
    description: '',
    target: null as number | null,
    unit: '',
    startDate: '',
    endDate: ''
  })
  
  const hasGoalContent = computed(() => {
    return !!(newGoal.value.title || newGoal.value.description || newGoal.value.category)
  })
  
  const validateForm = () => {
    dateError.value = ''

    if (newGoal.value.startDate && newGoal.value.endDate) {
      const startDate = new Date(newGoal.value.startDate)
      const endDate = new Date(newGoal.value.endDate)
      
      if (endDate < startDate) {
        dateError.value = 'End date cannot be earlier than start date'
        formValid.value = false
        return
      }
    }

    formValid.value = !!(
      newGoal.value.title &&
      newGoal.value.category &&
      newGoal.value.description &&
      newGoal.value.target &&
      newGoal.value.unit &&
      newGoal.value.startDate &&
      newGoal.value.endDate
    )
  }
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  const resetForm = () => {
    newGoal.value = {
      title: '',
      category: '',
      description: '',
      target: null,
      unit: '',
      startDate: '',
      endDate: ''
    }
    formValid.value = false
    dateError.value = ''
  }
  
  const saveGoal = async () => {
  if (!formValid.value) return
  
  isSaving.value = true
  
  try {
    const token = authStore.token
    const goalData = {
      title: newGoal.value.title,
      description: newGoal.value.description,
      category: newGoal.value.category,
      target: newGoal.value.target,
      unit: newGoal.value.unit,
      startDate: newGoal.value.startDate,
      endDate: newGoal.value.endDate
    }
    
    const response = await axios.post('/api/user/goals', goalData, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    // Add the new goal to the top of the list
    goals.value.unshift(response.data)
    resetForm()
  } catch (error) {
    console.error('Error saving goal:', error)
    errorMessage.value = 'Failed to save your goal. Please try again.'
  } finally {
    isSaving.value = false
  }
}
  
  const updateProgress = (goalId: number) => {
    const goal = goals.value.find(g => g.id === goalId)
    if (goal) {
      selectedGoal.value = { ...goal }
      progressUpdate.value = goal.current
      progressError.value = '' // Clear any previous errors
      showProgressModal.value = true
    }
  }
  
  const saveProgress = async () => {
  if (!selectedGoal.value) return
  
  // Validate that progress doesn't exceed target
  if (progressUpdate.value > selectedGoal.value.target) {
    progressError.value = `Progress cannot exceed the target of ${selectedGoal.value.target} ${selectedGoal.value.unit}`
    return
  }
  
  progressError.value = '' // Clear any previous error
  isSavingProgress.value = true
  
  try {
    const token = authStore.token
    const response = await axios.put(`/api/user/goals/${selectedGoal.value.id}`, 
      { current: progressUpdate.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    
    // Update goal in the list
    const index = goals.value.findIndex(g => g.id === selectedGoal.value?.id)
    if (index !== -1) {
      goals.value[index] = response.data
    }
    
    closeModal()
  } catch (error) {
    console.error('Error updating progress:', error)
    errorMessage.value = 'Failed to update progress. Please try again.'
  } finally {
    isSavingProgress.value = false
  }
}
  
 // Add this new ref with your other refs
const modalClosing = ref(false)

// Replace your closeModal function with this updated version
const closeModal = () => {
  progressError.value = '' // Clear any errors when closing
  modalClosing.value = true
  setTimeout(() => {
    showProgressModal.value = false
    selectedGoal.value = null
    modalClosing.value = false
  }, 300) // Match this duration to your CSS animation duration
}
  
  const deleteGoal = async (goalId: number) => {
  if (confirm('Are you sure you want to delete this goal?')) {
    try {
      const token = authStore.token
      await axios.delete(`/api/user/goals/${goalId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Remove goal from list
      goals.value = goals.value.filter(g => g.id !== goalId)
    } catch (error) {
      console.error('Error deleting goal:', error)
      errorMessage.value = 'Failed to delete goal. Please try again.'
    }
  }
}
  
  const fetchGoals = async () => {
  isLoading.value = true
  
  try {
    const token = authStore.token
    const response = await axios.get('/api/user/goals', {
      headers: { Authorization: `Bearer ${token}` }
    })
    goals.value = response.data
  } catch (error) {
    console.error('Error fetching goals:', error)
    errorMessage.value = 'Failed to load your goals. Please try again.'
  } finally {
    isLoading.value = false
  }
}
  
  const logout = () => {
    authStore.logout()
    router.push('/login')
  }
  
  onMounted(() => {
    fetchGoals()
  })
  </script>
  
  <style scoped>

.personalized-goal-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}
  .personalized-goal {
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
  
  .goal-main {
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
  
  /* Goal creation section */
  .goal-creation-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 50px;
  }
  
  .goal-form {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
  
  .goal-form h3 {
    margin-top: 0;
    margin-bottom: 25px;
    color: #2E7D32;
    font-size: 1.5rem;
    border-bottom: 2px solid #e8f5e9;
    padding-bottom: 15px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .form-group.half {
    flex: 1;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #333;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="date"],
  select,
  textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.3s;
  }
  
  input[type="text"]:focus,
  input[type="number"]:focus,
  input[type="date"]:focus,
  select:focus,
  textarea:focus {
    border-color: #4CAF50;
    outline: none;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
  
  textarea {
    min-height: 120px;
    resize: vertical;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
  }
  
  .save-btn, .reset-btn {
    padding: 12px 25px;
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .save-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    flex-grow: 1;
    margin-right: 15px;
  }
  
  .save-btn:hover:not(:disabled) {
    background: linear-gradient(90deg, #2E7D32, #43A047);
  }
  
  .save-btn:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  .reset-btn {
    background: transparent;
    border: 1px solid #999;
    color: #666;
  }
  
  .reset-btn:hover {
    background-color: #f5f5f5;
    border-color: #666;
  }
  
  /* Goal preview */
  .goal-preview {
    display: flex;
    flex-direction: column;
  }
  
  .goal-preview h3 {
    margin-top: 0;
    margin-bottom: 25px;
    color: #2E7D32;
    font-size: 1.5rem;
    border-bottom: 2px solid #e8f5e9;
    padding-bottom: 15px;
  }
  
  .preview-card {
    background: white;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    min-height: 300px;
  }
  
  .empty-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #999;
    text-align: center;
  }
  
  .empty-icon {
    font-size: 3rem;
    margin-bottom: 20px;
    opacity: 0.5;
  }
  
  .preview-content {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .preview-tag {
    align-self: flex-start;
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    text-transform: capitalize;
    margin-bottom: 15px;
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
  
  .preview-content h4 {
    font-size: 1.3rem;
    margin: 0 0 15px 0;
    color: #2E7D32;
  }
  
  .preview-description {
    color: #666;
    margin-bottom: auto;
  }
  
  .preview-target, .preview-dates {
    display: flex;
    align-items: center;
    margin-top: 15px;
    color: #555;
  }
  
  .target-icon, .date-icon {
    margin-right: 10px;
  }
  
  /* Current goals section */
  .current-goals-section {
    margin-top: 50px;
  }
  
  .current-goals-section h3 {
    color: #2E7D32;
    font-size: 1.5rem;
    margin-bottom: 25px;
  }
  
  .goals-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 25px;
  }
  
  .goal-card {
    position: relative;
    background-color: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease;
  }
  
  .goal-card:hover {
    transform: translateY(-5px);
  }
  
  .category-energy {
    border-left: 5px solid #F57F17;
  }
  
  .category-water {
    border-left: 5px solid #0277BD;
  }
  
  .category-waste {
    border-left: 5px solid #2E7D32;
  }
  
  .category-transportation {
    border-left: 5px solid #7B1FA2;
  }
  
  .category-food {
    border-left: 5px solid #C62828;
  }
  
  .goal-tag {
    position: absolute;
    top: 15px;
    right: 15px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 0.8rem;
    text-transform: capitalize;
  }
  
  .goal-card h4 {
    font-size: 1.3rem;
    margin: 0 0 15px 0;
    color: #2E7D32;
    padding-right: 80px;
  }
  
  .goal-card p {
    color: #666;
    margin-bottom: 20px;
  }
  
  .goal-progress {
    margin-bottom: 20px;
  }
  
  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .progress-bar {
    height: 10px;
    background-color: #e0e0e0;
    border-radius: 5px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #43A047, #66BB6A);
    border-radius: 5px;
    transition: width 0.3s ease;
  }
  
  .goal-details {
    margin-bottom: 20px;
  }
  
  .goal-target, .goal-dates {
    display: flex;
    align-items: center;
    margin-top: 10px;
    color: #555;
    font-size: 0.9rem;
  }
  
  .goal-actions {
    display: flex;
    justify-content: space-between;
  }
  
  .update-btn, .delete-btn {
    padding: 8px 15px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .update-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    flex-grow: 1;
    margin-right: 10px;
  }
  
  .update-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
  }
  
  .delete-btn {
    background: transparent;
    border: 1px solid #f44336;
    color: #f44336;
  }
  
  .delete-btn:hover {
    background-color: rgba(244, 67, 54, 0.1);
  }
  
  /* No goals section */
  .no-goals {
    margin-top: 30px;
  }
  
  .no-goals-content {
    background: white;
    border-radius: 12px;
    padding: 40px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  }
  
  .no-goals-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    color: #4CAF50;
    opacity: 0.7;
  }
  
  .no-goals-content h3 {
    color: #2E7D32;
    margin-bottom: 10px;
  }
  
  .no-goals-content p {
    color: #666;
    max-width: 500px;
    margin: 0 auto;
  }
  
  /* Progress update modal */
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
  
  .modal-content {
    background-color: white;
    width: 90%;
    max-width: 500px;
    border-radius: 12px;
    padding: 30px;
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
    margin-bottom: 20px;
  }
  
  .modal-header h2 {
    color: #2E7D32;
    margin: 0;
  }
  
  .modal-body {
    margin-bottom: 30px;
  }
  
  .modal-body h3 {
    color: #333;
    margin-top: 0;
  }
  
  .progress-form {
    margin-top: 20px;
    position: relative;
  }
  
  .progress-form label {
    margin-bottom: 10px;
  }
  
  .progress-form input {
    padding-right: 0px;
  }
  
  .unit-label {
    position: absolute;
    right: 12px;
    bottom: 12px;
    color: #666;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
  }
  
  .save-progress-btn, .cancel-btn {
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 500;
    cursor: pointer;
  }
  
  .save-progress-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
  }
  
  .save-progress-btn:hover {
    background: linear-gradient(90deg, #2E7D32, #43A047);
  }
  
  .cancel-btn {
    background: transparent;
    border: 1px solid #999;
    color: #666;
  }
  
  .cancel-btn:hover {
    background-color: #f5f5f5;
  }
  
  /* Add these styles for the progress error message */
  .progress-error {
    color: #f44336;
    font-size: 0.85rem;
    margin-top: 8px;
    padding: 5px;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 4px;
  }

  /* Form validation error styling */
  .form-error {
    color: #f44336;
    font-size: 0.85rem;
    margin: -10px 0 20px 0;
    padding: 5px 10px;
    background-color: rgba(244, 67, 54, 0.1);
    border-radius: 4px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .goal-creation-section {
      grid-template-columns: 1fr;
    }
    
    .preview-card {
      min-height: 200px;
    }
    
    .goal-preview {
      margin-bottom: 30px;
    }
    
    .form-row {
      flex-direction: column;
      gap: 20px;
    }
    
    .modal-content {
      width: 95%;
      padding: 20px;
    }
  }
  /* Loading spinner */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #4CAF50;
  animation: spin 1s ease infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error alert */
.error-alert {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;
}

.error-content {
  display: flex;
  align-items: center;
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.error-icon {
  margin-right: 10px;
  font-size: 1.2rem;
}

.error-text {
  flex: 1;
  font-size: 0.9rem;
}

.error-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: #666;
  padding: 0 5px;
}
  </style>