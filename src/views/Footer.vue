<template>
  <footer class="dashboard-footer">
    <div class="container footer-content">
      <div class="footer-info">
        <p>&copy; {{ currentYear }} E-Connect. All rights reserved.</p>
      </div>
      <div class="footer-links">
        <a href="#" @click.prevent="openModal('privacy')">Privacy Policy</a>
        <a href="#" @click.prevent="openModal('terms')">Terms of Service</a>
        <a href="#" @click.prevent="openModal('contact')">Contact Us</a>
      </div>
    </div>
    
    <!-- Simple Modal Component -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="isModalOpen" class="modal-backdrop" @click="closeModal">
          <div class="modal" @click.stop>
            <button class="modal-close" @click="closeModal">&times;</button>
            
            <!-- Privacy Policy Content -->
            <div v-if="activeModal === 'privacy'" class="modal-content">
              <h2>Privacy Policy</h2>
              <div class="modal-body">
                <p>At E-Connect, we value your privacy and are committed to protecting your personal data.</p>
                
                <h3>Information We Collect</h3>
                <p>We collect basic account information when you register, as well as data about your environmental activities that you choose to share.</p>
                
                <h3>How We Use Your Information</h3>
                <p>Your data helps us calculate your environmental impact, personalize your experience, and improve our services.</p>
                
                <h3>Data Security</h3>
                <p>We implement appropriate security measures to protect your personal information from unauthorized access or disclosure.</p>
                
                <h3>Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal information at any time through your account settings.</p>
              </div>
            </div>
            
            <!-- Terms of Service Content -->
            <div v-else-if="activeModal === 'terms'" class="modal-content">
              <h2>Terms of Service</h2>
              <div class="modal-body">
                <p>By using E-Connect, you agree to these Terms of Service.</p>
                
                <h3>Account Responsibilities</h3>
                <p>You are responsible for maintaining the security of your account. Any activities that occur under your account are your responsibility.</p>
                
                <h3>Acceptable Use</h3>
                <p>You agree not to misuse our services or help anyone else do so. This includes attempting to access our services by methods other than the interface and instructions we provide.</p>
                
                <h3>Content Guidelines</h3>
                <p>Any content you submit must be accurate and must not violate the rights of any third party.</p>
                
                <h3>Modifications to Service</h3>
                <p>We reserve the right to modify or discontinue our service temporarily or permanently at any time.</p>
              </div>
            </div>
            
            <!-- Contact Us Content -->
            <div v-else-if="activeModal === 'contact'" class="modal-content">
              <h2>Contact Us</h2>
              <div class="modal-body">
                <p>We're here to help! Please use one of the following methods to get in touch with us.</p>
                
                <h3>Email</h3>
                <p><a href="mailto:econnect@gmail.com" class="contact-link">econnect@gmail.com</a></p>
                
                <h3>Message Form</h3>
                <form class="contact-form" @submit.prevent="submitContactForm">
                  <div class="form-group">
                    <label for="name">Name</label>
                    <input type="text" id="name" v-model="contactForm.name" placeholder="Your name" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" id="email" v-model="contactForm.email" placeholder="Your email" required>
                  </div>
                  
                  <div class="form-group">
                    <label for="message">Message</label>
                    <textarea id="message" v-model="contactForm.message" rows="4" placeholder="How can we help you?" required></textarea>
                  </div>
                  <div v-if="formError" class="form-error">{{ formError }}</div>
<div v-if="formSuccess" class="form-success">{{ formSuccess }}</div>
<button type="submit" class="submit-btn" :disabled="isSubmitting">
  {{ isSubmitting ? 'Sending...' : 'Send Message' }}
</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </footer>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import axios from 'axios'
const currentYear = computed(() => new Date().getFullYear())
const isModalOpen = ref(false)
const activeModal = ref('')
const isSubmitting = ref(false)
const formError = ref('')
const formSuccess = ref('')

// Contact form data
const contactForm = ref({
  name: '',
  email: '',
  message: ''
})

// Open a specific modal
const openModal = (modalType: string) => {
  activeModal.value = modalType
  isModalOpen.value = true
  // Prevent scrolling of background content
  document.body.style.overflow = 'hidden'
}

// Close the modal
const closeModal = () => {
  isModalOpen.value = false
  // Restore scrolling
  document.body.style.overflow = ''
}

// Handle contact form submission
const submitContactForm = async () => {
  try {
    isSubmitting.value = true
    formError.value = ''
    formSuccess.value = ''
    
    // Validate form
    if (!contactForm.value.name || !contactForm.value.email || !contactForm.value.message) {
      formError.value = 'Please fill out all fields'
      return
    }
    
    // Send data to backend API
    await axios.post('/api/contact', contactForm.value)
    
    // Show success message
    formSuccess.value = 'Your message has been sent! We will get back to you soon.'
    
    // Reset form
    contactForm.value = {
      name: '',
      email: '',
      message: ''
    }
    
    // Close modal after a short delay
    setTimeout(() => {
      closeModal()
    }, 3000)
    
  } catch (error: any) {
    console.error('Error submitting contact form:', error)
    formError.value = error.response?.data?.message || 'Failed to send message. Please try again later.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.dashboard-footer {
  background-color: #333;
  color: #fff;
  padding: 30px 0;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.footer-info p {
  margin: 0;
}

.footer-links {
  display: flex;
  gap: 20px;
}

.footer-links a {
  color: #fff;
  text-decoration: none;
  transition: color 0.2s;
  cursor: pointer;
}

.footer-links a:hover {
  color: #4CAF50;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background-color: white;
  border-radius: 8px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
}

.modal-close {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  z-index: 2;
}

.modal-content {
  padding: 25px;
}

.modal-content h2 {
  color: #2E7D32;
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.modal-body {
  color: #333;
}

.modal-body h3 {
  color: #2E7D32;
  margin-top: 20px;
  margin-bottom: 8px;
}

.modal-body p {
  margin-bottom: 15px;
  line-height: 1.5;
}

.contact-link {
  color: #2E7D32;
  text-decoration: none;
  font-weight: 500;
}

.contact-link:hover {
  text-decoration: underline;
}

/* Contact form styling */
.contact-form {
  margin-top: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background-color: #388E3C;
}

/* Transition animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 20px;
  }

  .modal {
    width: 95%;
  }
  .dashboard-footer{
    background-color: #b4dc84;
  }
}
.form-error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #f44336;
}

.form-success {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  border-left: 4px solid #4caf50;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
