import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Clock } from './pages/Clock'
import { Attendance } from './pages/Attendance'
import { Requests } from './pages/Requests'
import { AdminEmployees } from './pages/admin/Employees'
import { AdminReports } from './pages/admin/Reports'
import { Settings } from './pages/Settings'
import { checkAuth } from './store/slices/authSlice'
import { RootState, AppDispatch } from './store/store'

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    // Check authentication on app start
    dispatch(checkAuth())
  }, [dispatch])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center">
        <div className="liquid-glass p-8 rounded-liquid">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-center mt-4 text-slate-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <Login />
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="clock" element={<Clock />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="requests" element={<Requests />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Admin Routes */}
        <Route 
          path="admin/employees" 
          element={
            <ProtectedRoute adminOnly>
              <AdminEmployees />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="admin/reports" 
          element={
            <ProtectedRoute adminOnly>
              <AdminReports />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App