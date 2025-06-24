/**
 * API Service for Timecard Management System
 * Centralized API communication with Flask backend
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Enable cookies for session management
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor for adding auth headers if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling common responses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error: AxiosError) => {
    console.error('API Response Error:', error)
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// Types for API responses
export interface ApiResponse<T = any> {
  success?: boolean
  message?: string
  error?: string
  data?: T
}

export interface User {
  id: number
  username: string
  isAdmin: boolean
  employeeId: string
  employee?: {
    name: string
    department: string
    position: string
  }
}

export interface TimeRecord {
  id: number
  date: string
  clockIn?: string
  clockOut?: string
  breakTime: number
  totalHours: number
  status?: string
}

export interface Employee {
  id: number
  employeeId: string
  name: string
  department: string
  position: string
  email: string
  phone: string
  joinDate?: string
  status: 'active' | 'inactive'
  hasUser?: boolean
  isAdmin?: boolean
}

// ==========================================
// Authentication API
// ==========================================

export const authAPI = {
  login: async (username: string, password: string): Promise<{ user: User }> => {
    const response = await apiClient.post('/auth/login', { username, password })
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
}

// ==========================================
// Attendance API
// ==========================================

export const attendanceAPI = {
  getTodayRecord: async (): Promise<{ record: TimeRecord | null; status: string }> => {
    const response = await apiClient.get('/attendance/today')
    return response.data
  },

  clockIn: async (photo?: string): Promise<{ record: TimeRecord }> => {
    const response = await apiClient.post('/attendance/clock-in', { photo })
    return response.data
  },

  clockOut: async (photo?: string): Promise<{ record: TimeRecord }> => {
    const response = await apiClient.post('/attendance/clock-out', { photo })
    return response.data
  },

  startBreak: async (): Promise<{ status: string }> => {
    const response = await apiClient.post('/attendance/break/start')
    return response.data
  },

  endBreak: async (): Promise<{ status: string }> => {
    const response = await apiClient.post('/attendance/break/end')
    return response.data
  },

  getRecentRecords: async (limit = 10): Promise<{ records: TimeRecord[] }> => {
    const response = await apiClient.get(`/attendance/recent?limit=${limit}`)
    return response.data
  },

  getMonthlyRecords: async (month: string): Promise<{ records: TimeRecord[] }> => {
    const response = await apiClient.get(`/attendance/monthly?month=${month}`)
    return response.data
  },
}

// ==========================================
// Admin API
// ==========================================

export const adminAPI = {
  getEmployees: async (params?: {
    search?: string
    department?: string
    status?: string
  }): Promise<{ employees: Employee[] }> => {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.department) queryParams.append('department', params.department)
    if (params?.status) queryParams.append('status', params.status)
    
    const response = await apiClient.get(`/admin/employees?${queryParams}`)
    return response.data
  },

  getAttendanceSummary: async (date?: string): Promise<{
    date: string
    summary: Array<{
      employeeId: string
      name: string
      department: string
      clockIn?: string
      clockOut?: string
      totalHours: number
      currentStatus: string
      isPresent: boolean
    }>
  }> => {
    const params = date ? `?date=${date}` : ''
    const response = await apiClient.get(`/admin/attendance/summary${params}`)
    return response.data
  },
}

// ==========================================
// File Upload API
// ==========================================

export const uploadAPI = {
  uploadPhoto: async (file: File): Promise<{ filename: string; url: string }> => {
    const formData = new FormData()
    formData.append('photo', file)
    
    const response = await apiClient.post('/upload/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
}

// ==========================================
// Export/Download API
// ==========================================

export const exportAPI = {
  downloadCSV: async (params: {
    startDate: string
    endDate: string
    employeeId?: string
  }): Promise<Blob> => {
    const response = await apiClient.get('/export/csv', {
      params,
      responseType: 'blob',
    })
    return response.data
  },

  downloadPDF: async (params: {
    startDate: string
    endDate: string
    employeeId?: string
  }): Promise<Blob> => {
    const response = await apiClient.get('/export/pdf', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}

// ==========================================
// Utility Functions
// ==========================================

export const handleApiError = (error: any): string => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export const isApiError = (error: any): boolean => {
  return error?.response?.data?.error !== undefined
}

// Health check
export const healthCheck = async (): Promise<{ status: string }> => {
  const response = await apiClient.get('/health')
  return response.data
}

export default apiClient