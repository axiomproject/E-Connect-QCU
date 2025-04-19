<template>
    <div class="admin-layout">
      <AdminLayout pageTitle="Badges">
        <div class="admin-badges">
          <!-- Action Bar -->
          <div class="action-bar">
            <div class="search-filter">
              <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" placeholder="Search badges..." v-model="searchQuery">
              </div>
              <select v-model="categoryFilter">
                <option value="">All Categories</option>
                <option value="waste">Waste</option>
                <option value="energy">Energy</option>
                <option value="water">Water</option>
                <option value="transportation">Transportation</option>
                <option value="food">Food</option>
                <option value="milestone">Milestone</option>
                <option value="impact">Impact</option>
                <option value="difficulty">Difficulty</option>
              </select>
              <select v-model="rarityFilter">
                <option value="">All Rarities</option>
<option value="easy">Easy</option>
<option value="medium">Medium</option>
<option value="hard">Hard</option>
<option value="ultra-hard">Ultra Hard</option>
              </select>
            </div>
            <button class="add-btn" @click="openBadgeModal()">
              <i class="fas fa-plus"></i> Add Badge
            </button>
          </div>
  
          <!-- Badges Table -->
          <div class="badges-container">
            <div class="loading-container" v-if="loading">
              <i class="fas fa-spinner fa-spin"></i>
              <p>Loading badges...</p>
            </div>
  
            <div class="empty-state" v-else-if="filteredBadges.length === 0">
              <i class="fas fa-award"></i>
              <h3>No badges found</h3>
              <p v-if="searchQuery || categoryFilter || rarityFilter">
                Try adjusting your search or filter
              </p>
              <p v-else>
                Start by adding your first badge
              </p>
              <button class="add-btn" @click="openBadgeModal()">
                <i class="fas fa-plus"></i> Add Badge
              </button>
            </div>
  
            <div class="table-responsive" v-else>
              <table class="badges-table">
                <thead>
                  <tr>
                    <th>Badge</th>
                    <th>Category</th>
                    <th>Rarity</th>
                    <th>Points</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="badge in filteredBadges" :key="badge.id">
                    <td>
                      <div class="badge-info">
                        <span class="badge-icon">{{ badge.icon }}</span>
                        <div>
                          <div class="badge-name">{{ badge.name }}</div>
                          <div class="badge-description">{{ truncateText(badge.short_description, 50) }}</div>
                        </div>
                      </div>
                    </td>
                    <td>{{ capitalize(badge.category) }}</td>
                    <td>
                      <span class="rarity-badge" :class="badge.rarity">
                        {{ capitalize(badge.rarity) }}
                      </span>
                    </td>
                    <td>{{ badge.points }}</td>
                    <td>
                      <div class="action-buttons">
                        <button class="edit-btn" @click="openBadgeModal(badge)">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" @click="confirmDelete(badge)">
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
  
      <!-- Badge Modal for Add/Edit -->
      <transition name="modal-fade">
      <div class="modal-overlay" v-if="showBadgeModal" @click="closeBadgeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>{{ isEditMode ? 'Edit Badge' : 'Add New Badge' }}</h2>
            <button class="close-btn" @click="closeBadgeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <form @submit.prevent="saveBadge" class="badge-form">
              <div class="badge-preview">
                <div class="badge-icon-preview" :class="badgeForm.rarity">
                  <span>{{ badgeForm.icon || '🏆' }}</span>
                </div>
              </div>
  
              <div class="form-row">
                <div class="form-group">
                  <label for="badge-name">Badge Name</label>
                  <input 
                    type="text" 
                    id="badge-name" 
                    v-model="badgeForm.name" 
                    required
                    placeholder="Enter badge name"
                  >
                </div>
  
                <div class="form-group">
                  <label for="badge-icon">Icon (Emoji)</label>
                  <input 
                    type="text" 
                    id="badge-icon" 
                    v-model="badgeForm.icon" 
                    required
                    placeholder="🏆"
                  >
                  <small class="form-hint">Use a single emoji character</small>
                </div>
              </div>
              
              <div class="form-group">
                <label for="badge-short-description">Short Description</label>
                <input 
                  type="text" 
                  id="badge-short-description" 
                  v-model="badgeForm.short_description" 
                  required
                  placeholder="Enter a concise description"
                >
                <small class="form-hint">Brief description shown in badge lists</small>
              </div>
              
              <div class="form-group">
                <label for="badge-description">Full Description</label>
                <textarea 
                  id="badge-description" 
                  v-model="badgeForm.description" 
                  rows="3"
                  required
                  placeholder="Enter detailed badge description"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="badge-requirement">Requirement</label>
                <textarea 
                  id="badge-requirement" 
                  v-model="badgeForm.requirement" 
                  rows="2"
                  required
                  placeholder="Enter achievement requirements"
                ></textarea>
                <small class="form-hint">e.g., "Complete 3 water-related challenges" or "Save over 50kg of CO₂"</small>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="badge-category">Category</label>
                  <select 
                    id="badge-category" 
                    v-model="badgeForm.category"
                    required
                  >
                    <option value="waste">Waste</option>
                    <option value="energy">Energy</option>
                    <option value="water">Water</option>
                    <option value="transportation">Transportation</option>
                    <option value="food">Food</option>
                    <option value="milestone">Milestone</option>
                    <option value="impact">Impact</option>
                    <option value="difficulty">Difficulty</option>
                  </select>
                </div>
  
                <div class="form-group">
                  <label for="badge-rarity">Rarity</label>
                  <select 
                    id="badge-rarity" 
                    v-model="badgeForm.rarity"
                    required
                  >
                  <option value="easy">Easy</option>
<option value="medium">Medium</option>
<option value="hard">Hard</option>
<option value="ultra-hard">Ultra Hard</option>
                  </select>
                </div>
              </div>
  
              <div class="form-group">
                <label for="badge-points">Points Value</label>
                <input 
                  type="number" 
                  id="badge-points" 
                  v-model="badgeForm.points" 
                  min="0"
                  required
                >
              </div>
            </form>
          </div>
          
          <div class="modal-footer">
            <button class="cancel-btn" @click="closeBadgeModal">Cancel</button>
            <button class="save-btn" @click="saveBadge">
              {{ isEditMode ? 'Save Changes' : 'Add Badge' }}
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
            <h2>Delete Badge</h2>
            <button class="close-btn" @click="cancelDelete">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="delete-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <p>Are you sure you want to delete the badge "<strong>{{ badgeToDelete?.name }}</strong>"?</p>
              <p class="warning-text">This action cannot be undone and will remove this badge from all users who have earned it.</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="cancel-btn" @click="cancelDelete">Cancel</button>
            <button class="delete-confirm-btn" @click="deleteBadge">
              Delete Badge
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
        badges: [],
        searchQuery: '',
        categoryFilter: '',
        rarityFilter: '',
        showBadgeModal: false,
        showDeleteModal: false,
        isEditMode: false,
        badgeToDelete: null,
        badgeForm: {
          name: '',
          icon: '🏆',
          short_description: '',
          description: '',
          requirement: '',
          category: 'milestone',
          rarity: 'easy',
          points: 10
        },
        defaultBadgeForm: {
          name: '',
          icon: '🏆',
          short_description: '',
          description: '',
          requirement: '',
          category: 'milestone',
          rarity: 'common',
          points: 10
        }
      };
    },
    computed: {
      filteredBadges() {
        return this.badges.filter(badge => {
          // Filter by search query
          const matchesSearch = this.searchQuery === '' || 
            badge.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            badge.description?.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            badge.short_description?.toLowerCase().includes(this.searchQuery.toLowerCase());
          
          // Filter by category
          const matchesCategory = this.categoryFilter === '' || 
            badge.category === this.categoryFilter;
          
          // Filter by rarity
          const matchesRarity = this.rarityFilter === '' ||
            badge.rarity === this.rarityFilter;
          
          return matchesSearch && matchesCategory && matchesRarity;
        });
      }
    },
    mounted() {
      this.fetchBadges();
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
      
      async fetchBadges() {
        this.loading = true;
        try {
          const response = await axios.get('/api/admin/badges', this.getAuthHeader());
          this.badges = response.data;
        } catch (error) {
          console.error('Error fetching badges:', error);
          // Handle error (could add toast notification)
        } finally {
          this.loading = false;
        }
      },
      
      openBadgeModal(badge = null) {
        if (badge) {
          // Edit mode - populate form with badge data
          this.isEditMode = true;
          this.badgeForm = { ...badge };
        } else {
          // Add mode - reset form to defaults
          this.isEditMode = false;
          this.badgeForm = { ...this.defaultBadgeForm };
        }
        this.showBadgeModal = true;
      },
      
      closeBadgeModal() {
        this.showBadgeModal = false;
      },
      
      async saveBadge() {
        try {
          if (this.isEditMode) {
            // Update existing badge
            const response = await axios.put(
              `/api/admin/badges/${this.badgeForm.id}`,
              this.badgeForm,
              this.getAuthHeader()
            );
            
            // Update badge in the local array
            const index = this.badges.findIndex(b => b.id === this.badgeForm.id);
            if (index !== -1) {
              this.badges[index] = response.data;
            }
          } else {
            // Create new badge
            const response = await axios.post(
              '/api/admin/badges',
              this.badgeForm,
              this.getAuthHeader()
            );
            
            // Add new badge to the array
            this.badges.push(response.data);
          }
          
          // Close the modal and refresh
          this.closeBadgeModal();
          this.fetchBadges();
        } catch (error) {
          console.error('Error saving badge:', error);
        }
      },
      
      confirmDelete(badge) {
        this.badgeToDelete = badge;
        this.showDeleteModal = true;
      },
      
      cancelDelete() {
        this.showDeleteModal = false;
        this.badgeToDelete = null;
      },
      
      async deleteBadge() {
        if (!this.badgeToDelete) return;
        
        try {
          // Delete the badge on the server
          await axios.delete(
            `/api/admin/badges/${this.badgeToDelete.id}`,
            this.getAuthHeader()
          );
          
          // Remove the badge from the array
          const index = this.badges.findIndex(b => b.id === this.badgeToDelete.id);
          if (index !== -1) {
            this.badges.splice(index, 1);
          }
          
          // Close the modal
          this.cancelDelete();
          
        } catch (error) {
          console.error('Error deleting badge:', error);
        }
      },
      
      truncateText(text, maxLength) {
        if (!text) return '';
        return text.length > maxLength 
          ? text.substring(0, maxLength) + '...'
          : text;
      },
      
      capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }
    }
  };
  </script>
  
  <style scoped>
  .admin-badges {
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
  .badges-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    overflow: hidden;
  }
  
  .badges-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .badges-table th,
  .badges-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .badges-table th {
    font-weight: 600;
    color: #7f8c8d;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .badges-table tr:last-child td {
    border-bottom: none;
  }
  
  .badges-table tr:hover td {
    background-color: #f8f9fa;
  }
  
  .badge-info {
    display: flex;
    align-items: center;
  }
  
  .badge-icon {
    font-size: 1.8rem;
    margin-right: 0.75rem;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f8f8;
    border-radius: 50%;
  }
  
  .badge-name {
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 0.25rem;
  }
  
  .badge-description {
    font-size: 0.85rem;
    color: #7f8c8d;
  }
  
  .rarity-badge {
    padding: 0.35rem 0.7rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    display: inline-block;
  }
  
  .rarity-badge.easy {
    background-color: rgba(46, 204, 113, 0.1);
    color: #2ecc71;
  }
  
  .rarity-badge.medium {
    background-color: rgba(52, 152, 219, 0.1);
    color: #3498db;
  }
  
  .rarity-badge.hard {
    background-color: rgba(155, 89, 182, 0.1);
    color: #9b59b6;
  }
  
  .rarity-badge.ultra-hard {
    background-color: rgba(241, 196, 15, 0.1);
    color: #f1c40f;
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
  
  /* Badge Preview */
  .badge-preview {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  .badge-icon-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    transition: all 0.3s ease;
  }
  
  .badge-icon-preview.common {
    background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
    box-shadow: 0 5px 15px rgba(46, 204, 113, 0.2);
  }
  
  .badge-icon-preview.rare {
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
  }
  
  .badge-icon-preview.epic {
    background: linear-gradient(135deg, #ede7f6, #d1c4e9);
    box-shadow: 0 5px 15px rgba(155, 89, 182, 0.2);
  }
  
  .badge-icon-preview.legendary {
    background: linear-gradient(135deg, #fff8e1, #ffecb3);
    box-shadow: 0 5px 15px rgba(241, 196, 15, 0.2);
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
  
  .badge-form {
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

/* Mobile-friendly table adjustments */
@media (max-width: 768px) {
  .badges-table th:nth-child(2),
  .badges-table th:nth-child(3),
  .badges-table th:nth-child(4),
  .badges-table td:nth-child(2),
  .badges-table td:nth-child(3),
  .badges-table td:nth-child(4) {
    display: none;
  }
  
  /* Ensure first and last columns (Badge and Actions) take appropriate width */
  .badges-table th:first-child,
  .badges-table td:first-child {
    width: 75%;
  }
  
  .badges-table th:last-child,
  .badges-table td:last-child {
    width: 25%;
  }
}
.table-responsive {
  overflow-x: auto;
  width: 100%;
}
  </style>