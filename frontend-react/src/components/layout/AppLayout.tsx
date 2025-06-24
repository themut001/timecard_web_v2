import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { NotificationContainer } from '../ui/Notification'
import { useSelector } from 'react-redux'
import { RootState } from '@/store/store'

export const AppLayout: React.FC = () => {
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <Header />
        
        <main className="p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Notifications */}
      <NotificationContainer />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => {
            // Close sidebar on mobile
          }}
        />
      )}
    </div>
  )
}