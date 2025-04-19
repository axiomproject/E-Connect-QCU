<template>
  <div class="verify-email-container">
    <div v-if="loading" class="loading">
      <h2>Verifying your email...</h2>
      <p>Please wait while we verify your email address.</p>
    </div>
    
    <div v-else-if="verified" class="success">
      <h2>Email Verified Successfully!</h2>
      <p>Your email has been verified. You will be redirected to login shortly.</p>
      <div class="redirect-countdown" v-if="countdown > 0">
        Redirecting in {{ countdown }} seconds...
      </div>
      <button @click="handleManualRedirect" class="login-btn">
        Go to Login
      </button>
    </div>
    
    <div v-else class="error">
      <h2>Verification Failed</h2>
      <p>{{ error }}</p>
      <div class="actions">
        <router-link to="/login" class="btn">Go to Login</router-link>
        <router-link to="/register" class="btn">Register Again</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const verified = ref(false);
const error = ref('');
const countdown = ref(5);

// Add a state to track whether to auto-redirect
const shouldAutoRedirect = ref(true);

const verifyEmail = async () => {
  try {
    const token = route.query.token as string;
    
    if (!token) {
      throw new Error('Verification token is missing');
    }
    
    console.log('Component loaded, route token:', token);
    
    const baseURL = import.meta.env.VITE_API_URL || '';
    if (!baseURL) {
      throw new Error('API URL is not configured');
    }
    
    console.log(`Verifying email with token: ${token}`);
    console.log(`API URL: ${baseURL}`);
    
    const response = await fetch(`${baseURL}/api/verify-email?token=${token}`);
    const data = await response.json();
    
    console.log('Verification response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Verification failed');
    }
    
    // If verification successful, store the token but don't auto-redirect if user is now logged in
    if (data.token) {
      // Store token temporarily but don't use it for auto-login
      // This way user explicitly logs in after verification
      const temporaryToken = data.token;
      console.log('Token received after verification but not storing it yet');
      
      // Don't automatically store the auth token
      // localStorage.setItem('token', data.token);
      // authStore.token = data.token;
      
      // But do store user data if available
      if (data.user) {
        // Just store email for login form pre-filling
        localStorage.setItem('verified_email', data.user.email);
        console.log('User email stored for login form:', data.user.email);
      }
    }
    
    verified.value = true;
    
    // Start countdown for redirect
    const interval = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(interval);
        if (shouldAutoRedirect.value) {
          goToLogin();
        }
      }
    }, 1000);
    
  } catch (err: any) {
    console.error('Email verification error:', err);
    error.value = err.message || 'An error occurred during verification';
    verified.value = false;
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  console.log('Redirecting to login page');
  // Make sure we're explicitly going to login, not dashboard
  localStorage.removeItem('token'); // Remove any existing token to prevent auto-redirect
  router.push('/login');
};

// Cancel auto-redirect when user clicks the button
const handleManualRedirect = () => {
  shouldAutoRedirect.value = false;
  goToLogin();
};

onMounted(() => {
  console.log('VerifyEmail component mounted');
  verifyEmail();
});
</script>

<style scoped>
.verify-email-container {
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
  text-align: center;
}

h2 {
  color: #4CAF50;
  margin-bottom: 20px;
}

.loading, .success, .error {
  padding: 20px;
}

.success {
  background-color: #e8f5e9;
  border-radius: 8px;
}

.error {
  background-color: #ffebee;
  border-radius: 8px;
}

.error h2 {
  color: #f44336;
}

.redirect-countdown {
  margin: 15px 0;
  font-style: italic;
  color: #666;
}

.login-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 15px;
  transition: all 0.3s;
}

.login-btn:hover {
  background: #388E3C;
  transform: translateY(-2px);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.btn {
  background: #4CAF50;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.3s;
}

.btn:hover {
  background: #388E3C;
  transform: translateY(-2px);
}
</style>
