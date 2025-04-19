<template>
    <div class="admin-layout">
      <AdminLayout pageTitle="Users">
          <div class="user-actions">
          
          </div>
  
        <div class="users-container">
          <!-- Action bar -->
           
          <div class="action-bar">
            
            <div class="filter-group">
              <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search users..." 
                v-model="searchQuery"
                @input="handleSearch" 
              />
            </div>
              <select v-model="statusFilter" @change="applyFilters">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
  
            <button class="add-user-btn" @click="openAddUserModal">
              <i class="fas fa-plus"></i> Add New User
            </button>
          </div>
  
          <!-- Users table -->
          <div class="users-table-wrapper">
            <table class="users-table">
              <thead>
                <tr>
                  <th class="checkbox-col">
                    <input type="checkbox" v-model="selectAll" @change="toggleSelectAll">
                  </th>
                  <th class="avatar-col">Avatar</th>
                  <th class="username-col">
                    <div class="sort-header" @click="sortBy('username')">
                      Username
                      <i class="fas fa-sort" :class="getSortIconClass('username')"></i>
                    </div>
                  </th>
                  <th class="email-col">
                    <div class="sort-header" @click="sortBy('email')">
                      Email
                      <i class="fas fa-sort" :class="getSortIconClass('email')"></i>
                    </div>
                  </th>
                  <th class="status-col">
                    <div class="sort-header" @click="sortBy('status')">
                      Status
                      <i class="fas fa-sort" :class="getSortIconClass('status')"></i>
                    </div>
                  </th>
                  <th class="date-col">
                    <div class="sort-header" @click="sortBy('created_at')">
                      Joined
                      <i class="fas fa-sort" :class="getSortIconClass('created_at')"></i>
                    </div>
                  </th>
                  <th class="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="8" class="loading-row">
                    <div class="loading-spinner"></div>
                    <p>Loading users...</p>
                  </td>
                </tr>
                <tr v-else-if="displayedUsers.length === 0">
                  <td colspan="8" class="empty-row">
                    <i class="fas fa-users"></i>
                    <p>No users found</p>
                  </td>
                </tr>
                <tr 
                  v-for="user in displayedUsers" 
                  :key="user.id"
                  :id="`user-row-${user.id}`"
                  :class="{ 'highlighted-row': user.id === highlightedUserId }"
                >
                  <td>
                    <input type="checkbox" v-model="selectedUsers" :value="user.id">
                  </td>
                  <td>
                    <div class="user-avatar">
                      <img :src="user.avatar || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'" :alt="user.username">
                    </div>
                  </td>
                  <td>{{ user.username }}</td>
                  <td class="email-cell">{{ user.email }}</td>
                  <td>
                    <span class="status-indicator" :class="'status-' + user.status">
                      {{ user.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="edit-btn" @click="openEditUserModal(user)">
                        <i class="fas fa-edit"></i>
                      </button>
                      <button class="status-toggle-btn" @click="toggleUserStatus(user)" :title="user.status === 'active' ? 'Deactivate User' : 'Activate User'">
                        <i class="fas" :class="user.status === 'active' ? 'fa-toggle-on' : 'fa-toggle-off'"></i>
                      </button>
                      <button class="delete-btn" @click="confirmDelete(user)">
                        <i class="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <!-- Bulk actions and pagination -->
          <div class="table-footer">
            <div class="bulk-actions" v-if="selectedUsers.length > 0">
              <select v-model="bulkAction">
                <option value="">Bulk Actions</option>
                <option value="activate">Activate Selected</option>
                <option value="deactivate">Deactivate Selected</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button @click="applyBulkAction" :disabled="!bulkAction">Apply</button>
              <div class="selected-count">{{ selectedUsers.length }} users selected</div>
            </div>
            
            <div class="pagination">
              <button 
                @click="currentPage = Math.max(1, currentPage - 1)" 
                :disabled="currentPage === 1"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <div class="page-info">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
              
              <button 
                @click="currentPage = Math.min(totalPages, currentPage + 1)" 
                :disabled="currentPage === totalPages"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
              
              <select v-model="pageSize" @change="handlePageSizeChange">
                <option :value="10">10 per page</option>
                <option :value="25">25 per page</option>
                <option :value="50">50 per page</option>
                <option :value="100">100 per page</option>
              </select>
            </div>
          </div>
  
          <!-- Add/Edit User Modal -->
          <transition name="modal-fade">
          <div class="modal-overlay" v-if="showUserModal" @click="closeUserModal">
            <div class="modal-container" @click.stop>
              <div class="modal-header">
                <h2>{{ editingUser ? 'Edit User' : 'Add New User' }}</h2>
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
                  
                  <div class="form-group" v-if="!editingUser">
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
                  <div class="form-group" v-if="editingUser">
  <label for="edit-password">Password <span class="optional-text">(leave empty to keep current)</span></label>
  <div class="password-input-container">
    <input 
      :type="showPassword ? 'text' : 'password'" 
      id="edit-password" 
      v-model="userForm.password" 
      placeholder="Enter new password"
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
                  
                  <div class="form-group avatar-upload">
                    <label>Avatar</label>
                    <div class="avatar-preview">
                      <img :src="userForm.avatar || 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png'" alt="Avatar Preview">
                    </div>
                    <label for="avatar-upload" class="avatar-upload-btn">
                      <i class="fas fa-upload"></i> Upload Avatar
                    </label>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      accept="image/*"
                      @change="handleAvatarUpload"
                      style="display: none;"
                    >
                  </div>
                </form>
              </div>
              
              <div class="modal-footer">
                <button class="cancel-btn" @click="closeUserModal">Cancel</button>
                <button class="save-btn" @click="saveUser">
                  {{ editingUser ? 'Update User' : 'Add User' }}
                </button>
              </div>
            </div>
          </div>
        </transition>

        <transition name="modal-fade">
          <!-- Delete Confirmation Modal -->
          <div class="modal-overlay" v-if="showDeleteModal" @click="cancelDelete">
            <div class="modal-container delete-modal" @click.stop>
              <div class="modal-header">
                <h2>Confirm Deletion</h2>
                <button class="close-btn" @click="cancelDelete">
                  <i class="fas fa-times"></i>
                </button>
              </div>
              
              <div class="modal-body">
                <div class="delete-icon">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
                <p>Are you sure you want to delete the user <strong>{{ userToDelete?.username }}</strong>?</p>
                <p class="warning-text">This action cannot be undone.</p>
              </div>
              
              <div class="modal-footer">
                <button class="cancel-btn" @click="cancelDelete">Cancel</button>
                <button class="delete-confirm-btn" @click="deleteUser">Delete User</button>
              </div>
            </div>
          </div>
        </transition>
          </div>
      </AdminLayout>
    </div>
  
  </template>
  <script>
  import AdminSidebar from './AdminSidebar.vue';
  import axios from 'axios';
  import { useAuthStore } from '../../stores/auth';
  import AdminLayout from './AdminLayout.vue';
  
  export default {
    components: {
      AdminLayout
    },
    data() {
      return {
        sidebarCollapsed: false,
        loading: false,
        users: [],
        searchQuery: '',
        statusFilter: 'all',
        currentPage: 1,
        pageSize: 10,
        selectedUsers: [],
        selectAll: false,
        showUserModal: false,
        showPassword: false,
        editingUser: null,
        userForm: {
          username: '',
          email: '',
          password: '',
          role: 'user',
          status: 'active',
          avatar: null
        },
        avatarFile: null, // New property to store the file object
        showDeleteModal: false,
        userToDelete: null,
        sortColumn: 'username',
        sortDirection: 'asc',
        bulkAction: '',
        errorMessage: null,
        successMessage: null,
        highlightedUserId: null
      };
    },
    computed: {
      filteredUsers() {
        let result = [...this.users];
        
        // Apply search
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase();
          result = result.filter(user => 
            user.username.toLowerCase().includes(query) || 
            user.email.toLowerCase().includes(query)
          );
        }
        
        // Apply status filter
        if (this.statusFilter !== 'all') {
          result = result.filter(user => user.status === this.statusFilter);
        }
        

        
        // Apply sorting
        result.sort((a, b) => {
          let comparison = 0;
          if (a[this.sortColumn] > b[this.sortColumn]) {
            comparison = 1;
          } else if (a[this.sortColumn] < b[this.sortColumn]) {
            comparison = -1;
          }
          return this.sortDirection === 'desc' ? comparison * -1 : comparison;
        });
        
        return result;
      },
      displayedUsers() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredUsers.slice(start, end);
      },
      totalPages() {
        return Math.ceil(this.filteredUsers.length / this.pageSize) || 1;
      }
    },
    methods: {
      updateSidebarState(isCollapsed) {
        this.sidebarCollapsed = isCollapsed;
      },
      formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      },
      
      handleSearch() {
        this.currentPage = 1;
      },
      applyFilters() {
        this.currentPage = 1;
      },
      sortBy(column) {
        if (this.sortColumn === column) {
          this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortColumn = column;
          this.sortDirection = 'asc';
        }
      },
      getSortIconClass(column) {
        if (this.sortColumn !== column) return '';
        return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
      },
      toggleSelectAll() {
        if (this.selectAll) {
          this.selectedUsers = this.displayedUsers.map(user => user.id);
        } else {
          this.selectedUsers = [];
        }
      },
      handlePageSizeChange() {
        // Reset to first page when changing page size
        this.currentPage = 1;
      },
      async applyBulkAction() {
        if (!this.bulkAction || this.selectedUsers.length === 0) return;
      
        try {
          await axios.post(
            '/api/admin/users/bulk', 
            {
              action: this.bulkAction,
              userIds: this.selectedUsers
            }, 
            this.getAuthHeader()
          );
          
          // Update local state based on action
          switch (this.bulkAction) {
            case 'activate':
              this.users = this.users.map(user => {
                if (this.selectedUsers.includes(user.id)) {
                  return { ...user, status: 'active' };
                }
                return user;
              });
              break;
            case 'deactivate':
              this.users = this.users.map(user => {
                if (this.selectedUsers.includes(user.id)) {
                  return { ...user, status: 'inactive' };
                }
                return user;
              });
              break;
            case 'delete':
              this.users = this.users.filter(user => !this.selectedUsers.includes(user.id));
              break;
          }
          
          this.selectedUsers = [];
          this.selectAll = false;
          this.bulkAction = '';
          
          alert('Bulk action completed successfully');
        } catch (error) {
          console.error('Error applying bulk action:', error);
          alert(error.response?.data?.message || 'Error applying bulk action');
        }
      },
      getAuthHeader() {
        const authStore = useAuthStore();
        return {
          headers: {
            Authorization: `Bearer ${authStore.token}`
          }
        };
      },
      async fetchUsers() {
        this.loading = true;
        
        try {
          const response = await axios.get('/api/admin/users', this.getAuthHeader());
          
          // Transform API response to match our user object structure
          this.users = response.data.map(user => ({
  id: user.id,
  username: user.username,
  email: user.email,
  status: user.is_verified ? (user.is_active ? 'active' : 'inactive') : 'pending',
  created_at: user.created_at,
  avatar: user.avatar || null,
  role: 'user' // Since we don't have is_admin column, set a default role
}));
        } catch (error) {
          console.error('Error fetching users:', error);
          this.errorMessage = 'Failed to load users. Please try again.';
        } finally {
          this.loading = false;
        }
      },
      async uploadAvatar() {
        if (!this.avatarFile) return null;
        
        const formData = new FormData();
        formData.append('avatar', this.avatarFile);
        
        // Add the user ID to the form data if we're editing a user
        const userId = this.editingUser ? this.editingUser.id : 'new';
        
        try {
          console.log('Uploading avatar file for userId:', userId);
          
          // Send the userId as a query parameter
          const response = await axios.post(
            `/api/admin/user-avatar-upload?userId=${userId}`,
            formData,
            {
              headers: {
                ...this.getAuthHeader().headers,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          
          console.log('Avatar upload response:', response.data);
          return response.data.avatarUrl;
        } catch (error) {
          console.error('Error uploading avatar:', error);
          console.error('Error details:', error.response?.data || 'No response data');
          alert('Failed to upload avatar: ' + (error.response?.data?.message || error.message));
          return null;
        }
      },
      async saveUser() {
        try {
          // First, check if we need to upload an avatar
          let avatarUrl = null;
          if (this.avatarFile) {
            avatarUrl = await this.uploadAvatar();
          }
          
          const userData = {
            username: this.userForm.username,
            email: this.userForm.email,
            status: this.userForm.status,
            role: this.userForm.role
          };
          
          // Add password if provided
          if (!this.editingUser) {
            if (!this.userForm.password) {
              alert('Password is required for new users');
              return;
            }
            userData.password = this.userForm.password;
          } else if (this.userForm.password) {
            userData.password = this.userForm.password;
          }
          
          // Add avatar URL if we have one
          if (avatarUrl) {
            userData.avatar = avatarUrl;
          }
          
          let response;
          
          if (this.editingUser) {
            // Update existing user
            response = await axios.put(
              `/api/admin/users/${this.editingUser.id}`, 
              userData, 
              this.getAuthHeader()
            );
            
            // Update the local array
            this.users = this.users.map(user => {
              if (user.id === this.editingUser.id) {
                return { 
                  ...user, 
                  ...this.userForm,
                  avatar: avatarUrl || user.avatar // Use new avatar or keep existing
                };
              }
              return user;
            });
            
            alert('User updated successfully');
          } else {
            // Create new user
            response = await axios.post(
              '/api/admin/users', 
              userData, 
              this.getAuthHeader()
            );
            
            // Add to local array
            const newUser = {
              ...response.data.user,
              id: response.data.user.id,
              status: this.userForm.status,
              role: this.userForm.role,
              created_at: new Date().toISOString()
            };
            
            this.users.unshift(newUser);
            alert('User created successfully');
          }
          
          // Reset the avatar file
          this.avatarFile = null;
          this.closeUserModal();
        } catch (error) {
          console.error('Error saving user:', error);
          alert(error.response?.data?.message || 'Error saving user');
        }
      },
      async deleteUser() {
        if (!this.userToDelete) return;
        
        try {
          await axios.delete(
            `/api/admin/users/${this.userToDelete.id}`, 
            this.getAuthHeader()
          );
          
          // Remove from local array
          this.users = this.users.filter(user => user.id !== this.userToDelete.id);
          alert('User deleted successfully');
          
          this.showDeleteModal = false;
          this.userToDelete = null;
        } catch (error) {
          console.error('Error deleting user:', error);
          alert(error.response?.data?.message || 'Error deleting user');
          this.showDeleteModal = false;
        }
      },
      async toggleUserStatus(user) {
        try {
          const newStatus = user.status === 'active' ? 'inactive' : 'active';
          
          await axios.put(
            `/api/admin/users/${user.id}/status`, 
            { status: newStatus }, 
            this.getAuthHeader()
          );
          
          // Update local state
          this.users = this.users.map(u => {
            if (u.id === user.id) {
              return { ...u, status: newStatus };
            }
            return u;
          });
        } catch (error) {
          console.error('Error toggling user status:', error);
          alert(error.response?.data?.message || 'Error updating user status');
        }
      },
      openAddUserModal() {
        this.editingUser = null;
        this.userForm = {
          username: '',
          email: '',
          password: '',
          role: 'user',
          status: 'active',
          avatar: null
        };
        this.showUserModal = true;
      },
      openEditUserModal(user) {
        this.editingUser = user;
        this.userForm = {
          id: user.id,
          username: user.username,
          email: user.email,
          password: '',
          role: user.role,
          status: user.status,
          avatar: user.avatar
        };
        this.showUserModal = true;
      },
      closeUserModal() {
        this.showUserModal = false;
        this.editingUser = null;
        this.avatarFile = null; // Reset the avatar file when closing modal
      },
      handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        this.avatarFile = file; // Store the file for later upload
        
        // Create preview as before
        const reader = new FileReader();
        reader.onload = e => {
          this.userForm.avatar = e.target.result;
        };
        reader.readAsDataURL(file);
      },
      confirmDelete(user) {
        this.userToDelete = user;
        this.showDeleteModal = true;
      },
      cancelDelete() {
        this.showDeleteModal = false;
        this.userToDelete = null;
      },
      scrollToUser(userId) {
        const userRow = document.getElementById(`user-row-${userId}`);
        if (userRow) {
          userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight the row
          userRow.classList.add('highlighted-user');
          // Remove highlight after a few seconds
          setTimeout(() => {
            userRow.classList.remove('highlighted-user');
          }, 3000);
        }
      },
      checkRouteForUserId() {
        if (this.$route.params.id) {
          this.highlightedUserId = parseInt(this.$route.params.id);
        }
      }
    },
    watch: {
      displayedUsers() {
        // Update selectAll checkbox state
        this.selectAll = this.displayedUsers.length > 0 && 
          this.selectedUsers.length === this.displayedUsers.length;
      },
      users: {
        handler() {
          if (this.highlightedUserId) {
            this.$nextTick(() => {
              this.scrollToUser(this.highlightedUserId);
            });
          }
        },
        deep: true
      },
      '$route.params.id': {
        handler() {
          this.checkRouteForUserId();
        },
        immediate: true
      }
    },
    mounted() {
      // Get sidebar collapse state
      const storedState = localStorage.getItem('adminSidebarCollapsed');
      if (storedState !== null) {
        this.sidebarCollapsed = storedState === 'true';
      }
      
      // Fetch users
      this.fetchUsers();
      
      // Check if we should open the Add User modal from query params
      if (this.$route.query.action === 'add-user') {
        this.openAddUserModal();
        
        // Remove the query parameter from the URL without reloading the page
        const { query } = this.$route;
        const newQuery = { ...query };
        delete newQuery.action;
        this.$router.replace({ query: newQuery });
      }

      // Check if there's a user ID in the route
      this.checkRouteForUserId();
    }
  };
  </script>
  
  <style scoped>
  .admin-layout {
    display: flex;
    min-height: 100vh;
    background-color: #f8f9fa;
    font-family: 'Poppins', 'Segoe UI', Roboto, Arial, sans-serif;
  }
  
  .admin-content {
    flex: 1;
    margin-left: 250px;
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
  
  .users-container {
    padding: 2rem;
  }
  
  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  .filter-group {
    display: flex;
    gap: 1rem;
  }
  
  .filter-group select {
    border-radius: 50px;
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 1px solid #e0e0e0;
    font-size: 0.9rem;
    background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
    background-size: 16px;
    cursor: pointer;
    appearance: none;
  }
  
  .filter-group select:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
  }
  
  .add-user-btn {
    background: linear-gradient(90deg, #43A047, #66BB6A);
    color: white;
    border: none;
    border-radius: 41px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .add-user-btn:hover {
    background: linear-gradient(90deg, #388E3C, #43A047);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .users-table-wrapper {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
    margin-bottom: 1.5rem;
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .users-table th, .users-table td {
    padding: 1rem;
    text-align: left;
  }
  
  .users-table th {
    background-color: #f5f7fa;
    font-weight: 600;
    color: #7f8c8d;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #eaeaea;
  }
  
  .users-table tr {
    border-bottom: 1px solid #eaeaea;
    transition: background-color 0.2s ease;
  }
  
  .users-table tr:last-child {
    border-bottom: none;
  }
  
  .users-table tr:hover {
    background-color: #f8f9fa;
  }
  
  .checkbox-col {
    width: 50px;
  }
  
  .avatar-col {
    width: 70px;
  }
  .user-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  border: 2px solid #e8f5e9;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.85rem;
  color: #7f8c8d;
}
  
  .username-col {
    width: 140px;
  }
  
  .email-col {
    min-width: 200px;
  }
  
  .role-col, .status-col {
    width: 120px;
  }
  
  .date-col {
    width: 120px;
  }
  
  .actions-col {
    width: 120px;
  }
  
  .email-cell {
    color: #7f8c8d;
    font-size: 0.9rem;
  }
  
  .sort-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }
  
  .sort-header i {
    font-size: 0.85rem;
    color: #bdc3c7;
  }
  
  .sort-header:hover {
    color: #4CAF50;
  }
  
  .sort-header i.fa-sort-up, .sort-header i.fa-sort-down {
    color: #4CAF50;
  }
  
  .role-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-align: center;
  }
  
  .role-user {
    background-color: #e8f5e9;
    color: #388E3C;
  }
  
  .role-admin {
    background-color: #ede7f6;
    color: #5e35b1;
  }
  
  .role-moderator {
    background-color: #e3f2fd;
    color: #1976d2;
  }
  
  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .status-indicator::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .status-active {
    background-color: #e8f5e9;
    color: #388E3C;
  }
  
  .status-active::before {
    background-color: #4CAF50;
  }
  
  .status-inactive {
    background-color: #fafafa;
    color: #9e9e9e;
  }
  
  .status-inactive::before {
    background-color: #9e9e9e;
  }
  
  .status-pending {
    background-color: #fff8e1;
    color: #ff8f00;
  }
  
  .status-pending::before {
    background-color: #ff8f00;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .action-buttons button {
    background: none;
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #7f8c8d;
  }
  
  .edit-btn:hover {
    background-color: #e3f2fd;
    color: #1976d2;
  }
  
  .status-toggle-btn:hover {
    background-color: #e8f5e9;
    color: #4CAF50;
  }
  
  .status-toggle-btn i.fa-toggle-on {
    color: #4CAF50;
  }
  
  .delete-btn:hover {
    background-color: #ffebee;
    color: #e53935;
  }
  
  .loading-row, .empty-row {
    text-align: center;
    color: #95a5a6;
    
  }
  
  .loading-spinner {
    width: 30px;
    height: 30px;
    border: 3px solid rgba(76, 175, 80, 0.1);
    border-top-color: #4CAF50;
    border-radius: 50%;
    animation: spin 1s ease infinite;
    margin: 1rem auto;
  }

  .empty-row {
  text-align: center;
  padding: 3rem 0;
  width: 100%;
}

.user-form {
      gap: 1rem;
    }
  

  .highlighted-row {
    animation: highlight-animation 3s ease;
  }

  @keyframes highlight-animation {
    0% { background-color: rgba(76, 175, 80, 0.3); }
    70% { background-color: rgba(76, 175, 80, 0.3); }
    100% { background-color: transparent; }
  }


.empty-row i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #e0e0e0;
  display: block;
}
  
  .empty-row i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #e0e0e0;
  display: block;
}

.empty-row td {
  height: 200px; /* Adjust this value to control the empty state height */
  vertical-align: middle;
}
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1.5rem;
  }
  
  .bulk-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .bulk-actions select {
    padding: 0.5rem 2rem 0.5rem 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.9rem;
    background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
    background-size: 16px;
    cursor: pointer;
    appearance: none;
    min-width: 150px;
  }
  
  .bulk-actions button {
    padding: 0.5rem 1rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .bulk-actions button:hover {
    background-color: #388E3C;
  }
  
  .bulk-actions button:disabled {
    background-color: #e0e0e0;
    cursor: not-allowed;
  }
  
  .selected-count {
    font-size: 0.9rem;
    color: #7f8c8d;
    margin-left: 0.5rem;
  }
  
  .pagination {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .pagination-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background-color: white;
    border: 1px solid #e0e0e0;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .pagination-btn:hover:not(:disabled) {
    background-color: #e8f5e9;
    border-color: #4CAF50;
    color: #4CAF50;
  }
  
  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .page-info {
    font-size: 0.9rem;
    color: #7f8c8d;
  }
  
  .pagination select {
    padding: 0.4rem 2rem 0.4rem 0.75rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.85rem;
    background: white url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%232c3e50' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.5rem center;
    background-size: 16px;
    cursor: pointer;
    appearance: none;
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
  
  .avatar-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #e8f5e9;
  }
  
  .avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-upload-btn {
    padding: 0.6rem 1rem;
    background-color: #f5f5f5;
    color: #2c3e50;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .avatar-upload-btn:hover {
    background-color: #e8f5e9;
    border-color: #4CAF50;
    color: #4CAF50;
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
  
  /* Delete modal */
  .delete-modal {
    width: 400px;
  }
  
  .delete-icon {
    font-size: 3rem;
    color: #e53935;
    text-align: center;
    margin-bottom: 1rem;
  }
  
  .warning-text {
    color: #e53935;
    font-weight: 600;
    margin-top: 0.5rem;
  }
  
  .delete-confirm-btn {
    padding: 0.6rem 1.25rem;
    background-color: #e53935;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .delete-confirm-btn:hover {
    background-color: #d32f2f;
  }
  
  /* Responsive adjustments */
  @media (max-width: 1024px) {
    .admin-content {
      margin-left: 0;
    }
    
    .admin-content.sidebar-collapsed {
      margin-left: 0;
    }
    
    .users-table th, .users-table td {
      padding: 0.75rem 0.5rem;
    }
    
    .email-col, .date-col {
      display: none;
    }

    .users-table th.status-col,
    .users-table th.date-col,
    .users-table td:nth-child(5), /* Status */
    .users-table td:nth-child(6)  /* Joined */
    {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    .admin-header,
    .users-container {
      padding: 1rem;
    }
    
    .action-bar {
      flex-direction: column;
      align-items: flex-start;
    
      gap: 1rem;
    }
    .search-box input {
    padding: 0.6rem 0.6rem 0.6rem 2.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 20px;
    width: 650px;
    font-size: 0.9rem;
    transition: all 0.3s ease;
  }
    
    .filter-group {
      width: 100%;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }
    .filter-group > * {
      width: 100%;
    }
    
    .add-user-btn {
      width: 100%;
      justify-content: center;
    }
    
    .role-col {
      display: none;
    }
    
    .table-footer {
      flex-direction: column;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .bulk-actions, .pagination {
      width: 100%;
    }
  }
  
  @media (max-width: 576px) {
    .users-table-wrapper {
      overflow-x: auto;
    }
    
    .status-col {
      display: none;
    }
    
    .user-form {
      gap: 1rem;
    }
  }

/* Responsive: Always allow horizontal scroll for table on small screens */
@media (max-width: 900px) {
  .users-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .users-table th.email-col,
  .users-table td.email-cell,
  .users-table th.status-col,
  .users-table td:nth-child(5), /* Status */
  .users-table th.date-col,
  .users-table td:nth-child(6), /* Joined */
  .users-table th.avatar-col,
  .users-table td:nth-child(2) { /* Hide avatar column */
    display: none !important;
  }
  /* Show actions column */
  .users-table th.actions-col,
  .users-table td.actions-col {
    display: table-cell !important;
  }
  .users-table th, .users-table td {
    padding: 0.6rem 0.3rem;
    font-size: 0.98rem;
  }
  .user-avatar {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
}

/* Optional: Make table header sticky on mobile for better UX */
@media (max-width: 900px) {
  .users-table thead th {
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
