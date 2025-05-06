<template>
  <div class="login-container">
    <img src="../assets/logo.png" alt="Eco Tracker Logo" class="login-logo" />
    
    <div v-if="verificationRequired" class="verification-required">
      <h3>Email Verification Required</h3>
      <p>Your email address needs to be verified before you can log in.</p>
      <p>
        We sent a verification link to <strong>{{ email }}</strong>.
        Please check your inbox and click the link to verify your email address.
      </p>
      <button @click="resendVerification" :disabled="loading" class="resend-btn">
        {{ loading ? 'Sending...' : 'Resend verification email' }}
      </button>
      <div v-if="resendMessage" class="resend-message">
        {{ resendMessage }}
      </div>
      <!-- For testing purposes only - remove in production -->
      <div v-if="verificationLink" class="verification-test">
        <p>For testing: <a :href="verificationLink" target="_blank">Click here to verify email</a></p>
      </div>
    </div>

    <!-- Add the inactive account error message here -->
    <div v-else-if="inactiveAccountError" class="verification-required inactive-account">
      <h3>Account Archived</h3>
      <p>Your account has been archived and is no longer active.</p>
      <p>Please contact support if you wish to reactivate your account.</p>
    </div>

    <!-- Forgot Password Form -->
<div v-else-if="showForgotPassword" class="forgot-password-container">
  <h3>Reset Your Password</h3>
  <p>Enter your email address and we'll send you a link to reset your password.</p>
  
  <form @submit.prevent="handleForgotPassword">
    <div class="form-group">
      <label for="reset-email">Email</label>
      <input 
        type="email" 
        id="reset-email" 
        v-model="forgotPasswordEmail" 
        placeholder="Enter your email"
        required
      />
    </div>
    
    <div v-if="forgotPasswordError" class="error">{{ forgotPasswordError }}</div>
    <div v-if="forgotPasswordSuccess" class="success-message">{{ forgotPasswordSuccess }}</div>
    
    <button type="submit" :disabled="forgotPasswordLoading">
      {{ forgotPasswordLoading ? 'Sending...' : 'Send Reset Link' }}
    </button>
    
    <p>
      <a href="#" @click.prevent="showForgotPassword = false">
        Back to login
      </a>
    </p>
  </form>
</div>
    
    <template v-else>
      <h2>Welcome</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="Enter your email"
            required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input-container">
            <input 
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="Enter your password"
              required
            />
            <span 
              class="password-toggle-icon" 
              v-show="password.length > 0" 
              @click="showPassword = !showPassword"
            >
              <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </span>
          </div>
        </div>
        <div class="forgot-password-link">
          <a href="#" @click.prevent="showForgotPassword = true">Forgot password?</a>
        </div>
        <div class="error" v-if="error">{{ error }}</div>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        <p>
          Don't have an account? 
          <router-link to="/register">Register here</router-link>
        </p>
      </form>
      
    </template>
  </div>
  <div class="ad-banner-wrapper">
    <AdBanner class="ad-banner" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import "../styles/Login.css" 
import AdBanner from './AdBanner.vue'

const router = useRouter()
const authStore = useAuthStore()
// Forgot password state
const showForgotPassword = ref(false)
const forgotPasswordEmail = ref('')
const forgotPasswordError = ref('')
const forgotPasswordSuccess = ref('')
const forgotPasswordLoading = ref(false)
const email = ref('')
const password = ref('')
const error = ref('')
const verificationRequired = ref(false)
const resendMessage = ref('')
const showPassword = ref(false)
const inactiveAccountError = ref(false)

const loading = computed(() => authStore.loading)
const verificationLink = computed(() => authStore.verificationLink)

onMounted(() => {
  document.body.classList.add('login-page')
  
  // Check if there's a verified email to pre-fill
  const verifiedEmail = localStorage.getItem('verified_email');
  if (verifiedEmail) {
    email.value = verifiedEmail;
    // Clear it so it's only used once
    localStorage.removeItem('verified_email');
  }
  
  // Clean up when component unmounts
  return () => {
    document.body.classList.remove('login-page')
  }
})

const handleLogin = async () => {
  try {
    error.value = ''
    
    // Check if this might be an admin email (you can customize this logic)
    // For example, check if email belongs to admin domain or has a special pattern
    const isAdminLoginAttempt = email.value.includes('admin');
    
    if (isAdminLoginAttempt) {
      // Try admin login first
      try {
        await authStore.adminLogin({
          email: email.value,
          password: password.value
        })
        
        // Redirect to admin dashboard after successful login
        router.push('/admin/dashboard')
        return;
      } catch (adminErr: any) {
        // If admin login fails, we'll try regular user login as fallback
        console.log('Admin login failed, trying regular login');
      }
    }
    
    // Regular user login path
    await authStore.login({
      email: email.value,
      password: password.value
    })

     // Check if the account is inactive
     if (authStore.user && 'is_active' in authStore.user && authStore.user.is_active === false) {
      inactiveAccountError.value = true
      await authStore.logout() // Log them out immediately
      throw new Error('Your account has been archived')
    }
    
    router.push('/dashboard')
  } catch (err: any) {
    if (err.cause === 'verification_required') {
      verificationRequired.value = true
    } else if (err.cause === 'account_inactive') {
      inactiveAccountError.value = true
    } else {
      error.value = err.message
    }
  }
}

const resendVerification = async () => {
  try {
    resendMessage.value = ''
    
    const result = await authStore.resendVerification(email.value)
    resendMessage.value = 'Verification email has been sent. Please check your inbox.'
  } catch (err: any) {
    resendMessage.value = `Error: ${err.message}`
  }
}
const handleForgotPassword = async () => {
  try {
    // Reset message states
    forgotPasswordError.value = ''
    forgotPasswordSuccess.value = ''
    forgotPasswordLoading.value = true
    
    // Call API to send reset password email
    const response = await fetch('/api/reset-password-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: forgotPasswordEmail.value })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send reset link')
    }
    
    // Show success message
    forgotPasswordSuccess.value = 'Password reset link sent! Please check your email.'
    
    // Pre-fill the email field on the login form for convenience
    email.value = forgotPasswordEmail.value
    
    // Automatically return to login after 5 seconds
    setTimeout(() => {
      showForgotPassword.value = false
    }, 5000)
    
  } catch (err) {
    if (err instanceof Error) {
      forgotPasswordError.value = err.message || 'An error occurred'
    } else {
      forgotPasswordError.value = 'An error occurred'
    }
  } finally {
    forgotPasswordLoading.value = false
  }
}
</script>

<style scoped>
/* Background styling that pops */
body.login-page {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  position: relative;
  overflow: hidden;
}

body.login-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,.07)' fill-rule='evenodd'/%3E%3C/svg%3E");
  z-index: 0;
}

.login-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 40px;
  z-index: 1;
  transition: all 0.3s ease;
  overflow: hidden;
}

.login-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  z-index: 2;
}

.login-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  display: block;
  margin: 0 auto 30px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.form-group {
  margin-bottom: 25px;
  position: relative;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
  font-size: 14px;
  transition: all 0.3s ease;
}

input {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 12px;
  background-color: #f5f5f5;
  color: #333;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

input:focus {
  outline: none;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(90deg, #4CAF50, #66BB6A);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
  position: relative;
  overflow: hidden;
}

button:hover {
  background: linear-gradient(90deg, #388E3C, #4CAF50);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* Add ripple effect to button */
button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
}

button:active::after {
  width: 300px;
  height: 300px;
  opacity: 1;
  transition: 0s;
}

button:disabled {
  background: linear-gradient(90deg, #B0BEC5, #CFD8DC);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.error {
  background-color: #FFF6F6;
  color: #E53935;
  margin: 15px 0;
  padding: 12px 15px;
  border-radius: 12px;
  font-size: 14px;
  border-left: 3px solid #E53935;
}

p {
  text-align: center;
  margin-top: 25px;
  color: #666;
  font-size: 14px;
}

a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

a:hover {
  color: #2E7D32;
}

/* Verification required styling */
.verification-required {
  padding: 25px;
  background-color: rgba(232, 245, 233, 0.8);
  border-radius: 16px;
  margin-bottom: 25px;
  text-align: center;
  border: 1px solid rgba(76, 175, 80, 0.2);
  backdrop-filter: blur(5px);
}

.verification-required h3 {
  color: #2E7D32;
  margin-bottom: 15px;
  font-size: 22px;
}

.verification-required p {
  margin-bottom: 15px;
  line-height: 1.5;
  color: #555;
  font-size: 15px;
}

.resend-btn {
  margin-top: 10px;
  padding: 12px 20px;
  background: rgba(76, 175, 80, 0.15);
  color: #2E7D32;
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s;
  box-shadow: none;
}

.resend-btn:hover {
  background: rgba(76, 175, 80, 0.25);
}

.resend-message {
  margin-top: 15px;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  color: #2E7D32;
  background-color: rgba(76, 175, 80, 0.1);
}

.verification-test {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 243, 224, 0.8);
  border: 1px dashed #FF9800;
  border-radius: 12px;
  font-size: 14px;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .login-container {
    width: 90%;
    padding: 30px 20px;
  }
  
  .login-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 24px;
  }
  
  button {
    padding: 14px;
  }
}

@media (max-height: 600px) {
  .login-container {
    padding: 25px 20px;
  }
  
  .login-logo {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
}
/* Forgot password styling */
.forgot-password-container h3 {
  text-align: center;
  margin-bottom: 15px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.forgot-password-container p {
  margin-bottom: 25px;
  color: #555;
}

.forgot-password-link {
  text-align: right;
  margin-top: 8px;
  margin-bottom: 8px;
}

.forgot-password-link a {
  font-size: 14px;
  color: #666;
}

.forgot-password-link a:hover {
  color: #4CAF50;
  text-decoration: underline;
}

.success-message {
  background-color: #E8F5E9;
  color: #2E7D32;
  margin: 15px 0;
  padding: 12px 15px;
  border-radius: 12px;
  font-size: 14px;
  border-left: 3px solid #2E7D32;
}

/* Password visibility toggle styles */
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
  color: #4CAF50;
}

.password-input-container input {
  width: 100%;
  padding-right: 40px; /* Make room for the eye icon */
}
.inactive-account {
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
}
.inactive-account h3 {
  color: #F57C00;
}
/* Add these CSS rules to your Login.vue style section */

form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden; /* Prevents content from spilling out */
}

.form-group {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

input, 
.password-input-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease; /* Re-add the transition */
}

input:focus {
  outline: none;
  background-color: #fff;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15), inset 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease; /* Ensure transition works on focus */
}

/* Ensure transitions work for error states too */
.form-group.invalid input {
  border: 1px solid #f44336;
  background-color: #fff2f2;
  transition: all 0.3s ease;
}

.error {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word; /* Ensures text wraps instead of overflowing */
}

.success-message {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word;
}

/* Forgot password container */
.forgot-password-container {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.ad-banner-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  display: flex;
  justify-content: flex-end; /* align to the right */
  align-items: flex-end;
  z-index: 10;
  background: transparent;
  pointer-events: none;
  padding: 0;
  margin: 0;
}

.ad-banner {
  pointer-events: auto;
  margin: 0;
  padding: 0;
  /* Ensure the ad is flush with the bottom and right */
  border-radius: 0;
}

/* On mobile, still flush with bottom/right */
@media (max-width: 480px) {
  .ad-banner-wrapper {
    padding-bottom: 0;
  }
}
</style>
