<template>
        <div class="admin-layout">
      <AdminLayout pageTitle="Donations">
          <div class="user-actions">
          
          </div>
    <div class="admin-donations">
        <div class="action-bar">
          <div class="filters">
            <div class="filter-group">
              <label for="statusFilter">Status</label>
              <select id="statusFilter" v-model="filters.status" @change="loadDonations">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
  
            <div class="filter-group">
              <label for="projectFilter">Project</label>
              <select id="projectFilter" v-model="filters.project" @change="loadDonations">
                <option value="all">All Projects</option>
                <option value="reforestation">Reforestation</option>
                <option value="ocean">Ocean Cleanup</option>
                <option value="water">Clean Water</option>
                <option value="renewable">Renewable Energy</option>
              </select>
            </div>
  
            <div class="filter-group">
              <label for="dateRange">Date Range</label>
              <div class="date-inputs">
                <input type="date" v-model="filters.startDate" @change="loadDonations">
                <span>to</span>
                <input type="date" v-model="filters.endDate" @change="loadDonations">
              </div>
            </div>
          </div>
  
          <div class="search-bar">
            <input 
              type="text" 
              v-model="filters.search" 
              @input="debouncedSearch"
              placeholder="Search by donor name or email..."
            >
            <button class="search-btn" @click="loadDonations">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading donations...</p>
      </div>
  
      <!-- Table view -->
      <div v-else-if="donations.length > 0" class="donations-table-container">
        <table class="donations-table">
          <thead>
            <tr>
              <th @click="sortBy('id')" class="sortable">
                ID <i class="fas" :class="getSortIcon('id')"></i>
              </th>
              <th @click="sortBy('donor_name')" class="sortable">
                Donor <i class="fas" :class="getSortIcon('donor_name')"></i>
              </th>
              <th @click="sortBy('amount')" class="sortable">
                Amount <i class="fas" :class="getSortIcon('amount')"></i>
              </th>
              <th @click="sortBy('project_id')" class="sortable">
                Project <i class="fas" :class="getSortIcon('project_id')"></i>
              </th>
              <th @click="sortBy('payment_method')" class="sortable">
                Payment <i class="fas" :class="getSortIcon('payment_method')"></i>
              </th>
              <th @click="sortBy('donation_date')" class="sortable">
                Date <i class="fas" :class="getSortIcon('donation_date')"></i>
              </th>
              <th @click="sortBy('status')" class="sortable">
                Status <i class="fas" :class="getSortIcon('status')"></i>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="donation in donations" :key="donation.id" :class="{ 'rejected': donation.status === 'rejected' }">
              <td>{{ donation.id }}</td>
              <td>
                <div class="donor-info">
                  <div>{{ donation.donor_first_name }} {{ donation.donor_last_name }}</div>
                  <div class="donor-email">{{ donation.donor_email }}</div>
                </div>
              </td>
              <td class="amount">₱{{ formatAmount(donation.amount) }}</td>
              <td>{{ formatProject(donation.project_id) }}</td>
              <td>{{ formatPaymentMethod(donation.payment_method) }}</td>
              <td>{{ formatDate(donation.donation_date) }}</td>
              <td>
                <span class="status-badge" :class="donation.status">
                  {{ donation.status.charAt(0).toUpperCase() + donation.status.slice(1) }}
                </span>
              </td>
              <td class="actions">
                <button class="action-btn view-btn" @click="viewDonation(donation)" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  v-if="donation.status === 'pending' || donation.status === 'completed'" 
                  class="action-btn verify-btn" 
                  @click="verifyDonation(donation)" 
                  title="Verify Donation"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button class="action-btn edit-btn" @click="editDonation(donation)" title="Edit Donation">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  v-if="donation.status !== 'rejected'" 
                  class="action-btn reject-btn" 
                  @click="confirmRejectDonation(donation)" 
                  title="Reject Donation"
                >
                  <i class="fas fa-times"></i>
                </button>
                <button class="action-btn delete-btn" @click="confirmDeleteDonation(donation)" title="Delete Donation">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
  
        <!-- Pagination -->
        <div class="pagination">
          <button 
            class="page-btn" 
            :disabled="pagination.page === 1" 
            @click="changePage(pagination.page - 1)"
          >
            <i class="fas fa-chevron-left"></i> Previous
          </button>
          <div class="page-info">
            Page {{ pagination.page }} of {{ pagination.totalPages }}
          </div>
          <button 
            class="page-btn" 
            :disabled="pagination.page === pagination.totalPages" 
            @click="changePage(pagination.page + 1)"
          >
            Next <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
  
      <!-- Empty state -->
      <div v-else class="empty-state">
        <i class="fas fa-donate empty-icon"></i>
        <h2>No donations found</h2>
        <p>Try adjusting your filters or search criteria</p>
        <button class="reset-btn" @click="resetFilters">Reset Filters</button>
      </div>
  
      <!-- Donation detail modal -->
      <div v-if="showDonationModal" class="modal-overlay" @click="closeDonationModal">
        <div class="modal-content donation-detail-modal" @click.stop>
          <div class="modal-header">
            <h2>Donation Details</h2>
            <button class="close-btn" @click="closeDonationModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" v-if="selectedDonation">
            <div class="detail-section">
              <h3>Donation Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>ID:</label>
                  <span>{{ selectedDonation.id }}</span>
                </div>
                <div class="detail-item">
                  <label>Amount:</label>
                  <span class="amount">₱{{ formatAmount(selectedDonation.amount) }}</span>
                </div>
                <div class="detail-item">
                  <label>Project:</label>
                  <span>{{ formatProject(selectedDonation.project_id) }}</span>
                </div>
                <div class="detail-item">
                  <label>Date:</label>
                  <span>{{ formatDate(selectedDonation.donation_date, true) }}</span>
                </div>
                <div class="detail-item">
                  <label>Status:</label>
                  <span class="status-badge" :class="selectedDonation.status">
                    {{ selectedDonation.status.charAt(0).toUpperCase() + selectedDonation.status.slice(1) }}
                  </span>
                </div>
                <div class="detail-item">
                  <label>Recurring:</label>
                  <span>{{ selectedDonation.is_recurring ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </div>
  
            <div class="detail-section">
              <h3>Donor Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Name:</label>
                  <span>{{ selectedDonation.donor_first_name }} {{ selectedDonation.donor_last_name }}</span>
                </div>
                <div class="detail-item">
                  <label>Email:</label>
                  <span>{{ selectedDonation.donor_email }}</span>
                </div>
                <div class="detail-item" v-if="selectedDonation.donor_phone">
                  <label>Phone:</label>
                  <span>{{ selectedDonation.donor_phone }}</span>
                </div>
                <div class="detail-item">
                  <label>User ID:</label>
                  <span>{{ selectedDonation.user_id }}</span>
                </div>
              </div>
            </div>
  
            <div class="detail-section">
              <h3>Payment Details</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Method:</label>
                  <span>{{ formatPaymentMethod(selectedDonation.payment_method) }}</span>
                </div>
                <div v-if="selectedDonation.payment_details" class="detail-item payment-details">
                  <label>Details:</label>
                  <pre>{{ formatPaymentDetails(selectedDonation.payment_details) }}</pre>
                </div>
              </div>
            </div>
  
            <div class="modal-actions">
              <button 
                v-if="selectedDonation.status === 'pending' || selectedDonation.status === 'completed'" 
                class="btn verify-btn" 
                @click="verifyDonation(selectedDonation)"
              >
                <i class="fas fa-check"></i> Verify Donation
              </button>
              <button class="btn edit-btn" @click="editDonation(selectedDonation)">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button 
                v-if="selectedDonation.status !== 'rejected'" 
                class="btn reject-btn" 
                @click="confirmRejectDonation(selectedDonation)"
              >
                <i class="fas fa-times"></i> Reject Donation
              </button>
              <button class="btn delete-btn" @click="confirmDeleteDonation(selectedDonation)">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Edit donation modal -->
      <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
        <div class="modal-content edit-modal" @click.stop>
          <div class="modal-header">
            <h2>{{ isNewDonation ? 'Create Donation' : 'Edit Donation' }}</h2>
            <button class="close-btn" @click="closeEditModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveDonation" class="edit-form">
              <div class="form-group">
                <label for="editAmount">Amount (₱)</label>
                <input 
                  type="number" 
                  id="editAmount" 
                  v-model.number="editedDonation.amount" 
                  required
                  min="1"
                  step="0.01"
                >
              </div>
              
              <div class="form-group">
                <label for="editProject">Project</label>
                <select id="editProject" v-model="editedDonation.project_id" required>
                  <option value="reforestation">Reforestation Projects</option>
                  <option value="ocean">Ocean Cleanup</option>
                  <option value="water">Clean Water Initiative</option>
                  <option value="renewable">Renewable Energy</option>
                </select>
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="editFirstName">First Name</label>
                  <input type="text" id="editFirstName" v-model="editedDonation.donor_first_name" required>
                </div>
                <div class="form-group">
                  <label for="editLastName">Last Name</label>
                  <input type="text" id="editLastName" v-model="editedDonation.donor_last_name" required>
                </div>
              </div>
              
              <div class="form-group">
                <label for="editEmail">Email</label>
                <input type="email" id="editEmail" v-model="editedDonation.donor_email" required>
              </div>
              
              <div class="form-group">
                <label for="editPhone">Phone (Optional)</label>
                <input type="tel" id="editPhone" v-model="editedDonation.donor_phone">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label for="editPaymentMethod">Payment Method</label>
                  <select id="editPaymentMethod" v-model="editedDonation.payment_method" required>
                    <option value="gcash">GCash</option>
                    <option value="maya">Maya</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="editStatus">Status</label>
                  <select id="editStatus" v-model="editedDonation.status" required>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <div class="checkbox-wrapper">
                  <input type="checkbox" id="editRecurring" v-model="editedDonation.is_recurring">
                  <label for="editRecurring">Monthly Recurring Donation</label>
                </div>
              </div>
              
              <div class="form-actions">
                <button type="button" class="cancel-btn" @click="closeEditModal">Cancel</button>
                <button type="submit" class="save-btn">
                  {{ isNewDonation ? 'Create' : 'Save Changes' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  
      <!-- Confirm dialog -->
      <div v-if="showConfirmDialog" class="modal-overlay" @click="cancelAction">
        <div class="modal-content confirm-dialog" @click.stop>
          <div class="modal-header">
            <h2>{{ confirmDialogTitle }}</h2>
          </div>
          <div class="modal-body">
            <p>{{ confirmDialogMessage }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn cancel-btn" @click="cancelAction">Cancel</button>
            <button 
              class="btn" 
              :class="confirmDialogAction === 'delete' ? 'delete-btn' : 'reject-btn'"
              @click="confirmAction"
            >
              {{ confirmDialogAction === 'delete' ? 'Delete' : 'Reject' }}
            </button>
          </div>
        </div>
      </div>
</AdminLayout>
</div>
  </template>
  
  <script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue';
  import axios from 'axios';
import AdminLayout from './AdminLayout.vue';

// Define interface for donation data
interface Donation {
  id: number;
  user_id?: number;
  amount: number;
  project_id: string;
  payment_method: string;
  payment_details: any;
  is_recurring: boolean;
  donor_first_name: string;
  donor_last_name: string;
  donor_email: string;
  donor_phone?: string;
  donation_date?: string;
  status: string;
  notes?: string;
  created_by?: number;
  verified_by?: number;
  verified_at?: string;
  rejected_by?: number;
  rejected_at?: string;
  rejected_reason?: string;
  updated_at?: string;
}

// Add a ref for sidebar state
const sidebarCollapsed = ref(false);

// Update your ref declarations
const donations = ref<Donation[]>([]);
const selectedDonation = ref<Donation | null>(null);
const editedDonation = ref<Donation>({
  id: 0,
  amount: 0,
  project_id: 'reforestation',
  payment_method: 'gcash',
  payment_details: {},
  is_recurring: false,
  donor_first_name: '',
  donor_last_name: '',
  donor_email: '',
  donor_phone: '',
  status: 'pending'
});
  
  // Toast system for notifications - create a simple implementation
  const useToast = () => {
    const showToast = (message: string, type: string = 'info') => {
      alert(`${type.toUpperCase()}: ${message}`);
    };
    
    return { showToast };
  };
  
  const { showToast } = useToast();
  
  // Data
  const loading = ref(true);
  const filters = reactive({
    status: 'all',
    project: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });
  const pagination = reactive({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1
  });
  const sortConfig = reactive({
    key: 'donation_date',
    direction: 'desc'
  });
  
  // Modal state
  const showDonationModal = ref(false);
  const showEditModal = ref(false);
  const isNewDonation = ref(false);
  const showConfirmDialog = ref(false);
  const confirmDialogTitle = ref('');
  const confirmDialogMessage = ref('');
  const confirmDialogAction = ref('');
  const pendingAction = ref<(() => Promise<void>) | null>(null);
  
  // Search debounce timer
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  
  // Format functions
  const formatAmount = (amount: number | string): string => {
  return parseFloat(amount as string).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
  
const formatDate = (dateString: string | undefined, includeTime: boolean = false): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = includeTime 
    ? { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } 
    : { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};
  
const formatProject = (projectId: string | undefined): string => {
  if (!projectId) return 'Unknown';
  
  const projects: Record<string, string> = {
    'reforestation': 'Reforestation',
    'ocean': 'Ocean Cleanup',
    'water': 'Clean Water',
    'renewable': 'Renewable Energy'
  };
  return projects[projectId] || projectId;
};

const formatPaymentMethod = (method: string | undefined): string => {
  if (!method) return 'Unknown';
  
  const methods: Record<string, string> = {
    'gcash': 'GCash',
    'maya': 'Maya',
    'bank': 'Bank Transfer'
  };
  return methods[method] || method;
};
  
const formatPaymentDetails = (details: any): string => {
  if (typeof details === 'string') {
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch (e) {
      return details;
    }
  }
  return JSON.stringify(details, null, 2);
};
  
  // API functions
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };
  
  const loadDonations = async () => {
    loading.value = true;
    try {
      // Build query params
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: sortConfig.key,
        direction: sortConfig.direction,
        ...filters.status !== 'all' ? { status: filters.status } : {},
        ...filters.project !== 'all' ? { project: filters.project } : {},
        ...filters.search ? { search: filters.search } : {},
        ...filters.startDate ? { startDate: filters.startDate } : {},
        ...filters.endDate ? { endDate: filters.endDate } : {},
      };
  
      // Make API request
      const response = await axios.get('/api/admin/donations', {
        ...getAuthHeader(),
        params
      });

    // Update data
    donations.value = response.data.donations;
    pagination.totalItems = response.data.pagination.total;
    pagination.totalPages = response.data.pagination.pages;
  } catch (error) {
    console.error('Error loading donations:', error);
    showToast('Error loading donations. Please try again.', 'error');
    donations.value = [];
  } finally {
    loading.value = false;
  }
};

const verifyDonation = async (donation: Donation) => {
  try {
    const response = await axios.put(`/api/admin/donations/${donation.id}/verify`, {}, getAuthHeader());
    
    showToast('Donation verified successfully', 'success');
    
    // Update local data
    if (selectedDonation.value && selectedDonation.value.id === donation.id) {
      selectedDonation.value.status = 'verified';
    }
    
    // Refresh the list
    loadDonations();
  } catch (error) {
    console.error('Error verifying donation:', error);
    showToast('Error verifying donation. Please try again.', 'error');
  }
};
const rejectDonation = async (donation: Donation): Promise<void> => {
  try {
    const response = await axios.put(`/api/admin/donations/${donation.id}/reject`, {}, getAuthHeader());
    
    showToast('Donation marked as rejected', 'success');
    
    // Close modals
    showConfirmDialog.value = false;
    showDonationModal.value = false;
    
    // Update local data if needed
    if (selectedDonation.value && selectedDonation.value.id === donation.id) {
      selectedDonation.value.status = 'rejected';
    }
    
    // Refresh the list
    loadDonations();
  } catch (error) {
    console.error('Error rejecting donation:', error);
    showToast('Error rejecting donation. Please try again.', 'error');
  }
};

const deleteDonation = async (donation: Donation): Promise<void> => {
  try {
    await axios.delete(`/api/admin/donations/${donation.id}`, getAuthHeader());
    
    showToast('Donation deleted successfully', 'success');
    
    // Close modals
    showConfirmDialog.value = false;
    showDonationModal.value = false;
    
    // Refresh the list
    loadDonations();
  } catch (error) {
    console.error('Error deleting donation:', error);
    showToast('Error deleting donation. Please try again.', 'error');
  }
};
  
  const saveDonation = async () => {
    try {
      if (isNewDonation.value) {
        await axios.post('/api/admin/donations', editedDonation.value, getAuthHeader());
        showToast('Donation created successfully', 'success');
      } else {
        await axios.put(`/api/admin/donations/${editedDonation.value.id}`, editedDonation.value, getAuthHeader());
        showToast('Donation updated successfully', 'success');
      }
      
      // Close modal and refresh data
      closeEditModal();
      loadDonations();
    } catch (error) {
      console.error('Error saving donation:', error);
      showToast(`Error ${isNewDonation.value ? 'creating' : 'updating'} donation. Please try again.`, 'error');
    }
  };
  
  // UI interaction functions
  const debouncedSearch = () => {
    // Clear previous timer
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    // Set new timer
    searchTimer = setTimeout(() => {
      pagination.page = 1; // Reset to first page on new search
      loadDonations();
    }, 500);
  };
  
  const sortBy = (key: string): void => {
  // If already sorting by this key, toggle direction
  if (sortConfig.key === key) {
    sortConfig.direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
  } else {
    sortConfig.key = key;
    sortConfig.direction = 'asc';
  }
  loadDonations();
};
const getSortIcon = (key: string): string => {
  if (sortConfig.key !== key) return 'fa-sort';
  return sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
};
  
const changePage = (page: number): void => {
  pagination.page = page;
  loadDonations();
};
  
  const resetFilters = () => {
    filters.status = 'all';
    filters.project = 'all';
    filters.search = '';
    filters.startDate = '';
    filters.endDate = '';
    pagination.page = 1;
    loadDonations();
  };
  
  // Modal functions
  const viewDonation = (donation: Donation): void => {
  selectedDonation.value = donation;
  showDonationModal.value = true;
};
  
  const closeDonationModal = () => {
    showDonationModal.value = false;
    selectedDonation.value = null;
  };
  
  const editDonation = (donation: Donation) => {
  // Close view modal if open
  showDonationModal.value = false;
  
  // Create a deep copy to avoid modifying the original
  editedDonation.value = JSON.parse(JSON.stringify(donation));
  
  // If payment_details is stored as a string, parse it
  if (typeof editedDonation.value.payment_details === 'string') {
    try {
      editedDonation.value.payment_details = JSON.parse(editedDonation.value.payment_details);
    } catch (e) {
      // Keep as is if can't parse
    }
  }
  
  isNewDonation.value = false;
  showEditModal.value = true;
};
  
  const createNewDonation = () => {
  editedDonation.value = {
    id: 0, // Temp ID, will be replaced by backend
    amount: 0,
    project_id: 'reforestation',
    payment_method: 'gcash',
    payment_details: {},
    is_recurring: false,
    donor_first_name: '',
    donor_last_name: '',
    donor_email: '',
    donor_phone: '',
    status: 'pending'
  };
  isNewDonation.value = true;
  showEditModal.value = true;
};
  
  const closeEditModal = () => {
    showEditModal.value = false;
    // Reset editedDonation with a properly typed empty Donation object
    editedDonation.value = {
      id: 0,
      amount: 0,
      project_id: 'reforestation',
      payment_method: 'gcash',
      payment_details: {},
      is_recurring: false,
      donor_first_name: '',
      donor_last_name: '',
      donor_email: '',
      donor_phone: '',
      status: 'pending'
    };
  };
  
  const confirmRejectDonation = (donation: Donation): void => {
  confirmDialogTitle.value = 'Reject Donation';
  confirmDialogMessage.value = `Are you sure you want to mark donation #${donation.id} as rejected? This will flag it as invalid.`;
  confirmDialogAction.value = 'reject';
  pendingAction.value = () => rejectDonation(donation);
  showConfirmDialog.value = true;
};
  
const confirmDeleteDonation = (donation: Donation): void => {
  confirmDialogTitle.value = 'Delete Donation';
  confirmDialogMessage.value = `Are you sure you want to delete donation #${donation.id}? This action cannot be undone.`;
  confirmDialogAction.value = 'delete';
  pendingAction.value = () => deleteDonation(donation);
  showConfirmDialog.value = true;
};
  
  const confirmAction = () => {
    if (pendingAction.value) {
      pendingAction.value();
    }
  };
  
  const cancelAction = () => {
    showConfirmDialog.value = false;
    pendingAction.value = null;
  };
  
  // Lifecycle hooks
  onMounted(() => {
    loadDonations();
  });
  </script>
  
  <style scoped>
  .admin-donations {
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .page-header {
    margin-bottom: 25px;
  }
  
  .page-header h1 {
    color: #2E7D32;
    margin-bottom: 15px;
    font-size: 1.8rem;
  }
  
  .action-bar {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
  }
  
  .filter-group label {
    font-size: 0.8rem;
    margin-bottom: 5px;
    color: #555;
  }
  
  .filter-group select, .filter-group input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    min-width: 150px;
  }
  
  .date-inputs {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .date-inputs span {
    color: #555;
  }
  
  .date-inputs input {
    min-width: 130px;
  }
  
  .search-bar {
    display: flex;
    align-items: center;
  }
  
  .search-bar input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px 0 0 4px;
    min-width: 250px;
  }
  
  .search-btn {
    padding: 8px 12px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 0 4px 4px 0;
    cursor: pointer;
  }
  
  .search-btn:hover {
    background-color: #43A047;
  }
  
  /* Loading */
  .loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #4CAF50;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 15px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  /* Table styling */
  .donations-table-container {
    overflow-x: auto;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }
  
  .donations-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }
  
  .donations-table th {
    background-color: #f8f8f8;
    color: #333;
    text-align: left;
    padding: 12px 15px;
    border-bottom: 2px solid #e0e0e0;
    position: sticky;
    top: 0;
  }
  
  .sortable {
    cursor: pointer;
  }
  
  .sortable:hover {
    background-color: #f0f0f0;
  }
  
  .donations-table th i {
    margin-left: 5px;
    color: #777;
  }
  
  .donations-table td {
    padding: 10px 15px;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: middle;
  }
  
  .donations-table tr:hover {
    background-color: #f9f9f9;
  }
  
  .donations-table tr.rejected {
    background-color: #ffebee;
  }
  
  .donations-table tr.rejected:hover {
    background-color: #ffe5e8;
  }
  
  .donor-info {
    display: flex;
    flex-direction: column;
  }
  
  .donor-email {
    font-size: 0.85rem;
    color: #666;
    margin-top: 2px;
  }
  
  .amount {
    font-weight: 500;
    color: #2E7D32;
  }
  
  .status-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
  }
  
  .status-badge.pending {
    background-color: #FFF3E0;
    color: #E65100;
  }
  
  .status-badge.completed {
    background-color: #E1F5FE;
    color: #0277BD;
  }
  
  .status-badge.verified {
    background-color: #E8F5E9;
    color: #2E7D32;
  }
  
  .status-badge.rejected {
    background-color: #FFEBEE;
    color: #C62828;
  }
  
  .actions {
    display: flex;
    justify-content: flex-start;
    gap: 8px;
  }
  
  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
    color: white;
  }
  
  .action-btn:hover {
    transform: translateY(-2px);
  }
  
  .view-btn {
    background-color: #5C6BC0;
  }
  
  .view-btn:hover {
    background-color: #3F51B5;
  }
  
  .verify-btn {
    background-color: #66BB6A;
  }
  
  .verify-btn:hover {
    background-color: #43A047;
  }
  
  .edit-btn {
    background-color: #FFCA28;
    color: #333;
  }
  
  .edit-btn:hover {
    background-color: #FFC107;
  }
  
  .reject-btn {
    background-color: #EF5350;
  }
  
  .reject-btn:hover {
    background-color: #E53935;
  }
  
  .delete-btn {
    background-color: #8D6E63;
  }
  
  .delete-btn:hover {
    background-color: #795548;
  }
  
  /* Pagination */
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px;
    background-color: #f8f8f8;
    border-top: 1px solid #e0e0e0;
  }
  
  .page-btn {
    padding: 6px 12px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    margin: 0 5px;
  }
  
  .page-btn:hover:not(:disabled) {
    background-color: #f0f0f0;
  }
  
  .page-btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .page-info {
    margin: 0 20px;
    color: #666;
  }
  
  /* Empty State */
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .empty-icon {
    font-size: 3rem;
    color: #A5D6A7;
    margin-bottom: 20px;
  }
  
  .empty-state h2 {
    color: #2E7D32;
    margin-bottom: 10px;
  }
  
  .empty-state p {
    color: #666;
    margin-bottom: 20px;
  }
  
  .reset-btn {
    padding: 8px 16px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .reset-btn:hover {
    background-color: #388E3C;
  }
  
  /* Modal */
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
    z-index: 100;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    max-width: 800px;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
  }
  
  .modal-header {
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .modal-header h2 {
    color: #2E7D32;
    font-size: 1.4rem;
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #777;
  }
  
  .close-btn:hover {
    color: #333;
  }
  
  .modal-body {
    padding: 20px;
    overflow-y: auto;
    flex-grow: 1;
  }
  
  /* Donation Detail Modal */
  .detail-section {
    margin-bottom: 25px;
  }
  
  .detail-section h3 {
    color: #43A047;
    margin-bottom: 15px;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
  }
  
  .detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .detail-item {
    display: flex;
    flex-direction: column;
  }
  
  .detail-item label {
    font-size: 0.8rem;
    color: #777;
    margin-bottom: 5px;
  }
  
  .detail-item.payment-details {
    grid-column: 1 / -1;
  }
  
  .detail-item pre {
    background-color: #f8f8f8;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9rem;
    color: #333;
  }
  
  .modal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #e0e0e0;
  }
  
  /* Edit Modal */
  .edit-modal {
    max-width: 600px;
  }
  
  .edit-form {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
  }
  
  .form-group label {
    margin-bottom: 8px;
    color: #333;
  }
  
  .form-group input, .form-group select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
  }
  
  .checkbox-wrapper input {
    margin-right: 10px;
    width: 16px;
    height: 16px;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
  }
  
  .cancel-btn, .save-btn {
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .cancel-btn {
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    color: #555;
  }
  
  .save-btn {
    background-color: #4CAF50;
    border: none;
    color: white;
  }
  
  .cancel-btn:hover {
    background-color: #e0e0e0;
  }
  
  .save-btn:hover {
    background-color: #43A047;
  }
  
  /* Confirm Dialog */
  .confirm-dialog {
    max-width: 400px;
  }
  
  .confirm-dialog .modal-actions {
    justify-content: flex-end;
    margin-top: 10px;
    padding-top: 0;
    border-top: none;
  }
  
  .btn {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    color: white;
  }
  
  .btn.cancel-btn {
    background-color: #f0f0f0;
    color: #555;
    border: 1px solid #ddd;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .action-bar {
      flex-direction: column;
    }
    
    .filters {
      flex-direction: column;
    }
    
    .search-bar {
      width: 100%;
    }
    
    .search-bar input {
      flex-grow: 1;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .detail-grid {
      grid-template-columns: 1fr;
    }
    
    .modal-content {
      width: 95%;
    }
  }
  </style>