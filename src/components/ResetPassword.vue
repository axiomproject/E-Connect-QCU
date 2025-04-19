<template>
    <div class="reset-password-container">
      <img src="../assets/logo.png" alt="Eco Tracker Logo" class="reset-logo" />
      
      <div v-if="loading" class="loading">
        <p>Verifying your reset link...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <h3>Reset Link Error</h3>
        <p>{{ error }}</p>
        <router-link to="/login" class="back-link">Back to login</router-link>
      </div>
      
      <div v-else-if="success" class="success-container">
        <h3>Password Reset Successful</h3>
        <p>Your password has been successfully reset.</p>
        <router-link to="/login" class="back-link">Back to login</router-link>
      </div>
      
      <div v-else class="form-container">
        <h3>Create New Password</h3>
        <p>Please enter a new password for your account.</p>
        
        <form @submit.prevent="validateAndSubmit">
          <div class="form-group" :class="{ 'invalid': passwordError && passwordValidated }">
  <label for="password">New Password</label>
  <div class="password-input-container">
    <input 
      :type="showPassword ? 'text' : 'password'" 
      id="password" 
      v-model="password"
      placeholder="Enter new password"
      @blur="validatePassword"
      @input="onPasswordInput" 
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
  <span class="validation-message" v-if="passwordError && passwordValidated">{{ passwordError }}</span>
  <div class="password-strength" v-if="password.length > 0">
    <div class="strength-meter">
      <div class="strength-bar" :style="{ width: passwordStrength.percentage + '%', backgroundColor: passwordStrength.color }"></div>
    </div>
    <span class="strength-text" :style="{ color: passwordStrength.color }">{{ passwordStrength.text }}</span>
  </div>
</div>
          
<div class="form-group" :class="{ 'invalid': confirmPasswordError && confirmPasswordValidated }">
  <label for="confirmPassword">Confirm Password</label>
  <div class="password-input-container">
    <input 
      :type="showConfirmPassword ? 'text' : 'password'" 
      id="confirmPassword" 
      v-model="confirmPassword"
      placeholder="Confirm new password"
      @blur="validateConfirmPassword"
      @input="onConfirmPasswordInput" 
      required
    />
    <span 
      class="password-toggle-icon" 
      v-show="confirmPassword.length > 0" 
      @click="showConfirmPassword = !showConfirmPassword"
    >
      <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
    </span>
  </div>
  <span class="validation-message" v-if="confirmPasswordError && confirmPasswordValidated">{{ confirmPasswordError }}</span>
          </div>
          
          <div v-if="formError" class="error">{{ formError }}</div>
          
          <button type="submit" :disabled="submitLoading || !isFormValid">
  {{ submitLoading ? 'Resetting...' : 'Reset Password' }}
</button>
        </form>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  
  const route = useRoute()
  const router = useRouter()
  
  const token = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const loading = ref(true)
  const error = ref('')
  const formError = ref('')
  const success = ref(false)
  const submitLoading = ref(false)
  const showPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordError = ref('')
const confirmPasswordError = ref('')
const passwordValidated = ref(false)
const confirmPasswordValidated = ref(false)
  
  onMounted(async () => {
    document.body.classList.add('reset-password-page')
    
    // Get token from URL
    token.value = route.query.token as string
    
    if (!token.value) {
      error.value = 'Invalid reset link. Please request a new password reset.'
      loading.value = false
      return
    }
    
    try {
      // Verify token with the backend
      const response = await fetch('/api/verify-reset-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: token.value })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        error.value = data.message || 'Invalid or expired reset link. Please request a new password reset.'
      }
    } catch (err: any) {
      error.value = 'Error verifying reset link. Please try again.'
    } finally {
      loading.value = false
    }
    
    return () => {
      document.body.classList.remove('reset-password-page')
    }
  })

  const isFormValid = computed(() => {
  return password.value.length >= 8 &&
         !passwordError.value &&
         !confirmPasswordError.value &&
         confirmPassword.value === password.value
})

// Password strength calculation
const passwordStrength = computed(() => {
  if (password.value.length === 0) {
    return { percentage: 0, color: '#ccc', text: '' }
  }
  
  let strength = 0
  const pwd = password.value
  
  // Length check
  if (pwd.length >= 8) strength += 25
  
  // Character variety checks
  if (/[A-Z]/.test(pwd)) strength += 25
  if (/[0-9]/.test(pwd)) strength += 25
  if (/[^A-Za-z0-9]/.test(pwd)) strength += 25
  
  let color = '#f44336' // weak (red)
  let text = 'Weak'
  
  if (strength >= 75) {
    color = '#4CAF50' // strong (green)
    text = 'Strong'
  } else if (strength >= 50) {
    color = '#FF9800' // medium (orange)
    text = 'Medium'
  }
  
  return { percentage: strength, color, text }
})

// Validation functions
const validatePassword = () => {
  passwordValidated.value = true
  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters'
    return false
  }
  
  if (!/[A-Z]/.test(password.value)) {
    passwordError.value = 'Password must contain at least one uppercase letter'
    return false
  }
  
  if (!/[0-9]/.test(password.value)) {
    passwordError.value = 'Password must contain at least one number'
    return false
  }
  
  if (!/[^A-Za-z0-9]/.test(password.value)) {
    passwordError.value = 'Password must contain at least one special character'
    return false
  }
  
  passwordError.value = ''
  return true
}

const validateConfirmPassword = () => {
  confirmPasswordValidated.value = true
  if (confirmPassword.value !== password.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }
  confirmPasswordError.value = ''
  return true
}

// Input handlers for real-time validation
const onPasswordInput = () => {
  if (passwordValidated.value) validatePassword()
  if (confirmPasswordValidated.value && confirmPassword.value) validateConfirmPassword()
}

const onConfirmPasswordInput = () => {
  if (confirmPasswordValidated.value) validateConfirmPassword()
}

const validateAndSubmit = async () => {
  // Validate all fields
  const isPasswordValid = validatePassword()
  const isConfirmPasswordValid = validateConfirmPassword()
  
  if (!isPasswordValid || !isConfirmPasswordValid) {
    return
  }
  
  await resetPassword()
}
  
  const resetPassword = async () => {
    // Clear previous errors
    formError.value = ''
    
    // Validate passwords
    if (password.value.length < 8) {
      formError.value = 'Password must be at least 8 characters long'
      return
    }
    
    if (password.value !== confirmPassword.value) {
      formError.value = 'Passwords do not match'
      return
    }
    
    submitLoading.value = true
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token.value,
          password: password.value
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password')
      }
      
      // Show success message
      success.value = true
      
      // Auto-redirect to login after 5 seconds
      setTimeout(() => {
        router.push('/login')
      }, 5000)
      
    } catch (err: any) {
      formError.value = err.message || 'An error occurred'
    } finally {
      submitLoading.value = false
    }
  }
  </script>
  
  <style scoped>
  body.reset-password-page {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
    position: relative;
    overflow: hidden;
  }
  
  body.reset-password-page::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='rgba(255,255,255,.07)' fill-rule='evenodd'/%3E%3C/svg%3E");
    z-index: 0;
  }
  
  .reset-password-container {
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
  }
  
  .reset-password-container::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    z-index: 2;
  }
  
  .reset-logo {
    width: 100px;
    height: 100px;
    object-fit: contain;
    display: block;
    margin: 0 auto 30px;
  }
  
  h3 {
    text-align: center;
    margin-bottom: 15px;
    color: #333;
    font-size: 24px;
    font-weight: 600;
  }
  
  p {
    text-align: center;
    margin-bottom: 25px;
    color: #555;
    font-size: 15px;
    line-height: 1.5;
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
  }
  
  input {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 12px;
    background-color: #f5f5f5;
    color: #333;
    font-size: 16px;
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
    box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
  }
  
  button:hover {
    background: linear-gradient(90deg, #388E3C, #4CAF50);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
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
  
  .error-container, .success-container {
    text-align: center;
    padding: 20px;
    border-radius: 16px;
  }
  
  .error-container {
    background-color: rgba(244, 67, 54, 0.1);
  }
  
  .success-container {
    background-color: rgba(76, 175, 80, 0.1);
  }
  
  .back-link {
    display: inline-block;
    margin-top: 20px;
    color: #4CAF50;
    text-decoration: none;
    font-weight: 600;
  }
  
  .back-link:hover {
    text-decoration: underline;
  }
  
  .loading {
    text-align: center;
  }
  
  @media (max-width: 480px) {
    .reset-password-container {
      padding: 30px 20px;
    }
    
    .reset-logo {
      width: 80px;
      height: 80px;
    }
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
/* Add validation styling */
.form-group.invalid input {
  border: 1px solid #f44336;
  background-color: #fff2f2;
  transition: all 0.3s ease;
}

.validation-message {
  display: block;
  color: #f44336;
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Password strength meter */
.password-strength {
  margin-top: 10px;
}

.strength-meter {
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 5px;
}

.strength-bar {
  height: 100%;
  width: 0;
  border-radius: 2px;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-text {
  font-size: 12px;
  font-weight: 500;
  float: right;
}

/* Fix for container sizing */
form, .form-group, input, .password-input-container, .error {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  transition: all 0.3s ease;
}

input, .password-input-container {
  transition: all 0.3s ease;
}

.form-group, .error {
  overflow: hidden;
  word-wrap: break-word;
}
  </style>