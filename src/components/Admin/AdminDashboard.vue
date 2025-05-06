<template>
  <div class="admin-layout">
    <AdminLayout pageTitle="Dashboard">

      <div class="admin-dashboard">
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-icon users">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ stats.totalUsers || 0 }}</div>
              <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-change positive">
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon challenges">
              <i class="fas fa-tasks"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ stats.totalChallenges || 0 }}</div>
              <div class="stat-label">Total Challenges</div>
            </div>
            <div class="stat-change positive">
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon completed">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ stats.completedChallenges || 0 }}</div>
              <div class="stat-label">Completed Challenges</div>
            </div>
            <div class="stat-change positive">
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon new-users">
              <i class="fas fa-user-plus"></i>
            </div>
            <div class="stat-details">
              <div class="stat-value">{{ stats.newUsersThisMonth || 0 }}</div>
              <div class="stat-label">New Users (30 days)</div>
            </div>
            <div class="stat-change positive">
            </div>
          </div>
        </div>

        <div class="dashboard-row">
          <div class="dashboard-card user-growth-chart">
  <div class="card-header">
    <h3>User Growth</h3>
    <div class="card-actions">
      <select v-model="userTimeRange" @change="fetchUserGrowthData">
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="all">All Time</option>
      </select>
    </div>
  </div>
  <div class="chart-container">
    <div v-if="loadingChart" class="loading-placeholder">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading chart data...</p>
    </div>
    <div v-else-if="!userGrowthData.length" class="empty-state">
      <i class="fas fa-chart-line"></i>
      <p>No user data available for the selected period</p>
    </div>
    <div v-else ref="userChartContainer" class="user-chart"></div>
  </div>
</div>

          <div class="dashboard-card recent-users">
            <div class="card-header">
              <h3>Recent Users</h3>
              <div class="card-actions">
                <button @click="navigateToUsers">View All</button>
              </div>
            </div>
            <div class="recent-users-list">
              <div class="loading-placeholder" v-if="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading recent users...</p>
              </div>
              <div class="empty-state" v-else-if="!recentUsers.length">
                <i class="fas fa-users"></i>
                <p>No recent users found</p>
              </div>
              <div v-else class="user-list">
                <div class="user-item" v-for="user in recentUsers" :key="user.id">
                  <div class="user-avatar">
                    <img :src="user.avatar || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'" :alt="user.username">
                  </div>
                  <div class="user-info">
                    <div class="user-name">{{ user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                  <div class="user-joined">
                    <span>{{ formatDate(user.created_at) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="dashboard-row">
          <div class="dashboard-card popular-challenges">
            <div class="card-header">
              <h3>Popular Challenges</h3>
              <div class="card-actions">
                <button @click="navigateToChallenges">Manage Challenges</button>
              </div>
            </div>
            <div class="challenges-container">
              <table class="challenges-table">
                <thead>
                  <tr>
                    <th>Challenge</th>
                    <th>Category</th>
                    <th>Completions</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loading">
                    <td colspan="4" class="text-center">
                      <i class="fas fa-spinner fa-spin mr-2"></i> Loading challenges...
                    </td>
                  </tr>
                  <tr v-else-if="popularChallenges.length === 0">
                    <td colspan="4" class="text-center">No challenge data available</td>
                  </tr>
                  <tr v-else v-for="challenge in popularChallenges" :key="challenge.id">
                    <td>{{ challenge.title }}</td>
                    <td>{{ challenge.category }}</td>
                    <td>{{ challenge.completions }}</td>
                    <td>
                      <div class="progress-bar">
                        <div class="progress" :style="{ width: challenge.completionRate + '%' }"></div>
                        <span>{{ challenge.completionRate }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="dashboard-card quick-actions">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="quick-actions-grid">
              <div class="quick-action" @click="navigateToAddUser">
                <i class="fas fa-user-plus"></i>
                <span>Add User</span>
              </div>
              <div class="quick-action" @click="openChallengeModal">
  <i class="fas fa-plus-circle"></i>
  <span>New Challenge</span>
</div>
<div class="quick-action" @click="openBadgeModal">
  <i class="fas fa-award"></i>
  <span>Create Badge</span>
</div>
              <div class="quick-action" @click="openAnnouncementModal">
                <i class="fas fa-bullhorn"></i>
                <span>Announcement</span>
              </div>
              <div class="quick-action" @click="navigateToSettings">
                <i class="fas fa-cog"></i>
                <span>Settings</span>
              </div>
              <div class="quick-action" @click="openExportModal">
  <i class="fas fa-file-export"></i>
  <span>Export Data</span>
</div>
            </div>
          </div>
        </div>

        <!-- Ads Clicked Section -->
        <div class="dashboard-row">
          <div class="dashboard-card ad-clicks-card">
            <div class="card-header">
              <h3>Ad Clicks</h3>
            </div>
            <div class="ad-clicks-container">
              <table class="ad-clicks-table">
                <thead>
                  <tr>
                    <th>Ad Name</th>
                    <th>Click Count</th>
                    <th>Last Clicked</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="loadingAdClicks">
                    <td colspan="3" class="text-center">
                      <i class="fas fa-spinner fa-spin mr-2"></i> Loading ad clicks...
                    </td>
                  </tr>
                  <tr v-else-if="adClicks.length === 0">
                    <td colspan="3" class="text-center">No ad click data available</td>
                  </tr>
                  <tr v-else v-for="ad in adClicks" :key="ad.ad_name">
                    <td>{{ ad.ad_name }}</td>
                    <td>{{ ad.click_count }}</td>
                    <td>{{ ad.last_clicked_at ? new Date(ad.last_clicked_at).toLocaleString() : '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  
    <!-- Add User Modal -->
    <transition name="modal-fade">
<div class="modal-overlay" v-if="showUserModal" @click="closeUserModal">
  <div class="modal-container" @click.stop>
    <div class="modal-header">
      <h2>Add New User</h2>
      <button class="close-btn" @click="closeUserModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="modal-body">
      <form @submit.prevent="saveUser" class="user-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="userForm.username" 
            required
            placeholder="Enter username"
          >
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="userForm.email" 
            required
            placeholder="Enter email address"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
    <input 
      :type="showPassword ? 'text' : 'password'" 
      id="password" 
      v-model="userForm.password" 
      required
      placeholder="Enter password"
    />
    <span class="password-toggle-icon" @click="showPassword = !showPassword">
      <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
        </div>
        
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" v-model="userForm.status">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </form>
    </div>
    
    <div class="modal-footer">
      <button class="cancel-btn" @click="closeUserModal">Cancel</button>
      <button class="save-btn" @click="saveUser">Add User</button>
    </div>
  </div>
</div>
</transition>
  <!-- Add Challenge Modal -->
  <transition name="modal-fade">
  <div class="modal-overlay" v-if="showChallengeModal" @click="closeChallengeModal">
  <div class="modal-container" @click.stop>
    <div class="modal-header">
      <h2>Add New Challenge</h2>
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
        </div>
        <div class="form-row">
        <div class="form-group">
          <label for="challenge-benefits">Benefits</label>
          <textarea 
            id="challenge-benefits" 
            v-model="challengeForm.benefits" 
            rows="3"
            placeholder="Describe environmental benefits of completing this challenge"
          ></textarea>
        </div>

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
      <button class="save-btn" @click="saveChallenge">Add Challenge</button>
    </div>
  </div>

</div>
  </transition>
  <!-- Add Badge Modal -->
  <transition name="modal-fade">
  <div class="modal-overlay" v-if="showBadgeModal" @click="closeBadgeModal">
  <div class="modal-container" @click.stop>
    <div class="modal-header">
      <h2>Add New Badge</h2>
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
      <button class="save-btn" @click="saveBadge">Add Badge</button>
    </div>
  </div>
</div>
</transition>
  <!-- Export Data Modal -->
  <transition name="modal-fade">
<div class="modal-overlay" v-if="showExportModal" @click="closeExportModal">
  <div class="modal-container" @click.stop>
    <div class="modal-header">
      <h2>Export Dashboard Data</h2>
      <button class="close-btn" @click="closeExportModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="modal-body">
      <p class="export-description">Select the data you want to export:</p>
      
      <div class="export-options">
        <div class="export-option">
          <input type="checkbox" id="export-stats" v-model="exportOptions.stats">
          <label for="export-stats">Statistics</label>
          <span class="export-hint">User counts, challenge counts, etc.</span>
        </div>
        
        <div class="export-option">
          <input type="checkbox" id="export-users" v-model="exportOptions.users">
          <label for="export-users">Recent Users</label>
          <span class="export-hint">Latest registered users</span>
        </div>
        
        <div class="export-option">
          <input type="checkbox" id="export-challenges" v-model="exportOptions.challenges">
          <label for="export-challenges">Popular Challenges</label>
          <span class="export-hint">Most completed challenges</span>
        </div>
      </div>
      
      <div class="export-format">
        <p>Export format:</p>
        <div class="format-options">
          <label class="format-option">
            <input type="radio" name="format" value="json" v-model="exportOptions.format">
            <span>JSON</span>
          </label>
          <label class="format-option">
            <input type="radio" name="format" value="csv" v-model="exportOptions.format">
            <span>CSV</span>
          </label>
          <label class="format-option">
            <input type="radio" name="format" value="xlsx" v-model="exportOptions.format">
            <span>XLSX</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="cancel-btn" @click="closeExportModal">Cancel</button>
      <button class="save-btn" :disabled="!hasSelectedOptions" @click="exportData">
        <i class="fas fa-download mr-2"></i> Export
      </button>
    </div>
  </div>
</div>
</transition>
<!-- Announcement Modal -->
<transition name="modal-fade">
<div class="modal-overlay" v-if="showAnnouncementModal" @click="closeAnnouncementModal">
  <div class="modal-container" @click.stop>
    <div class="modal-header">
      <h2>Send System Announcement</h2>
      <button class="close-btn" @click="closeAnnouncementModal">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div class="modal-body">
      <div v-if="announcement.success" class="announcement-success">
        <i class="fas fa-check-circle"></i>
        <p>Announcement successfully sent to all users!</p>
        <p class="announcement-stats">{{ announcement.sentCount }} users notified</p>
      </div>
      
      <form v-else @submit.prevent="sendAnnouncement" class="announcement-form">
        <div class="form-group">
          <label for="announcement-title">Announcement Title</label>
          <input 
            type="text" 
            id="announcement-title" 
            v-model="announcement.title" 
            required
            placeholder="Enter a clear, attention-grabbing title"
            maxlength="100"
          >
        </div>
        
        <div class="form-group">
          <label for="announcement-message">Announcement Message</label>
          <textarea 
            id="announcement-message" 
            v-model="announcement.message" 
            rows="5"
            required
            placeholder="Enter your message to all users"
            maxlength="500"
          ></textarea>
          <small class="form-hint">{{ 500 - announcement.message.length }} characters remaining</small>
        </div>
        
        <div class="form-group" v-if="announcement.error">
          <div class="announcement-error">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ announcement.error }}</span>
          </div>
        </div>
      </form>
    </div>
    
    <div class="modal-footer">
      <button class="cancel-btn" @click="closeAnnouncementModal">
        {{ announcement.success ? 'Close' : 'Cancel' }}
      </button>
      <button 
        v-if="!announcement.success" 
        class="save-btn" 
        @click="sendAnnouncement"
        :disabled="announcement.sending || !announcement.title || !announcement.message"
      >
        <i class="fas fa-spinner fa-spin mr-1" v-if="announcement.sending"></i>
        {{ announcement.sending ? 'Sending...' : 'Send Announcement' }}
      </button>
      <button 
        v-if="announcement.success" 
        class="save-btn" 
        @click="resetAnnouncementForm"
      >
        <i class="fas fa-paper-plane mr-1"></i>
        Send Another
      </button>
    </div>
  </div>

</div>
</transition>
    </AdminLayout>
  </div>
</template>

<script>
import AdminLayout from './AdminLayout.vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import * as XLSX from 'xlsx';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  components: {
    AdminLayout
  },
  data() {
    return {
      timeRange: 'week',
      loading: false,
      recentUsers: [],
      userTimeRange: 'week',
userGrowthData: [],
userChart: null,
loadingChart: false,
      showAnnouncementModal: false,
announcement: {
  title: '',
  message: '',
  sending: false,
  success: false,
  error: '',
  sentCount: 0
},
      showExportModal: false,
exportOptions: {
  stats: true,
  users: false,
  challenges: false,
  format: 'json'
},
      showBadgeModal: false,
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
      showChallengeModal: false,
challengeForm: {
  title: '',
  description: '',
  category: 'waste',
  difficulty: 'medium',
  points: 10,
  carbon_reduction: 1.0,
  is_active: true,
  stepsText: '',
  benefits: ''
},
showPassword: false,
      showUserModal: false,
userForm: {
  username: '',
  email: '',
  password: '',
  status: 'active',
  role: 'user'
},
      showAnnouncementModal: false,
      announcement: {
        title: '',
        message: '',
        success: false,
        sending: false,
        error: null,
        sentCount: 0
      },
      stats: {
        totalUsers: 0,
        totalChallenges: 0,
        completedChallenges: 0,
        newUsersThisMonth: 0
      },
      popularChallenges: [],
      adClicks: [],
      loadingAdClicks: false,
      error: null
    };
  },
  computed: {
    hasSelectedOptions() {
      return this.exportOptions.stats || 
             this.exportOptions.users || 
             this.exportOptions.challenges;
    }
  },
  mounted() {
    // Fetch data when component mounts
    this.fetchDashboardData();
    this.fetchRecentUsers();
    this.fetchPopularChallenges();
    this.fetchUserGrowthData();
    this.fetchAdClicks();
  },
methods: {
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  },
  getAuthHeader() {
    const authStore = useAuthStore();
    return {
      headers: {
        Authorization: `Bearer ${authStore.token}`
      }
    };
  },

  // Add these methods in the methods section:
openAnnouncementModal() {
  this.showAnnouncementModal = true;
},

closeAnnouncementModal() {
  if (!this.announcement.sending) {
    this.showAnnouncementModal = false;
    // Wait a bit before resetting the form to allow the closing animation
    setTimeout(() => {
      this.resetAnnouncementForm();
    }, 300);
  }
},

resetAnnouncementForm() {
  this.announcement = {
    title: '',
    message: '',
    sending: false,
    success: false,
    error: '',
    sentCount: 0
  };
},

async sendAnnouncement() {
  if (!this.announcement.title || !this.announcement.message) {
    this.announcement.error = 'Please fill in both title and message fields';
    return;
  }
  
  this.announcement.sending = true;
  this.announcement.error = '';
  
  try {
    const response = await axios.post('/api/admin/notifications/announcement', {
      title: this.announcement.title,
      message: this.announcement.message
    }, this.getAuthHeader());
    
    this.announcement.success = true;
    this.announcement.sentCount = response.data.sentCount || 0;
    console.log('Announcement sent successfully to all users');
  } catch (error) {
    console.error('Error sending announcement:', error);
    this.announcement.error = error.response?.data?.message || 'Failed to send announcement. Please try again.';
  } finally {
    this.announcement.sending = false;
  }
},

  openExportModal() {
  this.showExportModal = true;
},

closeExportModal() {
  this.showExportModal = false;
  // Reset export options
  this.exportOptions = {
    stats: true,
    users: false,
    challenges: false,
    format: 'json'
  };
},

exportData() {
  // Prepare the data to export
  const exportData = {};
  
  if (this.exportOptions.stats) {
    exportData.stats = this.stats;
  }
  
  if (this.exportOptions.users) {
    exportData.recentUsers = this.recentUsers;
  }
  
  if (this.exportOptions.challenges) {
    exportData.popularChallenges = this.popularChallenges;
  }
  
  // Create filename with date
  const date = new Date().toISOString().slice(0, 10);
  let filename = `econnect-dashboard-${date}`;
  let data;
  let contentType;
  
  if (this.exportOptions.format === 'json') {
    data = JSON.stringify(exportData, null, 2);
    contentType = 'application/json';
    filename += '.json';
    
    // Create a download link
    this.downloadFile(data, contentType, filename);
  } 
  else if (this.exportOptions.format === 'xlsx') {
    // Create workbook object
    const wb = XLSX.utils.book_new();
    
    // Process stats if included
    if (this.exportOptions.stats) {
      const statsData = [['Metric', 'Value']];
      for (const [key, value] of Object.entries(this.stats)) {
        statsData.push([this.formatKey(key), value]);
      }
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistics');
    }
    
    // Process users if included
    if (this.exportOptions.users && this.recentUsers && this.recentUsers.length > 0) {
      // Create headers excluding avatar
      const userHeaders = Object.keys(this.recentUsers[0])
        .filter(key => key !== 'avatar');
      
      // Create data array with headers
      const usersData = [userHeaders];
      
      // Add user data
      this.recentUsers.forEach(user => {
        const rowData = userHeaders.map(header => {
          let value = user[header];
          if (header === 'created_at') {
            value = new Date(value).toLocaleDateString();
          }
          return value;
        });
        usersData.push(rowData);
      });
      
      const usersSheet = XLSX.utils.aoa_to_sheet(usersData);
      XLSX.utils.book_append_sheet(wb, usersSheet, 'Recent Users');
    }
    
    // Process challenges if included
    if (this.exportOptions.challenges && this.popularChallenges && this.popularChallenges.length > 0) {
      // Get headers
      const challengeHeaders = Object.keys(this.popularChallenges[0]);
      
      // Create data array with headers
      const challengesData = [challengeHeaders];
      
      // Add challenge data
      this.popularChallenges.forEach(challenge => {
        const rowData = challengeHeaders.map(header => challenge[header]);
        challengesData.push(rowData);
      });
      
      const challengesSheet = XLSX.utils.aoa_to_sheet(challengesData);
      XLSX.utils.book_append_sheet(wb, challengesSheet, 'Popular Challenges');
    }
    
    // Convert to array buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Convert to Blob
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Create object URL and download
    const url = URL.createObjectURL(blob);
    filename += '.xlsx';
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  else { // CSV format
    // For CSV, we need to convert the data
    data = this.convertToCSV(exportData);
    contentType = 'text/csv';
    filename += '.csv';
    
    // Create a download link
    this.downloadFile(data, contentType, filename);
  }
  
  // Close the modal
  this.closeExportModal();
  alert('Export completed!');
},

downloadFile(data, contentType, filename) {
  const blob = new Blob([data], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
},

convertToCSV(data) {
  // Helper method to convert data to CSV format
  let csv = '';
  
  // Handle stats
  if (data.stats) {
    csv += 'STATISTICS\n';
    csv += 'Metric,Value\n';
    for (const [key, value] of Object.entries(data.stats)) {
      csv += `${this.formatKey(key)},${value}\n`;
    }
    csv += '\n';
  }
  
  // Handle users
  if (data.recentUsers && data.recentUsers.length > 0) {
    csv += 'RECENT USERS\n';
    // Get headers from first object
    const userHeaders = Object.keys(data.recentUsers[0])
      .filter(key => key !== 'avatar'); // Skip avatar URLs
    csv += userHeaders.join(',') + '\n';
    
    // Add data rows
    data.recentUsers.forEach(user => {
      const row = userHeaders.map(header => {
        let value = user[header];
        if (header === 'created_at') {
          value = new Date(value).toLocaleDateString();
        }
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csv += row.join(',') + '\n';
    });
    csv += '\n';
  }
  
  // Handle challenges
  if (data.popularChallenges && data.popularChallenges.length > 0) {
    csv += 'POPULAR CHALLENGES\n';
    // Get headers from first object
    const challengeHeaders = Object.keys(data.popularChallenges[0]);
    csv += challengeHeaders.join(',') + '\n';
    
    // Add data rows
    data.popularChallenges.forEach(challenge => {
      const row = challengeHeaders.map(header => {
        const value = challenge[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csv += row.join(',') + '\n';
    });
  }
  
  return csv;
},

formatKey(key) {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')  // Insert a space before all caps
    .replace(/^./, str => str.toUpperCase()) // Uppercase the first character
    .trim();
},
  
  openBadgeModal() {
  this.showBadgeModal = true;
},

closeBadgeModal() {
  this.showBadgeModal = false;
  this.badgeForm = {
    name: '',
    icon: '🏆',
    short_description: '',
    description: '',
    requirement: '',
    category: 'milestone',
    rarity: 'easy',
    points: 10
  };
},

async saveBadge() {
  try {
    // Validate form
    if (!this.badgeForm.name || !this.badgeForm.description || !this.badgeForm.requirement) {
      alert('Please fill all required fields');
      return;
    }
    
    // Create the badge
    const response = await axios.post('/api/admin/badges', this.badgeForm, this.getAuthHeader());
    
    // Close modal and show success message
    this.closeBadgeModal();
    alert('Badge created successfully');
    
  } catch (error) {
    console.error('Error creating badge:', error);
    alert(error.response?.data?.message || 'Error creating badge');
  }
},
  openChallengeModal() {
  this.showChallengeModal = true;
},

closeChallengeModal() {
  this.showChallengeModal = false;
  this.challengeForm = {
    title: '',
    description: '',
    category: 'waste',
    difficulty: 'medium',
    points: 10,
    carbon_reduction: 1.0,
    is_active: true,
    stepsText: '',
    benefits: ''
  };
},

async saveChallenge() {
  try {
    // Validate form
    if (!this.challengeForm.title || !this.challengeForm.description) {
      alert('Please fill all required fields');
      return;
    }
    
    // Convert the steps text to an array
    const stepsArray = this.challengeForm.stepsText
      .split('\n')
      .map(step => step.trim())
      .filter(step => step.length > 0);
    
    // Prepare data for API call
    const challengeData = {
      ...this.challengeForm,
      steps: JSON.stringify(stepsArray), // Convert steps to JSON string format
      icon: this.getCategoryIcon(this.challengeForm.category)
    };
    
    // Create the challenge
    const response = await axios.post('/api/admin/challenges', challengeData, this.getAuthHeader());
    
    // Close modal and show success message
    this.closeChallengeModal();
    alert('Challenge created successfully');

    
    
    // Refresh data
    this.fetchDashboardData();
    this.fetchPopularChallenges();
  } catch (error) {
    console.error('Error creating challenge:', error);
    alert(error.response?.data?.message || 'Error creating challenge');
  }
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

 // Add these methods to the methods object in AdminDashboard.vue
  
  closeUserModal() {
      this.showUserModal = false;
      this.userForm = {
        username: '',
        email: '',
        password: '',
        status: 'active',
        role: 'user'
      };
    },

    async saveUser() {
      try {
        // Validate form
        if (!this.userForm.username || !this.userForm.email || !this.userForm.password) {
          alert('Please fill all required fields');
          return;
        }
        
        // Prepare data for the API call
        const userData = {
          username: this.userForm.username,
          email: this.userForm.email,
          password: this.userForm.password,
          status: this.userForm.status,
          role: this.userForm.role
        };
        
        // Create the user
        const response = await axios.post('/api/admin/users', userData, this.getAuthHeader());
        
        // Close the modal and show success message
        this.closeUserModal();
        alert('User created successfully');
        
        // Refresh the recent users list
        this.fetchRecentUsers();
        this.fetchDashboardData();
      } catch (error) {
        console.error('Error creating user:', error);
        alert(error.response?.data?.message || 'Error creating user');
      }
    },

    openAnnouncementModal() {
      this.showAnnouncementModal = true;
    },

    closeAnnouncementModal() {
      this.showAnnouncementModal = false;
      this.resetAnnouncementForm();
    },

    resetAnnouncementForm() {
      this.announcement = {
        title: '',
        message: '',
        success: false,
        sending: false,
        error: null,
        sentCount: 0
      };
    },

    async sendAnnouncement() {
      try {
        this.announcement.sending = true;
        this.announcement.error = null;

        // Simulate API call to send announcement
        const response = await axios.post('/api/admin/notifications/announcement', {
          title: this.announcement.title,
          message: this.announcement.message
        }, this.getAuthHeader());

        this.announcement.success = true;
        this.announcement.sentCount = response.data.sentCount || 0;
      } catch (error) {
        console.error('Error sending announcement:', error);
        this.announcement.error = error.response?.data?.message || 'Error sending announcement';
      } finally {
        this.announcement.sending = false;
      }
    },

    async fetchDashboardData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Call the actual backend API for dashboard stats
        const response = await axios.get('/api/admin/dashboard', this.getAuthHeader());
        
        // Use nullish coalescing for more robust handling of potential null/undefined values
        this.stats = {
          totalUsers: response.data?.totalUsers ?? 0,
          totalChallenges: response.data?.totalChallenges ?? 0,
          completedChallenges: response.data?.completedChallenges ?? 0,
          newUsersThisMonth: response.data?.newUsersThisMonth ?? 0
        };
        
        console.log('Dashboard data loaded:', this.stats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        this.error = 'Failed to load dashboard data. Please try again.';
        
        // Fallback to zeros if error occurs
        this.stats = {
          totalUsers: 0,
          totalChallenges: 0,
          completedChallenges: 0,
          newUsersThisMonth: 0
        };
      } finally {
        this.loading = false;
      }
    },
    async fetchRecentUsers() {
      try {
        // Call the users API endpoint
        const response = await axios.get('/api/admin/users', this.getAuthHeader());
        
        // Sort users by creation date (newest first) and take the first 5
        const sortedUsers = response.data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        
        // Map to the format expected by our component
        this.recentUsers = sortedUsers.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
          avatar: user.avatar
        }));
        
        console.log('Recent users loaded:', this.recentUsers);
      } catch (error) {
        console.error('Error fetching recent users:', error);
        // Keep an empty array if error occurs
        this.recentUsers = [];
      }
    },
    async fetchUserGrowthData() {
  this.loadingChart = true;
  try {
    // Get auth header for API request
    const authHeader = this.getAuthHeader();
    
    // Make API request to backend
    const response = await axios.get(`/api/admin/user-growth?range=${this.userTimeRange}`, authHeader);
    
    this.userGrowthData = response.data;
    
    // Add a small delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.$nextTick(() => {
        this.renderUserGrowthChart();
      });
    }, 100);
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    this.userGrowthData = [];
  } finally {
    this.loadingChart = false;
  }
},
renderUserGrowthChart() {
  // Wait until chart container is available in the DOM
  const chartContainer = this.$refs.userChartContainer;
  if (!chartContainer) {
    console.warn('Chart container not found in DOM');
    return;
  }
  
  // Destroy existing chart if it exists to prevent duplicates
  if (this.userChart) {
    this.userChart.destroy();
  }
  
  // Create canvas element for chart
  const canvas = document.createElement('canvas');
  canvas.id = 'userGrowthChart';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  
  // Clear container and add the new canvas
  chartContainer.innerHTML = '';
  chartContainer.appendChild(canvas);
  
  // Format data for Chart.js
  const labels = this.userGrowthData.map(item => item.date);
  const newUsers = this.userGrowthData.map(item => item.new_users);
  const totalUsers = this.userGrowthData.map(item => item.total_users);
  
  // Create the chart with improved styling
  this.userChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'New Users',
          data: newUsers,
          backgroundColor: 'rgba(67, 160, 71, 0.15)',
          borderColor: '#43A047',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Total Users',
          data: totalUsers,
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderColor: '#2196F3',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      font: {
        family: 'Poppins, sans-serif'
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            boxWidth: 10,
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              family: 'Poppins, sans-serif',
              size: 11
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          titleFont: {
            family: 'Poppins, sans-serif',
            size: 12
          },
          bodyFont: {
            family: 'Poppins, sans-serif',
            size: 11
          },
          padding: 10,
          cornerRadius: 8,
          caretSize: 6
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              family: 'Poppins, sans-serif',
              size: 10
            },
            maxRotation: 45,
            minRotation: 45,
            color: '#666'
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.03)',
            drawBorder: false
          },
          ticks: {
            font: {
              family: 'Poppins, sans-serif',
              size: 10
            },
            color: '#666',
            padding: 8
          },
          title: {
            display: false
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              family: 'Poppins, sans-serif',
              size: 10
            },
            color: '#666',
            padding: 8
          },
          title: {
            display: false
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: false
      },
      elements: {
        line: {
          tension: 0.4
        }
      }
    }
  });
},
    async fetchPopularChallenges() {
      try {
        // Call the API to get popular challenges
        const response = await axios.get('/api/admin/challenges/popular', this.getAuthHeader());
        
        // Transform response data for the table
        this.popularChallenges = response.data.map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          category: challenge.category,
          completions: challenge.completion_count || 0,
          completionRate: Math.round((challenge.completion_count / (challenge.total_attempts || 1)) * 100) || 0
        }));
        
        console.log('Popular challenges loaded:', this.popularChallenges);
      } catch (error) {
        console.error('Error fetching popular challenges:', error);
        // Use empty array if there's an error
        this.popularChallenges = [];
      }
    },
    async fetchAdClicks() {
      this.loadingAdClicks = true;
      try {
        const authHeader = this.getAuthHeader();
        const response = await axios.get('/api/admin/ad-clicks', authHeader);
        this.adClicks = response.data || [];
      } catch (error) {
        this.adClicks = [];
      } finally {
        this.loadingAdClicks = false;
      }
    },
    navigateToChallenges() {
      this.$router.push('/admin/challenges');
    },
    navigateToUsers() {
      this.$router.push('/admin/users');
    },
    navigateToAddUser() {
  this.showUserModal = true;
},
    navigateToAddChallenge() {
      this.$router.push('/admin/challenges?action=add-challenge');
    },
    navigateToSettings() {
      this.$router.push('/admin/settings');
    }
  }
};
</script>

<style scoped>
.admin-layout {
    display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  font-family:"Poppins"
}

.admin-content {
  flex: 1;
  transition: margin-left 0.3s ease;
}

.admin-content.sidebar-collapsed {
  margin-left: 70px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 2rem;
  background-color: white;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.03);
}

.admin-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2E7D32;
  margin: 0;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
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

.search-box input:focus {
  width: 260px;
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.notifications {
  position: relative;
  cursor: pointer;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.notifications:hover {
  background-color: #f0f0f0;
}

.notifications i {
  font-size: 1.2rem;
  color: #666;
}

.badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  border: 2px solid white;
}

.admin-dashboard {
  padding: 2rem;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
  border-color: rgba(76, 175, 80, 0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
}

.stat-icon i {
  font-size: 1.5rem;
  color: white;
}

.stat-icon.users {
  background: linear-gradient(135deg, #43A047, #66BB6A);
}

.stat-icon.challenges {
  background: linear-gradient(135deg, #4CAF50, #81C784);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #388E3C, #66BB6A);
}

.stat-icon.new-users {
  background: linear-gradient(135deg, #2E7D32, #43A047);
}

.stat-details {
  flex: 1;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-change {
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-change.positive {
  color: #2ecc71;
  background-color: rgba(46, 204, 113, 0.1);
}

.stat-change.negative {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.dashboard-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
}

.dashboard-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.07);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-actions button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.card-actions button:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
}

.card-actions select {
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.85rem;
  appearance: none;
  background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
  background-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-actions select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.chart-container {
  padding: 1.5rem;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fcfcfc;
}

.chart-placeholder {
  text-align: center;
  color: #95a5a6;
}

.chart-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #e0e0e0;
}

.chart-placeholder p {
  font-size: 1rem;
}

.recent-users-list, .challenges-container {
  flex: 1;
  padding: 1rem 1.5rem;
  overflow-y: auto;
  max-height: 350px;
}

.loading-placeholder, .empty-state {
  text-align: center;
  padding: 3rem 0;
  color: #95a5a6;
}

.loading-placeholder i, .empty-state i {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #e0e0e0;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.user-item:hover {
  background-color: #f8f9fa;
  border-color: #e8f5e9;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  border: 2px solid #e8f5e9;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.8rem;
  color: #7f8c8d;
}

.user-joined {
  font-size: 0.8rem;
  color: #95a5a6;
  background: #f8f8f8;
  padding: 0.35rem 0.7rem;
  border-radius: 12px;
}

.challenges-table {
  width: 100%;
  border-collapse: collapse;
}

.challenges-table th, .challenges-table td {
  padding: 0.85rem 1rem;
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

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #43A047, #66BB6A);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-bar span {
  margin-left: 10px;
  font-size: 0.85rem;
  color: #2c3e50;
  font-weight: 600;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 1.5rem;
}

.quick-action {
  background-color: #fafafa;
  border-radius: 12px;
  padding: 1.25rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.quick-action:hover {
  background-color: #e8f5e9;
  border-color: rgba(76, 175, 80, 0.3);
  transform: translateY(-5px);
}

.quick-action i {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
  color: #4CAF50;
  transition: transform 0.3s ease;
}

.quick-action:hover i {
  transform: scale(1.2);
}

.quick-action span {
  font-size: 0.9rem;
  font-weight: 500;
  color: #2c3e50;
}

.challenge-modal {
  width: 700px;
  max-width: 90%;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

/* Responsive adjustment for form row */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-hint {
  font-size: 0.8rem;
  color: #95a5a6;
  margin-top: 0.25rem;
}

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

.badge-icon-preview.easy {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  box-shadow: 0 5px 15px rgba(46, 204, 113, 0.2);
}

.badge-icon-preview.medium {
  background: linear-gradient(135deg, #e3f2fd, #bbdefb);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.2);
}

.badge-icon-preview.hard {
  background: linear-gradient(135deg, #ede7f6, #d1c4e9);
  box-shadow: 0 5px 15px rgba(155, 89, 182, 0.2);
}

.badge-icon-preview.ultra-hard {
  background: linear-gradient(135deg, #fff8e1, #ffecb3);
  box-shadow: 0 5px 15px rgba(241, 196, 15, 0.2);
}

/* Export Modal Styles */
.export-description {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.export-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.export-option:hover {
  background-color: #f8f9fa;
  border-color: #4CAF50;
}

.export-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4CAF50;
}

.export-option label {
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
}

.export-hint {
  margin-left: auto;
  font-size: 0.85rem;
  color: #95a5a6;
}

.export-format {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #e0e0e0;
}

.export-format p {
  margin-bottom: 0.75rem;
  color: #2c3e50;
}

.format-options {
  display: flex;
  gap: 1.5rem;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.format-option input[type="radio"] {
  cursor: pointer;
  accent-color: #4CAF50;
}

/* Responsive adjustment for form row */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

/* Animation for loading spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

/* Helper classes */
.text-center {
  text-align: center;
}

.mr-2 {
  margin-right: 0.5rem;
}

.announcement-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.announcement-success {
  text-align: center;
  padding: 1rem;
  color: #2E7D32;
}

.announcement-success i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.announcement-stats {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.5rem;
}

.announcement-error {
  padding: 0.75rem;
  border-radius: 4px;
  background-color: #fdeaea;
  color: #d32f2f;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.announcement-error i {
  font-size: 1.2rem;
}

.mr-1 {
  margin-right: 0.25rem;
}

/* Responsive adjustments */
@media (max-width: 1200px) {
  .dashboard-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 868px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr) !important; /* Force 2 columns */
    gap: 0.75rem;
    padding: 0 0.5rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .stat-label {
    font-size: 0.8rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    min-width: 40px; /* Ensure icon doesn't shrink */
    margin-right: 0.75rem;
  }
  
  .stat-icon i {
    font-size: 1.2rem;
  }
  
  .admin-content {
    margin-left: 0;
  }
  
  .admin-content.sidebar-collapsed {
    margin-left: 0;
  }
  
  .admin-header,
  .admin-dashboard {
    padding: 1rem;
  }
  
  .search-box input {
    width: 180px;
  }
  
  .search-box input:focus {
    width: 220px;
  }
  
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-cards {
    gap: 0.5rem;
  }
  
  .stat-card {
    padding: 0.75rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    margin-right: 0.5rem;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .card-actions {
    width: 100%;
  }
  
  .card-actions button, 
  .card-actions select {
    width: 100%;
  }
}

@media (max-width: 359px) {
  .admin-dashboard {
    padding: 0.15rem !important;
  }
  .stats-cards {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.15rem !important;
    padding: 0 !important;
  }
  .stat-card {
    padding: 0.3rem !important;
    flex-direction: row;
    align-items: center;
    min-width: 0;
  }
  .stat-value {
    font-size: 0.85rem !important;
  }
  .stat-label {
    font-size: 0.6rem !important;
  }
  .stat-icon {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    margin-right: 0.3rem !important;
  }
  .stat-icon i {
    font-size: 0.85rem !important;
  }
  .dashboard-row {
    grid-template-columns: 1fr !important;
    gap: 0.3rem !important;
    margin-bottom: 0.5rem !important;
  }
  .dashboard-card {
    padding: 0.15rem !important;
    border-radius: 5px !important;
  }
  .card-header {
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
    padding: 0.5rem 0.2rem !important;
  }
  .card-header h3 {
    font-size: 0.8rem !important;
  }
  .card-actions button, 
  .card-actions select {
    width: 100% !important;
    font-size: 0.7rem !important;
    padding: 0.25rem 0.3rem !important;
  }
  .recent-users-list, .challenges-container {
    padding: 0.2rem !important;
    max-height: 120px !important;
  }
  .user-item {
    padding: 0.3rem !important;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
  }
  .user-avatar {
    width: 18px !important;
    height: 18px !important;
    margin-right: 0.3rem !important;
  }
  .user-name, .user-email, .user-joined {
    font-size: 0.6rem !important;
  }
  .challenges-table th, .challenges-table td {
    padding: 0.3rem 0.1rem !important;
    font-size: 0.6rem !important;
  }
  .progress-bar span {
    font-size: 0.6rem !important;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 0.15rem !important;
    padding: 0.2rem !important;
  }
  .quick-action {
    padding: 0.3rem 0.1rem !important;
    border-radius: 5px !important;
  }
  .quick-action i {
    font-size: 0.8rem !important;
    margin-bottom: 0.1rem !important;
  }
  .quick-action span {
    font-size: 0.6rem !important;
  }
  .modal-container {
    width: 99vw !important;
    max-width: 99vw !important;
    padding: 0 !important;
  }
  .modal-header, .modal-footer {
    padding: 0.3rem !important;
  }
  .modal-body {
    padding: 0.3rem !important;
  }
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.3rem !important;
    font-size: 0.7rem !important;
  }
  .form-group label {
    font-size: 0.7rem !important;
  }
  .form-hint {
    font-size: 0.6rem !important;
  }
  .badge-icon-preview {
    width: 28px !important;
    height: 28px !important;
    font-size: 0.8rem !important;
  }
  .user-growth-chart,
  .user-chart,
  .chart-container {
    height: 100px !important;
    min-height: 60px !important;
    padding: 0.1rem !important;
  }
  .announcement-success i {
    font-size: 1rem !important;
  }
  .announcement-success,
  .announcement-stats,
  .announcement-error {
    font-size: 0.6rem !important;
    padding: 0.3rem !important;
  }
}

@media (max-width: 359px) {
  .admin-dashboard {
    padding: 0.25rem !important;
  }
  .stats-cards {
    grid-template-columns: 1fr !important;
    gap: 0.25rem !important;
    padding: 0 !important;
    justify-items: anchor-center;
  }
  .stat-card {
    padding: 0.5rem !important;
    flex-direction: column;
    align-items: flex-start;
  }
  .stat-value {
    font-size: 1rem !important;
  }
  .stat-label {
    font-size: 0.7rem !important;
  }
  .stat-icon {
    width: 28px !important;
    height: 28px !important;
    min-width: 28px !important;
    align-self: center;
  }
  .stat-icon i {
    font-size: 1rem !important;
  }
  .dashboard-row {
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
    margin-bottom: 1rem !important;
  }
  .dashboard-card {
    padding: 0.25rem !important;
    border-radius: 6px !important;
  }
  .card-header {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem !important;
  }
  .card-header h3 {
    font-size: 0.95rem !important;
  }
  .card-actions button, 
  .card-actions select {
    width: 100% !important;
    font-size: 0.8rem !important;
    padding: 0.4rem 0.5rem !important;
  }
  .recent-users-list, .challenges-container {
    padding: 0.5rem !important;
    max-height: 180px !important;
  }
  .user-item {
    padding: 0.5rem !important;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  .user-avatar {
    width: 28px !important;
    height: 28px !important;
    margin-right: 0.5rem !important;
  }
  .user-name, .user-email, .user-joined {
    font-size: 0.7rem !important;
  }
  .challenges-table th, .challenges-table td {
    padding: 0.5rem 0.25rem !important;
    font-size: 0.7rem !important;
  }
  .progress-bar span {
    font-size: 0.7rem !important;
  }
  .quick-actions-grid {
    grid-template-columns: 1fr !important;
    gap: 0.5rem !important;
    padding: 0.5rem !important;
  }
  .quick-action {
    padding: 0.5rem 0.25rem !important;
    border-radius: 6px !important;
  }
  .quick-action i {
    font-size: 1.1rem !important;
    margin-bottom: 0.25rem !important;
  }
  .quick-action span {
    font-size: 0.75rem !important;
  }
  .modal-container {
    width: 98vw !important;
    max-width: 98vw !important;
    padding: 0 !important;
  }
  .modal-header, .modal-footer {
    padding: 0.5rem !important;
  }
  .modal-body {
    padding: 0.5rem !important;
  }
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.5rem !important;
    font-size: 0.8rem !important;
  }
  .form-group label {
    font-size: 0.8rem !important;
  }
  .form-hint {
    font-size: 0.7rem !important;
  }
  .badge-icon-preview {
    width: 48px !important;
    height: 48px !important;
    font-size: 1.3rem !important;
  }
  .user-growth-chart,
  .user-chart,
  .chart-container {
    height: 180px !important;
    min-height: 120px !important;
    padding: 0.25rem !important;
  }
  .announcement-success i {
    font-size: 1.5rem !important;
  }
  .announcement-success,
  .announcement-stats,
  .announcement-error {
    font-size: 0.75rem !important;
    padding: 0.5rem !important;
  }
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.user-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input, .form-group select {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-group input:focus, .form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  border-top: 1px solid #f0f0f0;
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

.save-btn {
  padding: 0.6rem 1.25rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background-color: #388E3C;
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

.password-input-container input {
  width: 100%;
  padding-right: 40px; /* Make room for the eye icon */
}
.user-growth-chart {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
  height: 450px;
}

.user-chart {
  height: 100%;
  width: 100%;
  padding: 0.5rem;
}

.chart-container {
  flex-grow: 1;
  padding: 1rem;
  height: calc(100% - 70px); /* Account for header height */
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.user-growth-chart {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  font-family: 'Poppins', sans-serif;
  height: 400px;
}

.user-growth-chart:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.user-chart {
  height: 100%;
  width: 100%;
  padding: 0.75rem;
  font-family: 'Poppins', sans-serif;
}

.chart-container {
  flex-grow: 1;
  padding: 0.75rem;
  height: calc(100% - 60px);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: white;
}
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

.ad-clicks-card {
  min-width: 300px;
  margin-top: 1.5rem;
}

.ad-clicks-container {
  padding: 1rem 1.5rem;
  overflow-x: auto;
}

.ad-clicks-table {
  width: 100%;
  border-collapse: collapse;
}

.ad-clicks-table th, .ad-clicks-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.ad-clicks-table th {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ad-clicks-table tr:last-child td {
  border-bottom: none;
}

.ad-clicks-table tr:hover td {
  background-color: #f8f9fa;
}

@media (max-width: 868px) {
  .ad-clicks-container {
    padding: 0.5rem;
  }
  .ad-clicks-table th, .ad-clicks-table td {
    padding: 0.5rem 0.5rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .ad-clicks-container {
    padding: 0.2rem;
  }
  .ad-clicks-table th, .ad-clicks-table td {
    padding: 0.3rem 0.2rem;
    font-size: 0.7rem;
  }
}
</style>

