<template>
    <AdminLayout pageTitle="Contact Messages">
      <div class="admin-contact">
        <div class="dashboard-card">
          <div class="card-header">
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Search messages..." 
                v-model="searchQuery"
                @input="debouncedSearch" 
              />
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                class="clear-search-btn"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="card-actions">
              <select v-model="statusFilter" @change="fetchMessages(1)">
                <option value="">All Messages</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
              </select>
            </div>
          </div>
  
          <div v-if="loading" class="loading-placeholder">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading messages...</p>
          </div>
  
          <div v-else-if="messages.length === 0" class="empty-state">
            <i class="fas fa-envelope-open"></i>
            <p>No messages found.</p>
          </div>
  
          <div v-else class="messages-container">
            <table class="messages-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="message in messages" 
                  :key="message.id" 
                  :id="`message-row-${message.id}`"
                  :class="{ 
                    unread: message.status === 'unread', 
                    'highlighted-message': message.id === highlightedMessageId 
                  }"
                >
                  <td>{{ message.name }}</td>
                  <td><a :href="`mailto:${message.email}`">{{ message.email }}</a></td>
                  <td class="message-preview">{{ truncateMessage(message.message) }}</td>
                  <td>{{ formatDate(message.created_at) }}</td>
                  <td>
                    <span class="status-badge" :class="message.status">
                      {{ message.status }}
                    </span>
                  </td>
                  <td class="actions">
                    <button @click="viewMessage(message)" class="view-btn">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button 
                      v-if="message.status === 'unread'" 
                      @click="updateStatus(message.id, 'read')" 
                      class="read-btn"
                    >
                      <i class="fas fa-check"></i>
                    </button>
                    <button 
                      v-if="message.status !== 'replied'" 
                      @click="updateStatus(message.id, 'replied')" 
                      class="reply-btn"
                    >
                      <i class="fas fa-reply"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
  
            <!-- Pagination controls -->
            <div class="pagination" v-if="pagination.pages > 1">
              <button 
                :disabled="pagination.page === 1" 
                @click="fetchMessages(pagination.page - 1)"
                class="pagination-btn"
              >
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              
              <span class="page-info">
                Page {{ pagination.page }} of {{ pagination.pages }}
              </span>
              
              <button 
                :disabled="pagination.page === pagination.pages" 
                @click="fetchMessages(pagination.page + 1)"
                class="pagination-btn"
              >
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Message Detail Modal -->
      <transition name="modal-fade">
      <div v-if="selectedMessage" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h2>Message from {{ selectedMessage.name }}</h2>
            <button class="close-btn" @click="closeModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="modal-body">
            <div class="message-meta">
              <div class="meta-item">
                <span class="meta-label">Email:</span>
                <a :href="`mailto:${selectedMessage.email}`">{{ selectedMessage.email }}</a>
              </div>
              <div class="meta-item">
                <span class="meta-label">Date:</span>
                <span>{{ formatDate(selectedMessage.created_at) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Status:</span>
                <span class="status-badge" :class="selectedMessage.status">
                  {{ selectedMessage.status }}
                </span>
              </div>
            </div>
            
            <div class="message-content">
              <h3>Message</h3>
              <p>{{ selectedMessage.message }}</p>
            </div>
          </div>
          
          <div class="modal-footer">
            <button 
              v-if="selectedMessage.status === 'unread'" 
              @click="updateStatus(selectedMessage.id, 'read')"
              class="read-btn"
            >
              <i class="fas fa-check"></i> Mark as Read
            </button>
            <button 
              v-if="selectedMessage.status !== 'replied'" 
              @click="updateStatus(selectedMessage.id, 'replied')"
              class="reply-btn"
            >
              <i class="fas fa-reply"></i> Mark as Replied
            </button>
            <a 
              :href="`mailto:${selectedMessage.email}?subject=Re: Your message to E-connect`" 
              class="email-btn"
            >
              <i class="fas fa-envelope"></i> Reply via Email
            </a>
          </div>
        </div>
      </div>
    </transition>
    </AdminLayout>
  </template>

<script>
import { ref, onMounted, watch } from 'vue';
import axios from 'axios';
import AdminLayout from './AdminLayout.vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth'

export default {
  name: 'AdminContact',
  components: {
    AdminLayout
  },
  
  setup() {
    const messages = ref([]);
    const loading = ref(true);
    const statusFilter = ref('');
    const selectedMessage = ref(null);
    const searchQuery = ref('');
    const pagination = ref({
      page: 1,
      limit: 10,
      total: 0,
      pages: 1
    });
    const highlightedMessageId = ref(null);
    const route = useRoute();
    let searchTimeout = null;

    const fetchMessages = async (page = 1) => {
      loading.value = true;
      
      try {
        const params = {
          page,
          limit: pagination.value.limit
        };
        
        if (statusFilter.value) {
          params.status = statusFilter.value;
        }
        
        if (searchQuery.value.trim()) {
          params.search = searchQuery.value.trim();
          console.log('Searching for:', params.search);
        }
        
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/admin/contact-messages', {
          params,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        messages.value = response.data.messages;
        pagination.value = response.data.pagination;
      } catch (error) {
        console.error('Error fetching contact messages:', error);
        alert('Failed to load contact messages. Please check your connection and permissions.');
      } finally {
        loading.value = false;
      }
    };

    // Debounce search to prevent too many API calls while typing
    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      searchTimeout = setTimeout(() => {
        fetchMessages(1);
      }, 500); // Wait 500ms after typing stops before searching
    };

    const clearSearch = () => {
      searchQuery.value = '';
      fetchMessages(1);
    };

    const handleSearch = () => {
      // Reset to first page when searching
      fetchMessages(1);
    };

    const updateStatus = async (messageId, newStatus) => {
      try {
        const token = localStorage.getItem('token');
        
        // Create a new API endpoint for updating message status
        await axios.put(`/api/admin/contact-messages/${messageId}/status`, 
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        // If showing a message in the modal, update its status
        if (selectedMessage.value && selectedMessage.value.id === messageId) {
          selectedMessage.value.status = newStatus;
        }
        
        // Refresh the messages list
        await fetchMessages(pagination.value.page);
      } catch (error) {
        console.error('Error updating message status:', error);
        alert('Failed to update message status. Please try again.');
      }
    };

    const viewMessage = (message) => {
      selectedMessage.value = { ...message };
      
      // If the message is unread, automatically mark it as read
      if (message.status === 'unread') {
        updateStatus(message.id, 'read');
      }
    };

    const closeModal = () => {
      selectedMessage.value = null;
    };

    const truncateMessage = (message, length = 50) => {
      if (message.length <= length) return message;
      return message.substring(0, length) + '...';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };

    const checkForHighlightedMessage = () => {
      if (route.query.messageId) {
        const messageId = parseInt(route.query.messageId);
        highlightedMessageId.value = messageId;
        
        // Open the message details automatically if it exists in current data
        const message = messages.value.find(m => m.id === messageId);
        if (message) {
          viewMessage(message);
          
          // Scroll to the message after a short delay to ensure DOM is updated
          setTimeout(() => {
            const messageRow = document.getElementById(`message-row-${messageId}`);
            if (messageRow) {
              messageRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      }
    };

    watch(() => messages.value, checkForHighlightedMessage);
    watch(() => route.query.messageId, checkForHighlightedMessage);

    onMounted(() => {
      fetchMessages();
      checkForHighlightedMessage();
    });

    return {
      messages,
      loading,
      statusFilter,
      searchQuery,
      selectedMessage,
      pagination,
      highlightedMessageId,
      fetchMessages,
      handleSearch,
      debouncedSearch,
      clearSearch,
      updateStatus,
      viewMessage,
      closeModal,
      truncateMessage,
      formatDate
    };
  }
};
</script>

<style scoped>


.dashboard-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.3s ease;
  margin-bottom: 2rem;
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

.clear-search-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #95a5a6;
  cursor: pointer;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.clear-search-btn:hover {
  color: #e53935;
  background-color: rgba(0, 0, 0, 0.05);
}

.card-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
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

.messages-container {
  padding: 0 1.5rem 1.5rem;
}

.messages-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.messages-table th, .messages-table td {
  padding: 0.85rem 1rem;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.messages-table th {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.messages-table tr:last-child td {
  border-bottom: none;
}

.messages-table tr:hover td {
  background-color: #f8f9fa;
}

.messages-table tr.unread {
  background-color: #f0f7ff;
  font-weight: 600;
}

.message-preview {
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-block;
  padding: 0.35rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.unread {
  background-color: #ffecb3;
  color: #ff9800;
}

.status-badge.read {
  background-color: #e3f2fd;
  color: #2196f3;
}

.status-badge.replied {
  background-color: #e8f5e9;
  color: #4caf50;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.view-btn {
  background-color: #4CAF50;
  color: white;
}

.read-btn {
  background-color: #2196F3;
  color: white;
}

.reply-btn {
  background-color: #FF9800;
  color: white;
}

.view-btn:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
}

.read-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
}

.reply-btn:hover {
  background-color: #F57C00;
  transform: translateY(-2px);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 1.5rem;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  color: #7f8c8d;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #7f8c8d;
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
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
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

.message-meta {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 600;
  color: #7f8c8d;
  width: 80px;
}

.message-content {
  background-color: #f9f9f9;
  padding: 1.25rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.message-content h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
}

.message-content p {
  white-space: pre-line;
  line-height: 1.6;
  color: #333;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem;
  border-top: 1px solid #f0f0f0;
}

.modal-footer button,
.modal-footer a {
  padding: 0.6rem 1.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
}

.read-btn, .reply-btn, .email-btn {
  color: white;
  border: none;
  font-weight: 500;
}

.read-btn {
  background-color: #2196F3;
}

.reply-btn {
  background-color: #FF9800;
}

.email-btn {
  background-color: #4CAF50;
}

.read-btn:hover {
  background-color: #1976D2;
}

.reply-btn:hover {
  background-color: #F57C00;
}

.email-btn:hover {
  background-color: #388E3C;
}

/* Add this new style for email links in the table */
.messages-table td a {
  color: #4C4C4C;
  text-decoration: none;
  transition: color 0.2s ease;
  position: relative;
}

.messages-table td a:hover {
  color: #4CAF50;
}

.messages-table td a::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  bottom: -2px;
  left: 0;
  background-color: #4CAF50;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease;
}

.messages-table td a:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

/* Also update the email link in the modal */
.meta-item a {
  color: #4C4C4C;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s ease;
  position: relative;
}

.meta-item a:hover {
  color: #4CAF50;
}

.meta-item a::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 1px;
  bottom: -2px;
  left: 0;
  background-color: #4CAF50;
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease;
}

.meta-item a:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

.highlighted-message {
  animation: highlight-animation 3s ease;
}

@keyframes highlight-animation {
  0% { background-color: rgba(255, 235, 59, 0.3); }
  70% { background-color: rgba(255, 235, 59, 0.3); }
  100% { background-color: transparent; }
}

@media (max-width: 768px) {
  .modal-container {
    width: 95%;
  }
  
  .message-meta {
    flex-direction: column;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer button,
  .modal-footer a {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .search-box input:focus {
    width: 100%;
  }
  
  .card-actions {
    width: 100%;
  }
  
  .card-actions select {
    width: 100%;
  }

  .messages-table {
    font-size: 0.85rem; /* Smaller text on mobile */
  }
  
  .messages-table th, .messages-table td {
    padding: 0.6rem 0.4rem; /* Reduced padding to fit more content */
  }
  
  .message-preview {
    max-width: 150px; /* Shorter preview on mobile */
  }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .actions button {
    width: 26px;
    height: 26px;
    font-size: 0.7rem;
  }
}

/* Very small screens (phones) */
@media (max-width: 576px) {
  .messages-table {
    font-size: 0.75rem; /* Even smaller text on very small screens */
  }
  
  .messages-table th, .messages-table td {
    padding: 0.5rem 0.3rem;
  }
  
  /* Create a horizontal scroll for the table */
  .messages-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* Better scrolling on iOS */
  }
  
  .message-preview {
    max-width: 100px;
  }
  
  /* Adjust headings to be shorter */
  .messages-table th:nth-child(3) {
    white-space: nowrap;
  }
  
  /* Make status badges more compact */
  .status-badge {
    padding: 0.2rem 0.4rem;
    font-size: 0.65rem;
  }
  
  /* Stack action buttons if needed */
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: center;
  }
  
  .actions button {
    margin-bottom: 0.1rem;
  }
  
  /* Adjust modal for smaller screens */
  .modal-container {
    width: 95%;
  }
}

/* Extra small devices */
@media (max-width: 375px) {
  /* Make email column narrower */
  .messages-table td:nth-child(2), .messages-table th:nth-child(2) {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* Make date column more compact */
  .messages-table td:nth-child(4), .messages-table th:nth-child(4) {
    max-width: 70px;
    overflow: hidden;
    white-space: nowrap;
  }
  
  /* Ensure table takes full width and horizontal scroll works */
  .messages-table {
    min-width: 100%;
    table-layout: fixed;
  }
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
</style>
