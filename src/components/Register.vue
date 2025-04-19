<template>
  <div class="register-container">
    <!-- Minimal back button to login page -->
    <button @click="goToLogin" class="back-button" aria-label="Back to login">
      <span class="back-icon">←</span>
    </button>

    <img src="../assets/logo.png" alt="E-Connect Logo" class="register-logo" />
    
    <div v-if="registrationSuccess" class="success-message">
      <div class="success-icon">✓</div>
      <h3>Registration Successful!</h3>
      <p>A verification email has been sent to <strong>{{ email }}</strong>. Please check your inbox and click the verification link to complete your registration.</p>
      <p>Didn't receive the email? <button @click="resendVerification" :disabled="loading" class="resend-btn">
        {{ loading ? 'Sending...' : 'Resend verification email' }}
      </button></p>
      <div class="back-to-login">
        <button @click="goToLogin" class="login-btn">Go to Login</button>
      </div>
    </div>
    
    <form v-if="!registrationSuccess" @submit.prevent="validateAndSubmit">
  <h2>Create Account</h2>
  <div class="form-group" :class="{ 'invalid': usernameError && usernameValidated }">
    <label for="username">Username</label>
    <input 
      type="text" 
      id="username" 
      v-model="username" 
      placeholder="Choose a username"
      @blur="validateUsername"
      @input="onUsernameInput"
      required
    />
    <span class="validation-message" v-if="usernameError && usernameValidated">{{ usernameError }}</span>
  </div>

  <div class="form-group" :class="{ 'invalid': emailError && emailValidated }">
    <label for="email">Email</label>
    <input 
      type="email" 
      id="email" 
      v-model="email" 
      placeholder="Enter your email"
      @blur="validateEmail"
      @input="onEmailInput"
      required
    />
    <span class="validation-message" v-if="emailError && emailValidated">{{ emailError }}</span>
  </div>
  
  <div class="form-group" :class="{ 'invalid': passwordError && passwordValidated }">
    <label for="password">Password</label>
    <div class="password-input-container">
      <input 
        :type="showPassword ? 'text' : 'password'" 
        id="password" 
        v-model="password" 
        placeholder="Create a strong password"
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
  </div>
  
  <div v-if="error" class="error">{{ error }}</div>
  <button type="submit" :disabled="loading || !isFormValid" class="submit-btn">
    {{ loading ? 'Registering...' : 'Register' }}
  </button>
  <p class="login-link">
    Already have an account? <router-link to="/login">Login</router-link>
  </p>
</form>
    
    <!-- Only for testing purposes - remove in production -->
    <div v-if="verificationLink" class="verification-test">
      <p>For testing: <a :href="verificationLink" target="_blank">Click here to verify email</a></p>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const registrationSuccess = ref(false)
const showPassword = ref(false)
const usernameError = ref('')
const emailError = ref('')
const passwordError = ref('')
const usernameValidated = ref(false)
const emailValidated = ref(false)
const passwordValidated = ref(false)
const loading = computed(() => authStore.loading)
const verificationLink = computed(() => authStore.verificationLink)

onMounted(() => {
  document.body.classList.add('register-page')
  
  // Clean up when component unmounts
  return () => {
    document.body.classList.remove('register-page')
  }
})

const handleRegister = async () => {
  try {
    error.value = ''
    
    await authStore.register({
      username: username.value,
      email: email.value,
      password: password.value
    })
    
    registrationSuccess.value = true
  } catch (err: any) {
    error.value = err.message
  }
}

const resendVerification = async () => {
  try {
    error.value = ''
    await authStore.resendVerification(email.value)
    alert('Verification email has been resent. Please check your inbox.')
  } catch (err: any) {
    error.value = err.message
  }
}
const isFormValid = computed(() => {
  return username.value.length >= 3 && 
         isValidEmail(email.value) && 
         password.value.length >= 8 &&
         !usernameError.value && 
         !emailError.value && 
         !passwordError.value
})
// Validation functions
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateUsername = () => {
  usernameValidated.value = true
  if (username.value.length < 3) {
    usernameError.value = 'Username must be at least 3 characters'
    return false
  }
  
  if (username.value.length > 30) {
    usernameError.value = 'Username cannot exceed 30 characters'
    return false
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username.value)) {
    usernameError.value = 'Username can only contain letters, numbers, and underscores'
    return false
  }
  
  usernameError.value = ''
  return true
}

const validateEmail = () => {
  emailValidated.value = true
  if (!isValidEmail(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return false
  }
  emailError.value = ''
  return true
}

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

const onUsernameInput = () => {
  if (usernameValidated.value) validateUsername()
}

const onEmailInput = () => {
  if (emailValidated.value) validateEmail()
}

const onPasswordInput = () => {
  if (passwordValidated.value) validatePassword()
}

const validateAndSubmit = async () => {
  // Validate all fields
  const isUsernameValid = validateUsername()
  const isEmailValid = validateEmail()
  const isPasswordValid = validatePassword()
  
  if (!isUsernameValid || !isEmailValid || !isPasswordValid) {
    return
  }
  
  await handleRegister()
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* Background styling that matches login page */
body.register-page {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
  position: relative;
  overflow: hidden;
}

body.register-page::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,.07)' fill-rule='evenodd'/%3E%3C/svg%3E");
  z-index: 0;
}

.register-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  background: linear-gradient(150deg, #ffffff 0%, #f1f8e9 100%);
  overflow: hidden;
  color: #333;
}

.register-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 6px;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  z-index: 2;
}

/* Minimal back button styling */
.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  color: #4CAF50;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 5;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background-color: #4CAF50;
  color: white;
  transform: translateX(-3px);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.back-button:active {
  transform: translateX(-2px);
}

.back-icon {
  font-size: 20px;
  line-height: 1;
}

/* Responsive adjustments for the back button */
@media (max-width: 480px) {
  .back-button {
    top: 15px;
    left: 15px;
    width: 32px;
    height: 32px;
  }
  
  .back-icon {
    font-size: 18px;
  }
}

.register-logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  display: block;
  margin: 0 auto 20px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #333;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

/* Add these CSS rules to your style section */

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

.validation-message {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  word-wrap: break-word; /* Ensures text wraps instead of overflowing */
}

/* Fix for error message */
.error {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: 12px 15px;
  margin: 15px 0;
  word-wrap: break-word;
  border-left: 3px solid #E53935;
}

.form-group {
  margin-bottom: 20px;
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

.submit-btn {
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

.submit-btn:hover {
  background: linear-gradient(90deg, #388E3C, #4CAF50);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

.submit-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* Add ripple effect to button */
.submit-btn::after {
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

.submit-btn:active::after {
  width: 300px;
  height: 300px;
  opacity: 1;
  transition: 0s;
}

.submit-btn:disabled {
  background: linear-gradient(90deg, #B0BEC5, #CFD8DC);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.error {
  background-color: #FFF6F6;
  color: #E53935;
  border-radius: 12px;
  font-size: 14px;
}

p {
  margin-top: 20px;
  text-align: center;
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

.login-link {
  margin-top: 20px;
}

/* Success message styling */
.success-message {
  text-align: center;
  padding: 20px;
  border-radius: 16px;
  background-color: rgba(232, 245, 233, 0.8);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(76, 175, 80, 0.2);
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.success-icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  background-color: #4CAF50;
  color: white;
  border-radius: 50%;
  font-size: 30px;
  margin-bottom: 15px;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.success-message h3 {
  color: #2E7D32;
  margin-bottom: 15px;
  font-size: 22px;
}

.success-message p {
  margin-bottom: 15px;
  line-height: 1.5;
  color: #555;
  font-size: 15px;
}

.resend-btn {
  background: none;
  border: none;
  color: #4CAF50;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;
  text-decoration: underline;
  padding: 0;
  transition: color 0.2s;
}

.resend-btn:hover {
  color: #2E7D32;
}

.back-to-login {
  margin-top: 25px;
}

.login-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 12px 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3);
}

.login-btn:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.4);
}

/* Testing verification link */
.verification-test {
  margin-top: 20px;
  padding: 15px;
  background-color: rgba(255, 243, 224, 0.8);
  border: 1px dashed #FF9800;
  border-radius: 12px;
  font-size: 14px;
  backdrop-filter: blur(5px);
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

/* Responsive adjustments */
@media (max-width: 480px) {
  .register-container {
    width: 90%;
    padding: 30px 20px 40px;
  }
  
  .register-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 20px;
  }
  
  h2 {
    font-size: 24px;
  }
  
  .back-button {
    top: 15px;
    left: 15px;
    font-size: 12px;
  }
}

@media (max-height: 700px) {
  .register-container {
    padding: 30px 20px;
  }
  
  .register-logo {
    width: 60px;
    height: 60px;
    margin-bottom: 15px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  input {
    padding: 12px;
  }
  
  .submit-btn {
    padding: 12px;
  }
}
.form-group.invalid input {
  border: 1px solid #f44336;
  background-color: #fff2f2;
}

.validation-message {
  display: block;
  color: #f44336;
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  animation: fadeIn 0.3s ease-in;
}
</style>
