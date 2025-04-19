import { defineStore } from 'pinia'
import { ref } from 'vue'

interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string; // Add avatar property
  adminDetails?: {

    admin_level: string;
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref<boolean>(false)
  const verificationLink = ref<string | null>(null)
  // Initialize isAdmin from localStorage if available
  const isAdmin = ref<boolean>(localStorage.getItem('isAdmin') === 'true')
  
  // Load user from localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      user.value = JSON.parse(storedUser)
    } catch (e) {
      console.error('Failed to parse stored user')
    }
  }

  const login = async (credentials: { email: string; password: string }) => {
    loading.value = true
    
    try {
      const baseURL = import.meta.env.VITE_API_URL || ''
      if (!baseURL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL in .env file.')
      }
      
      console.log(`Connecting to API at: ${baseURL}/api/login`)
      const response = await fetch(`${baseURL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for verification error
        if (response.status === 403 && data.isVerificationError) {
          throw new Error(data.message, { cause: 'verification_required' })
        }
        throw new Error(data.message || 'Login failed')
      }

      // Save token and user data
      token.value = data.token
      user.value = data.user
      isAdmin.value = data.user.isAdmin || false // Set admin status
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      // Store admin status in localStorage for persisting through page refreshes
      localStorage.setItem('isAdmin', data.user.isAdmin ? 'true' : 'false')
      
    } catch (error: any) {
      console.error('Login error:', error)
      // Check if this was a network error
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.')
      }
      // Rethrow for component to handle
      throw error
    } finally {
      loading.value = false
    }
  }
  
  const adminLogin = async (credentials: { email: string; password: string }) => {
    loading.value = true
    
    try {
      const baseURL = import.meta.env.VITE_API_URL || ''
      if (!baseURL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL in .env file.')
      }
      
      console.log(`Connecting to admin API at: ${baseURL}/api/admin/login`)
      const response = await fetch(`${baseURL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Admin login failed')
      }

      // Save token and user data
      token.value = data.token
      user.value = data.user
      isAdmin.value = true // Set admin status
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      // Explicitly set isAdmin in localStorage
      localStorage.setItem('isAdmin', 'true')
      
      return data
    } catch (error: any) {
      console.error('Admin login error:', error)
      // Check if this was a network error
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.')
      }
      // Rethrow for component to handle
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (userData: { username: string; email: string; password: string }) => {
    loading.value = true
    
    try {
      const baseURL = import.meta.env.VITE_API_URL || ''
      if (!baseURL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL in .env file.')
      }
      
      console.log(`Connecting to API at: ${baseURL}/api/register`)
      const response = await fetch(`${baseURL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed')
      }

      // Store verification link if provided (for testing)
      if (data.verificationLink) {
        verificationLink.value = data.verificationLink
      }

      // In this flow, we don't automatically log in after registration
      // since email verification is required
      return data
    } catch (error: any) {
      console.error('Registration error:', error)
      // Check if this was a network error
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.')
      }
      // Rethrow for component to handle
      throw error
    } finally {
      loading.value = false
    }
  }

  const resendVerification = async (email: string) => {
    loading.value = true
    
    try {
      const baseURL = import.meta.env.VITE_API_URL || ''
      if (!baseURL) {
        throw new Error('API URL is not configured. Please set VITE_API_URL in .env file.')
      }
      
      const response = await fetch(`${baseURL}/api/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend verification email')
      }

      // Store verification link if provided (for testing)
      if (data.verificationLink) {
        verificationLink.value = data.verificationLink
      }

      return data
    } catch (error: any) {
      console.error('Resend verification error:', error)
      // Check if this was a network error
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to the server. Please check if the server is running.')
      }
      // Rethrow for component to handle
      throw error
    } finally {
      loading.value = false
    }
  }

  const getEcoData = async () => {
    if (!token.value) {
      throw new Error('Authentication required')
    }
    
    const baseURL = import.meta.env.VITE_API_URL || ''
    const response = await fetch(`${baseURL}/api/eco-data`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch eco data')
    }

    return await response.json()
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin') // Also clear isAdmin from localStorage
    token.value = null
    user.value = null
    isAdmin.value = false // Reset admin status
  }

  const updateAvatar = (avatarUrl: string) => {
    if (user.value) {
      // Set the avatar URL
      user.value = {
        ...user.value,
        avatar: avatarUrl
      }
      
      // Persist the updated user object to localStorage
      localStorage.setItem('user', JSON.stringify(user.value))
      
      // For debugging
      console.log('Avatar updated in auth store:', avatarUrl)
    }
  }

  // Add a new method to update the username
  const updateUsername = (newUsername: string) => {
    if (user.value) {
      user.value = {
        ...user.value,
        username: newUsername
      }
      
      // Update localStorage to persist the change
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return { 
    token,
    user,
    loading,
    verificationLink,
    isAdmin, // Add isAdmin to return
    login,
    register,
    logout,
    getEcoData,
    resendVerification,
    updateAvatar,
    updateUsername, // Add this
    adminLogin // Add new admin login method
  }
})
