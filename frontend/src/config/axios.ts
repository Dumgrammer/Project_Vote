import axios from 'axios'

declare global {
  interface Window {
    __APP_API_BASE_URL__?: string
  }
}

const DEFAULT_BASE_URL = import.meta.env.PROD 
  ? 'https://darkred-magpie-601133.hostingersite.com/backend'
  : 'http://localhost/Project_Vote/backend'

const resolveBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }

  if (typeof window !== 'undefined' && window.__APP_API_BASE_URL__) {
    return window.__APP_API_BASE_URL__
  }

  return DEFAULT_BASE_URL
}

export const API_BASE_URL = resolveBaseUrl().replace(/\/$/, '')

export const buildApiUrl = (path = '') => {
  if (!path) {
    return API_BASE_URL
  }

  if (path.startsWith('?')) {
    return `${API_BASE_URL}/${path}`
  }

  if (path.startsWith('/')) {
    return `${API_BASE_URL}${path}`
  }

  return `${API_BASE_URL}/${path}`
}

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login or clear session
          console.error('Unauthorized access')
          break
        case 403:
          // Forbidden
          console.error('Access forbidden')
          break
        case 404:
          console.error('Resource not found')
          break
        case 500:
          console.error('Internal server error')
          break
        default:
          console.error('An error occurred:', data?.message || error.message)
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server')
    } else {
      // Something else happened
      console.error('Error:', error.message)
    }
    
    return Promise.reject(error)
  }
)

export default axiosInstance