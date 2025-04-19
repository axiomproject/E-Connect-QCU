<template>
    <div class="admin-layout">
      <AdminLayout pageTitle="Challenges">
        <div class="admin-challenges">
          <!-- Action Bar -->
          <div class="action-bar">
            <div class="search-filter">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search challenges..." v-model="searchQuery">
              </div>
              <select v-model="categoryFilter">
  <option value="">All Categories</option>
  <option value="energy">Energy</option>
  <option value="water">Water</option>
  <option value="waste">Waste</option>
  <option value="transportation">Transportation</option>
  <option value="food">Food</option>
</select>
<select v-model="difficultyFilter">
  <option value="">All Difficulties</option>
  <option value="easy">Easy</option>
  <option value="medium">Medium</option>
  <option value="hard">Hard</option>
  <option value="ultra-hard">Ultra-Hard</option>
</select>
            </div>
            <button class="add-btn" @click="openChallengeModal()">
              <i class="fas fa-plus"></i> Add Challenge
            </button>
          </div>
  
          <!-- Challenges Table -->
          <div class="challenges-container">
            <div class="loading-container" v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading challenges...</p>
            </div>
  
            <div class="empty-state" v-else-if="filteredChallenges.length === 0">
              <i class="fas fa-tasks"></i>
              <h3>No challenges found</h3>
              <p v-if="searchQuery || categoryFilter">
                Try adjusting your search or filter
              </p>
              <p v-else>
                Start by adding your first challenge
              </p>
              <button class="add-btn" @click="openChallengeModal()">
                <i class="fas fa-plus"></i> Add Challenge
              </button>
            </div>

            
  
            <div class="table-responsive" v-else>
              
              <table class="challenges-table">
                <thead>
                  <tr>
                    <th>Challenge</th>
<th>Category</th>
<th>Difficulty</th>
<th>Points</th>
<th>Status</th>
<th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="challenge in filteredChallenges" :key="challenge.id">
                    <td>
                      <div class="challenge-header">
                        <span class="category-icon">{{ getCategoryIcon(challenge.category) }}</span>
                        <div>
                          <div class="challenge-name">{{ challenge.title }}</div>
                          <div class="challenge-description">{{ truncateText(challenge.description, 50) }}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="category-cell">
                        <span>{{ capitalize(challenge.category) }}</span>
                      </div>
                    </td>
<td>{{ capitalize(challenge.difficulty) }}</td>
<td>{{ challenge.points }}</td>
                    <td>
                      <span 
                        class="status-badge" 
                        :class="{ 'active': challenge.is_active, 'inactive': !challenge.is_active }"
                      >
                        {{ challenge.is_active ? 'Active' : 'Inactive' }}
                      </span>
                    </td>
                    <td>
                      <div class="action-buttons">
                        <button class="edit-btn" @click="openChallengeModal(challenge)">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="status-toggle-btn" @click="toggleChallengeStatus(challenge)">
                          <i class="fas" :class="challenge.is_active ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                        </button>
                        <button class="delete-btn" @click="confirmDelete(challenge)">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
  
      <!-- Challenge Modal for Add/Edit -->
      <transition name="modal-fade">
      <div class="modal-overlay" v-if="showChallengeModal" @click="closeChallengeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditMode ? 'Edit Challenge' : 'Add New Challenge' }}</h2>
            <button class="close-btn" @click="closeChallengeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveChallenge" class="challenge-form">
                <div class="form-group">
  <label for="challenge-title">Challenge Title</label>
  <input 
    type="text" 
    id="challenge-title" 
    v-model="challengeForm.title" 
    required
    placeholder="Enter challenge title"
  >
</div>
              
              <div class="form-group">
                <label for="challenge-description">Description</label>
                <textarea 
                  id="challenge-description" 
                  v-model="challengeForm.description" 
                  rows="4"
                  required
                  placeholder="Enter challenge description"
                ></textarea>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="challenge-category">Category</label>
                  <select 
                    id="challenge-category" 
                    v-model="challengeForm.category"
                    required
                  >
                    <option value="waste">Waste</option>
                    <option value="energy">Energy</option>
                    <option value="transportation">Transportation</option>
                    <option value="food">Food</option>
                    <option value="water">Water</option>
                  </select>
                </div>
                

                <!-- Add difficulty dropdown -->
<div class="form-group">
  <label for="challenge-difficulty">Difficulty</label>
  <select 
    id="challenge-difficulty" 
    v-model="challengeForm.difficulty"
    required
  >
    <option value="easy">Easy</option>
    <option value="medium">Medium</option>
    <option value="hard">Hard</option>
    <option value="ultra-hard">Ultra-Hard</option>
  </select>
</div>

<!-- Add benefits field -->
<div class="form-group">
  <label for="challenge-benefits">Benefits</label>
  <textarea 
    id="challenge-benefits" 
    v-model="challengeForm.benefits" 
    rows="3"
    placeholder="Describe environmental benefits of completing this challenge"
  ></textarea>
</div>

<!-- Change the steps input field to accept plain text with each step on a new line -->
<div class="form-group">
  <label for="challenge-steps">Steps (one per line)</label>
  <textarea 
    id="challenge-steps" 
    v-model="challengeForm.stepsText" 
    rows="4"
    placeholder="Step 1: Do this
Step 2: Do that
Step 3: Complete this"
  ></textarea>
  <small class="form-hint">Enter each step on a new line</small>
</div>
<div class="form-row">
                <div class="form-group">
                  <label for="challenge-points">Points</label>
                  <input 
                    type="number" 
                    id="challenge-points" 
                    v-model="challengeForm.points" 
                    min="0"
                    required
                  >
                </div>
              </div>
              
      
                <div class="form-group">
                  <label for="challenge-carbon">Carbon Reduction (kg)</label>
                  <input 
                    type="number" 
                    id="challenge-carbon" 
                    v-model="challengeForm.carbon_reduction" 
                    min="0"
                    step="0.1"
                    required
                  >
                </div>
              </div>

<!-- Move status select out to its own standalone form-group -->
<div class="form-group">
  <label for="challenge-status">Status</label>
  <select id="challenge-status" v-model="challengeForm.is_active">
    <option :value="true">Active</option>
    <option :value="false">Inactive</option>
  </select>
</div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeChallengeModal">Cancel</button>
            <button class="save-btn" @click="saveChallenge">
              {{ isEditMode ? 'Save Changes' : 'Add Challenge' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
      <!-- Delete Confirmation Modal -->
      <transition name="modal-fade">
      <div class="modal-overlay" v-if="showDeleteModal" @click="cancelDelete">
        <div class="modal-container delete-modal" @click.stop>
          <div class="modal-header">
            <h2>Delete Challenge</h2>
            <button class="close-btn" @click="cancelDelete">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="delete-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Are you sure you want to delete the challenge "<strong>{{ challengeToDelete?.title }}</strong>"?</p>
              <p class="warning-text">This action cannot be undone.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="cancel-btn" @click="cancelDelete">Cancel</button>
            <button class="delete-confirm-btn" @click="deleteChallenge">
              Delete Challenge
            </button>
          </div>
        </div>
      </div>
    </transition>
    </div>
    
  </template>
  
  <script>
  import AdminLayout from './AdminLayout.vue';
  import axios from 'axios';
  import { useAuthStore } from '../../stores/auth';
  
  export default {
    components: {
      AdminLayout
    },
    data() {
      return {
        loading: false,
        challenges: [],
        searchQuery: '',
        categoryFilter: '',
        showChallengeModal: false,
        showDeleteModal: false,
        isEditMode: false,
        challengeToDelete: null,
        challengeForm: {
          title: '',
          description: '',
          category: 'waste',
          difficulty: 'medium',
          points: 10,
          carbon_reduction: 1.0,
          is_active: true,
          steps: '[]', // Keep for data storage
          stepsText: '', // Add this for user input
          benefits: ''
        },
        defaultChallengeForm: {
          title: '',
          description: '',
          category: 'waste',
          difficulty: 'easy',
          points: 10,
          carbon_reduction: 1.0,
          is_active: true,
          steps: '[]', // Keep for data storage
          stepsText: '', // Add this for user input
          benefits: ''
        },
        difficultyFilter: ''
      };
    },
    computed: {
        filteredChallenges() {
  return this.challenges.filter(challenge => {
    // Filter by search query
    const matchesSearch = this.searchQuery === '' || 
      challenge.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      challenge.description.toLowerCase().includes(this.searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = this.categoryFilter === '' || 
      challenge.category === this.categoryFilter;
    
    // Filter by difficulty
    const matchesDifficulty = this.difficultyFilter === '' ||
      challenge.difficulty === this.difficultyFilter;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });
}
    },
    mounted() {
      this.fetchChallenges();
      
      // Check if we should open the Add Challenge modal from query params
      if (this.$route.query.action === 'add-challenge') {
        this.openChallengeModal();
        
        // Remove the query parameter from the URL without reloading the page
        const { query } = this.$route;
        const newQuery = { ...query };
        delete newQuery.action;
        this.$router.replace({ query: newQuery });
      }
    },
    methods: {
      getAuthHeader() {
        const authStore = useAuthStore();
        return {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        };
      },
      
      async fetchChallenges() {
        this.loading = true;
        try {
          const response = await axios.get('/api/admin/challenges', this.getAuthHeader());
          this.challenges = response.data;
        } catch (error) {
          console.error('Error fetching challenges:', error);
          // Handle error (could add toast notification)
        } finally {
          this.loading = false;
        }
      },
      
      openChallengeModal(challenge = null) {
        if (challenge) {
          // Edit mode - populate form with challenge data
          this.isEditMode = true;
          const challengeCopy = { ...challenge };
          
          // Convert steps JSON to text format for editing
          try {
            const stepsArray = Array.isArray(challengeCopy.steps) 
              ? challengeCopy.steps 
              : JSON.parse(challengeCopy.steps || '[]');
            challengeCopy.stepsText = stepsArray.join('\n');
          } catch (e) {
            console.error('Error parsing steps:', e);
            challengeCopy.stepsText = '';
          }
          
          this.challengeForm = challengeCopy;
        } else {
          // Add mode - reset form to defaults
          this.isEditMode = false;
          this.challengeForm = { ...this.defaultChallengeForm };
        }
        this.showChallengeModal = true;
      },
      
      closeChallengeModal() {
        this.showChallengeModal = false;
      },
      
      async saveChallenge() {
        try {
          // Convert the steps text to a proper JSON array
          const stepsArray = this.challengeForm.stepsText
            .split('\n')
            .map(step => step.trim())
            .filter(step => step.length > 0);
          
          // Add icon based on category and include the steps array
          const formData = { 
            ...this.challengeForm,
            icon: this.getCategoryIcon(this.challengeForm.category),
            steps: JSON.stringify(stepsArray) // Properly stringify the array
          };
          
          if (this.isEditMode) {
            // Update existing challenge
            const response = await axios.put(
              `/api/admin/challenges/${formData.id}`,
              formData,
              this.getAuthHeader()
            );
            
            // Update challenge in the local array
            const index = this.challenges.findIndex(c => c.id === formData.id);
            if (index !== -1) {
              this.challenges[index] = response.data;
            }
          } else {
            // Create new challenge
            const response = await axios.post(
              '/api/admin/challenges',
              formData,
              this.getAuthHeader()
            );
            
            // Add new challenge to the array
            this.challenges.push(response.data);
          }
          
          // Close the modal and refresh
          this.closeChallengeModal();
          this.fetchChallenges();
        } catch (error) {
          console.error('Error saving challenge:', error);
        }
      },
      
      async toggleChallengeStatus(challenge) {
        try {
          // Update status on the server
          const updatedStatus = !challenge.is_active;
          
          await axios.patch(
            `/api/admin/challenges/${challenge.id}/status`,
            { is_active: updatedStatus },
            this.getAuthHeader()
          );
          
          // Update status locally
          challenge.is_active = updatedStatus;
          
        } catch (error) {
          console.error('Error toggling challenge status:', error);
          // Handle error (could add toast notification)
        }
      },
      
      confirmDelete(challenge) {
        this.challengeToDelete = challenge;
        this.showDeleteModal = true;
      },
      
      cancelDelete() {
        this.showDeleteModal = false;
        this.challengeToDelete = null;
      },
      
      async deleteChallenge() {
        if (!this.challengeToDelete) return;
        
        try {
          // Delete the challenge on the server
          await axios.delete(
            `/api/admin/challenges/${this.challengeToDelete.id}`,
            this.getAuthHeader()
          );
          
          // Remove the challenge from the array
          const index = this.challenges.findIndex(c => c.id === this.challengeToDelete.id);
          if (index !== -1) {
            this.challenges.splice(index, 1);
          }
          
          // Close the modal
          this.cancelDelete();
          
        } catch (error) {
          console.error('Error deleting challenge:', error);
          // Handle error (could add toast notification)
        }
      },
      
      truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength 
          ? text.substring(0, maxLength) + '...'
          : text;
      },

      getCategoryIcon(category) {
        switch (category.toLowerCase()) {
          case 'energy': return '⚡';
          case 'water': return '💧';
          case 'waste': return '♻️';
          case 'transportation': return '🚲';
          case 'food': return '🥗';
          default: return '🌱';
        }
      },

      // Add a new method to capitalize the first letter of a string
      capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }
    }
  };
  </script>
  
  <style scoped>
  .admin-challenges {
    padding: 1.5rem;
  }
  
  /* Action bar styles */
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .search-filter {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .search-box {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .search-box i {
    position: absolute;
    left: 12px;
    color: #95a5a6;
  }
  
  .search-box input {
    padding: 0.6rem 0.6rem 0.6rem 2.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    width: 220px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }
  
  .search-filter select {
    padding: 0.6rem 2.5rem 0.6rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    font-size: 0.9rem;
    appearance: none;
    background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
    background-size: 16px;
    cursor: pointer;
  }
  
  .add-btn {
    padding: 0.6rem 1.2rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 20px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .add-btn:hover {
    background-color: #388E3C;
    transform: translateY(-2px);
  }
  
  /* Table styles */
  .challenges-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  .challenges-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .challenges-table th,
  .challenges-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .challenges-table th {
    font-weight: 600;
    color: #7f8c8d;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .challenges-table tr:last-child td {
    border-bottom: none;
  }
  
  .challenges-table tr:hover td {
    background-color: #f8f9fa;
  }
  
  .challenge-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
  }
  
  .challenge-description {
    font-size: 0.85rem;
    color: #7f8c8d;
  }
  
  .status-badge {
    padding: 0.35rem 0.7rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
  }
  
  .status-badge.active {
    background-color: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
  }
  
  .status-badge.inactive {
    background-color: rgba(149, 165, 166, 0.1);
    color: #95a5a6;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-buttons button {
    width: 32px;
    height: 32px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .edit-btn {
    background-color: #f8f9fa;
    color: #3498db;
  }
  
  .edit-btn:hover {
    background-color: #3498db;
    color: white;
  }
  
  .status-toggle-btn {
    background-color: #f8f9fa;
    color: #2ecc71;
  }
  
  .status-toggle-btn:hover {
    background-color: #2ecc71;
    color: white;
  }
  
  .delete-btn {
    background-color: #f8f9fa;
    color: #e74c3c;
  }
  
  .delete-btn:hover {
    background-color: #e74c3c;
    color: white;
  }
  
  /* Loading and empty state styles */
  .loading-container, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #95a5a6;
  }
  
  .loading-container i, .empty-state i {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: #e0e0e0;
  }
  
  .empty-state h3 {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .empty-state p {
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-container {
    background-color: white;
    border-radius: 8px;
    width: 600px;
    max-width: 90%;
    max-height: 90vh;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .delete-modal {
    width: 450px;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #95a5a6;
    transition: all 0.2s ease;
  }
  
  .close-btn:hover {
    background-color: #f5f5f5;
    color: #e53935;
  }
  
  .modal-body {
    padding: 1.5rem;
    overflow-y: auto;
  }
  
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.25rem;
    border-top: 1px solid #f0f0f0;
  }
  
  .challenge-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .form-group label {
    font-size: 0.9rem;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .form-hint {
    font-size: 0.8rem;
    color: #95a5a6;
    margin-top: 0.25rem;
  }
  
  .cancel-btn {
    padding: 0.6rem 1.25rem;
    background-color: #f5f5f5;
    color: #7f8c8d;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cancel-btn:hover {
    background-color: #e0e0e0;
  }
  
  .save-btn,
  .delete-confirm-btn {
    padding: 0.6rem 1.25rem;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .save-btn {
    background-color: #4CAF50;
    color: white;
  }
  
  .save-btn:hover {
    background-color: #388E3C;
  }
  
  .delete-confirm-btn {
    background-color: #e74c3c;
    color: white;
  }
  
  .delete-confirm-btn:hover {
    background-color: #c0392b;
  }
  
  .delete-warning {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .delete-warning i {
    font-size: 3rem;
    color: #e74c3c;
    margin-bottom: 1rem;
  }
  
  .delete-warning p {
    color: #2c3e50;
    margin-bottom: 0.5rem;
  }
  
  .delete-warning .warning-text {
    color: #e74c3c;
    font-weight: 600;
  }

  /* Add these new styles for the category cell */
  .category-cell {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .category-icon {
    width: 40px;
    height: 40px;
    font-size: 1.8rem;
    margin-right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 28px;
  }

  /* Update challenge header styles */
  .challenge-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .action-bar {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .search-filter {
      flex-direction: column;
      width: 100%;
    }
    
    .search-box,
    .search-filter select {
      width: 100%;
    }
    
    .add-btn {
      width: 100%;
      justify-content: center;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
  }

  /* Mobile-friendly table: show only Challenge and Actions columns */
  @media (max-width: 900px) {
    .table-responsive {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .challenges-table th,
    .challenges-table td {
      padding: 0.6rem 0.3rem;
      font-size: 0.98rem;
    }
    /* Hide all columns except first (Challenge) and last (Actions) */
    .challenges-table th:nth-child(2),
    .challenges-table th:nth-child(3),
    .challenges-table th:nth-child(4),
    .challenges-table th:nth-child(5),
    .challenges-table td:nth-child(2),
    .challenges-table td:nth-child(3),
    .challenges-table td:nth-child(4),
    .challenges-table td:nth-child(5) {
      display: none !important;
    }
    /* Make header sticky for better UX */
    .challenges-table thead th {
      position: sticky;
      top: 0;
      background: #f5f7fa;
      z-index: 2;
    }
  }

  /* Modal animation styles */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(20px);
  opacity: 0;
}
  </style>