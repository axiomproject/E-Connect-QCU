<template>
  <div class="donate-page">
    <!-- Header component -->
    <AppHeader 
      :username="user?.username || 'User'" 
      @logout="logout" 
    />

    <!-- Main Content -->
    <main class="donate-main">
      <div class="container">
        <section class="hero-section">
          <h2>Support Environmental Causes</h2>
          <p>Your donation helps fund critical ecological initiatives and community projects around the world.</p>
        </section>

        <div class="donation-container">
          <!-- Donation Form -->
          <div class="donation-form-container">
            <div class="donation-form">
              <h3>Make a Donation</h3>

              <!-- Donation Amount Section -->
              <div class="form-section">
                <h4>Select Amount</h4>
                <div class="amount-options">
                  <button 
                    v-for="amount in donationAmounts" 
                    :key="amount"
                    @click="selectAmount(amount)"
                    :class="{'selected': selectedAmount === amount}"
                    class="amount-btn"
                  >
                    ₱{{ amount }}
                  </button>
                  <div class="custom-amount">
                    <label for="customAmount">Custom Amount (₱):</label>
                    <input 
                      type="number" 
                      id="customAmount" 
                      v-model="customAmount"
                      @input="handleCustomAmount"
                      placeholder="Enter amount"
                      min="1"
                    >
                  </div>
                </div>
              </div>

              <!-- Project Selection -->
              <div class="form-section">
                <h4>Support a Project</h4>
                <div class="project-selection">
                  <div 
                    v-for="project in projects" 
                    :key="project.id"
                    :class="{'selected': selectedProject === project.id}"
                    class="project-option"
                    @click="selectProject(project.id)"
                  >
                    <div class="project-icon">{{ project.icon }}</div>
                    <div class="project-details">
                      <h5>{{ project.name }}</h5>
                      <p>{{ project.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Personal Information -->
              <div class="form-section">
                <h4>Your Information</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" v-model="donor.firstName" placeholder="Your first name">
                  </div>
                  <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" v-model="donor.lastName" placeholder="Your last name">
                  </div>
                  <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" v-model="donor.email" placeholder="Your email address">
                  </div>
                  <div class="form-group">
                    <label for="phone">Phone Number (Optional)</label>
                    <input type="tel" id="phone" v-model="donor.phone" placeholder="Your phone number">
                  </div>
                </div>
              </div>

              <!-- Payment Methods -->
              <div class="form-section">
                <h4>Payment Method</h4>
                <div class="payment-methods">
                  <div 
                    v-for="method in paymentMethods" 
                    :key="method.id"
                    :class="{'selected': selectedPaymentMethod === method.id}"
                    class="payment-option"
                    @click="selectPaymentMethod(method.id)"
                  >
                    <div class="payment-icon">{{ method.icon }}</div>
                    <div class="payment-name">{{ method.name }}</div>
                  </div>
                </div>

                <div v-if="selectedPaymentMethod === 'gcash'" class="card-details">
  <div class="form-group">
    <label for="gcashName">GCash Name</label>
    <input type="text" id="gcashName" placeholder="Enter GCash account name">
  </div>
  <div class="form-group">
    <label for="gcashNumber">GCash Number</label>
    <input type="text" id="gcashNumber" placeholder="Enter GCash number">
  </div>
</div>

<div v-if="selectedPaymentMethod === 'maya'" class="card-details">
  <div class="form-group">
    <label for="mayaName">Maya Name</label>
    <input type="text" id="mayaName" placeholder="Enter Maya account name">
  </div>
  <div class="form-group">
    <label for="mayaNumber">Maya Number</label>
    <input type="text" id="mayaNumber" placeholder="Enter Maya number">
  </div>
</div>

<div v-if="selectedPaymentMethod === 'bank'" class="card-details">
  <div class="bank-instructions">
    <h5>Bank Transfer Instructions</h5>
    <p>Please transfer your donation to the following bank account:</p>
    <div class="bank-details">
      <p><strong>Account Name:</strong> E-Connect Environmental Foundation</p>
      <p><strong>Account Number:</strong> 1234-5678-9012-3456</p>
      <p><strong>Bank:</strong> Philippine National Bank</p>
      <p><strong>Branch:</strong> Manila Main</p>
    </div>
    <div class="bank-note">
      <p>Important: Please include your full name and email address in the reference/note section of your transfer so we can properly acknowledge your donation.</p>
      <p>After completing your transfer, please click "Donate Now" below to register your donation in our system.</p>
    </div>
  </div>
</div>
              </div>

              <!-- Recurring Donation Option -->
              <div class="form-section recurring-section">
  <div class="checkbox-group">
    <input type="checkbox" id="recurring" v-model="isRecurring">
    <label for="recurring">Make this a monthly donation</label>
  </div>
  <p class="recurring-note">You can cancel your recurring donation at any time.</p>
</div>

              <!-- Submit Button -->
              <button @click="processDonation" class="donate-btn">
                {{ isRecurring ? 'Donate Monthly' : 'Donate Now' }} 
                {{ selectedAmount ? `₱${selectedAmount}` : customAmount ? `₱${customAmount}` : '' }}
              </button>
            </div>
          </div>

          <!-- Impact Information -->
          <div class="impact-container">
            <div class="impact-card">
              <h3>Your Impact</h3>
              
              <div class="impact-item">
                <div class="impact-icon">🌳</div>
                <div class="impact-content">
                  <h4>Reforestation</h4>
                  <p>₱50 plants 50 trees in areas affected by deforestation, providing habitat for wildlife.</p>
                </div>
              </div>
              
              <div class="impact-item">
                <div class="impact-icon">🐢</div>
                <div class="impact-content">
                  <h4>Ocean Conservation</h4>
                  <p>₱100 helps clean 200 pounds of plastic from our oceans and supports marine life protection.</p>
                </div>
              </div>
              
              <div class="impact-item">
                <div class="impact-icon">🧪</div>
                <div class="impact-content">
                  <h4>Clean Water</h4>
                  <p>₱150 provides clean water solutions to communities affected by pollution.</p>
                </div>
              </div>
              
              <div class="impact-item">
                <div class="impact-icon">🔆</div>
                <div class="impact-content">
                  <h4>Renewable Energy</h4>
                  <p>₱200 helps install solar panels in underserved communities, reducing carbon emissions.</p>
                </div>
              </div>
              
              <div class="testimonial">
                <blockquote>
                  "Thanks to generous donors, we've planted over 10,000 trees in the Philippines this year, helping restore habitats and combat climate change."
                </blockquote>
                <cite>- Forest Restoration Project</cite>
              </div>
              
              <div class="donation-security">
                <div class="security-icon">🔒</div>
                <p>Your donation is secure and will be processed using industry-standard encryption.</p>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppHeader from '../views/Header.vue'
import AppFooter from '../views/Footer.vue'

interface User {
  username: string;
  [key: string]: any;
}

const router = useRouter()
const authStore = useAuthStore()

const user = computed<User | null>(() => authStore.user as User | null)

// Donation amount options
const donationAmounts = [25, 50, 100, 200]
const selectedAmount = ref<number | null>(null)
const customAmount = ref('')

// Project options
const projects = [
  { 
    id: 'reforestation', 
    name: 'Reforestation Projects', 
    description: 'Plant trees in deforested areas across the Philippines',
    icon: '🌳' 
  },
  { 
    id: 'ocean', 
    name: 'Ocean Cleanup', 
    description: 'Remove plastic and pollution from coastal areas',
    icon: '🌊' 
  },
  { 
    id: 'water', 
    name: 'Clean Water Initiative', 
    description: 'Provide clean water solutions to affected communities',
    icon: '💧' 
  },
  { 
    id: 'renewable', 
    name: 'Renewable Energy', 
    description: 'Support solar and wind energy projects',
    icon: '☀️' 
  }
]
const selectedProject = ref('reforestation')

// Payment methods
const paymentMethods = [
  { id: 'gcash', name: 'GCash', icon: '💰' },
  { id: 'maya', name: 'Maya', icon: '💲' },
  { id: 'bank', name: 'Bank Transfer', icon: '🏦' }
]
const selectedPaymentMethod = ref('gcash')

// Donor information
const donor = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

// Recurring donation option
const isRecurring = ref(false)

// Functions
const selectAmount = (amount: number) => {
  selectedAmount.value = amount
  customAmount.value = ''
}

const handleCustomAmount = () => {
  selectedAmount.value = null
}

const selectProject = (projectId: string) => {
  selectedProject.value = projectId
}

const selectPaymentMethod = (methodId: string) => {
  selectedPaymentMethod.value = methodId
}

const processDonation = async () => {
  try {
    // Validate inputs
    const finalAmount = selectedAmount.value || (customAmount.value ? parseFloat(customAmount.value) : 0)
    
    if (!finalAmount || finalAmount <= 0) {
      alert('Please select or enter a valid donation amount')
      return
    }
    
    if (!donor.value.firstName || !donor.value.lastName || !donor.value.email) {
      alert('Please fill in your personal information')
      return
    }
    
    // Collect payment details based on payment method
    let paymentDetails = {}
    
    if (selectedPaymentMethod.value === 'gcash') {
      const gcashName = (document.getElementById('gcashName') as HTMLInputElement).value
      const gcashNumber = (document.getElementById('gcashNumber') as HTMLInputElement).value
      
      if (!gcashName || !gcashNumber) {
        alert('Please enter your GCash details')
        return
      }
      
      paymentDetails = { gcashName, gcashNumber }
    } else if (selectedPaymentMethod.value === 'maya') {
      const mayaName = (document.getElementById('mayaName') as HTMLInputElement).value
      const mayaNumber = (document.getElementById('mayaNumber') as HTMLInputElement).value
      
      if (!mayaName || !mayaNumber) {
        alert('Please enter your Maya details')
        return
      }
      
      paymentDetails = { mayaName, mayaNumber }
    }
    
    // Prepare donation data
    const donationData = {
      amount: finalAmount,
      project: selectedProject.value,
      paymentMethod: selectedPaymentMethod.value,
      paymentDetails,
      isRecurring: isRecurring.value,
      donor: donor.value
    }
    
    // Show loading state (optional)
    // isProcessing.value = true
    
    // Send donation to backend
    const authToken = localStorage.getItem('token') || sessionStorage.getItem('token')
    const response = await fetch('/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(donationData)
    })
    
    // Hide loading state (optional)
    // isProcessing.value = false
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error processing donation')
    }
    
    const result = await response.json()
    
    // Show success message
    alert(`Thank you for your ${isRecurring.value ? 'monthly' : 'one-time'} donation of ₱${finalAmount} to our ${selectedProject.value} project!`)
    
    // Reset the form
    selectedAmount.value = null
    customAmount.value = ''
    donor.value = { firstName: '', lastName: '', email: '', phone: '' }
    isRecurring.value = false
    
  } catch (error) {
    console.error('Donation error:', error)
    if (error instanceof Error) {
      alert(`Error processing donation: ${error.message}`)
    } else {
      alert('Error processing donation: Unknown error occurred')
    }
  }
}

const logout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.donate-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.donate-main {
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

/* Donation container layout */
.donation-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
}

@media (min-width: 1024px) {
  .donation-container {
    grid-template-columns: 3fr 2fr;
  }
}

/* Donation form styling */
.donation-form-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.donation-form {
  padding: 30px;
}

.donation-form h3 {
  font-size: 1.6rem;
  color: #2E7D32;
  margin-bottom: 25px;
  text-align: center;
}

.form-section {
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.form-section:last-child {
  border-bottom: none;
}

.form-section h4 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 15px;
}

/* Amount selection */
.amount-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.amount-btn {
  background-color: #f1f8e9;
  border: 2px solid #c8e6c9;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #2E7D32;
  cursor: pointer;
  transition: all 0.2s ease;
}

.amount-btn:hover {
  background-color: #c8e6c9;
}

.amount-btn.selected {
  background-color: #2E7D32;
  border-color: #2E7D32;
  color: white;
}

.custom-amount {
  width: 100%;
  margin-top: 15px;
}

.custom-amount label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.custom-amount input {
  width: 100%;
  padding: 12px;
  border: 2px solid #c8e6c9;
  border-radius: 8px;
  font-size: 1rem;
}

/* Project selection */
.project-selection {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.project-option {
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-option:hover {
  border-color: #a5d6a7;
  background-color: #f1f8e9;
}

.project-option.selected {
  border-color: #43A047;
  background-color: #f1f8e9;
}

.project-icon {
  font-size: 2rem;
  margin-right: 15px;
}

.project-details h5 {
  font-size: 1.1rem;
  margin-bottom: 5px;
  color: #2E7D32;
}

.project-details p {
  font-size: 0.9rem;
  color: #666;
}

/* Form styling */
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.form-group input:focus {
  border-color: #43A047;
  outline: none;
}

/* Payment methods */
.payment-methods {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.payment-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.payment-option:hover {
  border-color: #a5d6a7;
  background-color: #f1f8e9;
}

.payment-option.selected {
  border-color: #43A047;
  background-color: #f1f8e9;
}

.payment-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.card-details {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

/* Recurring donation section */
.recurring-section {
  border-bottom: none;
  margin-top: 30px;
}

.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.checkbox-group input[type="checkbox"] {
  margin-right: 10px;
  width: 18px;
  height: 18px;
}

.recurring-note {
  font-size: 0.9rem;
  color: #666;
  margin-left: 28px;
}

/* Submit button */
.donate-btn {
  background: linear-gradient(90deg, #43A047, #66BB6A);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 16px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.donate-btn:hover {
  background: linear-gradient(90deg, #2E7D32, #43A047);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(67, 160, 71, 0.3);
}

/* Impact section */
.impact-container {
  margin-top: 10px;
}

.impact-card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.impact-card h3 {
  font-size: 1.6rem;
  color: #2E7D32;
  margin-bottom: 25px;
  text-align: center;
}

.impact-item {
  display: flex;
  margin-bottom: 20px;
}

.impact-icon {
  font-size: 2rem;
  margin-right: 15px;
  display: flex;
  align-items: center;
}

.impact-content h4 {
  font-size: 1.1rem;
  color: #2E7D32;
  margin-bottom: 5px;
}

.impact-content p {
  font-size: 0.95rem;
  color: #555;
}

.testimonial {
  background-color: #f1f8e9;
  border-left: 4px solid #43A047;
  padding: 20px;
  margin: 30px 0;
  border-radius: 0 8px 8px 0;
}

.testimonial blockquote {
  font-style: italic;
  margin: 0;
  color: #444;
  margin-bottom: 10px;
}

.testimonial cite {
  font-weight: 500;
  color: #2E7D32;
}

.donation-security {
  display: flex;
  align-items: center;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.security-icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.donation-security p {
  font-size: 0.9rem;
  color: #555;
}

/* Responsive adjustments for mobile */
@media (max-width: 768px) {
  .donation-form {
    padding: 20px;
  }
  
  .form-section {
    padding-bottom: 15px;
    margin-bottom: 20px;
  }
  
  .impact-card {
    padding: 20px;
  }
}
.bank-instructions {
  margin-bottom: 15px;
}

.bank-instructions h5 {
  font-size: 1.1rem;
  color: #2E7D32;
  margin-bottom: 10px;
}

.bank-details {
  background-color: #f1f8e9;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.bank-note {
  font-size: 0.95rem;
  color: #555;
  padding: 10px;
  border-left: 3px solid #66BB6A;
}
/* Custom checkbox styling */
.checkbox-group {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
}

.checkbox-group input[type="checkbox"] {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-weight: 500;
  color: #2E7D32;
  font-size: 1.05rem;
  cursor: pointer;
  user-select: none;
}

.checkbox-group label::before {
  content: '';
  display: inline-block;
  width: 22px;
  height: 22px;
  margin-right: 12px;
  border: 2px solid #a5d6a7;
  border-radius: 5px;
  background-color: #f1f8e9;
  transition: all 0.2s ease;
}

.checkbox-group input[type="checkbox"]:checked + label::before {
  background-color: #43A047;
  border-color: #43A047;
}

.checkbox-group input[type="checkbox"]:checked + label::after {
  content: '✓';
  position: absolute;
  left: 6px;
  top: 2px;
  color: white;
  font-size: 16px;
}

.checkbox-group input[type="checkbox"]:focus + label::before {
  box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.3);
}

.checkbox-group:hover label::before {
  border-color: #43A047;
}

.recurring-note {
  font-size: 0.9rem;
  color: #666;
  margin-left: 34px;
  margin-top: 6px;
}
</style>